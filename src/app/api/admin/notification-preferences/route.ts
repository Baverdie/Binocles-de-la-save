import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import NotificationPreferencesModel from "@/models/NotificationPreferences";
import type { INotificationPreferences } from "@/models/NotificationPreferences";

const VALID_EVENT_KEYS = [
  "appointment",
  "lensOrder",
  "contactRequest",
  "appointmentCancellation",
] as const;

async function getAdmin(email: string) {
  await connectDB();
  return AdminModel.findOne({ email });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const admin = await getAdmin(session.user.email);
    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    const userId = admin._id as mongoose.Types.ObjectId;
    let prefs = await NotificationPreferencesModel.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreferencesModel.create({ userId });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("[NotifPrefs] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const admin = await getAdmin(session.user.email);
    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    const userId = admin._id as mongoose.Types.ObjectId;
    const body = await request.json();

    let prefs = await NotificationPreferencesModel.findOne({ userId });
    if (!prefs) {
      prefs = (await NotificationPreferencesModel.create({ userId })) as InstanceType<
        typeof NotificationPreferencesModel
      > & { toObject(): INotificationPreferences };
    }

    if (typeof body.enabled === "boolean") {
      prefs.enabled = body.enabled;
    }

    if (body.events && typeof body.events === "object") {
      for (const key of VALID_EVENT_KEYS) {
        if (typeof body.events[key] === "boolean") {
          prefs.events[key] = body.events[key] as boolean;
        }
      }
    }

    await prefs.save();
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("[NotifPrefs] Erreur PATCH:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
