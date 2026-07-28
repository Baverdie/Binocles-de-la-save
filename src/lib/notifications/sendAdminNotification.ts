import webpush from "web-push";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import PushSubscriptionModel from "@/models/PushSubscription";
import NotificationPreferencesModel from "@/models/NotificationPreferences";

type NotificationEventType =
  | "appointment"
  | "lensOrder"
  | "contactRequest"
  | "appointmentCancellation";

interface PushPayload {
  title: string;
  body: string;
  url: string;
  type: NotificationEventType;
}

interface AdminLean {
  _id: string | mongoose.Types.ObjectId;
  email: string;
}

let vapidConfigured = false;

// Configure les clés VAPID au premier envoi plutôt qu'au chargement du module :
// évite de faire échouer le build quand les variables d'environnement sont absentes.
// Retourne false (et log une erreur) si les clés ne sont pas définies.
function configureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("[Push] Clés VAPID manquantes — notifications push désactivées");
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@binoclesdelasave.fr",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

export async function sendAdminPush(payload: PushPayload): Promise<void> {
  try {
    if (!configureVapid()) return;
    await connectDB();
    const admins = (await AdminModel.find().lean()) as AdminLean[];
    await Promise.allSettled(admins.map((admin) => sendPush(admin, payload)));
  } catch (error) {
    console.error("[Push] Erreur globale:", error);
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
