import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import RdvModel from "@/models/Rdv";
import { calculerHeureFin } from "@/lib/creneaux";
import { getConnectedAdmin, createEvent } from "@/lib/google-calendar";
import { marquerRdvTerminesEffectues } from "@/lib/rdv/autoEffectuer";

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { objet, typeInterne, dateRdv, heureDebut, duree, notes } = body;

		if (!objet || !dateRdv || !heureDebut || !duree) {
			return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
		}
		if (typeof duree !== "number" || duree < 5 || duree > 480) {
			return NextResponse.json({ error: "Durée invalide (5–480 min)" }, { status: 400 });
		}

		await connectDB();

		const heureFin = calculerHeureFin(heureDebut, duree);

		const rdv = await RdvModel.create({
			source: "interne",
			objet,
			typeInterne: typeInterne || undefined,
			nom: objet,
			prenom: "—",
			typeRdv: "examen",
			dateRdv: new Date(dateRdv + "T00:00:00"),
			heureDebut,
			heureFin,
			duree,
			statut: "confirme",
			notes: notes || undefined,
		});

		try {
			const connectedAdmin = await getConnectedAdmin();
			if (connectedAdmin?.googleRefreshToken && connectedAdmin?.googleCalendarId) {
				const eventId = await createEvent(
					connectedAdmin.googleRefreshToken,
					connectedAdmin.googleCalendarId,
					{
						dateRdv,
						heureDebut,
						heureFin,
						typeRdv: objet,
						nom: "",
						prenom: "",
						email: "",
						telephone: "",
						message: notes,
					}
				);
				if (eventId) {
					await RdvModel.findByIdAndUpdate(rdv._id, { googleEventId: eventId });
				}
			}
		} catch (err) {
			console.error("[Calendar] Create internal event failed:", err);
		}

		return NextResponse.json(rdv, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST rdv interne:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		await marquerRdvTerminesEffectues();

		const rdvs = await RdvModel.find()
			.sort({ dateRdv: -1 })
			.lean();

		return NextResponse.json(rdvs);
	} catch (error) {
		console.error("[API] Erreur GET rdvs:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
