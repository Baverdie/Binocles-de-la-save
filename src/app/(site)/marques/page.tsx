import type { Metadata } from "next";
import MarquesPage from "./MarquesPage";

export const metadata: Metadata = {
  title: "Nos Marques",
  description:
    "Découvrez les marques de lunettes sélectionnées par Binocles de la Save : créateurs français, artisans lunetiers, montures éco-responsables.",
  openGraph: {
    title: "Nos Marques | Binocles de la Save",
    description:
      "Une sélection de créateurs et artisans lunetiers français et européens.",
  },
};

export default function Page() {
  return <MarquesPage />;
}
