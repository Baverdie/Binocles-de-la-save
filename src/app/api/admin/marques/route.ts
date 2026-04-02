import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import MarqueModel from "@/models/Marque";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const marques = await MarqueModel.find().sort({ ordre: 1 }).lean();

    return NextResponse.json(marques);
  } catch (error) {
    console.error("[API] Erreur GET marques:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { nom, logo, origine, resume, descriptionLongue, tags, images, lienSite, actif } = body;

    if (!nom || !logo) {
      return NextResponse.json(
        { error: "Nom et logo requis" },
        { status: 400 }
      );
    }

    const lastMarque = await MarqueModel.findOne().sort({ ordre: -1 });
    const ordre = lastMarque ? lastMarque.ordre + 1 : 0;

    const marque = await MarqueModel.create({
      nom,
      logo,
      origine: origine || "",
      resume: resume || "",
      descriptionLongue: descriptionLongue || "",
      tags: tags || [],
      images: images || [],
      lienSite: lienSite || "",
      ordre,
      actif: actif !== false,
    });

    return NextResponse.json(marque);
  } catch (error) {
    console.error("[API] Erreur POST marque:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds requis" },
        { status: 400 }
      );
    }

    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        MarqueModel.findByIdAndUpdate(id, { ordre: index })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erreur PUT marques:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
