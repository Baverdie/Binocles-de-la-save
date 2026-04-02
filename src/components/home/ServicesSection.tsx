"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const services = [
  {
    title: "Examen de vue",
    description: "Un bilan visuel complet et personnalisé pour une correction optimale.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="4" fill="currentColor" />
        <path d="M24 4v4M24 40v4M4 24h4M40 24h4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Montage verres",
    description: "Un travail de précision pour un confort visuel parfait.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <path
          d="M8 24c0-6 4-12 12-12h8c8 0 12 6 12 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="14" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="34" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M22 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Réparation",
    description: "Redonnez vie à vos montures préférées grâce à mon expertise.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <path
          d="M14 34l-4 4M34 14l4-4M18 30l-8 8M30 18l8-8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="17"
          y="17"
          width="14"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="rotate(45 24 24)"
        />
      </svg>
    ),
  },
  {
    title: "Lentilles",
    description: "Conseils et adaptation pour un port confortable au quotidien.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <ellipse cx="24" cy="24" rx="16" ry="20" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="24" cy="24" rx="8" ry="12" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="18" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

export default function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-brown overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="services-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" fill="#E7DAC6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#services-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-beige/40 mb-3">
            Mes expertises
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-beige">
            Mes services
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.12, type: "spring", stiffness: 100, damping: 15 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="bg-beige p-4 sm:p-6 md:p-8 text-center rounded-2xl sm:rounded-3xl h-full transition-all duration-500 max-lg:shadow-md hover:shadow-xl overflow-hidden relative flex flex-col">
                <div className="relative flex flex-col flex-1">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-6 text-accent/70 max-lg:text-accent max-lg:scale-105 transition-all duration-500 group-hover:text-accent group-hover:scale-110">
                    {service.icon}
                  </div>

                  <h3 className="font-serif text-sm sm:text-base md:text-lg text-brown mb-2 sm:mb-3 transition-colors duration-500">
                    {service.title}
                  </h3>

                  <p className="text-brown/60 text-xs sm:text-sm leading-relaxed flex-1">
                    {service.description}
                  </p>

                  <motion.div
                    className="mt-4 sm:mt-6 h-px bg-accent/40 origin-left"
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
