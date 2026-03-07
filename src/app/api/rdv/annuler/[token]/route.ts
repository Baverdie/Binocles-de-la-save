import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import RdvModel from "@/models/Rdv";
import { getConnectedAdmin, deleteEvent } from "@/lib/google-calendar";
import {
	envoyerEmail,
	templateConfirmationAnnulationClient,
	templateAnnulationParClient,
} from "@/lib/email";

const TYPE_LABELS: Record<string, string> = {
	examen: "Examen de vue",
	vente: "Essayage / Vente",
	reparation: "Réparation / Ajustement",
};

// GET — Récupérer les infos du RDV pour affichage sur la page
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	const { token } = await params;
	await connectDB();

	const rdv = await RdvModel.findOne({ cancelToken: token }).lean();

	if (!rdv) {
		return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
	}

	return NextResponse.json({
		prenom: rdv.prenom,
		date: rdv.dateRdv,
		heureDebut: rdv.heureDebut,
		heureFin: rdv.heureFin,
		typeRdv: TYPE_LABELS[rdv.typeRdv] ?? rdv.typeRdv,
		statut: rdv.statut,
	});
}

// POST — Annuler le RDV
export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	const { token } = await params;
	await connectDB();

	const rdv = await RdvModel.findOne({ cancelToken: token });

	if (!rdv) {
		return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
	}

	if (rdv.statut !== "confirme") {
		return NextResponse.json(
			{ error: "Ce rendez-vous ne peut plus être annulé" },
			{ status: 409 }
		);
	}

	// Bloquer l'annulation si RDV dans moins de 24h
	const rdvDate = new Date(rdv.dateRdv);
	const [h, m] = rdv.heureDebut.split(":").map(Number);
	rdvDate.setHours(h, m, 0, 0);
	const diffMs = rdvDate.getTime() - Date.now();
	if (diffMs < 24 * 60 * 60 * 1000) {
		return NextResponse.json(
			{ error: "L'annulation n'est plus possible moins de 24h avant le rendez-vous" },
			{ status: 422 }
		);
	}

	// Annuler
	rdv.statut = "annule";
	rdv.annuleAt = new Date();
	rdv.raisonAnnulation = "Annulé par le client";
	await rdv.save();

	// Supprimer l'événement Google Calendar
	if (rdv.googleEventId) {
		try {
			const connectedAdmin = await getConnectedAdmin();
			if (connectedAdmin?.googleRefreshToken && connectedAdmin?.googleCalendarId) {
				await deleteEvent(
					connectedAdmin.googleRefreshToken,
					connectedAdmin.googleCalendarId,
					rdv.googleEventId
				);
			}
		} catch (err) {
			console.error("[Calendar] Delete event failed:", err);
		}
	}

	const dateFormatee = new Intl.DateTimeFormat("fr-FR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(rdv.dateRdv));

	const typeLabel = TYPE_LABELS[rdv.typeRdv] ?? rdv.typeRdv;

	// Email de confirmation d'annulation au client (ton neutre : c'est lui qui annule)
	envoyerEmail({
		to: rdv.email,
		subject: "Votre rendez-vous a bien été annulé — Binocles de la Save",
		html: templateConfirmationAnnulationClient({
			prenom: rdv.prenom,
			date: dateFormatee,
			heure: `${rdv.heureDebut} - ${rdv.heureFin}`,
		}),
	}).catch((err) => console.error("[API] Erreur email annulation client:", err));

	// Email de notification à l'admin
	const adminEmail = process.env.ADMIN_EMAIL || "contact@binoclesdelasave.fr";
	envoyerEmail({
		to: adminEmail,
		subject: `Annulation client — ${rdv.prenom} ${rdv.nom} — ${typeLabel}`,
		html: templateAnnulationParClient({
			nom: rdv.nom,
			prenom: rdv.prenom,
			email: rdv.email,
			telephone: rdv.telephone,
			date: dateFormatee,
			heure: `${rdv.heureDebut} - ${rdv.heureFin}`,
			typeRdv: typeLabel,
		}),
	}).catch((err) => console.error("[API] Erreur email notif admin:", err));

	return NextResponse.json({ success: true });
}
