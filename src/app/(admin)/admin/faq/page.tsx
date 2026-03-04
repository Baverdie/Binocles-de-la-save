"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Faq {
	_id: string;
	question: string;
	reponse: string;
	categorie: string;
	ordre: number;
	actif: boolean;
}

export default function FAQAdminPage() {
	const [faqs, setFaqs] = useState<Faq[]>([]);
	const [loading, setLoading] = useState(true);
	const [showActivesOnly, setShowActivesOnly] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
	const [formData, setFormData] = useState({
		question: "",
		reponse: "",
		categorie: "",
		actif: true,
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [dragCategorie, setDragCategorie] = useState<string | null>(null);
	const touchDragRef = useRef<{ id: string; categorie: string } | null>(null);
	const faqsRef = useRef(faqs);
	faqsRef.current = faqs;

	useEffect(() => {
		fetchFaqs();
	}, []);

	const closeForm = useCallback(() => {
		setShowForm(false);
		setEditingFaq(null);
		setFormData({ question: "", reponse: "", categorie: "", actif: true });
		setError("");
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape" && showForm) {
				closeForm();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [showForm, closeForm]);

	// Touch drag & drop for mobile
	useEffect(() => {
		function onTouchMove(e: TouchEvent) {
			if (!touchDragRef.current) return;
			e.preventDefault();
			const touch = e.touches[0];
			const el = document.elementFromPoint(touch.clientX, touch.clientY);
			const card = el?.closest("[data-faq-id]") as HTMLElement | null;
			if (!card) return;
			const targetId = card.getAttribute("data-faq-id");
			const targetCat = card.getAttribute("data-faq-categorie");
			if (!targetId || targetId === touchDragRef.current.id) return;
			if (targetCat !== touchDragRef.current.categorie) return;
			setFaqs((prev) => {
				const dragIdx = prev.findIndex((f) => f._id === touchDragRef.current!.id);
				const targetIdx = prev.findIndex((f) => f._id === targetId);
				if (dragIdx === -1 || targetIdx === -1) return prev;
				const next = [...prev];
				const [item] = next.splice(dragIdx, 1);
				next.splice(targetIdx, 0, item);
				return next;
			});
		}
		function onTouchEnd() {
			if (!touchDragRef.current) return;
			const categorie = touchDragRef.current.categorie;
			touchDragRef.current = null;
			setDraggedId(null);
			setDragCategorie(null);
			const catFaqs = faqsRef.current.filter((f) => f.categorie === categorie);
			const orderedIds = catFaqs.map((f) => f._id);
			fetch("/api/admin/faq", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds }),
			}).catch(() => {
				// Refresh on error
				fetch("/api/admin/faq").then(r => r.ok ? r.json() : null).then(d => d && setFaqs(d));
			});
		}
		document.addEventListener("touchmove", onTouchMove, { passive: false });
		document.addEventListener("touchend", onTouchEnd);
		return () => {
			document.removeEventListener("touchmove", onTouchMove);
			document.removeEventListener("touchend", onTouchEnd);
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	async function fetchFaqs() {
		try {
			const res = await fetch("/api/admin/faq");
			if (res.ok) {
				const data = await res.json();
				setFaqs(data);
			}
		} catch {
			console.error("Erreur lors du chargement des FAQ");
		} finally {
			setLoading(false);
		}
	}

	// Extraire les catégories existantes pour les suggestions
	const categories = [...new Set(faqs.map((f) => f.categorie))];

	function openCreateForm() {
		setEditingFaq(null);
		setFormData({ question: "", reponse: "", categorie: "", actif: true });
		setError("");
		setShowForm(true);
	}

	function openEditForm(faq: Faq) {
		setEditingFaq(faq);
		setFormData({
			question: faq.question,
			reponse: faq.reponse,
			categorie: faq.categorie,
			actif: faq.actif,
		});
		setError("");
		setShowForm(true);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			const url = editingFaq
				? `/api/admin/faq/${editingFaq._id}`
				: "/api/admin/faq";
			const method = editingFaq ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Erreur lors de l'enregistrement");
				return;
			}

			await fetchFaqs();
			closeForm();
		} catch {
			setError("Erreur de connexion");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(faq: Faq) {
		if (!confirm(`Supprimer la question "${faq.question}" ?`)) return;

		try {
			const res = await fetch(`/api/admin/faq/${faq._id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Erreur lors de la suppression");
				return;
			}

			setFaqs((prev) => prev.filter((f) => f._id !== faq._id));
		} catch {
			alert("Erreur de connexion");
		}
	}

	async function toggleActif(faq: Faq) {
		const newActif = !faq.actif;

		setFaqs((prev) =>
			prev.map((f) => (f._id === faq._id ? { ...f, actif: newActif } : f))
		);

		try {
			const res = await fetch(`/api/admin/faq/${faq._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ actif: newActif }),
			});

			if (!res.ok) {
				setFaqs((prev) =>
					prev.map((f) =>
						f._id === faq._id ? { ...f, actif: faq.actif } : f
					)
				);
			}
		} catch {
			setFaqs((prev) =>
				prev.map((f) =>
					f._id === faq._id ? { ...f, actif: faq.actif } : f
				)
			);
		}
	}

	function handleDragStart(faq: Faq) {
		setDraggedId(faq._id);
		setDragCategorie(faq.categorie);
	}

	function handleDragOver(e: React.DragEvent, targetFaq: Faq) {
		e.preventDefault();
		if (!draggedId || draggedId === targetFaq._id) return;
		// Ne pas permettre le drag entre catégories
		if (dragCategorie !== targetFaq.categorie) return;

		setFaqs((prev) => {
			const newFaqs = [...prev];
			const draggedIndex = newFaqs.findIndex((f) => f._id === draggedId);
			const targetIndex = newFaqs.findIndex((f) => f._id === targetFaq._id);
			if (draggedIndex === -1 || targetIndex === -1) return prev;

			const [draggedItem] = newFaqs.splice(draggedIndex, 1);
			newFaqs.splice(targetIndex, 0, draggedItem);
			return newFaqs;
		});
	}

	async function handleDragEnd() {
		if (!dragCategorie) {
			setDraggedId(null);
			setDragCategorie(null);
			return;
		}

		const catFaqs = faqs.filter((f) => f.categorie === dragCategorie);
		const orderedIds = catFaqs.map((f) => f._id);

		setDraggedId(null);
		setDragCategorie(null);

		try {
			await fetch("/api/admin/faq", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds }),
			});
		} catch {
			console.error("Erreur lors de la sauvegarde de l'ordre");
			fetchFaqs();
		}
	}

	const filteredFaqs = showActivesOnly
		? faqs.filter((f) => f.actif)
		: faqs;

	// Grouper par catégorie
	const grouped: { categorie: string; questions: Faq[] }[] = [];
	for (const faq of filteredFaqs) {
		const existing = grouped.find((g) => g.categorie === faq.categorie);
		if (existing) {
			existing.questions.push(faq);
		} else {
			grouped.push({ categorie: faq.categorie, questions: [faq] });
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
					<h1 className="font-serif text-2xl text-brown">FAQ</h1>
					<p className="text-brown/50 text-sm mt-1">
						{filteredFaqs.length} question{filteredFaqs.length > 1 ? "s" : ""}
						{" · "}
						<span className="text-brown/40">
							{grouped.length} catégorie{grouped.length > 1 ? "s" : ""}
						</span>
						{!showActivesOnly && (
							<>
								{" · "}
								<span className="text-brown/40">
									Glissez pour réorganiser
								</span>
							</>
						)}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={() => setShowActivesOnly((prev) => !prev)}
						className="flex items-center gap-2 px-3 py-2 bg-brown/10 text-brown rounded-xl text-xs hover:bg-brown/20 active:bg-brown/25 transition-colors cursor-pointer"
					>
						<span
							className={`relative w-9 h-5 rounded-full transition-colors ${
								showActivesOnly ? "bg-green-500" : "bg-gray-300"
							}`}
						>
							<span
								className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
									showActivesOnly ? "left-4" : "left-1"
								}`}
							/>
						</span>
						{showActivesOnly ? "Actives" : "Toutes"}
					</button>
					<button
						onClick={openCreateForm}
						className="flex items-center gap-2 px-4 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 transition-colors cursor-pointer"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
							<path
								d="M12 5v14M5 12h14"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
						Nouvelle question
					</button>
				</div>
			</div>

			{grouped.length === 0 ? (
				<div className="bg-beige/70 rounded-2xl p-12 text-center">
					<p className="text-brown/50">
						{showActivesOnly ? "Aucune question active" : "Aucune question"}
					</p>
				</div>
			) : (
				<div className="space-y-6">
					{grouped.map((group) => (
						<div key={group.categorie}>
							<h2 className="font-serif text-lg text-brown mb-3">
								{group.categorie}
								<span className="text-brown/40 text-sm font-sans ml-2">
									({group.questions.length})
								</span>
							</h2>
							<div className="grid gap-3">
								{group.questions.map((faq) => (
									<div
										key={faq._id}
										data-faq-id={faq._id}
										data-faq-categorie={faq.categorie}
										draggable={!showActivesOnly}
										onDragStart={() =>
											!showActivesOnly && handleDragStart(faq)
										}
										onDragOver={(e) =>
											!showActivesOnly && handleDragOver(e, faq)
										}
										onDragEnd={() =>
											!showActivesOnly && handleDragEnd()
										}
										className={`bg-beige/70 border border-brown/20 rounded-2xl p-4 transition-all hover:border-brown/40 hover:shadow-md active:shadow-sm ${
											showActivesOnly ? "cursor-default" : "cursor-move"
										} ${
											draggedId === faq._id ? "opacity-50 scale-[0.98]" : ""
										} ${!faq.actif ? "opacity-60" : ""}`}
									>
										<div className="flex items-start gap-4">
											{/* Drag handle */}
											{!showActivesOnly && (
												<div
													className="text-brown/30 hover:text-brown/60 transition-colors shrink-0 mt-0.5 touch-none cursor-grab"
													onTouchStart={() => {
														touchDragRef.current = { id: faq._id, categorie: faq.categorie };
														setDraggedId(faq._id);
														setDragCategorie(faq.categorie);
													}}
												>
													<svg
														className="w-5 h-5"
														viewBox="0 0 24 24"
														fill="currentColor"
													>
														<circle cx="9" cy="6" r="1.5" />
														<circle cx="15" cy="6" r="1.5" />
														<circle cx="9" cy="12" r="1.5" />
														<circle cx="15" cy="12" r="1.5" />
														<circle cx="9" cy="18" r="1.5" />
														<circle cx="15" cy="18" r="1.5" />
													</svg>
												</div>
											)}
											<div className="flex-1 min-w-0">
												<h3 className="font-medium text-brown text-sm">
													{faq.question}
												</h3>
												<p className="text-sm text-brown/50 mt-1 line-clamp-2">
													{faq.reponse}
												</p>
											</div>

											<button
												onClick={() => toggleActif(faq)}
												className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer shrink-0 ${
													faq.actif
														? "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
														: "bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300"
												}`}
											>
												{faq.actif ? "Actif" : "Inactif"}
											</button>

											<div className="flex items-center gap-1 shrink-0">
												<button
													onClick={() => openEditForm(faq)}
													className="p-2 text-brown/50 hover:text-brown hover:bg-brown/5 active:bg-brown/10 rounded-lg transition-colors cursor-pointer"
													title="Modifier"
												>
													<svg
														className="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
													>
														<path
															d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
															stroke="currentColor"
															strokeWidth="1.5"
															strokeLinecap="round"
														/>
														<path
															d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
															stroke="currentColor"
															strokeWidth="1.5"
															strokeLinecap="round"
															strokeLinejoin="round"
														/>
													</svg>
												</button>
												<button
													onClick={() => handleDelete(faq)}
													className="p-2 text-brown/50 hover:text-red-600 hover:bg-red-50 active:text-red-700 active:bg-red-100 rounded-lg transition-colors cursor-pointer"
													title="Supprimer"
												>
													<svg
														className="w-4 h-4"
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
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Modal de création/édition */}
			{showForm && (
				<div
					className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
					onClick={closeForm}
				>
					<div
						className="bg-beige border border-brown/30 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-lg"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-serif text-xl text-brown">
								{editingFaq ? "Modifier la question" : "Nouvelle question"}
							</h2>
							<button
								onClick={closeForm}
								className="p-1.5 text-brown/40 hover:text-brown hover:bg-brown/5 active:bg-brown/10 rounded-lg transition-colors cursor-pointer"
							>
								<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
									<path
										d="M18 6L6 18M6 6l12 12"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm text-brown/70 mb-1.5">
									Catégorie *
								</label>
								<div className="relative">
									<input
										type="text"
										value={formData.categorie}
										onChange={(e) =>
											setFormData({ ...formData, categorie: e.target.value })
										}
										className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50"
										required
										maxLength={100}
										placeholder="Ex: Rendez-vous, Remboursements..."
										list="categories-list"
									/>
									<datalist id="categories-list">
										{categories.map((cat) => (
											<option key={cat} value={cat} />
										))}
									</datalist>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="text-sm text-brown/70">Question *</label>
									<span className="text-xs text-brown/30">
										{formData.question.length}/300
									</span>
								</div>
								<input
									type="text"
									value={formData.question}
									onChange={(e) =>
										setFormData({ ...formData, question: e.target.value })
									}
									className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50"
									required
									maxLength={300}
									placeholder="La question telle qu'elle sera affichée..."
								/>
							</div>

							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="text-sm text-brown/70">Réponse *</label>
									<span className="text-xs text-brown/30">
										{formData.reponse.length}/2000
									</span>
								</div>
								<textarea
									value={formData.reponse}
									onChange={(e) =>
										setFormData({ ...formData, reponse: e.target.value })
									}
									className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50 resize-none"
									required
									rows={6}
									maxLength={2000}
									placeholder="La réponse détaillée..."
								/>
							</div>

							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() =>
										setFormData({ ...formData, actif: !formData.actif })
									}
									className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
										formData.actif ? "bg-green-500" : "bg-gray-300"
									}`}
								>
									<span
										className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
											formData.actif ? "left-7" : "left-1"
										}`}
									/>
								</button>
								<span className="text-sm text-brown">
									{formData.actif
										? "Visible sur le site"
										: "Masquée du site"}
								</span>
							</div>

							{error && (
								<p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
									{error}
								</p>
							)}

							<div className="flex gap-3 pt-4">
								<button
									type="button"
									onClick={closeForm}
									className="flex-1 px-4 py-2.5 border border-brown/20 text-brown rounded-xl hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
								>
									Annuler
								</button>
								<button
									type="submit"
									disabled={saving}
									className="flex-1 px-4 py-2.5 bg-brown text-beige rounded-xl hover:bg-brown/90 active:bg-brown/80 transition-colors disabled:opacity-50 cursor-pointer"
								>
									{saving
										? "Enregistrement..."
										: editingFaq
											? "Modifier"
											: "Créer"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
