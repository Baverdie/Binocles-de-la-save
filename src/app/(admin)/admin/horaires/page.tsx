"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PlageForm = {
	actif: boolean;
	debut: string;
	fin: string;
};

type HoraireForm = {
	jour: number;
	label: string;
	ouvert: boolean;
	matin: PlageForm;
	aprem: PlageForm;
};

type VacancesForm = {
	id: string;
	dateDebut: string;
	dateFin: string;
	message: string;
	actif: boolean;
};

type FermetureForm = {
	id: string;
	date: string;
	journeeComplete: boolean;
	heureDebut: string;
	heureFin: string;
	raison: string;
};

type HoraireApi = {
	_id?: string;
	jour: number;
	ouvert: boolean;
	matin?: { debut: string; fin: string };
	aprem?: { debut: string; fin: string };
};

type OuvertureForm = {
	id: string;
	date: string;
	matinActif: boolean;
	matinDebut: string;
	matinFin: string;
	apremActif: boolean;
	apremDebut: string;
	apremFin: string;
	raison: string;
};

function formatDateFr(dateStr: string): string {
	if (!dateStr) return "";
	const [year, month, day] = dateStr.split("-");
	return `${day}/${month}/${year}`;
}

const DEFAULT_HORAIRES: HoraireForm[] = [
	{
		jour: 1,
		label: "Lundi",
		ouvert: false,
		matin: { actif: false, debut: "", fin: "" },
		aprem: { actif: false, debut: "", fin: "" },
	},
	{
		jour: 2,
		label: "Mardi",
		ouvert: true,
		matin: { actif: true, debut: "09:30", fin: "12:30" },
		aprem: { actif: true, debut: "15:30", fin: "19:00" },
	},
	{
		jour: 3,
		label: "Mercredi",
		ouvert: true,
		matin: { actif: true, debut: "09:30", fin: "12:30" },
		aprem: { actif: true, debut: "16:00", fin: "19:00" },
	},
	{
		jour: 4,
		label: "Jeudi",
		ouvert: true,
		matin: { actif: true, debut: "09:30", fin: "12:30" },
		aprem: { actif: true, debut: "15:30", fin: "19:00" },
	},
	{
		jour: 5,
		label: "Vendredi",
		ouvert: true,
		matin: { actif: true, debut: "09:30", fin: "12:30" },
		aprem: { actif: true, debut: "15:30", fin: "19:00" },
	},
	{
		jour: 6,
		label: "Samedi",
		ouvert: true,
		matin: { actif: true, debut: "09:00", fin: "13:00" },
		aprem: { actif: false, debut: "", fin: "" },
	},
	{
		jour: 0,
		label: "Dimanche",
		ouvert: false,
		matin: { actif: false, debut: "", fin: "" },
		aprem: { actif: false, debut: "", fin: "" },
	},
].sort((a, b) => (a.jour === 0 ? 7 : a.jour) - (b.jour === 0 ? 7 : b.jour));

export default function HorairesPage() {
	const [horaires, setHoraires] = useState<HoraireForm[]>(DEFAULT_HORAIRES);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [loading, setLoading] = useState(true);
	const isHydratedRef = useRef(false);
	const isInitialLoadRef = useRef(true);
	const originalHorairesRef = useRef<HoraireForm[]>(DEFAULT_HORAIRES);
	const saveTimerRef = useRef<number | null>(null);
	const [vacances, setVacances] = useState<VacancesForm[]>([]);
	const [fermetures, setFermetures] = useState<FermetureForm[]>([]);
	const [vacancesForm, setVacancesForm] = useState<VacancesForm>({
		id: "",
		dateDebut: "",
		dateFin: "",
		message: "",
		actif: true,
	});
	const [fermetureForm, setFermetureForm] = useState<FermetureForm>({
		id: "",
		date: "",
		journeeComplete: true,
		heureDebut: "",
		heureFin: "",
		raison: "",
	});

	const [ouvertures, setOuvertures] = useState<OuvertureForm[]>([]);
	const [ouvertureForm, setOuvertureForm] = useState<OuvertureForm>({
		id: "",
		date: "",
		matinActif: true,
		matinDebut: "09:30",
		matinFin: "12:30",
		apremActif: true,
		apremDebut: "15:30",
		apremFin: "19:00",
		raison: "",
	});

	const totalOuverts = useMemo(
		() => horaires.filter((h) => h.ouvert).length,
		[horaires]
	);

	const prochainEvenement = useMemo(() => {
		const today = new Date().toISOString().slice(0, 10);

		const prochaineVacances = vacances
			.filter((v) => v.actif && v.dateFin >= today)
			.sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];

		const prochaineFermeture = fermetures
			.filter((f) => f.date >= today)
			.sort((a, b) => a.date.localeCompare(b.date))[0];

		if (!prochaineVacances && !prochaineFermeture) return null;

		if (!prochaineFermeture) return { type: "vacances" as const, ...prochaineVacances! };
		if (!prochaineVacances) return { type: "fermeture" as const, ...prochaineFermeture! };

		return prochaineVacances.dateDebut <= prochaineFermeture.date
			? { type: "vacances" as const, ...prochaineVacances }
			: { type: "fermeture" as const, ...prochaineFermeture };
	}, [vacances, fermetures]);

	function updateJour(index: number, updater: (h: HoraireForm) => HoraireForm) {
		setHoraires((prev) =>
			prev.map((item, i) => (i === index ? updater(item) : item))
		);
	}

	useEffect(() => {
		async function fetchAll() {
			try {
				const [horairesRes, vacancesRes, fermeturesRes, ouverturesRes] = await Promise.all([
					fetch("/api/admin/horaires"),
					fetch("/api/admin/vacances"),
					fetch("/api/admin/fermetures"),
					fetch("/api/admin/ouvertures"),
				]);

				if (horairesRes.ok) {
					const data: HoraireApi[] = await horairesRes.json();
					setHoraires((prev) =>
						prev.map((item) => {
							const found = data.find((h) => h.jour === item.jour);
							if (!found) return item;
							return {
								...item,
								ouvert: !!found.ouvert,
								matin: {
									actif: !!found.matin?.debut && !!found.matin?.fin,
									debut: found.matin?.debut || "",
									fin: found.matin?.fin || "",
								},
								aprem: {
									actif: !!found.aprem?.debut && !!found.aprem?.fin,
									debut: found.aprem?.debut || "",
									fin: found.aprem?.fin || "",
								},
							};
						})
					);
				}

				if (vacancesRes.ok) {
					const data = await vacancesRes.json();
					setVacances(
						data.map((item: Record<string, unknown>) => ({
							id: String(item._id),
							dateDebut: (item.dateDebut as string)?.slice(0, 10) || "",
							dateFin: (item.dateFin as string)?.slice(0, 10) || "",
							message: (item.message as string) || "",
							actif: item.actif !== false,
						}))
					);
				}

				if (fermeturesRes.ok) {
					const data = await fermeturesRes.json();
					setFermetures(
						data.map((item: Record<string, unknown>) => ({
							id: String(item._id),
							date: (item.date as string)?.slice(0, 10) || "",
							journeeComplete: item.journeeComplete !== false,
							heureDebut: (item.heureDebut as string) || "",
							heureFin: (item.heureFin as string) || "",
							raison: (item.raison as string) || "",
						}))
					);
				}

				if (ouverturesRes.ok) {
					const data = await ouverturesRes.json();
					setOuvertures(
						data.map((item: Record<string, unknown>) => {
							const matin = item.matin as Record<string, string> | undefined;
							const aprem = item.aprem as Record<string, string> | undefined;
							return {
								id: String(item._id),
								date: (item.date as string)?.slice(0, 10) || "",
								matinActif: !!matin?.debut,
								matinDebut: matin?.debut || "",
								matinFin: matin?.fin || "",
								apremActif: !!aprem?.debut,
								apremDebut: aprem?.debut || "",
								apremFin: aprem?.fin || "",
								raison: (item.raison as string) || "",
							};
						})
					);
				}
			} catch (error) {
				console.error("Erreur lors du chargement des horaires", error);
			} finally {
				setLoading(false);
				isInitialLoadRef.current = false;
			}
		}

		fetchAll();
	}, []);

	useEffect(() => {
		if (!loading) {
			originalHorairesRef.current = horaires;
		}
	}, [loading]);

	async function handleSave() {
		setSaving(true);
		setSaved(false);
		try {
			const payload = horaires.map((item) => ({
				jour: item.jour,
				ouvert: item.ouvert,
				matin:
					item.ouvert && item.matin.actif && item.matin.debut && item.matin.fin
						? { debut: item.matin.debut, fin: item.matin.fin }
						: null,
				aprem:
					item.ouvert && item.aprem.actif && item.aprem.debut && item.aprem.fin
						? { debut: item.aprem.debut, fin: item.aprem.fin }
						: null,
			}));

			const res = await fetch("/api/admin/horaires", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ horaires: payload }),
			});

			if (!res.ok) {
				throw new Error("Erreur lors de l'enregistrement");
			}

			if (!isInitialLoadRef.current) {
				setSaved(true);
				window.setTimeout(() => setSaved(false), 2000);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setSaving(false);
		}
	}

	useEffect(() => {
		if (loading) return;
		if (!isHydratedRef.current) {
			isHydratedRef.current = true;
			return;
		}

		const hasChanged = JSON.stringify(horaires) !== JSON.stringify(originalHorairesRef.current);
		if (!hasChanged) return;

		if (saveTimerRef.current) {
			window.clearTimeout(saveTimerRef.current);
		}

		saveTimerRef.current = window.setTimeout(() => {
			handleSave();
		}, 600);

		return () => {
			if (saveTimerRef.current) {
				window.clearTimeout(saveTimerRef.current);
			}
		};
	}, [horaires, loading]);

	function resetToDefault() {
		if (!window.confirm("Réinitialiser les horaires par défaut ? Les modifications non enregistrées seront perdues.")) {
			return;
		}
		setHoraires(DEFAULT_HORAIRES);
	}

	async function addVacances(e: React.FormEvent) {
		e.preventDefault();
		if (!vacancesForm.dateDebut || !vacancesForm.dateFin) return;

		if (vacancesForm.dateDebut >= vacancesForm.dateFin) {
			alert("La date de fin doit être après la date de début.");
			return;
		}

		try {
			const res = await fetch("/api/admin/vacances", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					dateDebut: vacancesForm.dateDebut,
					dateFin: vacancesForm.dateFin,
					message: vacancesForm.message,
					actif: vacancesForm.actif,
				}),
			});

			if (!res.ok) {
				throw new Error("Erreur lors de l'ajout");
			}

			const item = await res.json();
			setVacances((prev) => [
				...prev,
				{
					id: String(item._id),
					dateDebut: item.dateDebut?.slice(0, 10) || vacancesForm.dateDebut,
					dateFin: item.dateFin?.slice(0, 10) || vacancesForm.dateFin,
					message: item.message || "",
					actif: item.actif !== false,
				},
			]);

			setVacancesForm({
				id: "",
				dateDebut: "",
				dateFin: "",
				message: "",
				actif: true,
			});
		} catch (error) {
			console.error(error);
		}
	}

	async function removeVacances(id: string) {
		const prev = vacances;
		setVacances((items) => items.filter((item) => item.id !== id));
		try {
			const res = await fetch(`/api/admin/vacances/${id}`, { method: "DELETE" });
			if (!res.ok) {
				setVacances(prev);
			}
		} catch {
			setVacances(prev);
		}
	}

	async function toggleVacances(id: string) {
		const target = vacances.find((item) => item.id === id);
		if (!target) return;

		setVacances((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, actif: !item.actif } : item
			)
		);

		try {
			const res = await fetch(`/api/admin/vacances/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ actif: !target.actif }),
			});
			if (!res.ok) {
				setVacances((prev) =>
					prev.map((item) =>
						item.id === id ? { ...item, actif: target.actif } : item
					)
				);
			}
		} catch {
			setVacances((prev) =>
				prev.map((item) =>
					item.id === id ? { ...item, actif: target.actif } : item
				)
			);
		}
	}

	async function addFermeture(e: React.FormEvent) {
		e.preventDefault();
		if (!fermetureForm.date) return;

		if (!fermetureForm.journeeComplete) {
			if (!fermetureForm.heureDebut || !fermetureForm.heureFin) return;
			if (fermetureForm.heureDebut >= fermetureForm.heureFin) {
				alert("L'heure de fin doit être après l'heure de début.");
				return;
			}
		}

		try {
			const res = await fetch("/api/admin/fermetures", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					date: fermetureForm.date,
					journeeComplete: fermetureForm.journeeComplete,
					heureDebut: fermetureForm.journeeComplete ? undefined : fermetureForm.heureDebut,
					heureFin: fermetureForm.journeeComplete ? undefined : fermetureForm.heureFin,
					raison: fermetureForm.raison,
				}),
			});

			if (!res.ok) throw new Error("Erreur lors de l'ajout");
			const item = await res.json();
			setFermetures((prev) => [
				...prev,
				{
					id: String(item._id),
					date: item.date?.slice(0, 10) || fermetureForm.date,
					journeeComplete: item.journeeComplete !== false,
					heureDebut: item.heureDebut || "",
					heureFin: item.heureFin || "",
					raison: item.raison || "",
				},
			]);
			setFermetureForm({
				id: "",
				date: "",
				journeeComplete: true,
				heureDebut: "",
				heureFin: "",
				raison: "",
			});
		} catch (error) {
			console.error(error);
		}
	}

	async function removeFermeture(id: string) {
		const prev = fermetures;
		setFermetures((items) => items.filter((item) => item.id !== id));
		try {
			const res = await fetch(`/api/admin/fermetures/${id}`, { method: "DELETE" });
			if (!res.ok) {
				setFermetures(prev);
			}
		} catch {
			setFermetures(prev);
		}
	}

	async function addOuverture(e: React.FormEvent) {
		e.preventDefault();
		if (!ouvertureForm.date) return;
		if (!ouvertureForm.matinActif && !ouvertureForm.apremActif) {
			alert("Au moins une plage horaire (matin ou après-midi) doit être active.");
			return;
		}

		try {
			const res = await fetch("/api/admin/ouvertures", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					date: ouvertureForm.date,
					matin: ouvertureForm.matinActif
						? { debut: ouvertureForm.matinDebut, fin: ouvertureForm.matinFin }
						: undefined,
					aprem: ouvertureForm.apremActif
						? { debut: ouvertureForm.apremDebut, fin: ouvertureForm.apremFin }
						: undefined,
					raison: ouvertureForm.raison || undefined,
				}),
			});

			if (!res.ok) throw new Error("Erreur lors de l'ajout");
			const item = await res.json();
			const matin = item.matin as Record<string, string> | undefined;
			const aprem = item.aprem as Record<string, string> | undefined;
			setOuvertures((prev) => [
				...prev,
				{
					id: String(item._id),
					date: item.date?.slice(0, 10) || ouvertureForm.date,
					matinActif: !!matin?.debut,
					matinDebut: matin?.debut || "",
					matinFin: matin?.fin || "",
					apremActif: !!aprem?.debut,
					apremDebut: aprem?.debut || "",
					apremFin: aprem?.fin || "",
					raison: item.raison || "",
				},
			]);
			setOuvertureForm((prev) => ({ ...prev, date: "", raison: "" }));
		} catch (error) {
			console.error(error);
		}
	}

	async function removeOuverture(id: string) {
		const prev = ouvertures;
		setOuvertures((items) => items.filter((item) => item.id !== id));
		try {
			const res = await fetch(`/api/admin/ouvertures/${id}`, { method: "DELETE" });
			if (!res.ok) setOuvertures(prev);
		} catch {
			setOuvertures(prev);
		}
	}

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
					<h1 className="font-serif text-2xl text-brown">Horaires</h1>
					<p className="text-brown/50 text-sm mt-1">
						{totalOuverts} jour{totalOuverts > 1 ? "s" : ""} ouvert
						{totalOuverts > 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex items-center gap-3">
					{saving && (
						<span className="text-xs text-brown/50 animate-pulse">
							Enregistrement...
						</span>
					)}
					{saved && !saving && (
						<span className="text-xs text-green-600">
							Enregistré
						</span>
					)}
					<button
						onClick={resetToDefault}
						className="px-4 py-2 border border-brown/20 text-brown rounded-xl text-sm hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
					>
						Réinitialiser
					</button>
				</div>
			</div>

			<div className="hidden lg:block rounded-2xl border border-brown/10 bg-beige/70 overflow-hidden">
				<div className="grid grid-cols-11 gap-4 px-6 py-4 border-b border-brown/10 text-xs text-brown/50 bg-beige/80">
					<div className="col-span-3">Jour</div>
					<div className="col-span-1">Ouvert</div>
					<div className="col-span-3">Matin</div>
					<div className="col-span-4">Après-midi</div>
				</div>

				<div className="divide-y divide-brown/5">
					{horaires.map((item, index) => (
						<div
							key={item.jour}
							className="grid grid-cols-11 gap-4 px-6 py-4 transition-colors hover:bg-beige/80"
						>
							<div className="col-span-3 flex items-center">
								<span className="text-sm text-brown font-medium">
									{item.label}
								</span>
							</div>

							<div className="col-span-1 flex items-center">
								<button
									type="button"
									onClick={() =>
										updateJour(index, (h) =>
											h.ouvert
												? {
													...h,
													ouvert: false,
													matin: { ...h.matin, actif: false },
													aprem: { ...h.aprem, actif: false },
												}
												: { ...h, ouvert: true }
										)
									}
									className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${item.ouvert ? "bg-green-500" : "bg-gray-300"
										}`}
								>
									<span
										className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.ouvert ? "left-7" : "left-1"
											}`}
									/>
								</button>
							</div>

							<div className="col-span-3 flex items-center gap-2">
								<label className="flex items-center text-xs text-brown/60 cursor-pointer">
									<input
										type="checkbox"
										aria-label="Activer la plage du matin"
										checked={item.matin.actif}
										onChange={() =>
											updateJour(index, (h) => ({
												...h,
												matin: { ...h.matin, actif: !h.matin.actif },
											}))
										}
										disabled={!item.ouvert}
										className="h-4 w-4 rounded border-brown/30 text-brown focus:ring-brown cursor-pointer"
									/>
								</label>
								<input
									type="time"
									value={item.matin.debut}
									onChange={(e) =>
										updateJour(index, (h) => ({
											...h,
											matin: { ...h.matin, debut: e.target.value },
										}))
									}
									className="w-24 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									disabled={!item.ouvert || !item.matin.actif}
								/>
								<span className="text-brown/40 text-sm">→</span>
								<input
									type="time"
									value={item.matin.fin}
									onChange={(e) =>
										updateJour(index, (h) => ({
											...h,
											matin: { ...h.matin, fin: e.target.value },
										}))
									}
									className="w-24 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									disabled={!item.ouvert || !item.matin.actif}
								/>
							</div>

							<div className="col-span-4 flex items-center gap-2">
								<label className="flex items-center text-xs text-brown/60 cursor-pointer">
									<input
										type="checkbox"
										aria-label="Activer la plage de l'après-midi"
										checked={item.aprem.actif}
										onChange={() =>
											updateJour(index, (h) => ({
												...h,
												aprem: { ...h.aprem, actif: !h.aprem.actif },
											}))
										}
										disabled={!item.ouvert}
										className="h-4 w-4 rounded border-brown/30 text-brown focus:ring-brown cursor-pointer"
									/>
								</label>
								<input
									type="time"
									value={item.aprem.debut}
									onChange={(e) =>
										updateJour(index, (h) => ({
											...h,
											aprem: { ...h.aprem, debut: e.target.value },
										}))
									}
									className="w-24 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									disabled={!item.ouvert || !item.aprem.actif}
								/>
								<span className="text-brown/40 text-sm">→</span>
								<input
									type="time"
									value={item.aprem.fin}
									onChange={(e) =>
										updateJour(index, (h) => ({
											...h,
											aprem: { ...h.aprem, fin: e.target.value },
										}))
									}
									className="w-24 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									disabled={!item.ouvert || !item.aprem.actif}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="lg:hidden space-y-3">
				{horaires.map((item, index) => (
					<div
						key={item.jour}
						className="rounded-2xl border border-brown/10 bg-beige/70 p-4 space-y-3"
					>
						<div className="flex items-center justify-between">
							<span className="text-sm text-brown font-medium">{item.label}</span>
							<button
								type="button"
								onClick={() =>
									updateJour(index, (h) =>
										h.ouvert
											? {
												...h,
												ouvert: false,
												matin: { ...h.matin, actif: false },
												aprem: { ...h.aprem, actif: false },
											}
											: { ...h, ouvert: true }
									)
								}
								className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${item.ouvert ? "bg-green-500" : "bg-gray-300"}`}
							>
								<span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.ouvert ? "left-7" : "left-1"}`} />
							</button>
						</div>

						{item.ouvert && (
							<div className="space-y-3">
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-xs text-brown/60 cursor-pointer">
										<input
											type="checkbox"
											checked={item.matin.actif}
											onChange={() =>
												updateJour(index, (h) => ({
													...h,
													matin: { ...h.matin, actif: !h.matin.actif },
												}))
											}
											className="h-4 w-4 rounded border-brown/30 text-brown focus:ring-brown cursor-pointer"
										/>
										<span>Matin</span>
									</label>
									{item.matin.actif && (
										<div className="flex items-center gap-2">
											<input
												type="time"
												value={item.matin.debut}
												onChange={(e) =>
													updateJour(index, (h) => ({
														...h,
														matin: { ...h.matin, debut: e.target.value },
													}))
												}
												className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											/>
											<span className="text-brown/40 text-sm">→</span>
											<input
												type="time"
												value={item.matin.fin}
												onChange={(e) =>
													updateJour(index, (h) => ({
														...h,
														matin: { ...h.matin, fin: e.target.value },
													}))
												}
												className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											/>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<label className="flex items-center gap-2 text-xs text-brown/60 cursor-pointer">
										<input
											type="checkbox"
											checked={item.aprem.actif}
											onChange={() =>
												updateJour(index, (h) => ({
													...h,
													aprem: { ...h.aprem, actif: !h.aprem.actif },
												}))
											}
											className="h-4 w-4 rounded border-brown/30 text-brown focus:ring-brown cursor-pointer"
										/>
										<span>Après-midi</span>
									</label>
									{item.aprem.actif && (
										<div className="flex items-center gap-2">
											<input
												type="time"
												value={item.aprem.debut}
												onChange={(e) =>
													updateJour(index, (h) => ({
														...h,
														aprem: { ...h.aprem, debut: e.target.value },
													}))
												}
												className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											/>
											<span className="text-brown/40 text-sm">→</span>
											<input
												type="time"
												value={item.aprem.fin}
												onChange={(e) =>
													updateJour(index, (h) => ({
														...h,
														aprem: { ...h.aprem, fin: e.target.value },
													}))
												}
												className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											/>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				<div className="rounded-2xl border border-brown/10 bg-beige/70 p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-serif text-lg text-brown">Fermetures prolongées</h2>
						<span className="text-xs text-brown/50">
							{vacances.length} période{vacances.length > 1 ? "s" : ""}
						</span>
					</div>

					<form onSubmit={addVacances} className="grid gap-3">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label className="block text-xs text-brown/60 mb-1">Du</label>
								<input
									type="date"
									value={vacancesForm.dateDebut}
									onChange={(e) =>
										setVacancesForm((prev) => ({
											...prev,
											dateDebut: e.target.value,
										}))
									}
									className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									required
								/>
							</div>
							<div>
								<label className="block text-xs text-brown/60 mb-1">Au</label>
								<input
									type="date"
									value={vacancesForm.dateFin}
									min={vacancesForm.dateDebut || undefined}
									onChange={(e) =>
										setVacancesForm((prev) => ({
											...prev,
											dateFin: e.target.value,
										}))
									}
									className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									required
								/>
							</div>
						</div>
						<input
							type="text"
							value={vacancesForm.message}
							onChange={(e) =>
								setVacancesForm((prev) => ({
									...prev,
									message: e.target.value,
								}))
							}
							className="px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
							placeholder="Message (optionnel)"
						/>
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 text-xs text-brown/60 cursor-pointer">
								<input
									type="checkbox"
									checked={vacancesForm.actif}
									onChange={() =>
										setVacancesForm((prev) => ({
											...prev,
											actif: !prev.actif,
										}))
									}
									className="h-4 w-4 rounded border-brown/30 text-brown cursor-pointer"
								/>
								<span>Activer immédiatement</span>
							</label>
							<button
								type="submit"
								className="px-4 py-2 bg-brown text-beige rounded-xl text-xs hover:bg-brown/90 active:bg-brown/80 cursor-pointer"
							>
								Ajouter
							</button>
						</div>
					</form>

					<div className="space-y-2">
						{vacances.length === 0 ? (
							<p className="text-sm text-brown/40">Aucune période</p>
						) : (
							vacances.map((item) => (
								<div
									key={item.id}
									className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-brown/10 bg-beige/80 px-3 py-2"
								>
									<div className="min-w-0">
										<p className="text-sm text-brown">
											Du {formatDateFr(item.dateDebut)} au {formatDateFr(item.dateFin)}
										</p>
										{item.message && (
											<p className="text-xs text-brown/50 truncate">
												{item.message}
											</p>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<button
											onClick={() => toggleVacances(item.id)}
											className={`px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-colors active:scale-95 ${item.actif
												? "bg-green-100 text-green-700"
												: "bg-gray-100 text-gray-500"
												}`}
										>
											{item.actif ? "Actif" : "Inactif"}
										</button>
										<button
											onClick={() => removeVacances(item.id)}
											className="text-xs text-brown/50 hover:text-red-600 active:text-red-600 cursor-pointer"
										>
											Supprimer
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				<div className="rounded-2xl border border-brown/10 bg-beige/70 p-6 space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-serif text-lg text-brown">Fermetures exceptionnelles</h2>
						<span className="text-xs text-brown/50">
							{fermetures.length} fermeture{fermetures.length > 1 ? "s" : ""}
						</span>
					</div>

					<form onSubmit={addFermeture} className="grid gap-3">
						<div>
							<label className="block text-xs text-brown/60 mb-1">Date</label>
							<input
								type="date"
								value={fermetureForm.date}
								onChange={(e) =>
									setFermetureForm((prev) => ({
										...prev,
										date: e.target.value,
									}))
								}
								className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
								required
							/>
						</div>
						<label className="flex items-center gap-2 text-xs text-brown/60 cursor-pointer">
							<input
								type="checkbox"
								checked={fermetureForm.journeeComplete}
								onChange={() =>
									setFermetureForm((prev) => ({
										...prev,
										journeeComplete: !prev.journeeComplete,
									}))
								}
								className="h-4 w-4 rounded border-brown/30 text-brown cursor-pointer"
							/>
							<span>Toute la journée</span>
						</label>
						{!fermetureForm.journeeComplete && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-xs text-brown/60 mb-1">De</label>
									<input
										type="time"
										value={fermetureForm.heureDebut}
										onChange={(e) =>
											setFermetureForm((prev) => ({
												...prev,
												heureDebut: e.target.value,
											}))
										}
										className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
										required
									/>
								</div>
								<div>
									<label className="block text-xs text-brown/60 mb-1">À</label>
									<input
										type="time"
										value={fermetureForm.heureFin}
										min={fermetureForm.heureDebut || undefined}
										onChange={(e) =>
											setFermetureForm((prev) => ({
												...prev,
												heureFin: e.target.value,
											}))
										}
										className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
										required
									/>
								</div>
							</div>
						)}
						<input
							type="text"
							value={fermetureForm.raison}
							onChange={(e) =>
								setFermetureForm((prev) => ({
									...prev,
									raison: e.target.value,
								}))
							}
							className="px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
							placeholder="Raison (optionnel)"
						/>
						<div className="flex justify-end">
							<button
								type="submit"
								className="px-4 py-2 bg-brown text-beige rounded-xl text-xs hover:bg-brown/90 active:bg-brown/80 cursor-pointer"
							>
								Ajouter
							</button>
						</div>
					</form>

					<div className="space-y-2">
						{fermetures.length === 0 ? (
							<p className="text-sm text-brown/40">Aucune fermeture</p>
						) : (
							fermetures.map((item) => (
								<div
									key={item.id}
									className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-brown/10 bg-beige/80 px-3 py-2"
								>
									<div className="min-w-0">
										<p className="text-sm text-brown">
											{formatDateFr(item.date)}
											{item.journeeComplete
												? " • Toute la journée"
												: ` • ${item.heureDebut} - ${item.heureFin}`}
										</p>
										{item.raison && (
											<p className="text-xs text-brown/50 truncate">
												{item.raison}
											</p>
										)}
									</div>
									<button
										onClick={() => removeFermeture(item.id)}
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

			<div className="rounded-2xl border border-brown/10 bg-beige/70 p-6 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-serif text-lg text-brown">Ouvertures exceptionnelles</h2>
					<span className="text-xs text-brown/50">
						{ouvertures.length} ouverture{ouvertures.length > 1 ? "s" : ""}
					</span>
				</div>

				<form onSubmit={addOuverture} className="grid gap-3">
					<div>
						<label className="block text-xs text-brown/60 mb-1">Date</label>
						<input
							type="date"
							value={ouvertureForm.date}
							onChange={(e) =>
								setOuvertureForm((prev) => ({
									...prev,
									date: e.target.value,
								}))
							}
							className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
							required
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="flex items-center gap-2 text-xs text-brown/60 cursor-pointer mb-2">
								<input
									type="checkbox"
									checked={ouvertureForm.matinActif}
									onChange={() =>
										setOuvertureForm((prev) => ({
											...prev,
											matinActif: !prev.matinActif,
										}))
									}
									className="h-4 w-4 rounded border-brown/30 text-brown cursor-pointer"
								/>
								<span>Matin</span>
							</label>
							{ouvertureForm.matinActif && (
								<div className="grid grid-cols-2 gap-2">
									<div className="min-w-0">
										<label className="block text-xs text-brown/60 mb-1">De</label>
										<input
											type="time"
											value={ouvertureForm.matinDebut}
											onChange={(e) =>
												setOuvertureForm((prev) => ({
													...prev,
													matinDebut: e.target.value,
												}))
											}
											className="w-full min-w-0 max-w-30 px-2 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											required
										/>
									</div>
									<div className="min-w-0">
										<label className="block text-xs text-brown/60 mb-1">À</label>
										<input
											type="time"
											value={ouvertureForm.matinFin}
											onChange={(e) =>
												setOuvertureForm((prev) => ({
													...prev,
													matinFin: e.target.value,
												}))
											}
											className="w-full min-w-0 max-w-30 px-2 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											required
										/>
									</div>
								</div>
							)}
						</div>
						<div>
							<label className="flex items-center gap-2 text-xs text-brown/60 cursor-pointer mb-2">
								<input
									type="checkbox"
									checked={ouvertureForm.apremActif}
									onChange={() =>
										setOuvertureForm((prev) => ({
											...prev,
											apremActif: !prev.apremActif,
										}))
									}
									className="h-4 w-4 rounded border-brown/30 text-brown cursor-pointer"
								/>
								<span>Après-midi</span>
							</label>
							{ouvertureForm.apremActif && (
								<div className="grid grid-cols-2 gap-2">
									<div className="min-w-0">
										<label className="block text-xs text-brown/60 mb-1">De</label>
										<input
											type="time"
											value={ouvertureForm.apremDebut}
											onChange={(e) =>
												setOuvertureForm((prev) => ({
													...prev,
													apremDebut: e.target.value,
												}))
											}
											className="w-full min-w-0 max-w-30 px-2 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											required
										/>
									</div>
									<div className="min-w-0">
										<label className="block text-xs text-brown/60 mb-1">À</label>
										<input
											type="time"
											value={ouvertureForm.apremFin}
											onChange={(e) =>
												setOuvertureForm((prev) => ({
													...prev,
													apremFin: e.target.value,
												}))
											}
											className="w-full min-w-0 max-w-30 px-2 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
											required
										/>
									</div>
								</div>
							)}
						</div>
					</div>
					<input
						type="text"
						value={ouvertureForm.raison}
						onChange={(e) =>
							setOuvertureForm((prev) => ({
								...prev,
								raison: e.target.value,
							}))
						}
						className="px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
						placeholder="Raison (optionnel)"
					/>
					<div className="flex justify-end">
						<button
							type="submit"
							className="px-4 py-2 bg-brown text-beige rounded-xl text-xs hover:bg-brown/90 active:bg-brown/80 cursor-pointer"
						>
							Ajouter
						</button>
					</div>
				</form>

				<div className="space-y-2">
					{ouvertures.length === 0 ? (
						<p className="text-sm text-brown/40">Aucune ouverture exceptionnelle</p>
					) : (
						ouvertures.map((item) => (
							<div
								key={item.id}
								className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-brown/10 bg-beige/80 px-3 py-2"
							>
								<div className="min-w-0">
									<p className="text-sm text-brown">
										{formatDateFr(item.date)}
									</p>
									<p className="text-xs text-brown/60">
										{item.matinActif && `Matin : ${item.matinDebut} - ${item.matinFin}`}
										{item.matinActif && item.apremActif && " · "}
										{item.apremActif && `Après-midi : ${item.apremDebut} - ${item.apremFin}`}
									</p>
									{item.raison && (
										<p className="text-xs text-brown/50 truncate">
											{item.raison}
										</p>
									)}
								</div>
								<button
									onClick={() => removeOuverture(item.id)}
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
	);
}
