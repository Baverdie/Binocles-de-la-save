import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import FAQModel from "@/models/FAQ";

export async function GET() {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const faqs = await FAQModel.find().sort({ categorie: 1, ordre: 1 }).lean();

		return NextResponse.json(faqs);
	} catch (error) {
		console.error("[API] Erreur GET faq:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const body = await request.json();
		const { question, reponse, categorie, actif } = body;

		if (!question || !reponse || !categorie) {
			return NextResponse.json(
				{ error: "Question, réponse et catégorie requis" },
				{ status: 400 }
			);
		}

		const lastFaq = await FAQModel.findOne({ categorie }).sort({ ordre: -1 });
		const ordre = lastFaq ? lastFaq.ordre + 1 : 0;

		const faq = await FAQModel.create({
			question,
			reponse,
			categorie,
			ordre,
			actif: actif !== false,
		});

		return NextResponse.json(faq);
	} catch (error) {
		console.error("[API] Erreur POST faq:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const body = await request.json();
		const { orderedIds } = body;

		if (!Array.isArray(orderedIds)) {
			return NextResponse.json(
				{ error: "orderedIds requis" },
				{ status: 400 }
			);
		}

		await Promise.all(
			orderedIds.map((id: string, index: number) =>
				FAQModel.findByIdAndUpdate(id, { ordre: index })
			)
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur PUT faq:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
