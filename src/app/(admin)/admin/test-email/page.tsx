"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const TEMPLATES_CLIENT = [
	{
		key: "confirmationRdv",
		label: "Confirmation RDV",
		description: "Email envoye au client apres reservation",
	},
	{
		key: "annulationRdv",
		label: "Annulation RDV",
		description: "Email envoye au client en cas d'annulation",
	},
	{
		key: "rappelRdv",
		label: "Rappel RDV",
		description: "Rappel automatique envoye la veille",
	},
];

const TEMPLATES_ADMIN = [
	{
		key: "notificationRdv",
		label: "Notification RDV",
		description: "Notification admin d'un nouveau rendez-vous",
	},
	{
		key: "nouveauContact",
		label: "Nouveau contact",
		description: "Notification admin d'un message de contact",
	},
	{
		key: "commandeLentilles",
		label: "Commande lentilles",
		description: "Notification admin d'une commande de lentilles",
	},
];

export default function TestEmailPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [actif, setActif] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [sending, setSending] = useState<string | null>(null);
	const [sent, setSent] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const isAuthorized =
		status === "authenticated" &&
		session?.user?.name?.toLowerCase().includes("baverdie");

	useEffect(() => {
		if (status === "loading") return;
		if (!isAuthorized) {
			router.replace("/admin");
			return;
		}

		async function fetchConfig() {
			try {
				const res = await fetch("/api/admin/config-test");
				if (res.ok) {
					const data = await res.json();
					setEmail(data.emailRedirection || "");
					setActif(data.actif || false);
				}
			} catch (err) {
				console.error("Erreur chargement config test:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchConfig();
	}, [status, isAuthorized, router]);

	async function handleSave() {
		setSaving(true);
		try {
			const res = await fetch("/api/admin/config-test", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ emailRedirection: email, actif }),
			});
			if (res.ok) {
				setSaved(true);
				setTimeout(() => setSaved(false), 2000);
			}
		} catch (err) {
			console.error("Erreur sauvegarde:", err);
		} finally {
			setSaving(false);
		}
	}

	async function handleSendTest(templateKey: string) {
		setSending(templateKey);
		setError(null);
		setSent(null);
		try {
			const res = await fetch("/api/admin/test-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ template: templateKey }),
			});
			if (res.ok) {
				setSent(templateKey);
				setTimeout(() => setSent(null), 3000);
			} else {
				const data = await res.json();
				setError(data.error || "Erreur inconnue");
			}
		} catch {
			setError("Erreur reseau");
		} finally {
			setSending(null);
		}
	}

	if (status === "loading" || loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
			</div>
		);
	}

	if (!isAuthorized) return null;

	return (
		<div className="max-w-2xl mx-auto space-y-8">
			<div>
				<h1 className="font-serif text-2xl text-brown">Redirection email de test</h1>
				<p className="text-brown/50 text-sm mt-1">
					Redirige tous les emails sortants vers une adresse de test.
				</p>
			</div>

			<div className="rounded-2xl border border-brown/10 bg-beige/70 p-6 space-y-5">
				<label className="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={actif}
						onChange={(e) => setActif(e.target.checked)}
						className="h-5 w-5 rounded border-brown/30 text-brown cursor-pointer"
					/>
					<div>
						<span className="text-sm font-medium text-brown">
							Activer la redirection
						</span>
						<p className="text-xs text-brown/50 mt-0.5">
							Tous les emails iront vers l&apos;adresse ci-dessous
						</p>
					</div>
				</label>

				<div>
					<label className="block text-xs text-brown/60 mb-1">
						Email de redirection
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="ton.email@test.com"
						className="w-full px-4 py-2.5 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
					/>
				</div>

				{actif && email && (
					<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
						<span className="font-medium">Attention</span>
						<span>— Tous les emails seront envoyes a {email}</span>
					</div>
				)}

				<button
					onClick={handleSave}
					disabled={saving || (actif && !email)}
					className="w-full py-2.5 rounded-xl bg-brown text-beige text-sm font-medium hover:bg-brown/90 active:bg-brown/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saving ? "Enregistrement..." : saved ? "Enregistre !" : "Enregistrer"}
				</button>
			</div>

			<div>
				<h2 className="font-serif text-xl text-brown">Envoyer un email de test</h2>
				<p className="text-brown/50 text-sm mt-1">
					Envoie un email avec des donnees fictives pour previsualiser le rendu.
					{actif && email
						? ` L'email sera redirige vers ${email}.`
						: ` L'email sera envoye a ${session?.user?.email || "votre adresse"}.`}
				</p>
			</div>

			{error && (
				<div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			)}

			<div className="space-y-3">
				<h3 className="text-xs font-medium text-brown/40 uppercase tracking-widest">
					Emails client
				</h3>
				<div className="grid gap-3">
					{TEMPLATES_CLIENT.map((t) => (
						<div
							key={t.key}
							className="flex items-center justify-between rounded-2xl border border-brown/10 bg-beige/70 px-5 py-4"
						>
							<div>
								<p className="text-sm font-medium text-brown">{t.label}</p>
								<p className="text-xs text-brown/50 mt-0.5">{t.description}</p>
							</div>
							<button
								onClick={() => handleSendTest(t.key)}
								disabled={sending !== null}
								className={`shrink-0 ml-4 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
									sent === t.key
										? "bg-emerald-100 text-emerald-700 border border-emerald-200"
										: "bg-brown text-beige hover:bg-brown/90 active:bg-brown/80"
								} disabled:opacity-50 disabled:cursor-not-allowed`}
							>
								{sending === t.key
									? "Envoi..."
									: sent === t.key
										? "Envoye"
										: "Envoyer"}
							</button>
						</div>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-xs font-medium text-brown/40 uppercase tracking-widest">
					Emails admin
				</h3>
				<div className="grid gap-3">
					{TEMPLATES_ADMIN.map((t) => (
						<div
							key={t.key}
							className="flex items-center justify-between rounded-2xl border border-brown/10 bg-beige/70 px-5 py-4"
						>
							<div>
								<p className="text-sm font-medium text-brown">{t.label}</p>
								<p className="text-xs text-brown/50 mt-0.5">{t.description}</p>
							</div>
							<button
								onClick={() => handleSendTest(t.key)}
								disabled={sending !== null}
								className={`shrink-0 ml-4 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
									sent === t.key
										? "bg-emerald-100 text-emerald-700 border border-emerald-200"
										: "bg-brown text-beige hover:bg-brown/90 active:bg-brown/80"
								} disabled:opacity-50 disabled:cursor-not-allowed`}
							>
								{sending === t.key
									? "Envoi..."
									: sent === t.key
										? "Envoye"
										: "Envoyer"}
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
