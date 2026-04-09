import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { processLogoImage, optimizeGalleryImage } from "@/lib/imageProcessing";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(new Uint8Array(bytes));

    let fileExt = "jpg";
    let contentType = "image/jpeg";

    if (folder === "marques") {
      buffer = await processLogoImage(buffer);
      fileExt = "webp";
      contentType = "image/webp";
    } else if (folder === "marques/gallery") {
      buffer = await optimizeGalleryImage(buffer);
      fileExt = "webp";
      contentType = "image/webp";
    } else if (folder === "nouveautes") {
      buffer = await optimizeGalleryImage(buffer, 1600);
      fileExt = "webp";
      contentType = "image/webp";
    }

    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ path: blob.url });
  } catch (error) {
    console.error("[API] Erreur upload:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
