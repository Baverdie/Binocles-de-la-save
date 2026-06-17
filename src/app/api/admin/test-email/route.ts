import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	envoyerEmail,
	templateConfirmationRdv,
	templateNotificationNouveauRdv,
	templateAnnulationRdv,
	templateRappelRdv,
	templateNouveauContact,
	templateCommandeLentilles,
} from "@/lib/email";

const FAKE_DATA = {
	confirmationRdv: {
		subject: "Rendez-vous confirmé — Examen de vue",
		html: () =>
			templateConfirmationRdv({
				prenom: "Marie",
				date: "mardi 18 mars 2026",
				heure: "10:00 - 11:00",
				typeRdv: "Examen de vue",
				adresse: "42 Avenue de la République, 31530 Lévignac",
				telephone: "05 62 XX XX XX",
			}),
	},
	notificationRdv: {
		subject: "Nouveau RDV — Marie Dupont — Examen de vue",
		html: () =>
			templateNotificationNouveauRdv({
				nom: "Dupont",
				prenom: "Marie",
				email: "marie.dupont@example.com",
				telephone: "06 12 34 56 78",
				date: "mardi 18 mars 2026",
				heure: "10:00 - 11:00",
				typeRdv: "Examen de vue",
				message: "Bonjour, je porte des lunettes depuis 5 ans et j'aimerais vérifier ma vue. Merci !",
				googleSynced: true,
			}),
	},
	annulationRdv: {
		subject: "Annulation de votre rendez-vous",
		html: () =>
			templateAnnulationRdv({
				prenom: "Marie",
				date: "mardi 18 mars 2026",
				heure: "10:00 - 11:00",
				raison: "Fermeture exceptionnelle de la boutique.",
				proposerAutreCreneau: true,
			}),
	},
	rappelRdv: {
		subject: "Rappel — Rendez-vous demain à 10:00",
		html: () =>
			templateRappelRdv({
				prenom: "Marie",
				date: "mardi 18 mars 2026",
				heure: "10:00 - 11:00",
				typeRdv: "Examen de vue",
				adresse: "42 Avenue de la République, 31530 Lévignac",
				telephone: "05 62 XX XX XX",
			}),
	},
	nouveauContact: {
		subject: "Nouveau message de contact",
		html: () =>
			templateNouveauContact({
				nom: "Dupont",
				prenom: "Marie",
				email: "marie.dupont@example.com",
				telephone: "06 12 34 56 78",
				message: "Bonjour,\n\nJe souhaiterais savoir si vous proposez des montures pour enfants.\n\nMerci d'avance pour votre retour.\n\nCordialement,\nMarie Dupont",
			}),
	},
	commandeLentilles: {
		subject: "Commande de lentilles — Marie Dupont",
		html: () =>
			templateCommandeLentilles({
				nom: "Dupont",
				prenom: "Marie",
				telephone: "06 12 34 56 78",
				format: "Boîtes de 30",
				duree: "3 mois",
				besoinProduit: true,
				marqueProduit: "ReNu MultiPlus",
				message: "Merci de me prévenir par SMS quand la commande est prête.",
				hasMutuelle: true,
			}),
	},
};

type TemplateKey = keyof typeof FAKE_DATA;

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.name?.toLowerCase().includes("baverdie")) {
			return NextResponse.json({ error: "Non autorise" }, { status: 403 });
		}

		const { template } = await request.json();

		if (!template || !(template in FAKE_DATA)) {
			return NextResponse.json(
				{ error: "Template invalide", templates: Object.keys(FAKE_DATA) },
				{ status: 400 }
			);
		}

		const data = FAKE_DATA[template as TemplateKey];

		await envoyerEmail({
			to: session.user.email || "test@example.com",
			subject: data.subject,
			html: data.html(),
		});

		return NextResponse.json({ success: true, template });
	} catch (error) {
		console.error("[API] Erreur test-email:", error);
		return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
	}
}
