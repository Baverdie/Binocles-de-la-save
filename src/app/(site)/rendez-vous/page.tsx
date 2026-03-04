import type { Metadata } from "next";
import RendezVousPage from "./RendezVousPage";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description:
    "Prenez rendez-vous avec Binocles de la Save, votre opticien à Levignac. Examen de vue, adaptation de lentilles, ajustement de montures.",
  openGraph: {
    title: "Prendre rendez-vous | Binocles de la Save",
    description:
      "Réservez votre créneau pour un examen de vue ou un conseil personnalisé.",
  },
};

export default function Page() {
  return <RendezVousPage />;
}
