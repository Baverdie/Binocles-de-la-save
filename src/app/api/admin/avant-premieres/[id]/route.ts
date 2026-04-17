import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AvantPremiereModel from "@/models/AvantPremiere";

const MAX_ACTIFS = 5;

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
		const { titre, description, image, actif } = body;

		if (!titre || !image) {
			return NextResponse.json(
				{ error: "Titre et image sont requis" },
				{ status: 400 }
			);
		}

		await connectDB();

		if (actif === true) {
			const actifs = await AvantPremiereModel.find({ actif: true, _id: { $ne: id } })
				.sort({ createdAt: 1 })
				.lean();

			if (actifs.length >= MAX_ACTIFS) {
				await AvantPremiereModel.findByIdAndUpdate(actifs[0]._id, { actif: false });
			}
		}

		const updated = await AvantPremiereModel.findByIdAndUpdate(
			id,
			{ titre, description: description || undefined, image, actif },
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
