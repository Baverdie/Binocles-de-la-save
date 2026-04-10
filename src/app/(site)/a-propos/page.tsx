import type { Metadata } from "next";
import AProposPage from "./AProposPage";
import BreadcrumbJsonLd from "@/components/ui/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez Binocles de la Save, votre opticien indépendant à Levignac. Une approche personnalisée de l'optique, des marques créateurs et un service sur-mesure.",
  openGraph: {
    title: "À propos | Binocles de la Save",
    description:
      "Votre opticien indépendant à Levignac, passionné par les belles montures et le service personnalisé.",
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "À propos", path: "/a-propos" }]} />
      <AProposPage />
    </>
  );
}
