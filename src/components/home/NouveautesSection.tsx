"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import type { AvantPremiere } from "@/types";

import "swiper/css";
import "swiper/css/pagination";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface NouveautesSectionProps {
  nouveautes: AvantPremiere[];
}

export default function NouveautesSection({ nouveautes }: NouveautesSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  if (nouveautes.length === 0) return null;

  const isSingleSlide = nouveautes.length === 1;

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-brown overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="nouveautes-dots"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="16" cy="16" r="1" fill="#E7DAC6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nouveautes-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-beige/40 mb-3">
            Exclusivités
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-beige mb-4">
            Nouveautés & Avant-premières
          </h2>
          <p className="text-beige/60 text-sm max-w-md mx-auto">
            Découvrez nos dernières collections en exclusivité
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            onSwiper={(swiper) => {
              setSwiperRef(swiper);
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            spaceBetween={24}
            slidesPerView={1}
            pagination={!isSingleSlide ? { clickable: true } : false}
            autoplay={
              isSingleSlide
                ? false
                : {
                  delay: 5000,
                  pauseOnMouseEnter: true,
                  disableOnInteraction: false,
                }
            }
            className="nouveautes-swiper"
          >
            {nouveautes.filter((n) => n.image).map((nouveaute) => (
              <SwiperSlide key={nouveaute._id}>
                <div className="group relative aspect-[4/3] sm:aspect-video md:aspect-21/9 w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-brown">
                  <Image
                    src={nouveaute.image}
                    alt={nouveaute.titre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-brown via-brown/50 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10">
                    <h3 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-beige mb-2 sm:mb-3">
                      {nouveaute.titre}
                    </h3>
                    {nouveaute.description && (
                      <p className="text-beige/70 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                        {nouveaute.description}
                      </p>
                    )}
                    <p className="text-beige/50 text-[10px] sm:text-xs md:text-sm">
                      Disponible du {formatDate(nouveaute.dateDebut)} au{" "}
                      {formatDate(nouveaute.dateFin)}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {!isSingleSlide && (
            <>
              <button
                onClick={() => swiperRef?.slidePrev()}
                disabled={isBeginning}
                className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-beige/90 text-brown shadow-lg transition-all duration-300 cursor-pointer ${isBeginning
                    ? "opacity-0 pointer-events-none"
                    : "hover:bg-beige hover:scale-105"
                  }`}
                aria-label="Slide précédent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => swiperRef?.slideNext()}
                disabled={isEnd}
                className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-beige/90 text-brown shadow-lg transition-all duration-300 cursor-pointer ${isEnd
                    ? "opacity-0 pointer-events-none"
                    : "hover:bg-beige hover:scale-105"
                  }`}
                aria-label="Slide suivant"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10"
        >
          <a
            href="https://www.instagram.com/bdslevignac/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-beige/10 hover:border-beige/25 hover:bg-beige/5 transition-all duration-300"
          >
            <svg className="w-5 h-5 text-beige/60 group-hover:text-beige transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="text-sm text-beige/60 group-hover:text-beige/90 transition-colors">
              Retrouvez les nouveautés sur{" "}
              <span className="font-medium text-beige/80 group-hover:text-beige">
                @bdslevignac
              </span>
            </span>
            <svg
              className="w-3.5 h-3.5 text-beige/30 group-hover:text-beige/60 group-hover:translate-x-0.5 transition-all"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
            </svg>
          </a>
        </motion.div>
      </div>

      <style jsx global>{`
        .nouveautes-swiper {
          padding-bottom: 48px;
        }
        .nouveautes-swiper .swiper-pagination {
          bottom: 0;
        }
        .nouveautes-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #e7dac6;
          opacity: 0.3;
          transition: all 0.3s ease;
        }
        .nouveautes-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          width: 24px;
          border-radius: 4px;
          background: var(--accent);
        }
      `}</style>
    </section>
  );
}
