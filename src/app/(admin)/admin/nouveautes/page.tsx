"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface AvantPremiere {
	_id: string;
	titre: string;
	description?: string;
	images: string[];
	dateDebut: string;
	dateFin: string;
	actif: boolean;
	ordre: number;
	createdAt: string;
}

const defaultForm = {
	titre: "",
	description: "",
	images: [] as string[],
	dateDebut: "",
	actif: true,
};

export default function NouveautesAdminPage() {
	const [items, setItems] = useState<AvantPremiere[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<AvantPremiere | null>(null);
	const [formData, setFormData] = useState(defaultForm);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchItems();
	}, []);

	const closeForm = useCallback(() => {
		setShowForm(false);
		setEditing(null);
		setFormData({ ...defaultForm, images: [] });
		setError("");
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape" && showForm) closeForm();
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [showForm, closeForm]);

	async function fetchItems() {
		try {
			const res = await fetch("/api/admin/avant-premieres");
			if (res.ok) {
				const data = await res.json();
				setItems(data);
			}
		} catch {
			console.error("Erreur lors du chargement");
		} finally {
			setLoading(false);
		}
	}

	function openCreate() {
		setEditing(null);
		setFormData({ ...defaultForm, images: [] });
		setError("");
		setShowForm(true);
	}

	function openEdit(item: AvantPremiere) {
		setEditing(item);
		setFormData({
			titre: item.titre,
			description: item.description || "",
			images: [...item.images],
			dateDebut: item.dateDebut.slice(0, 10),
			actif: item.actif,
		});
		setError("");
		setShowForm(true);
	}

	async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files?.length) return;

		const remaining = 5 - formData.images.length;
		if (remaining <= 0) {
			setError("Maximum 5 images");
			return;
		}

		setUploading(true);
		setError("");

		const filesToUpload = Array.from(files).slice(0, remaining);

		for (const file of filesToUpload) {
			try {
				const fd = new FormData();
				fd.append("file", file);
				fd.append("folder", "nouveautes");

				const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
				if (!res.ok) throw new Error("Erreur upload");

				const { path } = await res.json();
				setFormData((prev) => ({ ...prev, images: [...prev.images, path] }));
			} catch {
				setError("Erreur lors de l'upload d'une image");
			}
		}

		setUploading(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	function removeImage(index: number) {
		setFormData((prev) => ({
			...prev,
			images: prev.images.filter((_, i) => i !== index),
		}));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!formData.titre.trim()) {
			setError("Le titre est requis");
			return;
		}
		if (formData.images.length === 0) {
			setError("Au moins une image est requise");
			return;
		}
		if (!formData.dateDebut) {
			setError("La date de début est requise");
			return;
		}

		setSaving(true);
		setError("");

		try {
			const url = editing
				? `/api/admin/avant-premieres/${editing._id}`
				: "/api/admin/avant-premieres";
			const method = editing ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Erreur");
			}

			closeForm();
			fetchItems();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
		} finally {
			setSaving(false);
		}
	}

	async function handleToggleActif(item: AvantPremiere) {
		const prev = items;
		setItems((arr) =>
			arr.map((i) => (i._id === item._id ? { ...i, actif: !i.actif } : i))
		);
		try {
			const res = await fetch(`/api/admin/avant-premieres/${item._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					titre: item.titre,
					description: item.description,
					images: item.images,
					dateDebut: item.dateDebut,
					actif: !item.actif,
				}),
			});
			if (!res.ok) throw new Error();
		} catch {
			setItems(prev);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm("Supprimer cette avant-première ?")) return;
		try {
			const res = await fetch(`/api/admin/avant-premieres/${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				setItems((arr) => arr.filter((i) => i._id !== id));
			}
		} catch {
			console.error("Erreur suppression");
		}
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}

	function getStatut(item: AvantPremiere) {
		if (!item.actif) return { label: "Désactivée", color: "text-brown/40 bg-brown/5" };
		const now = new Date();
		const debut = new Date(item.dateDebut);
		const fin = new Date(item.dateFin);
		if (now < debut) return { label: "Programmée", color: "text-blue-600 bg-blue-50" };
		if (now > fin) return { label: "Terminée", color: "text-brown/40 bg-brown/5" };
		return { label: "En cours", color: "text-green-600 bg-green-50" };
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h1 className="font-serif text-2xl text-brown">Nouveautés & Avant-premières</h1>
					<p className="text-sm text-brown/50 mt-1">
						Gérez les avant-premières affichées sur la page d&apos;accueil
					</p>
				</div>
				<button
					onClick={openCreate}
					className="flex items-center gap-2 px-4 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 transition-colors cursor-pointer self-start sm:self-auto"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
						<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
					Ajouter
				</button>
			</div>

			{loading ? (
				<div className="text-brown/50 text-sm">Chargement...</div>
			) : items.length === 0 ? (
				<div className="rounded-2xl border border-brown/10 bg-beige/70 p-12 text-center">
					<p className="text-brown/50 text-sm mb-4">
						Aucune avant-première. Créez-en une pour remplacer les données de démonstration sur le site.
					</p>
					<button
						onClick={openCreate}
						className="px-4 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 cursor-pointer"
					>
						Créer la première
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{items.map((item) => {
						const statut = getStatut(item);
						return (
							<div
								key={item._id}
								className="rounded-2xl border border-brown/10 bg-beige/70 p-4 flex gap-4 items-start"
							>
								<div className="relative w-32 h-20 rounded-xl overflow-hidden bg-brown/5 shrink-0">
									<Image
										src={item.images[0]}
										alt={item.titre}
										fill
										className="object-cover"
									/>
									{item.images.length > 1 && (
										<span className="absolute bottom-1 right-1 bg-brown/70 text-beige text-[10px] px-1.5 py-0.5 rounded-full">
											{item.images.length}
										</span>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<h3 className="font-medium text-brown truncate max-w-[50vw]">{item.titre}</h3>
										<span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${statut.color}`}>
											{statut.label}
										</span>
									</div>
									{item.description && (
										<p className="text-xs text-brown/50 line-clamp-1 mb-1">
											{item.description}
										</p>
									)}
									<p className="text-xs text-brown/40">
										Depuis le {formatDate(item.dateDebut)} (1 mois)
									</p>
								</div>

								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => handleToggleActif(item)}
										className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
											item.actif ? "bg-green-500" : "bg-brown/20"
										}`}
										title={item.actif ? "Désactiver" : "Activer"}
									>
										<span
											className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
												item.actif ? "left-5" : "left-0.5"
											}`}
										/>
									</button>
									<button
										onClick={() => openEdit(item)}
										className="p-2 text-brown/50 hover:text-brown rounded-lg hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
										title="Modifier"
									>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
											<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
											<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</button>
									<button
										onClick={() => handleDelete(item._id)}
										className="p-2 text-brown/50 hover:text-red-600 rounded-lg hover:bg-red-50 active:text-red-700 active:bg-red-100 transition-colors cursor-pointer"
										title="Supprimer"
									>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
											<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-brown/30 backdrop-blur-sm">
					<div className="bg-beige rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
						<form onSubmit={handleSubmit} className="p-6 space-y-5">
							<div className="flex items-center justify-between">
								<h2 className="font-serif text-lg text-brown">
									{editing ? "Modifier" : "Nouvelle avant-première"}
								</h2>
								<button
									type="button"
									onClick={closeForm}
									className="text-brown/40 hover:text-brown cursor-pointer"
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
										<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
									</svg>
								</button>
							</div>

							{error && (
								<p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
							)}

							<div>
								<label className="block text-xs text-brown/60 mb-1">Titre</label>
								<input
									type="text"
									value={formData.titre}
									onChange={(e) => setFormData((p) => ({ ...p, titre: e.target.value }))}
									maxLength={100}
									className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									placeholder="Ex: Nouvelle Collection Printemps 2026"
									required
								/>
							</div>

							<div>
								<label className="block text-xs text-brown/60 mb-1">Description (optionnelle)</label>
								<textarea
									value={formData.description}
									onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
									maxLength={300}
									rows={3}
									className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none resize-none"
									placeholder="Courte description..."
								/>
							</div>

							<div>
								<label className="block text-xs text-brown/60 mb-2">
									Images ({formData.images.length}/5)
								</label>
								<div className="flex flex-wrap gap-2 mb-2">
									{formData.images.map((img, i) => (
										<div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
											<Image src={img} alt="" fill className="object-cover" />
											<button
												type="button"
												onClick={() => removeImage(i)}
												className="absolute inset-0 bg-brown/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
											>
												<svg className="w-5 h-5 text-beige" viewBox="0 0 24 24" fill="none">
													<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
												</svg>
											</button>
										</div>
									))}
									{formData.images.length < 5 && (
										<button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											disabled={uploading}
											className="w-20 h-20 rounded-lg border-2 border-dashed border-brown/20 flex items-center justify-center text-brown/30 hover:text-brown/50 hover:border-brown/40 transition-colors cursor-pointer"
										>
											{uploading ? (
												<span className="text-xs animate-pulse">...</span>
											) : (
												<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
													<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
												</svg>
											)}
										</button>
									)}
								</div>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									multiple
									onChange={handleUpload}
									className="hidden"
								/>
							</div>

							<div>
								<label className="block text-xs text-brown/60 mb-1">Date de début</label>
								<input
									type="date"
									value={formData.dateDebut}
									onChange={(e) => setFormData((p) => ({ ...p, dateDebut: e.target.value }))}
									className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
									required
								/>
								<p className="text-[10px] text-brown/40 mt-1">Durée automatique : 1 mois</p>
							</div>

							<label className="flex items-center gap-3 cursor-pointer">
								<input
									type="checkbox"
									checked={formData.actif}
									onChange={(e) => setFormData((p) => ({ ...p, actif: e.target.checked }))}
									className="h-4 w-4 rounded border-brown/30 text-brown cursor-pointer"
								/>
								<span className="text-sm text-brown">Active</span>
							</label>

							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={closeForm}
									className="px-4 py-2 text-sm text-brown/60 hover:text-brown transition-colors cursor-pointer"
								>
									Annuler
								</button>
								<button
									type="submit"
									disabled={saving}
									className="px-6 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 transition-colors disabled:opacity-50 cursor-pointer"
								>
									{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
