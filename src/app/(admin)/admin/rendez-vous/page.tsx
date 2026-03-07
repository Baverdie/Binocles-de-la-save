"use client";

import { useState, useEffect, useRef } from "react";

type ConfigRdvForm = {
	durees: { examen: number; vente: number; reparation: number };
	marge: number;
	plagesBloquees: PlageBloqueeForm[];
};

type PlageBloqueeForm = {
	jour: number;
	debut: string;
	fin: string;
	typesRdv: string[];
	raison: string;
};

const JOURS_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface Rdv {
	_id: string;
	nom: string;
	prenom: string;
	email: string;
	telephone: string;
	message?: string;
	typeRdv: string;
	dateRdv: string;
	heureDebut: string;
	heureFin: string;
	duree: number;
	statut: string;
	raisonAnnulation?: string;
	createdAt: string;
}

const typeLabels: Record<string, string> = {
	examen: "Examen de vue",
	vente: "Essayage / Vente",
	reparation: "Réparation / Ajustement",
};

type FilterKey = "all" | "confirme" | "effectue" | "annule";

export default function RendezVousAdminPage() {
	const [rdvs, setRdvs] = useState<Rdv[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<FilterKey>("all");
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [cancelReason, setCancelReason] = useState("");

	// Config RDV
	const [configRdv, setConfigRdv] = useState<ConfigRdvForm>({
		durees: { examen: 60, vente: 45, reparation: 30 },
		marge: 15,
		plagesBloquees: [],
	});
	const configRdvRef = useRef(configRdv);
	const configSaveTimerRef = useRef<number | null>(null);
	const [configSaving, setConfigSaving] = useState(false);
	const [configSaved, setConfigSaved] = useState(false);
	const isConfigHydratedRef = useRef(false);
	const [newPlage, setNewPlage] = useState<PlageBloqueeForm>({
		jour: 2,
		debut: "",
		fin: "",
		typesRdv: [],
		raison: "",
	});
	const [joursOuverts, setJoursOuverts] = useState<{ jour: number; label: string }[]>([]);

	useEffect(() => {
		async function fetchAll() {
			try {
				const [rdvRes, configRes, horairesRes] = await Promise.all([
					fetch("/api/admin/rdv"),
					fetch("/api/admin/config-rdv"),
					fetch("/api/admin/horaires"),
				]);

				if (rdvRes.ok) {
					const data = await rdvRes.json();
					setRdvs(data);
				}

				if (configRes.ok) {
					const data = await configRes.json();
					const cfg: ConfigRdvForm = {
						durees: {
							examen: data.durees?.examen ?? 60,
							vente: data.durees?.vente ?? 45,
							reparation: data.durees?.reparation ?? 30,
						},
						marge: data.marge ?? 15,
						plagesBloquees: (data.plagesBloquees || []).map(
							(p: Record<string, unknown>) => ({
								jour: p.jour as number,
								debut: (p.debut as string) || "",
								fin: (p.fin as string) || "",
								typesRdv: (p.typesRdv as string[]) || [],
								raison: (p.raison as string) || "",
							})
						),
					};
					setConfigRdv(cfg);
					configRdvRef.current = cfg;
				}

				if (horairesRes.ok) {
					const horaires = await horairesRes.json();
					const jours = (horaires as { jour: number; ouvert: boolean }[])
						.filter((h) => h.ouvert)
						.map((h) => ({
							jour: h.jour,
							label: JOURS_LABELS[h.jour],
						}));
					setJoursOuverts(jours);
				}
			} catch {
				console.error("Erreur lors du chargement");
			} finally {
				setLoading(false);
			}
		}
		fetchAll();
	}, []);

	// Auto-save config RDV
	async function saveConfigRdv(cfg: ConfigRdvForm) {
		setConfigSaving(true);
		setConfigSaved(false);
		try {
			const res = await fetch("/api/admin/config-rdv", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(cfg),
			});
			if (res.ok) {
				configRdvRef.current = cfg;
				setConfigSaved(true);
				window.setTimeout(() => setConfigSaved(false), 2000);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setConfigSaving(false);
		}
	}

	useEffect(() => {
		if (loading) return;
		if (!isConfigHydratedRef.current) {
			isConfigHydratedRef.current = true;
			return;
		}

		const hasChanged = JSON.stringify(configRdv) !== JSON.stringify(configRdvRef.current);
		if (!hasChanged) return;

		if (configSaveTimerRef.current) {
			window.clearTimeout(configSaveTimerRef.current);
		}

		configSaveTimerRef.current = window.setTimeout(() => {
			saveConfigRdv(configRdv);
		}, 600);

		return () => {
			if (configSaveTimerRef.current) {
				window.clearTimeout(configSaveTimerRef.current);
			}
		};
	}, [configRdv, loading]);

	function addPlageBloquee(e: React.FormEvent) {
		e.preventDefault();
		if (!newPlage.debut || !newPlage.fin) return;
		if (newPlage.debut >= newPlage.fin) {
			alert("L'heure de fin doit être après l'heure de début.");
			return;
		}
		setConfigRdv((prev) => ({
			...prev,
			plagesBloquees: [
				...prev.plagesBloquees,
				{ ...newPlage },
			],
		}));
		setNewPlage((prev) => ({ ...prev, debut: "", fin: "", typesRdv: [], raison: "" }));
	}

	function removePlageBloquee(index: number) {
		setConfigRdv((prev) => ({
			...prev,
			plagesBloquees: prev.plagesBloquees.filter((_, i) => i !== index),
		}));
	}

	async function handleEffectuer(id: string) {
		const prev = rdvs;
		setRdvs((r) =>
			r.map((rdv) =>
				rdv._id === id ? { ...rdv, statut: "effectue" } : rdv
			)
		);
		try {
			const res = await fetch(`/api/admin/rdv/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "effectuer" }),
			});
			if (!res.ok) setRdvs(prev);
		} catch {
			setRdvs(prev);
		}
	}

	async function handleAnnuler(id: string) {
		const prev = rdvs;
		setRdvs((r) =>
			r.map((rdv) =>
				rdv._id === id
					? { ...rdv, statut: "annule", raisonAnnulation: cancelReason }
					: rdv
			)
		);
		setCancellingId(null);
		setCancelReason("");
		try {
			const res = await fetch(`/api/admin/rdv/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "annuler", raisonAnnulation: cancelReason || undefined }),
			});
			if (!res.ok) setRdvs(prev);
		} catch {
			setRdvs(prev);
		}
	}

	async function handleDelete(rdv: Rdv) {
		if (!confirm(`Supprimer le RDV de "${rdv.prenom} ${rdv.nom}" ?`)) return;

		const prev = rdvs;
		setRdvs((r) => r.filter((item) => item._id !== rdv._id));
		try {
			const res = await fetch(`/api/admin/rdv/${rdv._id}`, {
				method: "DELETE",
			});
			if (!res.ok) setRdvs(prev);
		} catch {
			setRdvs(prev);
		}
	}

	const filtered = rdvs.filter((r) => {
		if (filter === "all") return true;
		return r.statut === filter;
	});

	const confirmeCount = rdvs.filter((r) => r.statut === "confirme").length;

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
					<h1 className="font-serif text-2xl text-brown">Rendez-vous</h1>
					<p className="text-brown/50 text-sm mt-1">
						{rdvs.length} rendez-vous
						{confirmeCount > 0 && (
							<span className="text-amber-600 ml-2">
								· {confirmeCount} à venir
							</span>
						)}
					</p>
				</div>

				<div className="flex gap-1 bg-brown/5 rounded-xl p-1 self-start sm:self-auto">
					{[
						{ key: "all" as const, label: "Tous" },
						{ key: "confirme" as const, label: "Confirmés" },
						{ key: "effectue" as const, label: "Effectués" },
						{ key: "annule" as const, label: "Annulés" },
					].map((f) => (
						<button
							key={f.key}
							onClick={() => setFilter(f.key)}
							className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer ${
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
						{filter === "confirme"
							? "Aucun rendez-vous confirmé"
							: filter === "effectue"
								? "Aucun rendez-vous effectué"
								: filter === "annule"
									? "Aucun rendez-vous annulé"
									: "Aucun rendez-vous"}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((rdv) => {
						const isExpanded = expandedId === rdv._id;
						const isCancelling = cancellingId === rdv._id;

						const dateFormatee = new Date(rdv.dateRdv).toLocaleDateString("fr-FR", {
							weekday: "short",
							day: "numeric",
							month: "short",
						});

						return (
							<div
								key={rdv._id}
								className={`rounded-2xl border border-brown/10 bg-beige/70 transition-all ${
									rdv.statut === "annule" ? "opacity-50" : ""
								}`}
							>
								{/* Header */}
								<div
									className="flex items-center gap-4 px-5 py-4 cursor-pointer"
									onClick={() => {
										setExpandedId(isExpanded ? null : rdv._id);
										if (isExpanded) {
											setCancellingId(null);
											setCancelReason("");
										}
									}}
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-brown">
												{rdv.prenom} {rdv.nom}
											</span>
											<span className="text-xs text-brown/30">·</span>
											<span className="text-xs text-brown/50">
												{dateFormatee} à {rdv.heureDebut}
											</span>
										</div>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="text-xs text-brown/60">
												{typeLabels[rdv.typeRdv] || rdv.typeRdv}
											</span>
											<span className="text-xs text-brown/30">·</span>
											<span className="text-xs text-brown/40">
												{rdv.duree} min
											</span>
										</div>
									</div>

									<span
										className={`px-3 py-1.5 rounded-lg text-xs shrink-0 ${
											rdv.statut === "confirme"
												? "bg-amber-100 text-amber-700"
												: rdv.statut === "effectue"
													? "bg-green-100 text-green-700"
													: "bg-brown/5 text-brown/40"
										}`}
									>
										{rdv.statut === "confirme"
											? "À venir"
											: rdv.statut === "effectue"
												? "Effectué"
												: "Annulé"}
									</span>

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

								{/* Détails */}
								{isExpanded && (
									<div className="px-5 pb-4 pt-0 border-t border-brown/5">
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Type
												</p>
												<p className="text-sm text-brown mt-0.5">
													{typeLabels[rdv.typeRdv] || rdv.typeRdv}
												</p>
											</div>
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Date
												</p>
												<p className="text-sm text-brown mt-0.5">
													{new Date(rdv.dateRdv).toLocaleDateString("fr-FR", {
														weekday: "long",
														day: "numeric",
														month: "long",
													})}
												</p>
											</div>
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Heure
												</p>
												<p className="text-sm text-brown mt-0.5">
													{rdv.heureDebut} — {rdv.heureFin} ({rdv.duree} min)
												</p>
											</div>
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Email
												</p>
												<a
													href={`mailto:${rdv.email}`}
													className="text-sm text-brown mt-0.5 hover:underline block"
												>
													{rdv.email}
												</a>
											</div>
											<div>
												<p className="text-[10px] uppercase tracking-wider text-brown/40">
													Téléphone
												</p>
												<a
													href={`tel:${rdv.telephone}`}
													className="text-sm text-brown mt-0.5 hover:underline block"
												>
													{rdv.telephone}
												</a>
											</div>
										</div>

										{rdv.message && (
											<div className="mt-3 px-3 py-2 rounded-lg bg-brown/5 border border-brown/10">
												<p className="text-[10px] uppercase tracking-wider text-brown/40 mb-1">
													Message
												</p>
												<p className="text-sm text-brown/70 whitespace-pre-wrap">
													{rdv.message}
												</p>
											</div>
										)}

										{rdv.raisonAnnulation && rdv.statut === "annule" && (
											<div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
												<p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">
													Raison de l&apos;annulation
												</p>
												<p className="text-sm text-red-600 whitespace-pre-wrap">
													{rdv.raisonAnnulation}
												</p>
											</div>
										)}

										{/* Formulaire annulation inline */}
										{isCancelling && (
											<div className="mt-3 px-3 py-3 rounded-lg bg-brown/5 border border-brown/10">
												<p className="text-xs font-medium text-brown mb-2">
													Annuler ce rendez-vous
												</p>
												<input
													type="text"
													value={cancelReason}
													onChange={(e) => setCancelReason(e.target.value)}
													placeholder="Raison (optionnel)"
													className="w-full px-3 py-2 rounded-lg border border-brown/10 bg-white text-sm focus:border-brown focus:outline-none mb-2"
												/>
												<div className="flex gap-2">
													<button
														onClick={() => {
															setCancellingId(null);
															setCancelReason("");
														}}
														className="px-3 py-1.5 rounded-lg text-xs text-brown/60 hover:text-brown hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
													>
														Retour
													</button>
													<button
														onClick={() => handleAnnuler(rdv._id)}
														className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors cursor-pointer"
													>
														Confirmer l&apos;annulation
													</button>
												</div>
											</div>
										)}

										{/* Actions */}
										<div className="flex flex-wrap items-center justify-end gap-2 mt-4">
											{rdv.statut === "confirme" && (
												<>
													<button
														onClick={() => handleEffectuer(rdv._id)}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-brown text-beige hover:bg-brown/90 active:bg-brown/80 transition-colors cursor-pointer"
													>
														<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
															<path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
														</svg>
														Effectuer
													</button>
													{!isCancelling && (
														<button
															onClick={() => setCancellingId(rdv._id)}
															className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-brown/60 hover:text-red-600 hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
														>
															<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
																<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
															</svg>
															Annuler
														</button>
													)}
												</>
											)}
											<a
												href={`tel:${rdv.telephone}`}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-brown/60 hover:text-brown hover:bg-brown/5 active:bg-brown/10 transition-colors"
											>
												<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
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
												onClick={() => handleDelete(rdv)}
												className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-brown/30 hover:text-red-600 hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
											>
												<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
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

			{/* Configuration rendez-vous */}
			<div className="rounded-2xl border border-brown/10 bg-beige/70 p-6 space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="font-serif text-lg text-brown">Configuration rendez-vous</h2>
					<div className="flex items-center gap-3">
						{configSaving && (
							<span className="text-xs text-brown/50 animate-pulse">Enregistrement...</span>
						)}
						{configSaved && !configSaving && (
							<span className="text-xs text-green-600">Enregistré</span>
						)}
					</div>
				</div>

				<div>
					<p className="text-xs text-brown/50 mb-3">Durée par type de rendez-vous</p>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{([
							{ key: "examen" as const, label: "Examen de vue" },
							{ key: "vente" as const, label: "Essayage / Vente" },
							{ key: "reparation" as const, label: "Réparation" },
						]).map(({ key, label }) => (
							<div key={key}>
								<label className="block text-xs text-brown/60 mb-1">{label}</label>
								<div className="flex items-center gap-2">
									<input
										type="number"
										min={15}
										max={180}
										step={5}
										value={configRdv.durees[key]}
										onChange={(e) =>
											setConfigRdv((prev) => ({
												...prev,
												durees: { ...prev.durees, [key]: Number(e.target.value) },
											}))
										}
										className="w-20 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									/>
									<span className="text-xs text-brown/40">min</span>
								</div>
							</div>
						))}
					</div>
				</div>

				<div>
					<label className="block text-xs text-brown/50 mb-1">Marge entre deux rendez-vous</label>
					<div className="flex items-center gap-2">
						<input
							type="number"
							min={0}
							max={60}
							step={5}
							value={configRdv.marge}
							onChange={(e) =>
								setConfigRdv((prev) => ({ ...prev, marge: Number(e.target.value) }))
							}
							className="w-20 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
						/>
						<span className="text-xs text-brown/40">min</span>
					</div>
				</div>

				<div>
					<p className="text-xs text-brown/50 mb-3">Plages sans rendez-vous</p>
					<form onSubmit={addPlageBloquee} className="space-y-3 mb-3">
						<div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3">
							<div className="col-span-2 sm:col-span-1">
								<label className="block text-xs text-brown/60 mb-1">Jour</label>
								<select
									value={newPlage.jour}
									onChange={(e) => setNewPlage((prev) => ({ ...prev, jour: Number(e.target.value) }))}
									className="w-full sm:w-auto px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
								>
									{joursOuverts.map((h) => (
										<option key={h.jour} value={h.jour}>{h.label}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-xs text-brown/60 mb-1">De</label>
								<input
									type="time"
									value={newPlage.debut}
									onChange={(e) => setNewPlage((prev) => ({ ...prev, debut: e.target.value }))}
									className="w-full sm:w-28 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									required
								/>
							</div>
							<div>
								<label className="block text-xs text-brown/60 mb-1">À</label>
								<input
									type="time"
									value={newPlage.fin}
									onChange={(e) => setNewPlage((prev) => ({ ...prev, fin: e.target.value }))}
									className="w-full sm:w-28 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									required
								/>
							</div>
							<div className="col-span-2 sm:col-span-1">
								<label className="block text-xs text-brown/60 mb-1">Raison</label>
								<input
									type="text"
									value={newPlage.raison}
									onChange={(e) => setNewPlage((prev) => ({ ...prev, raison: e.target.value }))}
									className="w-full sm:w-36 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									placeholder="Optionnel"
								/>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
							<span className="text-xs text-brown/60">Types concernés :</span>
							{([
								{ key: "examen", label: "Examen" },
								{ key: "vente", label: "Vente" },
								{ key: "reparation", label: "Réparation" },
							]).map(({ key, label }) => (
								<label key={key} className="flex items-center gap-1.5 text-xs text-brown/60 cursor-pointer">
									<input
										type="checkbox"
										checked={newPlage.typesRdv.includes(key)}
										onChange={(e) =>
											setNewPlage((prev) => ({
												...prev,
												typesRdv: e.target.checked
													? [...prev.typesRdv, key]
													: prev.typesRdv.filter((t) => t !== key),
											}))
										}
										className="h-3.5 w-3.5 rounded border-brown/30 text-brown cursor-pointer"
									/>
									{label}
								</label>
							))}
							<span className="text-[10px] text-brown/30">(vide = tous)</span>
						</div>
						<div className="flex justify-end">
							<button
								type="submit"
								className="px-3 py-1.5 bg-brown text-beige rounded-lg text-xs hover:bg-brown/90 active:bg-brown/80 cursor-pointer"
							>
								Ajouter
							</button>
						</div>
					</form>
					<div className="space-y-2">
						{configRdv.plagesBloquees.length === 0 ? (
							<p className="text-sm text-brown/40">Aucune plage bloquée</p>
						) : (
							configRdv.plagesBloquees.map((plage, index) => (
								<div
									key={index}
									className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-brown/10 bg-beige/80 px-3 py-2"
								>
									<div className="min-w-0">
										<p className="text-sm text-brown">
											{JOURS_LABELS[plage.jour]} • {plage.debut} - {plage.fin}
											{plage.raison && <span className="text-brown/50 ml-2">({plage.raison})</span>}
										</p>
										{plage.typesRdv.length > 0 && (
											<p className="text-xs text-brown/40 mt-0.5">
												{plage.typesRdv.map((t) => typeLabels[t] || t).join(", ")}
											</p>
										)}
									</div>
									<button
										onClick={() => removePlageBloquee(index)}
										className="text-xs text-brown/50 hover:text-red-600 active:text-red-600 cursor-pointer shrink-0 self-start sm:self-auto"
									>
										Supprimer
									</button>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
