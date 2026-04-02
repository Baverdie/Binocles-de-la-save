import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import RdvModel from "@/models/Rdv";

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();

		const rdvs = await RdvModel.find()
			.sort({ dateRdv: -1 })
			.lean();

		return NextResponse.json(rdvs);
	} catch (error) {
		console.error("[API] Erreur GET rdvs:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
