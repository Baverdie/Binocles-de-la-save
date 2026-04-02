import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ConfigRdvModel from "@/models/ConfigRdv";
import { DUREE_PAR_TYPE } from "@/types";

const DEFAULTS = {
	durees: { ...DUREE_PAR_TYPE },
	marge: 15,
	plagesBloquees: [],
};

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const config = await ConfigRdvModel.findOne().lean();

		return NextResponse.json(config || DEFAULTS);
	} catch (error) {
		console.error("[API] Erreur GET config-rdv:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { durees, marge, plagesBloquees } = body;

		if (!durees || typeof marge !== "number") {
			return NextResponse.json(
				{ error: "durees et marge requis" },
				{ status: 400 }
			);
		}

		await connectDB();
		const config = await ConfigRdvModel.findOneAndUpdate(
			{},
			{ durees, marge, plagesBloquees: plagesBloquees || [] },
			{ upsert: true, new: true, runValidators: true }
		).lean();

		return NextResponse.json(config);
	} catch (error) {
		console.error("[API] Erreur PUT config-rdv:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
