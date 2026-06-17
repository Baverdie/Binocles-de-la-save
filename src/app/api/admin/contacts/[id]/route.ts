import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ContactModel from "@/models/Contact";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const contact = await ContactModel.findById(id);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    contact.traite = !contact.traite;
    await contact.save();

    return NextResponse.json({ traite: contact.traite });
  } catch (error) {
    console.error("[API] Erreur PATCH contact:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const contact = await ContactModel.findByIdAndDelete(id);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erreur DELETE contact:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
