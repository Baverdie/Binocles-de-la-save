"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const engagements = [
  {
    number: "01",
    title: "Matériaux nobles",
    description: "Acétate, titane, bois... Des montures sélectionnées pour leur qualité et leur durabilité.",
  },
  {
    number: "02",
    title: "Éco-responsable",
    description: "Label Éco-Défi pour une optique plus respectueuse de l'environnement.",
  },
  {
    number: "03",
    title: "Made in France",
    description: "Privilégier le savoir-faire local et les artisans français.",
  },
];

export default function EngagementsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="engagements-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#engagements-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            Ma philosophie
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brown">
            Mes engagements
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {engagements.map((item, index) => (
            <motion.div
              key={item.number}
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              animate={isInView ? { clipPath: "inset(0% 0 0 0)" } : {}}
              transition={{ duration: 0.7, delay: 0.2 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="bg-brown p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl h-full transition-shadow duration-300 max-lg:shadow-md hover:shadow-xl overflow-hidden relative flex flex-col">
                <div className="relative flex flex-col flex-1">
                  <motion.span
                    className="inline-block font-optician text-2xl sm:text-3xl text-accent/70 max-lg:text-accent mb-3 sm:mb-4 transition-colors duration-300 group-hover:text-accent"
                  >
                    {item.number}
                  </motion.span>

                  <h3 className="font-serif text-lg sm:text-xl text-beige mb-2 sm:mb-3 transition-transform duration-300 group-hover:translate-x-1">
                    {item.title}
                  </h3>

                  <p className="text-beige/60 text-xs sm:text-sm leading-relaxed flex-1">
                    {item.description}
                  </p>

                  <motion.div
                    className="mt-4 sm:mt-6 h-px bg-accent/50 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
