import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ContactModel from "@/models/Contact";
import RdvModel from "@/models/Rdv";
import MarqueModel from "@/models/Marque";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      upcomingRdvCount,
      activeMarques,
      monthContacts,
      monthLensOrders,
      recentContacts,
      upcomingRdv,
    ] = await Promise.all([
      RdvModel.countDocuments({ dateRdv: { $gte: now }, statut: "confirme" }),
      MarqueModel.countDocuments({ actif: true }),
      ContactModel.countDocuments({ createdAt: { $gte: startOfMonth }, type: "question" }),
      ContactModel.countDocuments({ createdAt: { $gte: startOfMonth }, type: "lentilles" }),
      ContactModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      RdvModel.find({ dateRdv: { $gte: now }, statut: "confirme" }).sort({ dateRdv: 1 }).limit(5).lean(),
    ]);

    return NextResponse.json({
      stats: { upcomingRdvCount, activeMarques, monthContacts, monthLensOrders },
      recentContacts: JSON.parse(JSON.stringify(recentContacts)),
      upcomingRdv: JSON.parse(JSON.stringify(upcomingRdv)),
    });
  } catch (error) {
    console.error("[API] Erreur GET dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
