import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import ContactModel from "@/models/Contact";
import {
  envoyerEmail,
  templateNouveauContact,
  templateCommandeLentilles,
} from "@/lib/email";
import { sendAdminPush } from "@/lib/notifications/sendAdminNotification";

interface FilePayload {
  name: string;
  type: string;
  data: string; // base64
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;
    const adminEmail =
      process.env.ADMIN_EMAIL || "contact@binoclesdelasave.fr";

    if (type === "lentilles") {
      return handleLentilles(body, adminEmail);
    }

    return handleContact(body, adminEmail);
  } catch (error) {
    console.error("Erreur API contact:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}

async function handleContact(
  body: Record<string, unknown>,
  adminEmail: string
) {
  const { nom, prenom, email, telephone, message } = body as {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    message: string;
  };

  if (!nom || !prenom || !email || !telephone || !message) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Adresse email invalide." },
      { status: 400 }
    );
  }

  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Le message ne doit pas dépasser 1000 caractères." },
      { status: 400 }
    );
  }

  await connectDB();
  await ContactModel.create({ nom, prenom, email, telephone, message, type: "question" });

  await envoyerEmail({
    to: adminEmail,
    subject: `Nouveau message de ${prenom} ${nom}`,
    html: templateNouveauContact({ nom, prenom, email, telephone, message }),
  });

  return NextResponse.json({ success: true });
}

async function handleLentilles(
  body: Record<string, unknown>,
  adminEmail: string
) {
  const {
    nom,
    prenom,
    telephone,
    format,
    duree,
    besoinProduit,
    marqueProduit,
    message,
    ordonnance,
    mutuelle,
  } = body as {
    nom: string;
    prenom: string;
    telephone: string;
    format: "journalieres" | "mensuelles";
    duree: string;
    besoinProduit: boolean;
    marqueProduit: string | null;
    message: string;
    ordonnance?: FilePayload;
    mutuelle?: FilePayload;
  };

  if (!nom || !prenom || !telephone || !format || !duree || !ordonnance) {
    return NextResponse.json(
      { error: "Veuillez remplir tous les champs obligatoires et joindre votre ordonnance." },
      { status: 400 }
    );
  }

  const formatLabel = format === "journalieres" ? "Journalières" : "Mensuelles";
  const dureeLabel = `${duree} mois`;

  const fullMessage = [
    "[Commande de lentilles]",
    `Format : ${formatLabel}`,
    `Durée souhaitée : ${dureeLabel}`,
    besoinProduit
      ? `Produit d'entretien : ${marqueProduit || "Non précisé"}`
      : "",
    message ? `\nMessage : ${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await connectDB();

  console.log("Sauvegarde commande lentilles:", {
    nom,
    prenom,
    email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@lentilles.local`,
    telephone,
    type: "lentilles",
  });

  const savedContact = await ContactModel.create({
    nom,
    prenom,
    email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@lentilles.local`,
    telephone,
    message: fullMessage,
    type: "lentilles",
  });

  console.log("Commande lentilles sauvegardée avec succès:", savedContact._id);

  const verif = await ContactModel.countDocuments({ type: "lentilles" });
  console.log("Vérification immédiate - total lentilles dans la DB:", verif);

  const attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> = [];

  if (ordonnance?.data) {
    attachments.push({
      filename: ordonnance.name,
      content: Buffer.from(ordonnance.data, "base64"),
      contentType: ordonnance.type,
    });
  }

  if (mutuelle?.data) {
    attachments.push({
      filename: mutuelle.name,
      content: Buffer.from(mutuelle.data, "base64"),
      contentType: mutuelle.type,
    });
  }

  await envoyerEmail({
    to: adminEmail,
    subject: `Commande de lentilles — ${prenom} ${nom}`,
    html: templateCommandeLentilles({
      nom,
      prenom,
      telephone,
      format: formatLabel,
      duree: dureeLabel,
      besoinProduit,
      marqueProduit: marqueProduit || undefined,
      message: message || undefined,
      hasMutuelle: !!mutuelle,
    }),
    attachments,
  });

  sendAdminPush({
    title: "Nouvelle commande de lentilles",
    body: `${prenom} ${nom}`,
    url: "/formulaires",
    type: "lensOrder",
  }).catch((err) => console.error("[Push] Erreur lentilles:", err));

  return NextResponse.json({ success: true });
}
