import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import PushSubscriptionModel from "@/models/PushSubscription";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Subscription invalide" }, { status: 400 });
    }

    await connectDB();

    const admin = await AdminModel.findOne({ email: session.user.email });
    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(String(admin._id));
    const userAgent = request.headers.get("user-agent") || undefined;

    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint },
      { userId, endpoint, keys, userAgent },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push] Erreur subscribe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requis" }, { status: 400 });
    }

    await connectDB();
    await PushSubscriptionModel.deleteOne({ endpoint });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push] Erreur unsubscribe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
