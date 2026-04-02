import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPage from "./ContactPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Binocles de la Save, votre opticien à Levignac. Formulaire de contact, adresse, téléphone et horaires d'ouverture.",
  openGraph: {
    title: "Contact | Binocles de la Save",
    description:
      "Contactez votre opticien à Levignac. Formulaire, adresse et horaires.",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-beige" />}>
      <ContactPage />
    </Suspense>
  );
}
