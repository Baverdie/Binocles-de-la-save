export const dynamic = "force-dynamic";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Binocles de la Save - Opticien indépendant à Levignac (31530)",
  description:
    "Opticien indépendant à Levignac (31530). Examen de vue, montures créateurs, verres sur mesure, lentilles. Prise de rendez-vous en ligne. Proche Toulouse, Haute-Garonne.",
  openGraph: {
    title: "Binocles de la Save - Opticien indépendant à Levignac",
    description:
      "Votre opticien de quartier à Levignac. Examen de vue, montures créateurs, verres sur mesure. Rendez-vous en ligne.",
    url: "https://binoclesdelasave.fr",
  },
};

import {
  HeroSection,
  PresentationSection,
  ServicesSection,
  EngagementsSection,
  NouveautesSection,
  AvisSection,
  HorairesSection,
} from "@/components/home";
import connectDB from "@/lib/db/mongodb";
import VacancesModel from "@/models/Vacances";
import FermetureModel from "@/models/Fermeture";
import AvantPremiereModel from "@/models/AvantPremiere";
import HoraireModel from "@/models/Horaire";
import { getGoogleReviews } from "@/lib/google-reviews";
import type { Horaire } from "@/types";

export type ProchainEvenement = {
  type: "vacances" | "fermeture";
  label: string;
  detail?: string;
};

async function getProchainEvenement(): Promise<ProchainEvenement | undefined> {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const formatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

  const [prochaineVacances, prochaineFermeture] = await Promise.all([
    VacancesModel.findOne({
      actif: true,
      dateFin: { $gte: todayStart },
    })
      .sort({ dateDebut: 1 })
      .lean(),
    FermetureModel.findOne({
      date: { $gte: todayStart },
    })
      .sort({ date: 1 })
      .lean(),
  ]);

  if (!prochaineVacances && !prochaineFermeture) return undefined;

  const vacancesDate = prochaineVacances ? new Date(prochaineVacances.dateDebut) : null;
  const fermetureDate = prochaineFermeture ? new Date(prochaineFermeture.date) : null;

  if (vacancesDate && (!fermetureDate || vacancesDate <= fermetureDate)) {
    return {
      type: "vacances",
      label: `Fermeture du ${formatter.format(new Date(prochaineVacances!.dateDebut))} au ${formatter.format(new Date(prochaineVacances!.dateFin))}`,
      detail: prochaineVacances!.message || undefined,
    };
  }

  if (fermetureDate) {
    const dateStr = formatter.format(fermetureDate);
    const isFullDay = prochaineFermeture!.journeeComplete !== false;
    return {
      type: "fermeture",
      label: isFullDay
        ? `Fermeture le ${dateStr}`
        : `Fermeture le ${dateStr} de ${prochaineFermeture!.heureDebut} à ${prochaineFermeture!.heureFin}`,
      detail: prochaineFermeture!.raison || undefined,
    };
  }

  return undefined;
}

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Convertit les horaires DB en openingHoursSpecification schema.org
function buildOpeningHours(horaires: Horaire[]) {
  const specs: { "@type": string; dayOfWeek: string; opens: string; closes: string }[] = [];
  for (const h of horaires) {
    if (!h.ouvert) continue;
    const day = SCHEMA_DAYS[h.jour];
    if (h.matin?.debut && h.matin?.fin)
      specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: h.matin.debut, closes: h.matin.fin });
    if (h.aprem?.debut && h.aprem?.fin)
      specs.push({ "@type": "OpeningHoursSpecification", dayOfWeek: day, opens: h.aprem.debut, closes: h.aprem.fin });
  }
  return specs;
}

async function getNouveautes() {
  await connectDB();
  const nouveautes = await AvantPremiereModel.find({ actif: true })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(nouveautes));
}

async function getHoraires(): Promise<Horaire[]> {
  await connectDB();
  const horaires = await HoraireModel.find().sort({ jour: 1 }).lean();
  return JSON.parse(JSON.stringify(horaires));
}

export default async function HomePage() {
  const [prochainEvenement, nouveautes, googleReviews, horaires] = await Promise.all([
    getProchainEvenement(),
    getNouveautes(),
    getGoogleReviews(),
    getHoraires(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Optician",
    name: "Binocles de la Save",
    description:
      "Opticien indépendant à Levignac. Examen de vue, montures créateurs, verres sur mesure, lentilles.",
    url: "https://binoclesdelasave.fr",
    telephone: "+33534521969",
    address: {
      "@type": "PostalAddress",
      streetAddress: "42 Avenue de la République",
      addressLocality: "Levignac",
      postalCode: "31530",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.6745,
      longitude: 1.2418,
    },
    openingHoursSpecification: buildOpeningHours(horaires),
    sameAs: [
      "https://www.facebook.com/p/Binocles-de-la-Save-100087063979921/",
    ],
    image: "https://binoclesdelasave.fr/opengraph-image",
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Cash, Credit Card, Carte Vitale",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: 43.6745, longitude: 1.2418 },
      geoRadius: "20000",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection prochainEvenement={prochainEvenement} />
      <PresentationSection />
      <ServicesSection />
      <EngagementsSection />
      <NouveautesSection nouveautes={nouveautes} />
      <HorairesSection />
      <AvisSection googleData={googleReviews} />
    </>
  );
}
