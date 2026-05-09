import webpush from "web-push";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import PushSubscriptionModel from "@/models/PushSubscription";
import NotificationPreferencesModel from "@/models/NotificationPreferences";
import { envoyerEmail } from "@/lib/email";

export type NotificationEventType =
  | "appointment"
  | "lensOrder"
  | "contactRequest"
  | "appointmentCancellation";

interface NotificationPayload {
  title: string;
  body: string;
  url: string;
  type: NotificationEventType;
  emailSubject: string;
  emailHtml: string;
}

type PushPayload = Pick<NotificationPayload, "title" | "body" | "url" | "type">;

interface AdminLean {
  _id: string | mongoose.Types.ObjectId;
  email: string;
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:contact@binoclesdelasave.fr",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

// Envoie une notification push + email à tous les admins.
// L'email est TOUJOURS envoyé. Le push respecte les préférences par admin.
export async function sendAdminNotification(payload: NotificationPayload): Promise<void> {
  try {
    await connectDB();
    const admins = (await AdminModel.find().lean()) as AdminLean[];

    await Promise.allSettled(
      admins.flatMap((admin) => [sendEmail(admin.email, payload), sendPush(admin, payload)])
    );
  } catch (error) {
    console.error("[Notification] Erreur globale:", error);
  }
}

// Envoie uniquement la notification push (sans email) — à utiliser quand l'email
// est déjà envoyé par la route appelante avec un template riche.
export async function sendAdminPush(payload: PushPayload): Promise<void> {
  try {
    await connectDB();
    const admins = (await AdminModel.find().lean()) as AdminLean[];
    await Promise.allSettled(admins.map((admin) => sendPush(admin, payload)));
  } catch (error) {
    console.error("[Push] Erreur globale:", error);
  }
}

async function sendEmail(to: string, payload: NotificationPayload): Promise<void> {
  try {
    await envoyerEmail({ to, subject: payload.emailSubject, html: payload.emailHtml });
  } catch (error) {
    console.error(`[Notification] Erreur email vers ${to}:`, error);
  }
}

async function sendPush(admin: AdminLean, payload: PushPayload): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(String(admin._id));
    const prefs = await NotificationPreferencesModel.findOne({ userId });

    if (prefs) {
      if (!prefs.enabled) return;
      if (!prefs.events[payload.type]) return;
    }

    const subscriptions = await PushSubscriptionModel.find({ userId }).lean();
    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: "/apple-touch-icon.png",
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, pushPayload);
        } catch (error: unknown) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            await PushSubscriptionModel.deleteOne({ endpoint: sub.endpoint });
            console.log(`[Push] Subscription expirée supprimée: ${sub.endpoint}`);
          } else {
            console.error(`[Push] Erreur envoi:`, error);
          }
        }
      })
    );
  } catch (error) {
    console.error(`[Push] Erreur pour admin ${admin.email}:`, error);
  }
}
