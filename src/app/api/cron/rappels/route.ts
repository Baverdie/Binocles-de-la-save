import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import RdvModel from "@/models/Rdv";
import { envoyerEmail, templateRappelRdv } from "@/lib/email";

const TYPE_LABELS: Record<string, string> = {
	examen: "Examen de vue",
	vente: "Essayage / Vente",
	reparation: "Réparation / Ajustement",
};

const ADRESSE = process.env.NEXT_PUBLIC_ADRESSE || "Levignac, 31530";
const TELEPHONE = process.env.NEXT_PUBLIC_TELEPHONE || "";

export async function GET(request: NextRequest) {
	// Vérifier le secret CRON
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
	}

	try {
		await connectDB();

		// Calculer la date de demain (Europe/Paris)
		const now = new Date();
		const parisFormatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Europe/Paris",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		// Avancer d'un jour
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const demainStr = parisFormatter.format(tomorrow); // "2026-03-15"

		// Trouver les RDV confirmés de demain qui n'ont pas encore reçu de rappel
		const rdvsDemain = await RdvModel.find({
			dateRdv: {
				$gte: new Date(demainStr + "T00:00:00"),
				$lt: new Date(demainStr + "T23:59:59"),
			},
			statut: "confirme",
			rappelEnvoye: { $ne: true },
		}).lean();

		console.log(`[Cron Rappels] ${rdvsDemain.length} rappel(s) à envoyer pour le ${demainStr}`);

		let envoyes = 0;
		let erreurs = 0;

		for (const rdv of rdvsDemain) {
			const typeLabel = TYPE_LABELS[rdv.typeRdv] || rdv.typeRdv;
			const dateFormatee = new Intl.DateTimeFormat("fr-FR", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(new Date(demainStr + "T12:00:00"));

			const heureFormatee = `${rdv.heureDebut} - ${rdv.heureFin}`;

			try {
				await envoyerEmail({
					to: rdv.email,
					subject: `Rappel — Rendez-vous demain à ${rdv.heureDebut}`,
					html: templateRappelRdv({
						prenom: rdv.prenom,
						date: dateFormatee,
						heure: heureFormatee,
						typeRdv: typeLabel,
						adresse: ADRESSE,
						telephone: TELEPHONE,
					}),
				});

				await RdvModel.findByIdAndUpdate(rdv._id, { rappelEnvoye: true });
				envoyes++;
				console.log(`[Cron Rappels] Rappel envoyé à ${rdv.email}`);
			} catch (err) {
				erreurs++;
				console.error(`[Cron Rappels] Erreur envoi à ${rdv.email}:`, err);
			}
		}

		return NextResponse.json({
			success: true,
			date: demainStr,
			total: rdvsDemain.length,
			envoyes,
			erreurs,
		});
	} catch (error) {
		console.error("[Cron Rappels] Erreur:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
