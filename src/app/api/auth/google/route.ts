import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import { generateAuthUrl } from "@/lib/google-calendar";

// GET - Redirige vers l'écran de consentement Google OAuth
export async function GET() {
	try {
		const session = await auth();
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
		}

		await connectDB();
		const admin = await AdminModel.findOne({ email: session.user.email });
		if (!admin) {
			return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
		}

		const url = generateAuthUrl(admin._id.toString());
		return NextResponse.redirect(url);
	} catch (error) {
		console.error("[OAuth] Erreur initiation:", error);
		return NextResponse.redirect(
			new URL("/admin/utilisateurs?calendar=error", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
		);
	}
}
