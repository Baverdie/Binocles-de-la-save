import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";

// PATCH - Déconnecter Google Calendar d'un admin
export async function PATCH(
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

		const admin = await AdminModel.findById(id);
		if (!admin) {
			return NextResponse.json(
				{ error: "Admin non trouvé" },
				{ status: 404 }
			);
		}

		admin.googleRefreshToken = undefined;
		admin.googleCalendarId = undefined;
		await admin.save();

		console.log(`[OAuth] Google Calendar disconnected for admin ${id}`);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[API] Erreur disconnect Google:", error);
		return NextResponse.json(
			{ error: "Erreur serveur" },
			{ status: 500 }
		);
	}
}
