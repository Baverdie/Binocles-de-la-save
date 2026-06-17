import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AvantPremiereModel from "@/models/AvantPremiere";

const MAX_ACTIFS = 5;

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const items = await AvantPremiereModel.find().sort({ createdAt: -1 }).lean();
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
		const { titre, description, image, actif } = body;

		if (!titre || !image) {
			return NextResponse.json(
				{ error: "Titre et image sont requis" },
				{ status: 400 }
			);
		}

		await connectDB();

		const isActif = actif ?? true;

		if (isActif) {
			const actifs = await AvantPremiereModel.find({ actif: true })
				.sort({ createdAt: 1 })
				.lean();

			if (actifs.length >= MAX_ACTIFS) {
				await AvantPremiereModel.findByIdAndUpdate(actifs[0]._id, { actif: false });
			}
		}

		const item = await AvantPremiereModel.create({
			titre,
			description: description || undefined,
			image,
			actif: isActif,
		});

		return NextResponse.json(item, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST avant-premieres:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
