import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import connectDB from "@/lib/db/mongodb";
import HoraireModel from "@/models/Horaire";
import RdvModel from "@/models/Rdv";
import { FermetureModel } from "@/models";
import VacancesModel from "@/models/Vacances";
import ConfigRdvModel from "@/models/ConfigRdv";
import OuvertureExceptionnelleModel from "@/models/OuvertureExceptionnelle";
import { calculerCreneauxDisponibles, calculerHeureFin, DEFAULT_CONFIG } from "@/lib/creneaux";
import { DUREE_PAR_TYPE } from "@/types";
import type { TypeRdv } from "@/types";
import {
	envoyerEmail,
	templateConfirmationRdv,
	templateNotificationNouveauRdv,
} from "@/lib/email";
import { genererFichierICS, genererNomFichierICS } from "@/lib/ical";
import { getConnectedAdmin, createEvent } from "@/lib/google-calendar";

const TYPES_VALIDES: TypeRdv[] = ["examen", "vente", "reparation"];

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { typeRdv, dateRdv, heureDebut, nom, prenom, email, telephone, message } = body;

		// Validation
		if (!typeRdv || !dateRdv || !heureDebut || !nom || !prenom || !email || !telephone) {
			return NextResponse.json(
				{ error: "Tous les champs obligatoires doivent être remplis" },
				{ status: 400 }
			);
		}

		if (!TYPES_VALIDES.includes(typeRdv)) {
			return NextResponse.json(
				{ error: "Type de rendez-vous invalide" },
				{ status: 400 }
			);
		}

		// Rejeter les dates passées
		const today = new Date().toISOString().slice(0, 10);
		if (dateRdv < today) {
			return NextResponse.json(
				{ error: "Impossible de réserver dans le passé" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Charger la config RDV
		const [configDoc, horaires, rdvsDuJour, fermetures, vacances, ouvertures] =
			await Promise.all([
				ConfigRdvModel.findOne().lean(),
				HoraireModel.find().lean(),
				RdvModel.find({
					dateRdv: {
						$gte: new Date(dateRdv + "T00:00:00"),
						$lt: new Date(dateRdv + "T23:59:59"),
					},
					statut: { $ne: "annule" },
				}).lean(),
				FermetureModel.find({
					date: {
						$gte: new Date(dateRdv + "T00:00:00"),
						$lt: new Date(dateRdv + "T23:59:59"),
					},
				}).lean(),
				VacancesModel.find({ actif: true }).lean(),
				OuvertureExceptionnelleModel.find().lean(),
			]);

		const config = configDoc
			? {
					durees: configDoc.durees,
					marge: configDoc.marge,
					plagesBloquees: configDoc.plagesBloquees || [],
				}
			: DEFAULT_CONFIG;

		const duree = config.durees[typeRdv as TypeRdv];
		const heureFin = calculerHeureFin(heureDebut, duree);

		// Re-vérifier la disponibilité du créneau (protection race condition)
		const creneauxDispos = calculerCreneauxDisponibles(
			dateRdv,
			typeRdv,
			horaires,
			rdvsDuJour,
			fermetures,
			vacances,
			config,
			ouvertures
		);

		if (!creneauxDispos.includes(heureDebut)) {
			return NextResponse.json(
				{ error: "Ce créneau n'est plus disponible" },
				{ status: 409 }
			);
		}

		// Créer le RDV
		const cancelToken = randomBytes(32).toString("hex");
		const rdv = await RdvModel.create({
			nom,
			prenom,
			email,
			telephone,
			message: message || undefined,
			typeRdv,
			dateRdv: new Date(dateRdv + "T00:00:00"),
			heureDebut,
			heureFin,
			duree,
			statut: "confirme",
			cancelToken,
		});

		// Sync Google Calendar (fire-and-forget)
		let googleSynced = false;
		try {
			const connectedAdmin = await getConnectedAdmin();
			if (connectedAdmin?.googleRefreshToken && connectedAdmin?.googleCalendarId) {
				const eventId = await createEvent(
					connectedAdmin.googleRefreshToken,
					connectedAdmin.googleCalendarId,
					{ dateRdv, heureDebut, heureFin, typeRdv, nom, prenom, email, telephone, message }
				);
				if (eventId) {
					await RdvModel.findByIdAndUpdate(rdv._id, { googleEventId: eventId });
					googleSynced = true;
				}
			}
		} catch (err) {
			console.error("[Calendar] Create event failed:", err);
		}

		// Envoyer les emails en arrière-plan (ne pas bloquer la réponse)
		const typeLabels: Record<string, string> = {
			examen: "Examen de vue",
			vente: "Essayage / Vente",
			reparation: "Réparation / Ajustement",
		};
		const typeLabel = typeLabels[typeRdv] || typeRdv;

		const dateFormatee = new Intl.DateTimeFormat("fr-FR", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(new Date(dateRdv + "T12:00:00"));

		const heureFormatee = `${heureDebut} - ${heureFin}`;

		// Générer le fichier ICS
		const icsContent = genererFichierICS({
			dateRdv: new Date(dateRdv + "T00:00:00"),
			heureDebut,
			heureFin,
			typeRdv,
			clientNom: nom,
			clientPrenom: prenom,
		});
		const icsFilename = genererNomFichierICS(new Date(dateRdv + "T00:00:00"));

		// Email de confirmation au client
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://binoclesdelasave.fr";
		envoyerEmail({
			to: email,
			subject: `Rendez-vous confirmé — ${typeLabel}`,
			html: templateConfirmationRdv({
				prenom,
				date: dateFormatee,
				heure: heureFormatee,
				typeRdv: typeLabel,
				adresse: "42 Avenue de la République, 31530 Levignac",
				telephone: "05 34 52 19 69",
				cancelUrl: `${appUrl}/rendez-vous/annuler/${cancelToken}`,
			}),
			attachments: [
				{
					filename: icsFilename,
					content: icsContent,
					contentType: "text/calendar",
				},
			],
		}).catch((err) => console.error("[API] Erreur email confirmation:", err));

		// Email de notification à l'admin
		const adminEmail = process.env.ADMIN_EMAIL || "contact@binoclesdelasave.fr";
		envoyerEmail({
			to: adminEmail,
			subject: `Nouveau RDV — ${prenom} ${nom} — ${typeLabel}`,
			html: templateNotificationNouveauRdv({
				nom,
				prenom,
				email,
				telephone,
				date: dateFormatee,
				heure: heureFormatee,
				typeRdv: typeLabel,
				message,
				googleSynced,
			}),
		}).catch((err) => console.error("[API] Erreur email notification admin:", err));

		return NextResponse.json({ success: true, rdv }, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST rdv:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
