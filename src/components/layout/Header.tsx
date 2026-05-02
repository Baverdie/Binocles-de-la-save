"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Marques", href: "/marques" },
  { name: "Vitrines", href: "/vitrines" },
  { name: "À propos", href: "/a-propos" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // On non-home pages, always use dark variant (brown text on beige bg)
  // Also use dark variant when mobile menu is open (beige bg shows)
  const dark = !isHome || scrolled || mobileMenuOpen;

  return (
    <motion.header
      initial={isHome ? { opacity: 0, y: "-100%" } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isHome ? { duration: 1.2, delay: 3.0, ease: "easeOut" } : { duration: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        dark ? "bg-beige/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-34 w-34 sm:w-40 scale-104">
              <Image
                src="/logo/Big/bds-big-light.png"
                alt="Binocles de la Save"
                fill
                sizes="160px"
                className={`object-contain object-left transition-opacity duration-300 ${
                  dark ? "opacity-0" : "opacity-100"
                }`}
              />
              <Image
                src="/logo/Big/bds-big.png"
                alt="Binocles de la Save"
                fill
                sizes="160px"
                className={`object-contain object-left transition-opacity duration-300 ${
                  dark ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </Link>

          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative text-sm font-medium transition-colors duration-300 group ${
                  dark
                    ? "text-brown/70 hover:text-brown"
                    : "text-beige/70 hover:text-beige"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
                    dark ? "bg-accent" : "bg-beige"
                  }`}
                />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/rendez-vous"
              className={`hidden lg:inline-flex items-center border-2 justify-center px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                dark
                  ? "bg-brown border-brown text-beige hover:text-brown hover:bg-beige"
                  : "bg-beige border-beige text-brown hover:text-beige hover:bg-brown"
              }`}
            >
              Prendre RDV
            </Link>

            <button
              type="button"
              className={`lg:hidden relative w-10 h-10 flex items-center justify-center transition-colors ${
                dark ? "text-brown" : "text-beige"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">
                {mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              </span>
              <div className="w-5 h-4 relative flex flex-col justify-between items-center">
                <motion.span
                  animate={{
                    rotate: mobileMenuOpen ? 45 : 0,
                    y: mobileMenuOpen ? 7 : 0,
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`w-full h-0.5 rounded-full origin-center will-change-transform ${
                    dark ? "bg-brown" : "bg-beige"
                  }`}
                />
                <motion.span
                  animate={{
                    opacity: mobileMenuOpen ? 0 : 1,
                    scaleX: mobileMenuOpen ? 0 : 1,
                  }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`w-3/4 h-0.5 rounded-full will-change-transform ${
                    dark ? "bg-brown" : "bg-beige"
                  }`}
                />
                <motion.span
                  animate={{
                    rotate: mobileMenuOpen ? -45 : 0,
                    y: mobileMenuOpen ? -7 : 0,
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`w-full h-0.5 rounded-full origin-center will-change-transform ${
                    dark ? "bg-brown" : "bg-beige"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-beige border-t border-brown/10 shadow-lg"
          >
            <div className="flex flex-col px-6 py-6 gap-1">
              {navigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    className="block py-3 text-lg font-medium text-brown hover:text-brown/70 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="pt-4 mt-2 border-t border-brown/10"
              >
                <Link
                  href="/rendez-vous"
                  className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-medium rounded-full bg-brown text-beige hover:bg-brown/90 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Prendre rendez-vous
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
