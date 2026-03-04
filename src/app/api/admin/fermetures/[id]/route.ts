import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import FermetureModel from "@/models/Fermeture";

// DELETE - Supprimer une fermeture exceptionnelle
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
		await FermetureModel.findByIdAndDelete(id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur DELETE fermeture:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
