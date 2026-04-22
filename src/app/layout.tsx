import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#412A1C",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://binoclesdelasave.fr"),
  title: {
    default: "Binocles de la Save - Opticien à Levignac (31530)",
    template: "%s | Binocles de la Save",
  },
  description:
    "Votre opticien de confiance à Levignac. Examen de vue, montures de qualité, verres sur mesure. Prise de rendez-vous en ligne. Label éco-responsable.",
  keywords: [
    "opticien",
    "Levignac",
    "lunettes",
    "examen de vue",
    "31530",
    "Haute-Garonne",
    "montures",
    "verres",
    "lentilles",
  ],
  authors: [{ name: "Binocles de la Save" }],
  creator: "Binocles de la Save",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Binocles de la Save",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://binoclesdelasave.fr",
    siteName: "Binocles de la Save",
    title: "Binocles de la Save - Opticien à Levignac",
    description:
      "Opticien indépendant à Levignac. Lunettes, examen de vue, réparations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binocles de la Save",
    description: "Votre opticien à Levignac",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen overflow-x-hidden">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
