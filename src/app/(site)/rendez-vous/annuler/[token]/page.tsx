"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type RdvInfo = {
  prenom: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  typeRdv: string;
  statut: string;
};

type State = "loading" | "ready" | "confirming" | "success" | "error" | "not_found" | "already_cancelled" | "too_late";

export default function AnnulerRdvPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>("loading");
  const [rdv, setRdv] = useState<RdvInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/rdv/annuler/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState("not_found");
          return;
        }
        if (data.statut === "annule") {
          setRdv(data);
          setState("already_cancelled");
          return;
        }
        if (data.statut !== "confirme") {
          setState("not_found");
          return;
        }
        setRdv(data);
        setState("ready");
      })
      .catch(() => setState("not_found"));
  }, [token]);

  async function handleConfirm() {
    setState("confirming");
    const res = await fetch(`/api/rdv/annuler/${token}`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.success) {
      setState("success");
    } else if (res.status === 422) {
      setState("too_late");
    } else {
      setErrorMsg(data.error || "Une erreur est survenue.");
      setState("error");
    }
  }

  const dateFormatee = rdv?.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(rdv.date))
    : "";

  return (
    <main className="min-h-screen bg-beige flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {state === "loading" && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin mx-auto mb-4" />
            <p className="text-brown/60 text-sm">Chargement…</p>
          </div>
        )}

        {state === "ready" && rdv && (
          <div className="bg-white rounded-2xl border border-brown/10 p-8">
            <div className="text-center mb-8">
              <span className="inline-block text-xs tracking-[0.25em] uppercase text-brown/40 mb-3">
                Annulation
              </span>
              <h1 className="font-serif text-2xl text-brown">
                Annuler votre rendez-vous
              </h1>
            </div>

            <div className="bg-beige rounded-xl p-5 mb-6 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-brown/50">Date</span>
                <span className="text-brown font-medium capitalize">{dateFormatee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown/50">Horaire</span>
                <span className="text-brown font-medium">{rdv.heureDebut} – {rdv.heureFin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brown/50">Prestation</span>
                <span className="text-brown font-medium">{rdv.typeRdv}</span>
              </div>
            </div>

            <p className="text-sm text-brown/60 text-center mb-6">
              Êtes-vous sûr(e) de vouloir annuler ce rendez-vous ?<br />
              <span className="text-brown/40 text-xs">Cette action est irréversible.</span>
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-brown text-beige rounded-xl text-sm font-medium hover:bg-brown/90 transition-colors"
              >
                Confirmer l&apos;annulation
              </button>
              <Link
                href="/"
                className="w-full py-3 border border-brown/20 text-brown rounded-xl text-sm text-center hover:bg-brown/5 transition-colors"
              >
                Garder mon rendez-vous
              </Link>
            </div>
          </div>
        )}

        {state === "confirming" && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin mx-auto mb-4" />
            <p className="text-brown/60 text-sm">Annulation en cours…</p>
          </div>
        )}

        {state === "success" && (
          <div className="bg-white rounded-2xl border border-brown/10 p-8 text-center">
            <div className="w-12 h-12 bg-brown/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brown">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="inline-block text-xs tracking-[0.25em] uppercase text-brown/40 mb-3">Annulé</span>
            <h1 className="font-serif text-2xl text-brown mb-3">Rendez-vous annulé</h1>
            <p className="text-sm text-brown/60 mb-8">
              Votre rendez-vous a bien été annulé. Un email de confirmation vous a été envoyé.
            </p>
            <Link
              href="/rendez-vous"
              className="inline-block px-6 py-3 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 transition-colors"
            >
              Reprendre rendez-vous
            </Link>
          </div>
        )}

        {state === "already_cancelled" && (
          <div className="bg-white rounded-2xl border border-brown/10 p-8 text-center">
            <span className="inline-block text-xs tracking-[0.25em] uppercase text-brown/40 mb-3">Déjà annulé</span>
            <h1 className="font-serif text-2xl text-brown mb-3">Ce rendez-vous est déjà annulé</h1>
            <p className="text-sm text-brown/60 mb-8">
              Ce rendez-vous a déjà été annulé.
            </p>
            <Link href="/rendez-vous" className="inline-block px-6 py-3 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 transition-colors">
              Nouveau rendez-vous
            </Link>
          </div>
        )}

        {state === "too_late" && (
          <div className="bg-white rounded-2xl border border-brown/10 p-8 text-center">
            <span className="inline-block text-xs tracking-[0.25em] uppercase text-brown/40 mb-3">Délai dépassé</span>
            <h1 className="font-serif text-2xl text-brown mb-3">Annulation impossible</h1>
            <p className="text-sm text-brown/60 mb-8">
              L&apos;annulation en ligne n&apos;est plus possible moins de 24h avant le rendez-vous.<br />
              Merci de nous appeler directement.
            </p>
            <a
              href="tel:+33534521969"
              className="inline-block px-6 py-3 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 transition-colors"
            >
              05 34 52 19 69
            </a>
          </div>
        )}

        {state === "not_found" && (
          <div className="bg-white rounded-2xl border border-brown/10 p-8 text-center">
            <span className="inline-block text-xs tracking-[0.25em] uppercase text-brown/40 mb-3">Introuvable</span>
            <h1 className="font-serif text-2xl text-brown mb-3">Lien invalide</h1>
            <p className="text-sm text-brown/60 mb-8">
              Ce lien d&apos;annulation est invalide ou a déjà été utilisé.
            </p>
            <Link href="/" className="inline-block px-6 py-3 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 transition-colors">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="bg-white rounded-2xl border border-brown/10 p-8 text-center">
            <span className="inline-block text-xs tracking-[0.25em] uppercase text-brown/40 mb-3">Erreur</span>
            <h1 className="font-serif text-2xl text-brown mb-3">Une erreur est survenue</h1>
            <p className="text-sm text-brown/60 mb-8">{errorMsg}</p>
            <Link href="/" className="inline-block px-6 py-3 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 transition-colors">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
