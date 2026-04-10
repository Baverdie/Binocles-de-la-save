import type { Metadata } from "next";
import VitrinePage from "./VitrinePage";
import BreadcrumbJsonLd from "@/components/ui/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Nos Vitrines",
  description:
    "Découvrez l'histoire de nos vitrines : chaque saison, une nouvelle composition imaginée par l'équipe de Binocles de la Save.",
  openGraph: {
    title: "Nos Vitrines | Binocles de la Save",
    description:
      "L'histoire de nos vitrines au fil des saisons.",
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Nos Vitrines", path: "/vitrines" }]} />
      <VitrinePage />
    </>
  );
}
