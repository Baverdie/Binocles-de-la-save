import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ContactModel from "@/models/Contact";

// GET - Liste des contacts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const type = request.nextUrl.searchParams.get("type");
    const filter: Record<string, string> = {};
    if (type) filter.type = type;

    const contacts = await ContactModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("[API] Erreur GET contacts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
