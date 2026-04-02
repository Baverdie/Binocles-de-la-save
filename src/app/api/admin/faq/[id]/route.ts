import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import FAQModel from "@/models/FAQ";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const { id } = await params;
		await connectDB();
		const body = await request.json();
		const { question, reponse, categorie, actif } = body;

		const faq = await FAQModel.findById(id);
		if (!faq) {
			return NextResponse.json({ error: "FAQ non trouvée" }, { status: 404 });
		}

		if (question !== undefined) faq.question = question;
		if (reponse !== undefined) faq.reponse = reponse;
		if (categorie !== undefined) faq.categorie = categorie;
		if (actif !== undefined) faq.actif = actif;

		await faq.save();

		return NextResponse.json(faq);
	} catch (error) {
		console.error("[API] Erreur PUT faq:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const { id } = await params;
		await connectDB();

		const faq = await FAQModel.findByIdAndDelete(id);
		if (!faq) {
			return NextResponse.json({ error: "FAQ non trouvée" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur DELETE faq:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
