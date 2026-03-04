import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { processLogoImage, optimizeGalleryImage } from "@/lib/imageProcessing";

// POST - Upload d'image avec traitement intelligent
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

    // Vérifier le type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(new Uint8Array(bytes));

    // Traitement spécial selon le dossier
    let fileExt = "jpg";

    if (folder === "marques") {
      // Pour les logos : suppression du fond blanc, conversion PNG transparent
      buffer = await processLogoImage(buffer);
      fileExt = "png";
    } else if (folder === "marques/gallery" || folder === "nouveautes") {
      // Pour les galeries et nouveautés : optimisation et compression en WebP
      buffer = await optimizeGalleryImage(buffer);
      fileExt = "webp";
    }

    // Créer un nom de fichier unique
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Créer le dossier si nécessaire
    const uploadDir = path.join(process.cwd(), "public", folder);
    await mkdir(uploadDir, { recursive: true });

    // Écrire le fichier
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Retourner le chemin public
    const publicPath = `/${folder}/${filename}`;

    return NextResponse.json({ path: publicPath });
  } catch (error) {
    console.error("[API] Erreur upload:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
