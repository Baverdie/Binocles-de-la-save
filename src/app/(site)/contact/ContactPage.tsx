"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

type View = "hub" | "lentilles";
type Status = "idle" | "loading" | "success" | "error";

const options = [
  {
    key: "rdv" as const,
    label: "Prendre rendez-vous",
    description: "Examen de vue, essayage, réparation ou ajustement.",
    href: "/rendez-vous",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <rect x="6" y="10" width="36" height="30" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 20h36" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 6v8M32 6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="30" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "faq" as const,
    label: "Une question ?",
    description: "Consultez notre FAQ ou posez-nous votre question.",
    href: "/faq",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 18a6 6 0 0 1 11.2 3c0 4-6 4-6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="34" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "lentilles" as const,
    label: "Commander des lentilles",
    description: "Envoyez votre ordonnance pour une commande de lentilles.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <ellipse cx="24" cy="24" rx="16" ry="20" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="24" cy="24" rx="8" ry="12" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="18" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("hub");

  // Handle query param for direct access
  useEffect(() => {
    const vueParam = searchParams.get("vue");
    if (vueParam === "lentilles") {
      setView("lentilles");
    }
  }, [searchParams]);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    format: "",
    duree: "",
    besoinProduit: false,
    marqueProduit: "",
    message: "",
  });
  const [ordonnance, setOrdonnance] = useState<File | null>(null);
  const [aMutuelle, setAMutuelle] = useState(false);
  const [mutuelle, setMutuelle] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "telephone") {
      setForm((prev) => ({ ...prev, telephone: formatPhone(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    // Vérification ordonnance obligatoire
    if (!ordonnance) {
      setStatus("error");
      setErrorMsg("L'ordonnance est obligatoire pour commander des lentilles.");
      return;
    }

    // Vérification carte mutuelle si cochée
    if (aMutuelle && !mutuelle) {
      setStatus("error");
      setErrorMsg("Veuillez joindre votre carte de mutuelle.");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        format: form.format,
        duree: form.duree,
        besoinProduit: form.besoinProduit,
        marqueProduit: form.marqueProduit || null,
        message: form.message,
        type: "lentilles",
      };

      if (ordonnance) {
        payload.ordonnance = {
          name: ordonnance.name,
          type: ordonnance.type,
          data: await fileToBase64(ordonnance),
        };
      }

      if (mutuelle) {
        payload.mutuelle = {
          name: mutuelle.name,
          type: mutuelle.type,
          data: await fileToBase64(mutuelle),
        };
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      setStatus("success");
      setForm({
        nom: "",
        prenom: "",
        telephone: "",
        format: "",
        duree: "",
        besoinProduit: false,
        marqueProduit: "",
        message: "",
      });
      setOrdonnance(null);
      setAMutuelle(false);
      setMutuelle(null);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    }
  }

  const inputClasses =
    "w-full bg-white border border-brown/10 rounded-2xl px-4 py-3 text-sm text-brown placeholder:text-brown/30 focus:outline-none focus:border-accent/50 transition-colors duration-300";

  return (
    <section
      ref={ref}
      className="relative min-h-[75vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige overflow-hidden"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="contact-dots"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="16" cy="16" r="1" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contact-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            Contact
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brown">
            Comment puis-je vous aider ?
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Hub view — 3 cards */}
          {view === "hub" && (
            <motion.div
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto"
            >
              {options.map((option, index) => {
                const content = (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                      isInView ? { opacity: 1, y: 0 } : {}
                    }
                    transition={{
                      duration: 0.5,
                      delay: 0.2 + index * 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{ y: -4 }}
                    className="group cursor-pointer"
                  >
                    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl h-full transition-shadow duration-300 max-lg:shadow-md hover:shadow-xl flex flex-col items-center text-center">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 mb-4 sm:mb-6 text-accent/50 max-lg:text-accent max-lg:scale-105 transition-all duration-500 group-hover:text-accent group-hover:scale-110">
                        {option.icon}
                      </div>
                      <h3 className="font-serif text-base sm:text-lg text-brown mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:-translate-y-0.5">
                        {option.label}
                      </h3>
                      <p className="text-brown/50 text-xs sm:text-sm leading-relaxed flex-1">
                        {option.description}
                      </p>
                      <div className="mt-4 sm:mt-5 flex items-center gap-1.5 text-brown/40 max-lg:text-brown/70 group-hover:text-brown transition-colors duration-300">
                        <span className="text-[10px] sm:text-xs font-medium">
                          {option.key === "lentilles" ? "Commencer" : "Accéder"}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                          <path
                            d="M4 10h12M12 6l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                );

                if (option.href) {
                  return (
                    <Link key={option.key} href={option.href}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={option.key}
                    onClick={() => setView("lentilles")}
                  >
                    {content}
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Lentilles form view */}
          {view === "lentilles" && (
            <motion.div
              key="lentilles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {/* Back button */}
              <button
                onClick={() => {
                  setView("hub");
                  setStatus("idle");
                  setErrorMsg("");
                }}
                className="flex items-center gap-2 text-brown/40 hover:text-brown transition-colors duration-300 mb-8 group cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                >
                  <path
                    d="M16 10H4M8 14l-4-4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm">Retour</span>
              </button>

              <div className="mb-8">
                <h2 className="font-serif text-2xl md:text-3xl text-brown mb-3">
                  Commander des lentilles
                </h2>
                <p className="text-brown/50 text-sm leading-relaxed">
                  Remplissez le formulaire ci-dessous avec vos coordonnées et les
                  informations de votre ordonnance. Je vous recontacterai pour
                  confirmer votre commande.
                </p>
              </div>

              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white p-8 sm:p-10 rounded-3xl text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-6 text-accent/70">
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      className="w-full h-full"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M15 24l6 6 12-12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl text-brown mb-3">
                    Demande envoyée
                  </h3>
                  <p className="text-brown/60 text-sm leading-relaxed mb-6">
                    Votre demande de commande de lentilles a bien été envoyée.
                    Je vous recontacterai dans les meilleurs délais.
                  </p>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setView("hub");
                    }}
                    className="text-sm text-brown/50 hover:text-brown transition-colors duration-300"
                  >
                    Retour à l&apos;accueil contact
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nom / Prénom */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-xs text-brown/50 mb-1.5 ml-1"
                      >
                        Nom
                      </label>
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        required
                        value={form.nom}
                        onChange={handleChange}
                        placeholder="Dupont"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prenom"
                        className="block text-xs text-brown/50 mb-1.5 ml-1"
                      >
                        Prénom
                      </label>
                      <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        required
                        value={form.prenom}
                        onChange={handleChange}
                        placeholder="Marie"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label
                      htmlFor="telephone"
                      className="block text-xs text-brown/50 mb-1.5 ml-1"
                    >
                      Téléphone
                    </label>
                    <input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      required
                      value={form.telephone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      className={inputClasses}
                    />
                  </div>

                  {/* Format / Nombre de boîtes */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="format"
                        className="block text-xs text-brown/50 mb-1.5 ml-1"
                      >
                        Format de lentilles
                      </label>
                      <select
                        id="format"
                        name="format"
                        required
                        value={form.format}
                        onChange={handleChange}
                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23412A1C%22%20fill-opacity%3D%220.3%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] cursor-pointer`}
                      >
                        <option value="" disabled>
                          Choisir un format
                        </option>
                        <option value="journalieres">Journalières (90/boîte)</option>
                        <option value="mensuelles">Mensuelles (6/boîte)</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="duree"
                        className="block text-xs text-brown/50 mb-1.5 ml-1"
                      >
                        Durée souhaitée
                      </label>
                      <select
                        id="duree"
                        name="duree"
                        required
                        value={form.duree}
                        onChange={handleChange}
                        className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23412A1C%22%20fill-opacity%3D%220.3%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] cursor-pointer`}
                      >
                        <option value="" disabled>
                          Choisir une durée
                        </option>
                        <option value="3">3 mois</option>
                        <option value="6">6 mois</option>
                        <option value="12">12 mois</option>
                      </select>
                    </div>
                  </div>

                  {/* Produit d'entretien */}
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-300 ${form.besoinProduit
                          ? "border-accent bg-accent/5"
                          : "border-brown/10 bg-white hover:border-brown/20"
                        }`}
                    >
                      <input
                        type="checkbox"
                        name="besoinProduit"
                        checked={form.besoinProduit}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            besoinProduit: e.target.checked,
                            marqueProduit: e.target.checked ? prev.marqueProduit : "",
                          }))
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.besoinProduit
                            ? "border-accent bg-accent"
                            : "border-brown/20 bg-white"
                          }`}
                      >
                        {form.besoinProduit && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="text-beige"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-brown">
                        J&apos;ai besoin de produit d&apos;entretien
                      </span>
                    </label>

                    <AnimatePresence>
                      {form.besoinProduit && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <label
                            htmlFor="marqueProduit"
                            className="block text-xs text-brown/50 mb-1.5 ml-1"
                          >
                            Marque de produit souhaitée
                          </label>
                          <input
                            id="marqueProduit"
                            name="marqueProduit"
                            type="text"
                            value={form.marqueProduit}
                            onChange={handleChange}
                            placeholder="Ex: Biotrue, Renu, Opti-Free..."
                            className={inputClasses}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ordonnance upload (obligatoire) */}
                  <div>
                    <label
                      htmlFor="ordonnance"
                      className="block text-xs text-brown/50 mb-1.5 ml-1"
                    >
                      Ordonnance <span className="text-brown/70">*</span>
                    </label>
                    <label
                      htmlFor="ordonnance"
                      className={`flex items-center gap-3 ${inputClasses} cursor-pointer ${!ordonnance ? "border-brown/20" : "border-brown/30 bg-brown/5"}`}
                    >
                      <svg
                        className={`w-5 h-5 shrink-0 ${ordonnance ? "text-brown" : "text-brown/30"}`}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        {ordonnance ? (
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : (
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                      <span className={ordonnance ? "text-brown" : "text-brown/30"}>
                        {ordonnance ? ordonnance.name : "Photo de l'ordonnance (obligatoire)"}
                      </span>
                    </label>
                    <input
                      id="ordonnance"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      required
                      onChange={(e) =>
                        setOrdonnance(e.target.files?.[0] || null)
                      }
                    />
                  </div>

                  {/* Carte mutuelle */}
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-300 ${aMutuelle
                          ? "border-accent bg-accent/5"
                          : "border-brown/10 bg-white hover:border-brown/20"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={aMutuelle}
                        onChange={(e) => {
                          setAMutuelle(e.target.checked);
                          if (!e.target.checked) setMutuelle(null);
                        }}
                        className="sr-only"
                      />
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${aMutuelle
                            ? "border-accent bg-accent"
                            : "border-brown/20 bg-white"
                          }`}
                      >
                        {aMutuelle && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="text-beige"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-brown">
                        J&apos;ai une carte de mutuelle
                      </span>
                    </label>

                    <AnimatePresence>
                      {aMutuelle && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <label
                            htmlFor="mutuelle"
                            className={`flex items-center gap-3 ${inputClasses} cursor-pointer`}
                          >
                            <svg
                              className="w-5 h-5 text-brown/30 shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 5v14M5 12h14"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className={mutuelle ? "text-brown" : "text-brown/30"}>
                              {mutuelle ? mutuelle.name : "Photo de la carte mutuelle"}
                            </span>
                          </label>
                          <input
                            id="mutuelle"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) =>
                              setMutuelle(e.target.files?.[0] || null)
                            }
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Message optionnel */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs text-brown/50 mb-1.5 ml-1"
                    >
                      Message <span className="text-brown/30">(optionnel)</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      maxLength={1000}
                      rows={3}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Informations complémentaires..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  {/* Error */}
                  {status === "error" && errorMsg && (
                    <motion.p
                      ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-red-600/80 px-3 py-2 rounded-lg bg-red-50 border border-red-200"
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={status === "loading"}
                    className="w-full rounded-2xl cursor-pointer"
                  >
                    {status === "loading"
                      ? "Envoi en cours..."
                      : "Envoyer ma demande"}
                  </Button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom info — always visible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-brown/10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <svg
                className="w-6 h-6 text-accent/60 mx-auto mb-3"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="12"
                  cy="9"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <address className="not-italic text-sm text-brown/60 leading-relaxed">
                42 Avenue de la République
                <br />
                31530 Levignac
              </address>
            </div>
            <div>
              <svg
                className="w-6 h-6 text-accent/60 mx-auto mb-3"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <a
                href="tel:+33534521969"
                className="text-sm text-brown/60 hover:text-brown transition-colors duration-300"
              >
                05 34 52 19 69
              </a>
            </div>
            <div>
              <svg
                className="w-6 h-6 text-accent/60 mx-auto mb-3"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="2"
                  y="4"
                  width="20"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <a
                href="mailto:contact@binoclesdelasave.fr"
                className="text-sm text-brown/60 hover:text-brown transition-colors duration-300"
              >
                contact@binoclesdelasave.fr
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
