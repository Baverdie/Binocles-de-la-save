import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import VitrineModel from "@/models/Vitrine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const vitrines = await VitrineModel.find({ actif: true })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(vitrines);
  } catch (error) {
    console.error("[API] Erreur GET vitrines:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
