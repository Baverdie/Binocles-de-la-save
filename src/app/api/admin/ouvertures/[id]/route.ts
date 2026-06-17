import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import OuvertureExceptionnelleModel from "@/models/OuvertureExceptionnelle";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		const { id } = await params;

		await connectDB();
		const deleted = await OuvertureExceptionnelleModel.findByIdAndDelete(id);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Ouverture non trouvée" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur DELETE ouverture:", error);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}
