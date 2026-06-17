import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import VitrineModel from "@/models/Vitrine";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const vitrines = await VitrineModel.find().sort({ date: -1 }).lean();
    return NextResponse.json(vitrines);
  } catch (error) {
    console.error("[API] Erreur GET admin/vitrines:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { titre, description, image, date, actif } = body;

    if (!titre || !image || !date) {
      return NextResponse.json(
        { error: "Titre, image et date sont requis" },
        { status: 400 }
      );
    }

    await connectDB();

    const vitrine = await VitrineModel.create({
      titre,
      description: description || undefined,
      image,
      date: new Date(date),
      actif: actif ?? true,
    });

    return NextResponse.json(vitrine, { status: 201 });
  } catch (error) {
    console.error("[API] Erreur POST admin/vitrines:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
