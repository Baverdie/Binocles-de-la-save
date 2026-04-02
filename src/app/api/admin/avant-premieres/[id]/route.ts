import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AvantPremiereModel from "@/models/AvantPremiere";

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
		const body = await request.json();
		const { titre, description, images, dateDebut, actif } = body;

		if (!titre || !images?.length || !dateDebut) {
			return NextResponse.json(
				{ error: "Titre, au moins une image et une date de début sont requis" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Date de fin = dateDebut + 1 mois + 1 jour
		const debut = new Date(dateDebut);
		const fin = new Date(debut);
		fin.setMonth(fin.getMonth() + 1);
		fin.setDate(fin.getDate() + 1);

		const updated = await AvantPremiereModel.findByIdAndUpdate(
			id,
			{
				titre,
				description: description || undefined,
				images,
				dateDebut: debut,
				dateFin: fin,
				actif,
			},
			{ new: true }
		).lean();

		if (!updated) {
			return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
		}

		return NextResponse.json(updated);
	} catch (error) {
		console.error("[API] Erreur PUT avant-premieres:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const { id } = await params;
		await connectDB();

		const deleted = await AvantPremiereModel.findByIdAndDelete(id);
		if (!deleted) {
			return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur DELETE avant-premieres:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
