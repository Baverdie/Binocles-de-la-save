import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import FermetureModel from "@/models/Fermeture";

// GET - Liste des fermetures exceptionnelles
export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const fermetures = await FermetureModel.find().sort({ date: -1 }).lean();

		return NextResponse.json(fermetures);
	} catch (error) {
		console.error("[API] Erreur GET fermetures:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// POST - Créer une fermeture exceptionnelle
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { date, journeeComplete, heureDebut, heureFin, raison } = body;

		if (!date) {
			return NextResponse.json({ error: "Date requise" }, { status: 400 });
		}

		if (!journeeComplete && (!heureDebut || !heureFin)) {
			return NextResponse.json(
				{ error: "Heures requises pour une fermeture partielle" },
				{ status: 400 }
			);
		}

		await connectDB();

		const fermeture = await FermetureModel.create({
			date,
			journeeComplete: journeeComplete !== false,
			heureDebut: journeeComplete ? undefined : heureDebut,
			heureFin: journeeComplete ? undefined : heureFin,
			raison: raison || undefined,
		});

		return NextResponse.json(fermeture, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST fermeture:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
