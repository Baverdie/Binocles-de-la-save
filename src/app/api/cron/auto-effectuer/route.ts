import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { marquerRdvTerminesEffectues } from "@/lib/rdv/autoEffectuer";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
	}

	try {
		await connectDB();

		const marques = await marquerRdvTerminesEffectues();

		console.log(`[Cron Auto-effectuer] ${marques} rendez-vous marqué(s) effectué(s)`);

		return NextResponse.json({ success: true, marques });
	} catch (error) {
		console.error("[Cron Auto-effectuer] Erreur:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
