import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import HoraireModel from "@/models/Horaire";
import VacancesModel from "@/models/Vacances";
import FermetureModel from "@/models/Fermeture";
import ConfigRdvModel from "@/models/ConfigRdv";
import OuvertureExceptionnelleModel from "@/models/OuvertureExceptionnelle";
import { DUREE_PAR_TYPE } from "@/types";

export async function GET() {
	try {
		await connectDB();

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

		const [horaires, vacancesActives, fermetures, configDoc, ouvertures] =
			await Promise.all([
				HoraireModel.find().sort({ jour: 1 }).lean(),
				VacancesModel.find({
					actif: true,
					dateFin: { $gte: todayStart },
				})
					.sort({ dateDebut: 1 })
					.lean(),
				FermetureModel.find({ date: { $gte: todayStart } })
					.sort({ date: 1 })
					.lean(),
				ConfigRdvModel.findOne().lean(),
				OuvertureExceptionnelleModel.find({ date: { $gte: todayStart } })
					.sort({ date: 1 })
					.lean(),
			]);

		const configRdv = configDoc
			? { durees: configDoc.durees, marge: configDoc.marge }
			: { durees: { ...DUREE_PAR_TYPE }, marge: 15 };

		return NextResponse.json({
			horaires,
			vacancesActives,
			fermetures,
			ouvertures,
			configRdv,
		});
	} catch (error) {
		console.error("[API] Erreur GET horaires publics:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
