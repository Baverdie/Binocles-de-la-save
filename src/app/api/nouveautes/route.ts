import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import AvantPremiereModel from "@/models/AvantPremiere";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const nouveautes = await AvantPremiereModel.find({ actif: true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(nouveautes);
  } catch (error) {
    console.error("Erreur API nouveautes:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
