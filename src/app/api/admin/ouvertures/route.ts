import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import OuvertureExceptionnelleModel from "@/models/OuvertureExceptionnelle";

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const ouvertures = await OuvertureExceptionnelleModel.find()
			.sort({ date: 1 })
			.lean();

		return NextResponse.json(ouvertures);
	} catch (error) {
		console.error("[API] Erreur GET ouvertures:", error);
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
		const { date, matin, aprem, raison } = body;

		if (!date) {
			return NextResponse.json(
				{ error: "Date requise" },
				{ status: 400 }
			);
		}

		if (!matin?.debut && !aprem?.debut) {
			return NextResponse.json(
				{ error: "Au moins une plage horaire (matin ou après-midi) requise" },
				{ status: 400 }
			);
		}

		await connectDB();
		const ouverture = await OuvertureExceptionnelleModel.create({
			date,
			matin: matin?.debut && matin?.fin ? matin : undefined,
			aprem: aprem?.debut && aprem?.fin ? aprem : undefined,
			raison,
		});

		return NextResponse.json(ouverture, { status: 201 });
	} catch (error) {
		console.error("[API] Erreur POST ouvertures:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
