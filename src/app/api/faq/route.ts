import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import FAQModel from "@/models/FAQ";

// GET - FAQ publiques groupées par catégorie
export async function GET() {
	try {
		await connectDB();
		const faqs = await FAQModel.find({ actif: true })
			.sort({ categorie: 1, ordre: 1 })
			.select("question reponse categorie")
			.lean();

		// Grouper par catégorie
		const grouped: { categorie: string; questions: typeof faqs }[] = [];
		for (const faq of faqs) {
			const existing = grouped.find((g) => g.categorie === faq.categorie);
			if (existing) {
				existing.questions.push(faq);
			} else {
				grouped.push({ categorie: faq.categorie, questions: [faq] });
			}
		}

		return NextResponse.json(grouped);
	} catch (error) {
		console.error("[API] Erreur GET faq publique:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
