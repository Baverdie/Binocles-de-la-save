"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface Vitrine {
  _id: string;
  titre: string;
  description?: string;
  image: string;
  date: string;
  actif: boolean;
}

const defaultForm = {
  titre: "",
  description: "",
  image: "",
  date: "",
  actif: true,
};

export default function VitrinésAdminPage() {
  const [items, setItems] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vitrine | null>(null);
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
    setFormData({ ...defaultForm });
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
      const res = await fetch("/api/admin/vitrines");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      console.error("Erreur chargement vitrines");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormData({ ...defaultForm });
    setError("");
    setShowForm(true);
  }

  function openEdit(item: Vitrine) {
    setEditing(item);
    setFormData({
      titre: item.titre,
      description: item.description || "",
      image: item.image,
      date: item.date.slice(0, 10),
      actif: item.actif,
    });
    setError("");
    setShowForm(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "vitrines");

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Erreur upload");

      const { path } = await res.json();
      setFormData((prev) => ({ ...prev, image: path }));
    } catch {
      setError("Erreur lors de l'upload de l'image");
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.titre.trim()) { setError("Le titre est requis"); return; }
    if (!formData.image) { setError("Une image est requise"); return; }
    if (!formData.date) { setError("La date est requise"); return; }

    setSaving(true);
    setError("");

    try {
      const url = editing ? `/api/admin/vitrines/${editing._id}` : "/api/admin/vitrines";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: formData.titre,
          description: formData.description,
          image: formData.image,
          date: formData.date,
          actif: formData.actif,
        }),
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

  async function handleToggleActif(item: Vitrine) {
    const prev = items;
    setItems((arr) => arr.map((i) => (i._id === item._id ? { ...i, actif: !i.actif } : i)));
    try {
      const res = await fetch(`/api/admin/vitrines/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, actif: !item.actif }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette vitrine ?")) return;
    try {
      const res = await fetch(`/api/admin/vitrines/${id}`, { method: "DELETE" });
      if (res.ok) setItems((arr) => arr.filter((i) => i._id !== id));
    } catch {
      console.error("Erreur suppression");
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-brown">Vitrines</h1>
          <p className="text-sm text-brown/50 mt-1">
            Gérez l&apos;historique des vitrines affiché sur le site
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
          <p className="text-brown/50 text-sm mb-4">Aucune vitrine. Ajoutez-en une pour alimenter la page publique.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 cursor-pointer">
            Créer la première
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-brown/10 bg-beige/70 p-4 flex gap-4 items-start">
              <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-brown/5 shrink-0">
                {item.image && (
                  <Image src={item.image} alt={item.titre} fill className="object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-brown truncate">{item.titre}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${item.actif ? "text-green-600 bg-green-50" : "text-brown/40 bg-brown/5"}`}>
                    {item.actif ? "Visible" : "Masquée"}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-brown/50 line-clamp-1 mb-1">{item.description}</p>
                )}
                <p className="text-xs text-brown/40">{formatDate(item.date)}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActif(item)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${item.actif ? "bg-green-500" : "bg-brown/20"}`}
                  title={item.actif ? "Masquer" : "Afficher"}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.actif ? "left-5" : "left-0.5"}`} />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 text-brown/50 hover:text-brown rounded-lg hover:bg-brown/5 transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 text-brown/50 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown/30 backdrop-blur-sm">
          <div className="bg-beige rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg text-brown">
                  {editing ? "Modifier la vitrine" : "Nouvelle vitrine"}
                </h2>
                <button type="button" onClick={closeForm} className="text-brown/40 hover:text-brown cursor-pointer">
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
                  placeholder="Ex: Vitrine Printemps 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-brown/60 mb-1">Description (optionnelle)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none resize-none"
                  placeholder="Décrivez cette vitrine..."
                />
              </div>

              <div>
                <label className="block text-xs text-brown/60 mb-2">Photo</label>
                {formData.image && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden mb-2">
                    <Image src={formData.image} alt="" fill className="object-cover" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-2.5 rounded-xl border border-brown/20 text-xs text-brown/50 hover:text-brown hover:border-brown/40 transition-colors cursor-pointer"
                >
                  {uploading ? "Upload en cours..." : formData.image ? "Changer la photo" : "Choisir une photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs text-brown/60 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-brown/20 text-sm text-brown bg-white/50 focus:ring-1 focus:ring-brown/30 focus:outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) => setFormData((p) => ({ ...p, actif: e.target.checked }))}
                  className="h-4 w-4 rounded border-brown/30 text-brown cursor-pointer"
                />
                <span className="text-sm text-brown">Visible sur le site</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm text-brown/60 hover:text-brown transition-colors cursor-pointer">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 transition-colors disabled:opacity-50 cursor-pointer"
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
