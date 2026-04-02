export const dynamic = "force-dynamic";

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
import { getGoogleReviews } from "@/lib/google-reviews";

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

async function getNouveautes() {
  await connectDB();
  const now = new Date();
  const nouveautes = await AvantPremiereModel.find({
    actif: true,
    dateDebut: { $lte: now },
    dateFin: { $gte: now },
  })
    .sort({ ordre: 1 })
    .lean();
  return JSON.parse(JSON.stringify(nouveautes));
}

export default async function HomePage() {
  const [prochainEvenement, nouveautes, googleReviews] = await Promise.all([
    getProchainEvenement(),
    getNouveautes(),
    getGoogleReviews(),
  ]);

  return (
    <>
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
