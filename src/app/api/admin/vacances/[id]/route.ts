import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import VacancesModel from "@/models/Vacances";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const body = await request.json();
		const { dateDebut, dateFin, message, actif } = body;

		await connectDB();

		const { id } = await params;
		const updated = await VacancesModel.findByIdAndUpdate(
			id,
			{
				...(dateDebut ? { dateDebut } : {}),
				...(dateFin ? { dateFin } : {}),
				...(message !== undefined ? { message } : {}),
				...(actif !== undefined ? { actif } : {}),
			},
			{ new: true }
		).lean();

		if (!updated) {
			return NextResponse.json({ error: "Introuvable" }, { status: 404 });
		}

		return NextResponse.json(updated);
	} catch (error) {
		console.error("[API] Erreur PUT vacances:", error);
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
		await VacancesModel.findByIdAndDelete(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur DELETE vacances:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
