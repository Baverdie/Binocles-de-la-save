import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import RdvModel from "@/models/Rdv";
import {
	envoyerEmail,
	templateAnnulationRdv,
} from "@/lib/email";
import { getConnectedAdmin, deleteEvent } from "@/lib/google-calendar";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { action, raisonAnnulation } = body;

		if (!action || !["annuler", "effectuer"].includes(action)) {
			return NextResponse.json(
				{ error: "Action invalide" },
				{ status: 400 }
			);
		}

		await connectDB();

		const rdv = await RdvModel.findById(id);
		if (!rdv) {
			return NextResponse.json(
				{ error: "Rendez-vous non trouvé" },
				{ status: 404 }
			);
		}

		if (action === "annuler") {
			rdv.statut = "annule";
			rdv.annuleAt = new Date();
			if (raisonAnnulation) rdv.raisonAnnulation = raisonAnnulation;
			await rdv.save();

			if (rdv.googleEventId) {
				try {
					const connectedAdmin = await getConnectedAdmin();
					if (connectedAdmin?.googleRefreshToken && connectedAdmin?.googleCalendarId) {
						await deleteEvent(connectedAdmin.googleRefreshToken, connectedAdmin.googleCalendarId, rdv.googleEventId);
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
			}).format(rdv.dateRdv);

			if (rdv.email) {
				await envoyerEmail({
					to: rdv.email,
					subject: "Annulation de votre rendez-vous — Binocles de la Save",
					html: templateAnnulationRdv({
						prenom: rdv.prenom,
						date: dateFormatee,
						heure: `${rdv.heureDebut} - ${rdv.heureFin}`,
						raison: raisonAnnulation,
						proposerAutreCreneau: true,
					}),
				}).catch((err) => console.error("[API] Erreur email annulation:", err));
			}
		}

		if (action === "effectuer") {
			rdv.statut = "effectue";
			rdv.effectueAt = new Date();
			await rdv.save();
		}

		return NextResponse.json(rdv);
	} catch (error) {
		console.error("[API] Erreur PATCH rdv:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const { id } = await params;
		await connectDB();

		const rdv = await RdvModel.findById(id);
		if (!rdv) {
			return NextResponse.json(
				{ error: "Rendez-vous non trouvé" },
				{ status: 404 }
			);
		}

		if (rdv.googleEventId) {
			try {
				const connectedAdmin = await getConnectedAdmin();
				if (connectedAdmin?.googleRefreshToken && connectedAdmin?.googleCalendarId) {
					await deleteEvent(connectedAdmin.googleRefreshToken, connectedAdmin.googleCalendarId, rdv.googleEventId);
				}
			} catch (err) {
				console.error("[Calendar] Delete event failed:", err);
			}
		}

		await RdvModel.findByIdAndDelete(id);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur DELETE rdv:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
