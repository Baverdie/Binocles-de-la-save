import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ConfigTestModel from "@/models/ConfigTest";

// GET - Récupérer la config de test email
export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const config = await ConfigTestModel.findOne().lean();

		return NextResponse.json(config || { emailRedirection: "", actif: false });
	} catch (error) {
		console.error("[API] Erreur GET config-test:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// PUT - Mettre à jour la config de test email
export async function PUT(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.name?.toLowerCase().includes("baverdie")) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
		}

		const { emailRedirection, actif } = await request.json();

		await connectDB();

		const config = await ConfigTestModel.findOneAndUpdate(
			{},
			{
				emailRedirection: emailRedirection || "",
				actif: !!actif,
			},
			{ upsert: true, new: true }
		).lean();

		return NextResponse.json(config);
	} catch (error) {
		console.error("[API] Erreur PUT config-test:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
