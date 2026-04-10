import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import VitrineModel from "@/models/Vitrine";

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
    const { titre, description, image, date, actif } = body;

    if (!titre || !image || !date) {
      return NextResponse.json(
        { error: "Titre, image et date sont requis" },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await VitrineModel.findByIdAndUpdate(
      id,
      {
        titre,
        description: description || undefined,
        image,
        date: new Date(date),
        actif,
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] Erreur PUT admin/vitrines:", error);
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

    const deleted = await VitrineModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erreur DELETE admin/vitrines:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
