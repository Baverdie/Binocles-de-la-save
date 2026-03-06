import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Page introuvable",
	description: "La page que vous recherchez n'existe pas.",
};

export default function NotFound() {
	return (
		<div className="min-h-screen bg-beige flex flex-col items-center justify-center px-6 text-center">
			<div className="max-w-md">
				{/* Numéro 404 */}
				<p className="font-serif text-[120px] sm:text-[160px] leading-none text-brown/10 select-none">
					404
				</p>

				{/* Icône lunettes */}
				<div className="flex justify-center -mt-6 mb-8">
					<svg
						width="64"
						height="32"
						viewBox="0 0 64 32"
						fill="none"
						className="text-brown/40"
					>
						<circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
						<circle cx="48" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
						<path d="M29 16h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
						<path d="M3 12C1.5 10 0.5 8 1 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
						<path d="M61 12C62.5 10 63.5 8 63 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
					</svg>
				</div>

				<h1 className="font-serif text-2xl sm:text-3xl text-brown mb-3">
					Page introuvable
				</h1>
				<p className="text-brown/50 text-sm sm:text-base mb-8 leading-relaxed">
					Il semblerait que vous ayez perdu vos lunettes…<br />
					Cette page n&apos;existe pas ou a été déplacée.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link
						href="/"
						className="w-full sm:w-auto px-6 py-3 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 transition-colors"
					>
						Retour à l&apos;accueil
					</Link>
					<Link
						href="/contact"
						className="w-full sm:w-auto px-6 py-3 border border-brown/20 text-brown rounded-xl text-sm hover:bg-brown/5 active:bg-brown/10 transition-colors"
					>
						Nous contacter
					</Link>
				</div>
			</div>
		</div>
	);
}
