import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import bcrypt from "bcryptjs";

// GET - Liste des admins
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const admins = await AdminModel.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    // Remplacer googleRefreshToken par un boolean pour ne pas exposer le token
    const sanitized = admins.map((admin) => ({
      ...admin,
      googleRefreshToken: admin.googleRefreshToken ? "connected" : undefined,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("[API] Erreur GET admins:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un admin
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existing = await AdminModel.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Un admin avec cet email existe déjà" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await AdminModel.create({
      email,
      name,
      passwordHash,
    });

    return NextResponse.json({
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      createdAt: admin.createdAt,
    });
  } catch (error) {
    console.error("[API] Erreur POST admin:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
