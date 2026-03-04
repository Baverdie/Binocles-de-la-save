import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import VacancesModel from "@/models/Vacances";

// GET - Liste des vacances
export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const vacances = await VacancesModel.find().sort({ dateDebut: -1 }).lean();

		return NextResponse.json(vacances);
	} catch (error) {
		console.error("[API] Erreur GET vacances:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// POST - Créer une période de vacances
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { dateDebut, dateFin, message, actif } = body;

		if (!dateDebut || !dateFin) {
			return NextResponse.json({ error: "Dates requises" }, { status: 400 });
		}

		await connectDB();

		const vacances = await VacancesModel.create({
			dateDebut,
			dateFin,
			message: message || undefined,
			actif: actif !== false,
		});

		return NextResponse.json(vacances, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST vacances:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
