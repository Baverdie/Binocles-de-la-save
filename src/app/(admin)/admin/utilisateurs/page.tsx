"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface Admin {
	_id: string;
	email: string;
	name: string;
	googleRefreshToken?: string;
	googleCalendarId?: string;
	createdAt: string;
}

const CALENDAR_MESSAGES: Record<string, { text: string; type: "success" | "error" }> = {
	success: { text: "Google Calendar connecté avec succès", type: "success" },
	denied: { text: "Connexion Google Calendar refusée", type: "error" },
	error: { text: "Erreur lors de la connexion Google Calendar", type: "error" },
	invalid_state: { text: "Session expirée, veuillez réessayer", type: "error" },
};

export default function UtilisateursPage() {
	const { data: session } = useSession();
	const searchParams = useSearchParams();
	const [admins, setAdmins] = useState<Admin[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
	const [formData, setFormData] = useState({
		email: "",
		name: "",
		password: "",
	});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
	const [disconnecting, setDisconnecting] = useState(false);

	useEffect(() => {
		fetchAdmins();
	}, []);

	useEffect(() => {
		const calendarStatus = searchParams.get("calendar");
		if (calendarStatus && CALENDAR_MESSAGES[calendarStatus]) {
			setToast(CALENDAR_MESSAGES[calendarStatus]);
			window.history.replaceState({}, "", "/admin/utilisateurs");
			const timer = setTimeout(() => setToast(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [searchParams]);

	async function fetchAdmins() {
		try {
			const res = await fetch("/api/admin/utilisateurs");
			if (res.ok) {
				const data = await res.json();
				setAdmins(data);
			}
		} catch {
			console.error("Erreur lors du chargement des admins");
		} finally {
			setLoading(false);
		}
	}

	const connectedAdmin = admins.find(
		(a) => a.googleRefreshToken && a.googleCalendarId
	);

	async function handleDisconnect() {
		if (!connectedAdmin) return;
		if (!confirm("Déconnecter Google Calendar ?\nLes prochains RDV ne seront plus synchronisés.")) return;

		setDisconnecting(true);
		try {
			const res = await fetch(
				`/api/admin/utilisateurs/${connectedAdmin._id}/google-disconnect`,
				{ method: "PATCH" }
			);
			if (res.ok) {
				await fetchAdmins();
				setToast({ text: "Google Calendar déconnecté", type: "success" });
				setTimeout(() => setToast(null), 5000);
			}
		} catch {
			setToast({ text: "Erreur lors de la déconnexion", type: "error" });
			setTimeout(() => setToast(null), 5000);
		} finally {
			setDisconnecting(false);
		}
	}

	function openCreateForm() {
		setEditingAdmin(null);
		setFormData({ email: "", name: "", password: "" });
		setError("");
		setShowForm(true);
	}

	function openEditForm(admin: Admin) {
		setEditingAdmin(admin);
		setFormData({ email: admin.email, name: admin.name, password: "" });
		setError("");
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingAdmin(null);
		setFormData({ email: "", name: "", password: "" });
		setError("");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			const url = editingAdmin
				? `/api/admin/utilisateurs/${editingAdmin._id}`
				: "/api/admin/utilisateurs";
			const method = editingAdmin ? "PUT" : "POST";

			const body: Record<string, string> = {
				email: formData.email,
				name: formData.name,
			};
			if (formData.password) {
				body.password = formData.password;
			}

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Erreur lors de l'enregistrement");
				return;
			}

			await fetchAdmins();
			closeForm();
		} catch {
			setError("Erreur de connexion");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(admin: Admin) {
		if (admin.email === session?.user?.email) {
			alert("Vous ne pouvez pas supprimer votre propre compte");
			return;
		}

		if (!confirm(`Supprimer l'administrateur "${admin.name}" ?`)) {
			return;
		}

		try {
			const res = await fetch(`/api/admin/utilisateurs/${admin._id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Erreur lors de la suppression");
				return;
			}

			await fetchAdmins();
		} catch {
			alert("Erreur de connexion");
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
			{toast && (
				<div
					className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
						toast.type === "success"
							? "bg-green-50 text-green-700 border border-green-200"
							: "bg-red-50 text-red-700 border border-red-200"
					}`}
				>
					<svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
						{toast.type === "success" ? (
							<path
								d="M20 6L9 17l-5-5"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						) : (
							<path
								d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						)}
					</svg>
					{toast.text}
					<button
						onClick={() => setToast(null)}
						className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
							<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
						</svg>
					</button>
				</div>
			)}

			<div className="rounded-2xl border border-brown/10 bg-beige/70 p-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-4">
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
								connectedAdmin
									? "bg-green-100 text-green-600"
									: "bg-brown/10 text-brown/40"
							}`}
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
								<rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
								<path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
							</svg>
						</div>
						<div>
							<h3 className="text-sm font-medium text-brown">Google Calendar</h3>
							{connectedAdmin ? (
								<p className="text-xs text-green-600 mt-0.5">
									Connecté — {connectedAdmin.name}
								</p>
							) : (
								<p className="text-xs text-brown/40 mt-0.5">
									Non configuré — les RDV ne sont pas synchronisés
								</p>
							)}
						</div>
					</div>

					{connectedAdmin ? (
						<button
							onClick={handleDisconnect}
							disabled={disconnecting}
							className="px-3 py-1.5 rounded-lg text-xs border border-brown/15 text-brown/50 hover:text-red-600 hover:border-red-200 hover:bg-red-50 active:text-red-700 active:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
						>
							{disconnecting ? "Déconnexion..." : "Déconnecter"}
						</button>
					) : (
						<a
							href="/api/auth/google"
							className="inline-flex items-center gap-2 px-4 py-2 bg-brown text-beige rounded-xl text-xs hover:bg-brown/90 active:bg-brown/80 transition-colors self-start sm:self-auto"
						>
							<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
								<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
							Connecter Google Calendar
						</a>
					)}
				</div>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h1 className="font-serif text-2xl text-brown">Administrateurs</h1>
					<p className="text-brown/50 text-sm mt-1">
						{admins.length} compte{admins.length > 1 ? "s" : ""} administrateur
						{admins.length > 1 ? "s" : ""}
					</p>
				</div>
				<button
					onClick={openCreateForm}
					className="flex items-center gap-2 px-4 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 transition-colors cursor-pointer self-start sm:self-auto"
				>
					<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
						<path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
					</svg>
					Nouvel admin
				</button>
			</div>

			<div className="hidden lg:block bg-beige border border-brown/10 rounded-2xl overflow-hidden">
				<table className="w-full">
					<thead>
						<tr className="border-b border-brown/10">
							<th className="text-left text-xs font-medium text-brown/50 px-6 py-4">Nom</th>
							<th className="text-left text-xs font-medium text-brown/50 px-6 py-4">Email</th>
							<th className="text-left text-xs font-medium text-brown/50 px-6 py-4">Créé le</th>
							<th className="text-right text-xs font-medium text-brown/50 px-6 py-4">Actions</th>
						</tr>
					</thead>
					<tbody>
						{admins.map((admin) => (
							<tr
								key={admin._id}
								className="border-b border-brown/5 last:border-0 hover:bg-beige/30 transition-colors"
							>
								<td className="px-6 py-4">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-brown/10 flex items-center justify-center text-sm font-medium text-brown">
											{admin.name.charAt(0).toUpperCase()}
										</div>
										<span className="text-sm text-brown">{admin.name}</span>
										{admin.email === session?.user?.email && (
											<span className="px-2 py-0.5 bg-brown/10 text-brown/60 text-xs rounded-full">
												Vous
											</span>
										)}
									</div>
								</td>
								<td className="px-6 py-4">
									<span className="text-sm text-brown/70">{admin.email}</span>
								</td>
								<td className="px-6 py-4">
									<span className="text-sm text-brown/50">
										{new Date(admin.createdAt).toLocaleDateString("fr-FR", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</span>
								</td>
								<td className="px-6 py-4">
									<div className="flex items-center justify-end gap-2">
										<button
											onClick={() => openEditForm(admin)}
											className="p-2 text-brown/50 hover:text-brown hover:bg-brown/5 active:bg-brown/10 rounded-lg transition-colors cursor-pointer"
											title="Modifier"
										>
											<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
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
											onClick={() => handleDelete(admin)}
											className="p-2 text-brown/50 hover:text-red-600 hover:bg-red-50 active:text-red-700 active:bg-red-100 rounded-lg transition-colors cursor-pointer"
											title="Supprimer"
											disabled={admin.email === session?.user?.email}
										>
											<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
												<path
													d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeLinecap="round"
												/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="lg:hidden space-y-3">
				{admins.map((admin) => (
					<div
						key={admin._id}
						className="rounded-2xl border border-brown/10 bg-beige/70 p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-8 h-8 rounded-full bg-brown/10 flex items-center justify-center text-sm font-medium text-brown shrink-0">
									{admin.name.charAt(0).toUpperCase()}
								</div>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-sm text-brown font-medium truncate">{admin.name}</span>
										{admin.email === session?.user?.email && (
											<span className="px-2 py-0.5 bg-brown/10 text-brown/60 text-xs rounded-full shrink-0">
												Vous
											</span>
										)}
									</div>
									<p className="text-xs text-brown/50 truncate">{admin.email}</p>
									<p className="text-xs text-brown/40 mt-0.5">
										{new Date(admin.createdAt).toLocaleDateString("fr-FR", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1 shrink-0">
								<button
									onClick={() => openEditForm(admin)}
									className="p-2 text-brown/50 hover:text-brown hover:bg-brown/5 active:bg-brown/10 rounded-lg transition-colors cursor-pointer"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
										<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
										<path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</button>
								<button
									onClick={() => handleDelete(admin)}
									className="p-2 text-brown/50 hover:text-red-600 hover:bg-red-50 active:text-red-700 active:bg-red-100 rounded-lg transition-colors cursor-pointer"
									disabled={admin.email === session?.user?.email}
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
										<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{showForm && (
				<div
					className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
					onClick={closeForm}
				>
					<div
						className="bg-beige border border-brown/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg"
						onClick={(e) => e.stopPropagation()}
					>
						<h2 className="font-serif text-xl text-brown mb-6">
							{editingAdmin ? "Modifier l'administrateur" : "Nouvel administrateur"}
						</h2>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm text-brown/70 mb-1.5">Nom</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full px-4 py-2.5 rounded-xl border border-brown/30 focus:border-brown focus:ring-2 focus:ring-brown/30 outline-none text-brown bg-white/50"
									required
								/>
							</div>

							<div>
								<label className="block text-sm text-brown/70 mb-1.5">Email</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className="w-full px-4 py-2.5 rounded-xl border border-brown/30 focus:border-brown focus:ring-2 focus:ring-brown/30 outline-none text-brown bg-white/50"
									required
								/>
							</div>

							<div>
								<label className="block text-sm text-brown/70 mb-1.5">
									Mot de passe{" "}
									{editingAdmin && (
										<span className="text-brown/40">(laisser vide pour conserver)</span>
									)}
								</label>
								<input
									type="password"
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className="w-full px-4 py-2.5 rounded-xl border border-brown/30 focus:border-brown focus:ring-2 focus:ring-brown/30 outline-none text-brown bg-white/50"
									required={!editingAdmin}
									minLength={8}
								/>
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
									{saving ? "Enregistrement..." : editingAdmin ? "Modifier" : "Créer"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
