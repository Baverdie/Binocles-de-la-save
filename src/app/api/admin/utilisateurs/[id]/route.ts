import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import bcrypt from "bcryptjs";

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
    const admin = await AdminModel.findById(id).select("-passwordHash").lean();

    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("[API] Erreur GET admin:", error);
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
    const { email, name, password } = body;

    const admin = await AdminModel.findById(id);
    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    if (email && email !== admin.email) {
      const existing = await AdminModel.findOne({ email });
      if (existing) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }
      admin.email = email;
    }

    if (name) admin.name = name;
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 8 caractères" },
          { status: 400 }
        );
      }
      admin.passwordHash = await bcrypt.hash(password, 12);
    }

    await admin.save();

    return NextResponse.json({
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      updatedAt: admin.updatedAt,
    });
  } catch (error) {
    console.error("[API] Erreur PUT admin:", error);
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

    const count = await AdminModel.countDocuments();
    if (count <= 1) {
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier administrateur" },
        { status: 400 }
      );
    }

    const admin = await AdminModel.findByIdAndDelete(id);
    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erreur DELETE admin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
