"use client";

import Link from "next/link";
import Image from "next/image";

const navigation = [
  { name: "Marques", href: "/marques" },
  { name: "À propos", href: "/a-propos" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
  { name: "Commander des lentilles", href: "/contact?vue=lentilles" },
];

export default function Footer() {
  return (
    <footer className="bg-beige">
      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Top: Logo + Nav */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-6">
          <Link href="/" className="inline-block">
            <div className="relative h-12 w-28 sm:h-16 sm:w-36">
              <Image
                src="/logo/Big/bds-big.png"
                alt="Binocles de la Save"
                fill
                className="object-contain object-left"
              />
            </div>
          </Link>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-brown/75 hover:text-brown transition-colors duration-300"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Middle: Contact info in a row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 md:gap-12 py-6 sm:py-8 border-y border-brown/10">
          <address className="not-italic text-sm text-brown/75">
            42 Avenue de la République, 31530 Levignac
          </address>
          <a
            href="tel:+33534521969"
            className="text-sm text-brown/75 hover:text-brown transition-colors duration-300"
          >
            05 34 52 19 69
          </a>
          <div className="flex gap-4 sm:ml-auto">
            <a
              href="https://www.instagram.com/bdslevignac/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brown/40 hover:text-accent transition-colors duration-300"
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="6" r="1" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/p/Binocles-de-la-Save-100087063979921/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brown/40 hover:text-accent transition-colors duration-300"
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom: Copyright + Legal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-xs text-brown/55">
              © {new Date().getFullYear()} Binocles de la Save
            </p>
            <span className="hidden sm:inline text-accent/40">•</span>
            <p className="text-xs text-brown/55">
              Site créé par{" "}
              <a
                href="https://baverdie.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brown/70 hover:text-brown transition-colors duration-300 underline"
              >
                Baverdie
              </a>
            </p>
          </div>
          <div className="flex gap-6">
            <Link
              href="/mentions-legales"
              className="text-xs text-brown/55 hover:text-brown transition-colors duration-300 underline"
            >
              Mentions légales
            </Link>
            <Link
              href="/confidentialite"
              className="text-xs text-brown/55 hover:text-brown transition-colors duration-300 underline"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
