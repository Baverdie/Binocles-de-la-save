import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import MarqueModel from "@/models/Marque";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
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
    const marque = await MarqueModel.findById(id).lean();

    if (!marque) {
      return NextResponse.json({ error: "Marque non trouvée" }, { status: 404 });
    }

    return NextResponse.json(marque);
  } catch (error) {
    console.error("[API] Erreur GET marque:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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
    await connectDB();
    const body = await request.json();
    const { nom, logo, origine, resume, descriptionLongue, tags, images, lienSite, actif } = body;

    const marque = await MarqueModel.findById(id);
    if (!marque) {
      return NextResponse.json({ error: "Marque non trouvée" }, { status: 404 });
    }

    if (nom !== undefined) marque.nom = nom;
    if (logo !== undefined) marque.logo = logo;
    if (origine !== undefined) marque.origine = origine;
    if (resume !== undefined) marque.resume = resume;
    if (descriptionLongue !== undefined) marque.descriptionLongue = descriptionLongue;
    if (tags !== undefined) marque.tags = tags;
    if (images !== undefined) marque.images = images;
    if (lienSite !== undefined) marque.lienSite = lienSite;
    if (actif !== undefined) marque.actif = actif;

    await marque.save();

    return NextResponse.json(marque);
  } catch (error) {
    console.error("[API] Erreur PUT marque:", error);
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

    const marque = await MarqueModel.findByIdAndDelete(id);
    if (!marque) {
      return NextResponse.json({ error: "Marque non trouvée" }, { status: 404 });
    }

    const filesToDelete: string[] = [];
    if (marque.logo) filesToDelete.push(marque.logo);
    if (marque.images) filesToDelete.push(...marque.images);

    for (const filePath of filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), "public", filePath);
        await unlink(fullPath);
      } catch {
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erreur DELETE marque:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
