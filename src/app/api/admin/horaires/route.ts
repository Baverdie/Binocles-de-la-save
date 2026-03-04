import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import HoraireModel from "@/models/Horaire";

// GET - Liste des horaires
export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const horaires = await HoraireModel.find().sort({ jour: 1 }).lean();

		return NextResponse.json(horaires);
	} catch (error) {
		console.error("[API] Erreur GET horaires:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// PUT - Mise à jour globale des horaires
export async function PUT(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { horaires } = body;

		if (!Array.isArray(horaires)) {
			return NextResponse.json({ error: "horaires requis" }, { status: 400 });
		}

		await connectDB();

		const ops = horaires.map((item: any) => {
			const set: Record<string, unknown> = {
				jour: item.jour,
				ouvert: !!item.ouvert,
			};
			const unset: Record<string, true | "" | 1> = {};

			if (item.matin?.debut && item.matin?.fin) {
				set.matin = { debut: item.matin.debut, fin: item.matin.fin };
			} else {
				unset.matin = "";
			}

			if (item.aprem?.debut && item.aprem?.fin) {
				set.aprem = { debut: item.aprem.debut, fin: item.aprem.fin };
			} else {
				unset.aprem = "";
			}

			return {
				updateOne: {
					filter: { jour: item.jour },
					update: { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
					upsert: true,
				},
			};
		});

		if (ops.length > 0) {
			await HoraireModel.bulkWrite(ops);
		}

		const updated = await HoraireModel.find().sort({ jour: 1 }).lean();
		return NextResponse.json(updated);
	} catch (error) {
		console.error("[API] Erreur PUT horaires:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
