import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AvantPremiereModel from "@/models/AvantPremiere";

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const items = await AvantPremiereModel.find().sort({ ordre: 1 }).lean();
		return NextResponse.json(items);
	} catch (error) {
		console.error("[API] Erreur GET avant-premieres:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { titre, description, image, dateDebut, actif } = body;

		if (!titre || !image || !dateDebut) {
			return NextResponse.json(
				{ error: "Titre, une image et une date de début sont requis" },
				{ status: 400 }
			);
		}

		await connectDB();

		const debut = new Date(dateDebut);
		const fin = new Date(debut);
		fin.setMonth(fin.getMonth() + 1);
		fin.setDate(fin.getDate() + 1);

		const maxOrdre = await AvantPremiereModel.findOne().sort({ ordre: -1 }).select("ordre").lean();
		const ordre = (maxOrdre?.ordre ?? 0) + 1;

		const item = await AvantPremiereModel.create({
			titre,
			description: description || undefined,
			image,
			dateDebut: debut,
			dateFin: fin,
			actif: actif ?? true,
			ordre,
		});

		return NextResponse.json(item, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST avant-premieres:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
