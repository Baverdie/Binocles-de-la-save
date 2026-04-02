"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Button from "@/components/ui/Button";

interface FaqItem {
  _id: string;
  question: string;
  reponse: string;
}

interface FaqGroup {
  categorie: string;
  questions: FaqItem[];
}

type Status = "idle" | "loading" | "success" | "error";

export default function FAQPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [faqItems, setFaqItems] = useState<FaqGroup[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", email: "", question: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => res.json())
      .then((data) => setFaqItems(data))
      .catch(() => setFaqItems([]))
      .finally(() => setFaqLoading(false));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          prenom: "-",
          email: form.email,
          telephone: "-",
          message: `[Question FAQ]\n\n${form.question}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      setStatus("success");
      setForm({ nom: "", email: "", question: "" });
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
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="faq-dots"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="16" cy="16" r="1" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#faq-dots)" />
        </svg>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            FAQ
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brown">
            Questions fréquentes
          </h1>
        </motion.div>

        {faqLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-6 sm:space-y-8">
              {faqItems.map((category, catIndex) => (
                <motion.div
                  key={category.categorie}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + catIndex * 0.1 }}
                >
                  <h2 className="font-serif text-base sm:text-lg text-brown mb-3 sm:mb-4">
                    {category.categorie}
                  </h2>
                  <div className="space-y-2">
                    {category.questions.map((item, qIndex) => {
                      const key = `${catIndex}-${qIndex}`;
                      const isOpen = openIndex === key;

                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenIndex(isOpen ? null : key)}
                            className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left group cursor-pointer"
                          >
                            <span className="text-sm text-brown/80 group-hover:text-brown transition-colors duration-300">
                              {item.question}
                            </span>
                            <motion.span
                              animate={{ rotate: isOpen ? 45 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="shrink-0 w-5 h-5 text-brown/30 group-hover:text-accent transition-colors duration-300"
                            >
                              <svg viewBox="0 0 20 20" fill="none">
                                <path
                                  d="M10 4v12M4 10h12"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </motion.span>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-brown/60 leading-relaxed">
                                  {item.reponse}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-brown/10"
            >
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="font-serif text-lg sm:text-xl md:text-2xl text-brown mb-2">
                  Vous n&apos;avez pas trouvé votre réponse ?
                </h2>
                <p className="text-brown/50 text-xs sm:text-sm">
                  Posez-moi votre question, je vous répondrai rapidement.
                </p>
              </div>

              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-8 rounded-3xl text-center"
                >
                  <div className="w-14 h-14 mx-auto mb-5 text-accent/70">
                    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
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
                  <h3 className="font-serif text-lg text-brown mb-2">
                    Question envoyée
                  </h3>
                  <p className="text-brown/60 text-sm mb-5">
                    Je vous répondrai dans les meilleurs délais.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-sm text-brown/40 hover:text-brown transition-colors duration-300"
                  >
                    Poser une autre question
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        placeholder="Votre nom"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs text-brown/50 mb-1.5 ml-1"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="votre@email.fr"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="question"
                      className="block text-xs text-brown/50 mb-1.5 ml-1"
                    >
                      Votre question
                    </label>
                    <textarea
                      id="question"
                      name="question"
                      required
                      maxLength={1000}
                      rows={4}
                      value={form.question}
                      onChange={handleChange}
                      placeholder="Posez votre question..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  {status === "error" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-red-600/80"
                    >
                      {errorMsg}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={status === "loading"}
                    className="w-full rounded-2xl cursor-pointer"
                  >
                    {status === "loading" ? "Envoi en cours..." : "Envoyer"}
                  </Button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
