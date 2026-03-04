import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import HoraireModel from "@/models/Horaire";
import RdvModel from "@/models/Rdv";
import { FermetureModel } from "@/models";
import VacancesModel from "@/models/Vacances";
import ConfigRdvModel from "@/models/ConfigRdv";
import OuvertureExceptionnelleModel from "@/models/OuvertureExceptionnelle";
import { calculerCreneauxDisponibles, DEFAULT_CONFIG } from "@/lib/creneaux";
import type { TypeRdv } from "@/types";

const TYPES_VALIDES: TypeRdv[] = ["examen", "vente", "reparation"];

export async function GET(request: NextRequest) {
	const date = request.nextUrl.searchParams.get("date");
	const typeRdv = request.nextUrl.searchParams.get("typeRdv") as TypeRdv | null;

	if (!date || !typeRdv || !TYPES_VALIDES.includes(typeRdv)) {
		return NextResponse.json(
			{ error: "Paramètres date et typeRdv requis" },
			{ status: 400 }
		);
	}

	// Rejeter les dates passées
	const today = new Date().toISOString().slice(0, 10);
	if (date < today) {
		return NextResponse.json({ creneaux: [] });
	}

	try {
		await connectDB();

		const [horaires, rdvsDuJour, fermetures, vacances, configDoc, ouvertures] =
			await Promise.all([
				HoraireModel.find().lean(),
				RdvModel.find({
					dateRdv: {
						$gte: new Date(date + "T00:00:00"),
						$lt: new Date(date + "T23:59:59"),
					},
					statut: { $ne: "annule" },
				}).lean(),
				FermetureModel.find({
					date: {
						$gte: new Date(date + "T00:00:00"),
						$lt: new Date(date + "T23:59:59"),
					},
				}).lean(),
				VacancesModel.find({ actif: true }).lean(),
				ConfigRdvModel.findOne().lean(),
				OuvertureExceptionnelleModel.find().lean(),
			]);

		const config = configDoc
			? {
					durees: configDoc.durees,
					marge: configDoc.marge,
					plagesBloquees: configDoc.plagesBloquees || [],
				}
			: DEFAULT_CONFIG;

		const creneaux = calculerCreneauxDisponibles(
			date,
			typeRdv,
			horaires,
			rdvsDuJour,
			fermetures,
			vacances,
			config,
			ouvertures
		);

		return NextResponse.json({ creneaux });
	} catch (error) {
		console.error("[API] Erreur GET creneaux:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
