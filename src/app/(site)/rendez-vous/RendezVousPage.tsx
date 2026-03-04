"use client";

import { motion } from "framer-motion";
import { useState, useCallback, useEffect, useMemo } from "react";
import { DUREE_PAR_TYPE } from "@/types";
import type { TypeRdv } from "@/types";

interface HoraireApi {
	jour: number;
	ouvert: boolean;
}

interface VacancesApi {
	dateDebut: string;
	dateFin: string;
}

interface FermetureApi {
	date: string;
	journeeComplete?: boolean;
}

interface OuvertureApi {
	date: string;
}

const typesRdvBase = [
	{
		id: "examen" as TypeRdv,
		label: "Examen de vue",
		description: "Bilan visuel complet",
	},
	{
		id: "vente" as TypeRdv,
		label: "Conseil & vente",
		description: "Essayage et choix de montures",
	},
	{
		id: "reparation" as TypeRdv,
		label: "Réparation",
		description: "Ajustement ou réparation",
	},
];

function formatDuree(minutes: number): string {
	if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`;
	if (minutes >= 60) return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
	return `${minutes}min`;
}

function formatPhone(value: string) {
	const digits = value.replace(/\D/g, "").slice(0, 10);
	return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function capitalizeFirst(value: string) {
	if (!value) return value;
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateFr(dateStr: string) {
	const date = new Date(dateStr + "T12:00:00");
	return date.toLocaleDateString("fr-FR", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});
}

function getCalendarDates(date: string, time: string, duration: number) {
	const [hours, minutes] = time.split(":").map(Number);
	const startDate = new Date(date + "T12:00:00");
	startDate.setHours(hours, minutes, 0, 0);
	const endDate = new Date(startDate.getTime() + duration * 60000);
	return { startDate, endDate };
}

function generateGoogleCalendarUrl(title: string, date: string, time: string, duration: number) {
	const { startDate, endDate } = getCalendarDates(date, time, duration);
	const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: title,
		dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
		details: "Rendez-vous chez Binocles de la Save",
		location: "42 Avenue de la République, 31530 Levignac",
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateOutlookUrl(title: string, date: string, time: string, duration: number) {
	const { startDate, endDate } = getCalendarDates(date, time, duration);
	const params = new URLSearchParams({
		subject: title,
		startdt: startDate.toISOString(),
		enddt: endDate.toISOString(),
		location: "42 Avenue de la République, 31530 Levignac",
		body: "Rendez-vous chez Binocles de la Save",
	});
	return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function downloadICalFile(title: string, date: string, time: string, duration: number) {
	const { startDate, endDate } = getCalendarDates(date, time, duration);

	const formatLocalDate = (d: Date) => {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		const hours = String(d.getHours()).padStart(2, "0");
		const minutes = String(d.getMinutes()).padStart(2, "0");
		const seconds = String(d.getSeconds()).padStart(2, "0");
		return `${year}${month}${day}T${hours}${minutes}${seconds}`;
	};

	const ical = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Binocles de la Save//RDV//FR",
		"BEGIN:VEVENT",
		`DTSTART:${formatLocalDate(startDate)}`,
		`DTEND:${formatLocalDate(endDate)}`,
		`SUMMARY:${title}`,
		"DESCRIPTION:Rendez-vous chez Binocles de la Save",
		"LOCATION:42 Avenue de la République, 31530 Levignac",
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");

	const blob = new Blob([ical], { type: "text/calendar;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "rendez-vous-binocles.ics";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

function getNextDays(minDays: number): string[] {
	const days: string[] = [];
	const today = new Date();
	for (let i = 1; i <= minDays; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() + i);
		days.push(date.toISOString().split("T")[0]);
	}
	// Compléter la dernière semaine jusqu'au samedi
	const lastDate = new Date(today);
	lastDate.setDate(today.getDate() + minDays);
	while (lastDate.getDay() !== 6) {
		lastDate.setDate(lastDate.getDate() + 1);
		days.push(lastDate.toISOString().split("T")[0]);
	}
	return days;
}

export default function RendezVousPage() {
	const [step, setStep] = useState(1);
	const [typeRdv, setTypeRdv] = useState<TypeRdv | null>(null);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [selectedHeure, setSelectedHeure] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		nom: "",
		prenom: "",
		email: "",
		telephone: "",
		message: "",
	});
	const [showCalendarMenu, setShowCalendarMenu] = useState(false);

	// API states
	const [creneaux, setCreneaux] = useState<string[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Données de disponibilité (horaires, vacances, fermetures, ouvertures)
	const [horaires, setHoraires] = useState<HoraireApi[]>([]);
	const [vacances, setVacances] = useState<VacancesApi[]>([]);
	const [fermeturesJournee, setFermeturesJournee] = useState<Set<string>>(new Set());
	const [ouverturesExc, setOuverturesExc] = useState<OuvertureApi[]>([]);
	const [durees, setDurees] = useState<Record<TypeRdv, number>>(DUREE_PAR_TYPE);

	useEffect(() => {
		async function fetchDispo() {
			try {
				const res = await fetch("/api/horaires");
				if (!res.ok) return;
				const data = await res.json();
				setHoraires(data.horaires || []);
				setVacances(data.vacancesActives || []);
				const closedDates = new Set<string>();
				for (const f of data.fermetures || []) {
					if (f.journeeComplete !== false) {
						closedDates.add(f.date.slice(0, 10));
					}
				}
				setFermeturesJournee(closedDates);
				if (data.ouvertures) {
					setOuverturesExc(
						data.ouvertures.map((o: { date: string }) => ({
							date: o.date.slice(0, 10),
						}))
					);
				}
				if (data.configRdv?.durees) {
					setDurees({
						examen: data.configRdv.durees.examen ?? DUREE_PAR_TYPE.examen,
						vente: data.configRdv.durees.vente ?? DUREE_PAR_TYPE.vente,
						reparation: data.configRdv.durees.reparation ?? DUREE_PAR_TYPE.reparation,
					});
				}
			} catch { /* silencieux */ }
		}
		fetchDispo();
	}, []);

	const rawDates = useMemo(() => getNextDays(14), []);

	// Retirer les jours de repos hebdomadaire, sauf ouvertures exceptionnelles
	const ouverturesSet = useMemo(
		() => new Set(ouverturesExc.map((o) => o.date)),
		[ouverturesExc]
	);

	const availableDates = useMemo(() => {
		if (horaires.length === 0) return rawDates;
		return rawDates.filter((date) => {
			if (ouverturesSet.has(date)) return true;
			const dayOfWeek = new Date(date + "T12:00:00").getDay();
			const h = horaires.find((hr) => hr.jour === dayOfWeek);
			return !h || h.ouvert;
		});
	}, [rawDates, horaires, ouverturesSet]);

	// Griser les fermetures temporaires (vacances, fermetures), sauf ouvertures exceptionnelles
	const closedDates = useMemo(() => {
		const closed = new Set<string>();
		for (const date of availableDates) {
			if (ouverturesSet.has(date)) continue;
			for (const v of vacances) {
				const debut = v.dateDebut.slice(0, 10);
				const fin = v.dateFin.slice(0, 10);
				if (date >= debut && date <= fin) { closed.add(date); break; }
			}
			if (fermeturesJournee.has(date)) closed.add(date);
		}
		return closed;
	}, [availableDates, vacances, fermeturesJournee, ouverturesSet]);

	const fetchCreneaux = useCallback(async (date: string, type: TypeRdv) => {
		setLoadingSlots(true);
		setCreneaux([]);
		setError(null);
		try {
			const res = await fetch(`/api/rdv/creneaux?date=${date}&typeRdv=${type}`);
			if (!res.ok) throw new Error("Erreur lors du chargement des créneaux");
			const data = await res.json();
			setCreneaux(data.creneaux || []);
		} catch {
			setError("Impossible de charger les créneaux. Réessayez.");
		} finally {
			setLoadingSlots(false);
		}
	}, []);

	const handleSelectDate = (date: string) => {
		setSelectedDate(date);
		setSelectedHeure(null);
		if (typeRdv) {
			fetchCreneaux(date, typeRdv);
			setStep(3);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!typeRdv || !selectedDate || !selectedHeure) return;

		setSubmitting(true);
		setError(null);

		try {
			const res = await fetch("/api/rdv", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					typeRdv,
					dateRdv: selectedDate,
					heureDebut: selectedHeure,
					nom: formData.nom,
					prenom: formData.prenom,
					email: formData.email,
					telephone: formData.telephone,
					message: formData.message || undefined,
				}),
			});

			if (res.status === 409) {
				setError("Ce créneau n'est plus disponible. Veuillez en choisir un autre.");
				setStep(3);
				if (typeRdv) fetchCreneaux(selectedDate, typeRdv);
				return;
			}

			if (!res.ok) throw new Error("Erreur lors de la réservation");

			setStep(5);
		} catch {
			setError("Une erreur est survenue. Veuillez réessayer.");
		} finally {
			setSubmitting(false);
		}
	};

	const duration = typeRdv ? durees[typeRdv] : 60;

	return (
		<main className="min-h-screen bg-beige">
			{/* Hero */}
			<section className="relative pt-28 pb-10 sm:pt-32 sm:pb-12 md:pt-40 md:pb-16 px-4 sm:px-6 bg-brown overflow-hidden">
				<div className="absolute inset-0 opacity-[0.03]">
					<svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<pattern id="rdv-dots" width="32" height="32" patternUnits="userSpaceOnUse">
								<circle cx="16" cy="16" r="1" fill="#E7DAC6" />
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#rdv-dots)" />
					</svg>
				</div>

				<div className="relative max-w-3xl mx-auto text-center">
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="font-serif text-3xl sm:text-4xl md:text-5xl text-beige mb-4"
					>
						Prendre rendez-vous
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="text-beige/70"
					>
						Réservez votre créneau en quelques clics
					</motion.p>
				</div>
			</section>

			{/* Stepper */}
			<section className="relative -mt-6 px-4 sm:px-6 mb-8">
				<div className="max-w-2xl mx-auto">
					<div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4">
						<div className="flex items-center justify-center gap-0">
							{[
								{ num: 1, label: "Type" },
								{ num: 2, label: "Date" },
								{ num: 3, label: "Heure" },
								{ num: 4, label: "Coordonnées" },
							].map((s, i) => (
								<div key={s.num} className="flex items-center">
									<div className="flex items-center gap-1.5 sm:gap-2">
										<div
											className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${step >= s.num
												? "bg-accent text-white"
												: "bg-brown/10 text-brown/40"
												}`}
										>
											{step > s.num ? (
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M20 6L9 17l-5-5" />
												</svg>
											) : (
												s.num
											)}
										</div>
										<span
											className={`text-xs sm:text-sm hidden sm:block ${step >= s.num ? "text-brown" : "text-brown/40"
												}`}
										>
											{s.label}
										</span>
									</div>
									{i < 3 && (
										<div
											className={`w-6 sm:w-10 md:w-12 h-px mx-1.5 sm:mx-2 ${step > s.num ? "bg-accent" : "bg-brown/10"
												}`}
										/>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className="px-4 sm:px-6 pb-16 md:pb-24">
				<div className="max-w-2xl mx-auto">
					{/* Erreur globale */}
					{error && step !== 5 && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
						>
							{error}
						</motion.div>
					)}

					{/* Step 1: Type de RDV */}
					{step === 1 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							<h2 className="font-serif text-2xl text-brown mb-6 text-center">
								Quel type de rendez-vous ?
							</h2>
							<div className="space-y-3">
								{typesRdvBase.map((type) => (
									<button
										key={type.id}
										onClick={() => {
											setTypeRdv(type.id);
											setSelectedDate(null);
											setSelectedHeure(null);
											setCreneaux([]);
											setError(null);
											setStep(2);
										}}
										className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${typeRdv === type.id
											? "border-accent bg-accent/5"
											: "border-brown/10 bg-white hover:border-brown/30"
											}`}
									>
										<div className="flex items-center justify-between gap-3">
											<div className="min-w-0">
												<h3 className="font-medium text-brown">{type.label}</h3>
												<p className="text-brown/60 text-sm">{type.description}</p>
											</div>
											<span className="text-xs text-brown/40 bg-brown/5 px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap shrink-0">
												{formatDuree(durees[type.id])}
											</span>
										</div>
									</button>
								))}
							</div>
						</motion.div>
					)}

					{/* Step 2: Choix de date */}
					{step === 2 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							<button
								onClick={() => setStep(1)}
								className="flex items-center gap-2 text-brown/60 hover:text-brown mb-6 transition-colors cursor-pointer"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M19 12H5M12 19l-7-7 7-7" />
								</svg>
								Retour
							</button>

							<h2 className="font-serif text-2xl text-brown mb-6 text-center">
								Choisissez une date
							</h2>

							{typeRdv === "examen" && (
								<div className="mb-6 rounded-xl border border-brown/10 bg-brown/5 px-4 py-3 text-sm text-brown/80">
									Les examens de vue sont réalisés à partir de 16 ans révolus et nécessitent une ordonnance valide.
								</div>
							)}

							<div className="space-y-6">
								{(() => {
									// Grouper les dates par semaine (lundi → samedi)
									const weeks: { label: string; dates: string[] }[] = [];
									let currentWeek: string[] = [];
									let currentMonday = "";
									for (const date of availableDates) {
										const d = new Date(date + "T12:00:00");
										const day = d.getDay();
										// Calculer le lundi de cette semaine
										const monday = new Date(d);
										monday.setDate(d.getDate() - ((day + 6) % 7));
										const mondayStr = monday.toISOString().split("T")[0];
										if (mondayStr !== currentMonday) {
											if (currentWeek.length > 0) {
												const start = new Date(currentMonday + "T12:00:00");
												weeks.push({
													label: `Semaine du ${start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
													dates: currentWeek,
												});
											}
											currentMonday = mondayStr;
											currentWeek = [];
										}
										currentWeek.push(date);
									}
									if (currentWeek.length > 0) {
										const start = new Date(currentMonday + "T12:00:00");
										weeks.push({
											label: `Semaine du ${start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
											dates: currentWeek,
										});
									}
									return weeks.map((week) => (
										<div key={week.label}>
											<p className="text-xs text-brown/40 uppercase tracking-wider mb-2">
												{week.label}
											</p>
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
												{week.dates.map((date) => {
													const isClosed = closedDates.has(date);
													return (
														<button
															key={date}
															onClick={() => !isClosed && handleSelectDate(date)}
															disabled={isClosed}
															className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all duration-300 ${isClosed
																? "border-brown/5 bg-brown/5 text-brown/30 cursor-not-allowed"
																: selectedDate === date
																	? "border-accent bg-accent text-white cursor-pointer"
																	: "border-brown/10 bg-white hover:border-brown/30 text-brown cursor-pointer"
																}`}
														>
															<p className="text-xs opacity-70 capitalize">
																{new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}
															</p>
															<p className="text-sm sm:text-base font-medium">
																{new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
															</p>
														</button>
													);
												})}
											</div>
										</div>
									));
								})()}
							</div>
						</motion.div>
					)}

					{/* Step 3: Choix de l'heure */}
					{step === 3 && selectedDate && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							<button
								onClick={() => setStep(2)}
								className="flex items-center gap-2 text-brown/60 hover:text-brown mb-6 transition-colors cursor-pointer"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M19 12H5M12 19l-7-7 7-7" />
								</svg>
								Retour
							</button>

							<h2 className="font-serif text-2xl text-brown mb-2 text-center">
								Choisissez un horaire
							</h2>
							<p className="text-brown/50 text-sm text-center mb-8">
								{formatDateFr(selectedDate)}
							</p>

							{loadingSlots ? (
								<div className="flex items-center justify-center py-12">
									<div className="w-6 h-6 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
									<span className="ml-3 text-sm text-brown/60">Chargement des créneaux...</span>
								</div>
							) : creneaux.length > 0 ? (
								<>
									{(() => {
										const matin = creneaux.filter((h) => h < "13:00");
										const aprem = creneaux.filter((h) => h >= "13:00");
										const hasBoth = matin.length > 0 && aprem.length > 0;

										const renderGrid = (slots: string[]) => (
											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
												{slots.map((heure) => (
													<button
														key={heure}
														onClick={() => setSelectedHeure(heure)}
														className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-300 cursor-pointer ${selectedHeure === heure
															? "border-accent bg-accent text-white"
															: "border-brown/10 bg-white hover:border-brown/30 text-brown"
															}`}
													>
														{heure}
													</button>
												))}
											</div>
										);

										if (!hasBoth) return renderGrid(creneaux);

										return (
											<div className="space-y-6">
												<div>
													<p className="text-xs text-brown/40 uppercase tracking-wider mb-2">Matin</p>
													{renderGrid(matin)}
												</div>
												<div>
													<p className="text-xs text-brown/40 uppercase tracking-wider mb-2">Après-midi</p>
													{renderGrid(aprem)}
												</div>
											</div>
										);
									})()}

									{selectedHeure && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="mt-8"
										>
											<button
												onClick={() => { setError(null); setStep(4); }}
												className="w-full py-3 sm:py-4 rounded-xl bg-brown text-beige text-sm sm:text-base font-medium hover:bg-brown/90 transition-colors cursor-pointer"
											>
												Continuer
											</button>
										</motion.div>
									)}
								</>
							) : (
								<div className="text-center py-12">
									<p className="text-brown/50 text-sm">Aucun créneau disponible ce jour</p>
									<p className="text-brown/40 text-xs mt-2">
										<button
											onClick={() => setStep(2)}
											className="underline hover:text-brown transition-colors cursor-pointer"
										>
											Choisir une autre date
										</button>
									</p>
								</div>
							)}
						</motion.div>
					)}

					{/* Step 4: Formulaire */}
					{step === 4 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							<button
								onClick={() => setStep(3)}
								className="flex items-center gap-2 text-brown/60 hover:text-brown mb-6 transition-colors cursor-pointer"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M19 12H5M12 19l-7-7 7-7" />
								</svg>
								Retour
							</button>

							{/* Récap */}
							<div className="bg-brown/5 rounded-2xl p-4 mb-8">
								<p className="text-sm text-brown/60 mb-1">Votre rendez-vous</p>
								<p className="font-medium text-brown">
									<span className="block sm:inline">{typesRdvBase.find((t) => t.id === typeRdv)?.label}</span>
									<span className="hidden sm:inline"> — </span>
									<span className="block sm:inline text-sm sm:text-base">{formatDateFr(selectedDate!)} à {selectedHeure}</span>
								</p>
							</div>

							<h2 className="font-serif text-2xl text-brown mb-6 text-center">
								Vos coordonnées
							</h2>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm text-brown/70 mb-2">Prénom *</label>
										<input
											type="text"
											required
											value={formData.prenom}
											onChange={(e) => setFormData({ ...formData, prenom: capitalizeFirst(e.target.value) })}
											className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-brown/10 bg-white text-sm sm:text-base focus:border-accent focus:outline-none transition-colors"
											placeholder="Marie"
										/>
									</div>
									<div>
										<label className="block text-sm text-brown/70 mb-2">Nom *</label>
										<input
											type="text"
											required
											value={formData.nom}
											onChange={(e) => setFormData({ ...formData, nom: capitalizeFirst(e.target.value) })}
											className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-brown/10 bg-white text-sm sm:text-base focus:border-accent focus:outline-none transition-colors"
											placeholder="Dupont"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm text-brown/70 mb-2">Email *</label>
									<input
										type="email"
										required
										value={formData.email}
										onChange={(e) => setFormData({ ...formData, email: e.target.value })}
										className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-brown/10 bg-white text-sm sm:text-base focus:border-accent focus:outline-none transition-colors"
										placeholder="marie.dupont@email.com"
									/>
								</div>

								<div>
									<label className="block text-sm text-brown/70 mb-2">Téléphone *</label>
									<input
										type="tel"
										required
										value={formData.telephone}
										onChange={(e) => setFormData({ ...formData, telephone: formatPhone(e.target.value) })}
										className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-brown/10 bg-white text-sm sm:text-base focus:border-accent focus:outline-none transition-colors"
										placeholder="06 12 34 56 78"
									/>
								</div>

								<div>
									<label className="block text-sm text-brown/70 mb-2">
										Message <span className="text-brown/40">(optionnel)</span>
									</label>
									<textarea
										value={formData.message}
										onChange={(e) => setFormData({ ...formData, message: e.target.value })}
										rows={3}
										className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-brown/10 bg-white text-sm sm:text-base focus:border-accent focus:outline-none transition-colors resize-none"
										placeholder="Précisions sur votre visite..."
									/>
								</div>

								<button
									type="submit"
									disabled={submitting}
									className="w-full py-3 sm:py-4 rounded-xl bg-brown text-beige text-sm sm:text-base font-medium hover:bg-brown/90 transition-colors mt-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{submitting ? (
										<>
											<div className="w-4 h-4 border-2 border-beige/30 border-t-beige rounded-full animate-spin" />
											Réservation en cours...
										</>
									) : (
										"Confirmer le rendez-vous"
									)}
								</button>
							</form>
						</motion.div>
					)}

					{/* Step 5: Confirmation */}
					{step === 5 && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.4 }}
							className="text-center py-8"
						>
							<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-6">
								<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="sm:w-10 sm:h-10">
									<path d="M20 6L9 17l-5-5" />
								</svg>
							</div>

							<h2 className="font-serif text-2xl sm:text-3xl text-brown mb-4">
								Rendez-vous confirmé !
							</h2>

							<div className="bg-brown/5 rounded-2xl p-6 mb-6 max-w-sm mx-auto">
								<p className="text-brown font-medium mb-2">
									{typesRdvBase.find((t) => t.id === typeRdv)?.label}
								</p>
								<p className="text-brown/70">
									{formatDateFr(selectedDate!)} à {selectedHeure}
								</p>
							</div>

							<p className="text-brown/60 mb-6">
								Un email de confirmation vous a été envoyé à<br />
								<span className="font-medium text-brown">{formData.email}</span>
							</p>

							{/* Ajouter au calendrier */}
							<div className="relative max-w-xs mx-auto mb-8">
								<button
									onClick={() => setShowCalendarMenu(!showCalendarMenu)}
									className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-brown/10 bg-white text-sm text-brown hover:border-brown/30 transition-colors cursor-pointer"
								>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
										<path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
										<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
									Ajouter au calendrier
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										className={`ml-auto transition-transform duration-200 ${showCalendarMenu ? "rotate-180" : ""}`}
									>
										<path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</button>

								{showCalendarMenu && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-brown/10 shadow-lg overflow-hidden z-10"
									>
										{[
											{
												name: "Google Calendar",
												icon: (
													<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
														<path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
														<path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
													</svg>
												),
												href: generateGoogleCalendarUrl(
													`${typesRdvBase.find((t) => t.id === typeRdv)?.label} - Binocles de la Save`,
													selectedDate!,
													selectedHeure!,
													duration
												),
											},
											{
												name: "Apple Calendar",
												icon: (
													<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
														<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
														<path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
												),
												onClick: () =>
													downloadICalFile(
														`${typesRdvBase.find((t) => t.id === typeRdv)?.label} - Binocles de la Save`,
														selectedDate!,
														selectedHeure!,
														duration
													),
											},
											{
												name: "Outlook",
												icon: (
													<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
														<rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
														<path d="M3 8l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
													</svg>
												),
												href: generateOutlookUrl(
													`${typesRdvBase.find((t) => t.id === typeRdv)?.label} - Binocles de la Save`,
													selectedDate!,
													selectedHeure!,
													duration
												),
											},
										].map((cal) =>
											cal.href ? (
												<a
													key={cal.name}
													href={cal.href}
													target="_blank"
													rel="noopener noreferrer"
													onClick={() => setShowCalendarMenu(false)}
													className="flex items-center gap-3 px-4 py-3 text-sm text-brown hover:bg-brown/5 transition-colors cursor-pointer"
												>
													{cal.icon}
													{cal.name}
												</a>
											) : (
												<button
													key={cal.name}
													onClick={() => {
														cal.onClick?.();
														setShowCalendarMenu(false);
													}}
													className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brown hover:bg-brown/5 transition-colors cursor-pointer"
												>
													{cal.icon}
													{cal.name}
												</button>
											)
										)}
									</motion.div>
								)}
							</div>

							<a
								href="/"
								className="inline-flex items-center gap-2 text-brown hover:text-brown/70 transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M19 12H5M12 19l-7-7 7-7" />
								</svg>
								Retour à l&apos;accueil
							</a>
						</motion.div>
					)}
				</div>
			</section>
		</main>
	);
}
