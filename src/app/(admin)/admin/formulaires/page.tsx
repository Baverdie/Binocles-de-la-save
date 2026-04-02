"use client";

import { useState, useEffect } from "react";

interface Commande {
	_id: string;
	nom: string;
	prenom: string;
	telephone: string;
	message: string;
	traite: boolean;
	createdAt: string;
}

function parseCommande(message: string) {
	const format = message.match(/Format : (.+)/)?.[1] || "—";
	const duree = message.match(/Durée souhaitée : (.+)/)?.[1] || "—";
	const produit = message.match(/Produit d'entretien : (.+)/)?.[1];
	const userMessage = message.match(/\nMessage : ([\s\S]+)/)?.[1]?.trim();

	// Calcul du nombre de boîtes par œil
	const mois = parseInt(duree) || 0;
	const isJournalieres = format.toLowerCase().includes("journal");
	let boitesParOeil: number | null = null;
	if (mois > 0) {
		if (isJournalieres) {
			// 90 lentilles/boîte, 1 lentille/jour/œil → 30 lentilles/mois/œil
			boitesParOeil = Math.ceil((mois * 30) / 90);
		} else {
			// 6 lentilles/boîte, 1 lentille/mois/œil
			boitesParOeil = Math.ceil(mois / 6);
		}
	}

	return { format, duree, produit, userMessage, boitesParOeil };
}

function formatDateFr(value: string) {
	return new Date(value).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatHeure(value: string) {
	return new Date(value).toLocaleTimeString("fr-FR", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function CommandesPage() {
	const [commandes, setCommandes] = useState<Commande[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
	const [expandedId, setExpandedId] = useState<string | null>(null);

	useEffect(() => {
		async function fetchCommandes() {
			try {
				const res = await fetch("/api/admin/contacts?type=lentilles");
				if (res.ok) {
					const data = await res.json();
					setCommandes(data);
				}
			} catch {
				console.error("Erreur lors du chargement");
			} finally {
				setLoading(false);
			}
		}
		fetchCommandes();
	}, []);

	async function toggleTraite(id: string) {
		const prev = commandes;
		setCommandes((c) =>
			c.map((item) =>
				item._id === id ? { ...item, traite: !item.traite } : item
			)
		);
		try {
			const res = await fetch(`/api/admin/contacts/${id}`, {
				method: "PATCH",
			});
			if (!res.ok) setCommandes(prev);
		} catch {
			setCommandes(prev);
		}
	}

	async function handleDelete(commande: Commande) {
		if (
			!confirm(
				`Supprimer la commande de "${commande.prenom} ${commande.nom}" ?`
			)
		)
			return;

		const prev = commandes;
		setCommandes((c) => c.filter((item) => item._id !== commande._id));
		try {
			const res = await fetch(`/api/admin/contacts/${commande._id}`, {
				method: "DELETE",
			});
			if (!res.ok) setCommandes(prev);
		} catch {
			setCommandes(prev);
		}
	}

	const filtered = commandes.filter((c) => {
		if (filter === "pending") return !c.traite;
		if (filter === "done") return c.traite;
		return true;
	});

	const pendingCount = commandes.filter((c) => !c.traite).length;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h1 className="font-serif text-2xl text-brown">Commandes</h1>
					<p className="text-brown/50 text-sm mt-1">
						{commandes.length} commande{commandes.length > 1 ? "s" : ""} de lentilles
						{pendingCount > 0 && (
							<span className="text-amber-600 ml-2">
								· {pendingCount} à traiter
							</span>
						)}
					</p>
				</div>

				<div className="flex gap-1 bg-brown/5 rounded-xl p-1 self-start sm:self-auto">
					{[
						{ key: "all" as const, label: "Toutes" },
						{ key: "pending" as const, label: "À traiter" },
						{ key: "done" as const, label: "Traitées" },
					].map((f) => (
						<button
							key={f.key}
							onClick={() => setFilter(f.key)}
							className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
								filter === f.key
									? "bg-brown text-beige"
									: "text-brown/60 hover:text-brown"
							}`}
						>
							{f.label}
						</button>
					))}
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="rounded-2xl border border-brown/10 bg-beige/70 p-12 text-center">
					<p className="text-brown/40 text-sm">
						{filter === "pending"
							? "Aucune commande à traiter"
							: filter === "done"
								? "Aucune commande traitée"
								: "Aucune commande reçue"}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((commande) => {
						const { format, duree, produit, userMessage, boitesParOeil } = parseCommande(
							commande.message
						);
						const isExpanded = expandedId === commande._id;

						return (
							<div
								key={commande._id}
								className={`rounded-2xl border border-brown/10 bg-beige/70 transition-all ${
									commande.traite ? "opacity-60" : ""
								}`}
							>
								<div
									className="flex items-center gap-4 px-5 py-4 cursor-pointer"
									onClick={() =>
										setExpandedId(isExpanded ? null : commande._id)
									}
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-brown">
												{commande.prenom} {commande.nom}
											</span>
											<span className="text-xs text-brown/30">·</span>
											<a
												href={`tel:${commande.telephone}`}
												onClick={(e) => e.stopPropagation()}
												className="text-xs text-brown/50 hover:text-brown hover:underline"
											>
												{commande.telephone}
											</a>
										</div>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="text-xs text-brown/40">
												{formatDateFr(commande.createdAt)} à{" "}
												{formatHeure(commande.createdAt)}
											</span>
											<span className="text-xs text-brown/30">·</span>
											<span className="text-xs text-brown/60">
												{format} — {duree}
											</span>
										</div>
									</div>

									<button
										onClick={(e) => {
											e.stopPropagation();
											toggleTraite(commande._id);
										}}
										className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
											commande.traite
												? "bg-brown/10 text-brown/50 hover:bg-brown/20 active:bg-brown/25"
												: "bg-brown text-beige hover:bg-brown/90 active:bg-brown/80"
										}`}
									>
										{commande.traite ? "Traitée" : "À traiter"}
									</button>

									<svg
										className={`w-4 h-4 text-brown/30 transition-transform ${
											isExpanded ? "rotate-180" : ""
										}`}
										viewBox="0 0 24 24"
										fill="none"
									>
										<path
											d="M6 9l6 6 6-6"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</div>

								{isExpanded && (
									<div className="px-5 pb-4 pt-0 border-t border-brown/5">
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Format
												</p>
												<p className="text-sm text-brown mt-0.5">{format}</p>
											</div>
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Durée
												</p>
												<p className="text-sm text-brown mt-0.5">{duree}</p>
											</div>
											{boitesParOeil !== null && (
												<div>
													<p className="text-[10px] uppercase tracking-wider text-brown/40">
														Boîtes estimées
													</p>
													<p className="text-sm text-brown mt-0.5">
														{boitesParOeil * 2} boîte{boitesParOeil * 2 > 1 ? "s" : ""}
													</p>
												</div>
											)}
											{produit && (
												<div>
													<p className="text-[10px] uppercase tracking-wider text-brown/40">
														Produit d&apos;entretien
													</p>
													<p className="text-sm text-brown mt-0.5">
														{produit}
													</p>
												</div>
											)}
										</div>

										{userMessage && (
											<div className="mt-3 px-3 py-2 rounded-lg bg-brown/5 border border-brown/10">
												<p className="text-[10px] uppercase tracking-wider text-brown/40 mb-1">
													Message
												</p>
												<p className="text-sm text-brown/70 whitespace-pre-wrap">
													{userMessage}
												</p>
											</div>
										)}

										<div className="flex items-center justify-end gap-2 mt-4">
											<a
												href={`tel:${commande.telephone}`}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-brown text-beige hover:bg-brown/90 active:bg-brown/80 transition-colors"
											>
												<svg
													className="w-3.5 h-3.5"
													viewBox="0 0 24 24"
													fill="none"
												>
													<path
														d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
														stroke="currentColor"
														strokeWidth="1.5"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
												Appeler
											</a>
											<button
												onClick={() => handleDelete(commande)}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-brown/15 text-brown/50 hover:text-red-600 hover:border-brown/20 hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
											>
												<svg
													className="w-3.5 h-3.5"
													viewBox="0 0 24 24"
													fill="none"
												>
													<path
														d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
														stroke="currentColor"
														strokeWidth="1.5"
														strokeLinecap="round"
													/>
												</svg>
												Supprimer
											</button>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
