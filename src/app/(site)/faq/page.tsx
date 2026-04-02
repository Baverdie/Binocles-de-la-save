import type { Metadata } from "next";
import FAQPage from "./FAQPage";
import connectDB from "@/lib/db/mongodb";
import FAQModel from "@/models/FAQ";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions fréquentes sur les services de Binocles de la Save : rendez-vous, remboursements, lentilles, réparations et plus.",
  openGraph: {
    title: "FAQ | Binocles de la Save",
    description:
      "Trouvez les réponses à vos questions sur nos services d'optique.",
  },
};

async function getFaqSchema() {
  try {
    await connectDB();
    const faqs = await FAQModel.find({ actif: true })
      .select("question reponse")
      .lean();

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.reponse,
        },
      })),
    };
  } catch {
    return null;
  }
}

export default async function Page() {
  const faqSchema = await getFaqSchema();

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <FAQPage />
    </>
  );
}
