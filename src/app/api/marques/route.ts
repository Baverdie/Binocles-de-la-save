import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import MarqueModel from "@/models/Marque";

export async function GET() {
  try {
    await connectDB();

    const marques = await MarqueModel.find({ actif: true })
      .sort({ ordre: 1 })
      .lean();

    return NextResponse.json(marques);
  } catch (error) {
    console.error("[API] Erreur GET marques publiques:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
