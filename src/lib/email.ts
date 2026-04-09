import { Resend } from "resend";
import connectDB from "@/lib/db/mongodb";
import ConfigTestModel from "@/models/ConfigTest";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

async function getEmailRedirection(): Promise<string | null> {
  try {
    await connectDB();
    const config = await ConfigTestModel.findOne({ actif: true }).lean();
    return config?.emailRedirection || null;
  } catch {
    return null;
  }
}

export async function envoyerEmail({ to, subject, html, attachments = [] }: EmailOptions) {
  const redirection = await getEmailRedirection();
  const destinataire = redirection || to;

  const { data, error } = await resend.emails.send({
    from: `Binocles de la Save <${process.env.RESEND_FROM || "contact@binoclesdelasave.fr"}>`,
    to: destinataire,
    subject: redirection ? `[TEST] ${subject}` : subject,
    html: redirection
      ? `<div style="background:#fef3c7;padding:10px;margin-bottom:15px;border-radius:8px;font-size:12px;color:#92400e;"><strong>MODE TEST</strong> — Email original destiné à : ${to}</div>${html}`
      : html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Buffer ? a.content : Buffer.from(a.content, "base64"),
    })),
  });

  if (error) {
    console.error("Erreur envoi email:", error);
    throw new Error(error.message);
  }

  console.log(`Email envoyé${redirection ? " [TEST → " + destinataire + "]" : ""}:`, data?.id);
  return { success: true, messageId: data?.id };
}

// ==================== Design System Email ====================

const COLORS = {
  brown: "#412A1C",
  beige: "#E7DAC6",
  accent: "#C48F50",
  white: "#ffffff",
  grayLight: "#f8f6f3",
  grayText: "#8a7e74",
  border: "rgba(65,42,28,0.12)",
};

const FONT_HEADING = "'Outfit', 'Helvetica Neue', Arial, sans-serif";
const FONT_BODY = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');`;

function emailLayout(content: string) {
  return `
    <head><style>${FONT_IMPORT}</style></head>
    <div style="background-color: ${COLORS.grayLight}; padding: 40px 16px; font-family: ${FONT_BODY};">
      <div style="max-width: 560px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <div style="background-color: ${COLORS.brown}; padding: 32px 40px; text-align: center;">
          <span style="font-family: ${FONT_HEADING}; font-size: 20px; font-weight: 300; letter-spacing: 0.08em; color: ${COLORS.beige}; text-transform: uppercase;">
            Binocles de la Save
          </span>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid ${COLORS.border}; padding: 28px 40px; text-align: center;">
          <p style="margin: 0 0 6px 0; font-size: 13px; color: ${COLORS.grayText};">
            Binocles de la Save &mdash; Lévignac, 31530
          </p>
          <a href="https://binoclesdelasave.fr" style="font-size: 13px; color: ${COLORS.accent}; text-decoration: none;">
            binoclesdelasave.fr
          </a>
        </div>

      </div>
    </div>
  `;
}

function heading(text: string) {
  return `<h1 style="font-family: ${FONT_HEADING}; font-size: 24px; font-weight: 400; color: ${COLORS.brown}; margin: 0 0 24px 0; line-height: 1.3;">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="font-size: 15px; line-height: 1.7; color: ${COLORS.brown}; margin: 0 0 16px 0;">${text}</p>`;
}

function infoCard(rows: string[]) {
  return `
    <table style="width: 100%; background-color: ${COLORS.beige}; border-radius: 12px; margin: 24px 0;" cellpadding="0" cellspacing="0">
      <tr><td style="padding: 24px 28px;">
        <table style="width: 100%;" cellpadding="0" cellspacing="0">
          ${rows.map((row) => `<tr><td style="padding: 6px 0; font-size: 15px; line-height: 1.6; color: ${COLORS.brown};">${row}</td></tr>`).join("")}
        </table>
      </td></tr>
    </table>
  `;
}

function infoRow(label: string, value: string) {
  return `<strong style="color: ${COLORS.brown};">${label}</strong>&nbsp;&nbsp;&nbsp;${value}`;
}

function separator() {
  return `<tr><td style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid rgba(65,42,28,0.15); margin: 0;" /></td></tr>`;
}

function button(text: string, url: string) {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="display: inline-block; background-color: ${COLORS.brown}; color: ${COLORS.beige}; font-size: 14px; font-weight: 500; text-decoration: none; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.02em;">
        ${text}
      </a>
    </div>
  `;
}

function quoteBlock(content: string, label?: string) {
  return `
    <div style="background-color: ${COLORS.grayLight}; border-left: 3px solid ${COLORS.accent}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
      ${label ? `<p style="font-size: 13px; font-weight: 600; color: ${COLORS.grayText}; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">${label}</p>` : ""}
      <p style="font-size: 15px; line-height: 1.6; color: ${COLORS.brown}; margin: 0; white-space: pre-wrap;">${content}</p>
    </div>
  `;
}

function signature(name: string = "Sandra Vaissière") {
  return `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${COLORS.border};">
      <p style="font-size: 15px; color: ${COLORS.brown}; margin: 0; line-height: 1.6;">
        À bientôt,<br />
        <strong>${name}</strong><br />
        <span style="color: ${COLORS.grayText};">Binocles de la Save</span>
      </p>
    </div>
  `;
}

function badge(text: string) {
  return `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: ${COLORS.accent}; background-color: rgba(196,143,80,0.1); padding: 6px 16px; border-radius: 50px;">
        ${text}
      </span>
    </div>
  `;
}

function smallText(text: string) {
  return `<p style="font-size: 13px; color: ${COLORS.grayText}; margin: 8px 0; line-height: 1.5;">${text}</p>`;
}

// ==================== Templates Email ====================

export function templateConfirmationRdv(data: {
  prenom: string;
  date: string;
  heure: string;
  typeRdv: string;
  adresse: string;
  telephone: string;
  cancelUrl?: string;
}) {
  return emailLayout(`
    ${badge("Confirmation")}
    ${heading("Votre rendez-vous est confirmé")}
    ${paragraph(`Bonjour ${data.prenom},`)}
    ${paragraph("J'ai bien enregistré votre rendez-vous. Voici les détails :")}
    ${infoCard([
      infoRow("Date", data.date),
      infoRow("Horaire", data.heure),
      infoRow("Préstation", data.typeRdv),
    ])}
    ${infoCard([
      `<strong style="color: ${COLORS.brown};">Binocles de la Save</strong>`,
      `<span style="color: ${COLORS.grayText};">${data.adresse}</span>`,
      `<span style="color: ${COLORS.grayText};">Tél. ${data.telephone}</span>`,
    ])}
    ${smallText("Un fichier calendrier est joint à cet email pour ajouter le rendez-vous à votre agenda.")}
    ${paragraph("En cas d'empêchement, merci de me prévenir au moins 24h à l'avance.")}
    ${data.cancelUrl ? `<div style="text-align: center; margin: 24px 0;"><a href="${data.cancelUrl}" style="font-size: 13px; color: ${COLORS.grayText}; text-decoration: underline;">Annuler mon rendez-vous</a></div>` : ""}
    ${signature()}
  `);
}

export function templateNotificationNouveauRdv(data: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date: string;
  heure: string;
  typeRdv: string;
  message?: string;
  googleSynced?: boolean;
}) {
  return emailLayout(`
    ${badge("Nouveau rendez-vous")}
    ${heading(`${data.prenom} ${data.nom}`)}
    ${paragraph("Un nouveau rendez-vous vient d'être confirmé.")}
    ${infoCard([
      infoRow("Date", data.date),
      infoRow("Horaire", data.heure),
      infoRow("Préstation", data.typeRdv),
    ])}
    ${infoCard([
      infoRow("Nom", `${data.prenom} ${data.nom}`),
      infoRow("Email", `<a href="mailto:${data.email}" style="color: ${COLORS.accent}; text-decoration: none;">${data.email}</a>`),
      infoRow("Téléphone", `<a href="tel:${data.telephone}" style="color: ${COLORS.accent}; text-decoration: none;">${data.telephone}</a>`),
    ])}
    ${data.message ? quoteBlock(data.message, "Message du client") : ""}
    ${button("Voir dans le dashboard", "https://binoclesdelasave.fr/admin/rdv")}
    ${data.googleSynced ? smallText("L'événement a été ajouté à votre Google Calendar.") : ""}
  `);
}

// Email envoyé au client quand C'EST LUI qui annule
export function templateConfirmationAnnulationClient(data: {
  prenom: string;
  date: string;
  heure: string;
}) {
  return emailLayout(`
    ${badge("Annulation confirmée")}
    ${heading("Votre rendez-vous a bien été annulé")}
    ${paragraph(`Bonjour ${data.prenom},`)}
    ${paragraph("Votre demande d'annulation a bien été prise en compte.")}
    ${infoCard([
      infoRow("Date", data.date),
      infoRow("Horaire", data.heure),
    ])}
    ${paragraph("Vous pouvez reprendre rendez-vous à tout moment.")}
    ${button("Reprendre rendez-vous", "https://binoclesdelasave.fr/rendez-vous")}
    ${signature()}
  `);
}

// Email envoyé au client quand C'EST L'OPTICIENNE qui annule
export function templateAnnulationRdv(data: {
  prenom: string;
  date: string;
  heure: string;
  raison?: string;
  proposerAutreCreneau?: boolean;
}) {
  return emailLayout(`
    ${badge("Annulation")}
    ${heading("Votre rendez-vous a été annulé")}
    ${paragraph(`Bonjour ${data.prenom},`)}
    ${paragraph(`Je suis au regret de vous informer que votre rendez-vous du <strong>${data.date}</strong> à <strong>${data.heure}</strong> a dû être annulé.`)}
    ${data.raison ? quoteBlock(data.raison, "Motif") : ""}
    ${paragraph("Je m'en excuse sincèrement et espère pouvoir vous accueillir très prochainement.")}
    ${data.proposerAutreCreneau ? button("Reprendre rendez-vous", "https://binoclesdelasave.fr/rendez-vous") : ""}
    ${signature()}
  `);
}

export function templateAnnulationParClient(data: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date: string;
  heure: string;
  typeRdv: string;
}) {
  return emailLayout(`
    ${badge("Annulation client")}
    ${heading(`${data.prenom} ${data.nom} a annulé son rendez-vous`)}
    ${paragraph("Un client vient d'annuler son rendez-vous via le lien dans son email de confirmation.")}
    ${infoCard([
      infoRow("Date", data.date),
      infoRow("Horaire", data.heure),
      infoRow("Préstation", data.typeRdv),
    ])}
    ${infoCard([
      infoRow("Nom", `${data.prenom} ${data.nom}`),
      infoRow("Email", `<a href="mailto:${data.email}" style="color: ${COLORS.accent}; text-decoration: none;">${data.email}</a>`),
      infoRow("Téléphone", `<a href="tel:${data.telephone}" style="color: ${COLORS.accent}; text-decoration: none;">${data.telephone}</a>`),
    ])}
    ${button("Voir dans le dashboard", "https://binoclesdelasave.fr/admin/rdv")}
  `);
}

export function templateRappelRdv(data: {
  prenom: string;
  date: string;
  heure: string;
  typeRdv: string;
  adresse: string;
  telephone: string;
}) {
  return emailLayout(`
    ${badge("Rappel")}
    ${heading("Votre rendez-vous est demain")}
    ${paragraph(`Bonjour ${data.prenom},`)}
    ${paragraph("Un petit rappel pour votre rendez-vous de demain.")}
    ${infoCard([
      infoRow("Date", data.date),
      infoRow("Horaire", data.heure),
      infoRow("Préstation", data.typeRdv),
    ])}
    ${infoCard([
      `<strong style="color: ${COLORS.brown};">Binocles de la Save</strong>`,
      `<span style="color: ${COLORS.grayText};">${data.adresse}</span>`,
      `<span style="color: ${COLORS.grayText};">Tél. ${data.telephone}</span>`,
    ])}
    ${paragraph("En cas d'empêchement, merci de me prévenir par email ou en m'appelant.")}
    <div style="margin-top: 32px;">
      ${paragraph(`À demain,<br /><strong>Sandra Vaissiere</strong>`)}
    </div>
  `);
}

export function templateNouveauContact(data: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
  pieceJointe?: string;
}) {
  return emailLayout(`
    ${badge("Nouveau message")}
    ${heading(`Message de ${data.prenom} ${data.nom}`)}
    ${infoCard([
      infoRow("Nom", `${data.prenom} ${data.nom}`),
      infoRow("Email", `<a href="mailto:${data.email}" style="color: ${COLORS.accent}; text-decoration: none;">${data.email}</a>`),
      infoRow("Téléphone", `<a href="tel:${data.telephone}" style="color: ${COLORS.accent}; text-decoration: none;">${data.telephone}</a>`),
    ])}
    ${quoteBlock(data.message, "Message")}
    ${data.pieceJointe ? smallText(`Pièce jointe : ${data.pieceJointe}`) : ""}
    ${button("Voir dans le dashboard", "https://binoclesdelasave.fr/admin/formulaires")}
  `);
}

export function templateCommandeLentilles(data: {
  nom: string;
  prenom: string;
  telephone: string;
  format: string;
  duree: string;
  besoinProduit: boolean;
  marqueProduit?: string;
  message?: string;
  hasMutuelle: boolean;
}) {
  const detailRows = [
    infoRow("Format", data.format),
    infoRow("Durée souhaitée", data.duree),
  ];

  if (data.besoinProduit) {
    detailRows.push(infoRow("Produit d'entretien", data.marqueProduit || "Non précisé"));
  }

  detailRows.push(infoRow("Ordonnance", "Jointe"));
  detailRows.push(infoRow("Carte mutuelle", data.hasMutuelle ? "Jointe" : "Non fournie"));

  return emailLayout(`
    ${badge("Commande lentilles")}
    ${heading(`Commande de ${data.prenom} ${data.nom}`)}
    ${infoCard([
      infoRow("Client", `${data.prenom} ${data.nom}`),
      infoRow("Téléphone", `<a href="tel:${data.telephone}" style="color: ${COLORS.accent}; text-decoration: none;">${data.telephone}</a>`),
    ])}
    ${infoCard(detailRows)}
    ${data.message ? quoteBlock(data.message, "Message") : ""}
    ${button("Voir dans le dashboard", "https://binoclesdelasave.fr/admin/formulaires")}
  `);
}
