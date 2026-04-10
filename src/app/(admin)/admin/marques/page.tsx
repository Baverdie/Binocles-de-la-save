"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface Marque {
  _id: string;
  nom: string;
  logo: string;
  origine?: string;
  resume?: string;
  descriptionLongue?: string;
  tags?: string[];
  images?: string[];
  lienSite?: string;
  ordre: number;
  actif: boolean;
  createdAt: string;
}

export default function MarquesPage() {
  const [marques, setMarques] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivesOnly, setShowActivesOnly] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMarque, setEditingMarque] = useState<Marque | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    logo: "",
    origine: "",
    resume: "",
    descriptionLongue: "",
    tags: [] as string[],
    images: [] as string[],
    lienSite: "",
    actif: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    fetchMarques();
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingMarque(null);
    setFormData({
      nom: "",
      logo: "",
      origine: "",
      resume: "",
      descriptionLongue: "",
      tags: [],
      images: [],
      lienSite: "",
      actif: true,
    });
    setTagInput("");
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

  async function fetchMarques() {
    try {
      const res = await fetch("/api/admin/marques");
      if (res.ok) {
        const data = await res.json();
        setMarques(data);
      }
    } catch {
      console.error("Erreur lors du chargement des marques");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingMarque(null);
    setFormData({
      nom: "",
      logo: "",
      origine: "",
      resume: "",
      descriptionLongue: "",
      tags: [],
      images: [],
      lienSite: "",
      actif: true,
    });
    setTagInput("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(marque: Marque) {
    setEditingMarque(marque);
    setFormData({
      nom: marque.nom,
      logo: marque.logo,
      origine: marque.origine || "",
      resume: marque.resume || "",
      descriptionLongue: marque.descriptionLongue || "",
      tags: marque.tags || [],
      images: marque.images || [],
      lienSite: marque.lienSite || "",
      actif: marque.actif,
    });
    setTagInput("");
    setError("");
    setShowForm(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "marques");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      setFormData((prev) => ({ ...prev, logo: data.path }));
    } catch {
      setError("Erreur de connexion");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "marques/gallery");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, data.path],
      }));
    } catch {
      setError("Erreur de connexion");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  }

  function removeTag(index: number) {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingMarque
        ? `/api/admin/marques/${editingMarque._id}`
        : "/api/admin/marques";
      const method = editingMarque ? "PUT" : "POST";

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

      await fetchMarques();
      closeForm();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(marque: Marque) {
    if (!confirm(`Supprimer la marque "${marque.nom}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/marques/${marque._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }

      setMarques((prev) => prev.filter((m) => m._id !== marque._id));
    } catch {
      alert("Erreur de connexion");
    }
  }

  async function toggleActif(marque: Marque) {
    const newActif = !marque.actif;

    setMarques((prev) =>
      prev.map((m) => (m._id === marque._id ? { ...m, actif: newActif } : m))
    );

    try {
      const res = await fetch(`/api/admin/marques/${marque._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: newActif }),
      });

      if (!res.ok) {
        setMarques((prev) =>
          prev.map((m) =>
            m._id === marque._id ? { ...m, actif: marque.actif } : m
          )
        );
      }
    } catch {
      setMarques((prev) =>
        prev.map((m) =>
          m._id === marque._id ? { ...m, actif: marque.actif } : m
        )
      );
    }
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMarques = [...marques];
    const [draggedItem] = newMarques.splice(draggedIndex, 1);
    newMarques.splice(index, 0, draggedItem);
    setMarques(newMarques);
    setDraggedIndex(index);
  }

  async function handleDragEnd() {
    setDraggedIndex(null);

    try {
      await fetch("/api/admin/marques", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: marques.map((m) => m._id) }),
      });
    } catch {
      console.error("Erreur lors de la sauvegarde de l'ordre");
      fetchMarques();
    }
  }

  const filteredMarques = showActivesOnly
    ? marques.filter((marque) => marque.actif)
    : marques;

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
          <h1 className="font-serif text-2xl text-brown">Marques</h1>
          <p className="text-brown/50 text-sm mt-1">
            {filteredMarques.length} marque
            {filteredMarques.length > 1 ? "s" : ""}
            {showActivesOnly && (
              <>
                {" "}
                ·{" "}
                <span className="text-brown/40">Actives uniquement</span>
              </>
            )}
            {!showActivesOnly && (
              <>
                {" "}
                ·{" "}
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
            Nouvelle marque
          </button>
        </div>
      </div>

      {filteredMarques.length === 0 ? (
        <div className="bg-beige/70 rounded-2xl p-12 text-center">
          <p className="text-brown/50">
            {showActivesOnly ? "Aucune marque active" : "Aucune marque"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMarques.map((marque, index) => (
            <div
              key={marque._id}
              draggable={!showActivesOnly}
              onDragStart={() =>
                !showActivesOnly && handleDragStart(index)
              }
              onDragOver={(e) =>
                !showActivesOnly && handleDragOver(e, index)
              }
              onDragEnd={() => !showActivesOnly && handleDragEnd()}
              className={`bg-beige/70 border border-brown/20 rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-brown/40 hover:shadow-md active:shadow-sm ${
                showActivesOnly ? "cursor-default" : "cursor-move"
              } ${
                draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
              } ${!marque.actif ? "opacity-60" : ""}`}
            >
              {!showActivesOnly && (
                <div className="text-brown/30 hover:text-brown/60 transition-colors shrink-0">
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

              <div className="w-16 h-16 rounded-xl bg-beige/50 flex items-center justify-center overflow-hidden p-2 shrink-0">
                {marque.logo ? (
                  <Image
                    src={marque.logo}
                    alt={marque.nom}
                    width={64}
                    height={64}
                    className="object-contain"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(16%) sepia(27%) saturate(642%) hue-rotate(347deg) brightness(92%) contrast(92%)",
                    }}
                  />
                ) : (
                  <span className="text-brown/30 text-xs">Pas de logo</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-brown">{marque.nom}</h3>
                  {marque.origine && (
                    <span className="text-xs text-brown/40">
                      ({marque.origine})
                    </span>
                  )}
                </div>
                {marque.resume && (
                  <p className="text-sm text-brown/50 truncate max-w-[50vw]">
                    {marque.resume}
                  </p>
                )}
                {marque.tags && marque.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {marque.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-[10px] bg-brown/5 text-brown/60 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {marque.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-brown/40">
                        +{marque.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {marque.images && marque.images.length > 0 && (
                <span className="text-xs text-brown/40 shrink-0">
                  {marque.images.length} photo
                  {marque.images.length > 1 ? "s" : ""}
                </span>
              )}

              <button
                onClick={() => toggleActif(marque)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer shrink-0 ${
                  marque.actif
                    ? "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                {marque.actif ? "Actif" : "Inactif"}
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditForm(marque)}
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
                  onClick={() => handleDelete(marque)}
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
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={(e) => { mouseDownTargetRef.current = e.target; }}
          onClick={(e) => { if (mouseDownTargetRef.current === e.currentTarget) closeForm(); }}
        >
          <div
            className="bg-beige border border-brown/30 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-brown">
                {editingMarque
                  ? "Modifier la marque"
                  : "Nouvelle marque"}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 text-brown/40 hover:text-brown hover:bg-brown/5 active:bg-brown/10 rounded-lg transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                  Logo *
                </label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-brown/20 flex items-center justify-center cursor-pointer hover:border-brown/40 transition-colors overflow-hidden"
                  >
                    {formData.logo ? (
                      <Image
                        src={formData.logo}
                        alt="Logo"
                        width={96}
                        height={96}
                        className="object-contain"
                        style={{
                          filter:
                            "brightness(0) saturate(100%) invert(16%) sepia(27%) saturate(642%) hue-rotate(347deg) brightness(92%) contrast(92%)",
                        }}
                      />
                    ) : uploading ? (
                      <div className="w-6 h-6 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-8 h-8 text-brown/30"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 5v14M5 12h14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="text-sm text-brown/50">
                    <p>Cliquez pour uploader</p>
                    <p className="text-xs">
                      JPG, PNG, SVG ou WebP (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-brown/70 mb-1.5">
                    Nom de la marque *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm text-brown/70 mb-1.5">
                    Origine{" "}
                    <span className="text-brown/40">(ex: France)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.origine}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        origine: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50"
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-brown/70">
                    Résumé court{" "}
                    <span className="text-brown/40">
                      (affiché au survol)
                    </span>
                  </label>
                  <span className="text-xs text-brown/30">
                    {formData.resume.length}/200
                  </span>
                </div>
                <textarea
                  value={formData.resume}
                  onChange={(e) =>
                    setFormData({ ...formData, resume: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50 resize-none"
                  rows={2}
                  maxLength={200}
                  placeholder="Description courte de la marque..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-brown/70">
                    Description longue{" "}
                    <span className="text-brown/40">(page détail)</span>
                  </label>
                  <span className="text-xs text-brown/30">
                    {formData.descriptionLongue.length}/1000
                  </span>
                </div>
                <textarea
                  value={formData.descriptionLongue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descriptionLongue: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50 resize-none"
                  rows={4}
                  maxLength={1000}
                  placeholder="Description détaillée de l'histoire et du savoir-faire de la marque..."
                />
              </div>

              <div>
                <label className="block text-sm text-brown/70 mb-1.5">
                  Tags{" "}
                  <span className="text-brown/40">
                    (ex: Made in France, Titane)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-brown/10 text-brown text-sm rounded-lg"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-brown/50 hover:text-brown cursor-pointer"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50 text-sm"
                    placeholder="Ajouter un tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-brown/10 text-brown rounded-xl hover:bg-brown/20 active:bg-brown/25 transition-colors cursor-pointer text-sm"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-brown/70 mb-1.5">
                  Images de la collection{" "}
                  <span className="text-brown/40">
                    ({formData.images.length}/5)
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {formData.images.map((img, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden bg-beige/50 group"
                    >
                      <Image
                        src={img}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-brown/20 flex items-center justify-center cursor-pointer hover:border-brown/40 transition-colors"
                    >
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
                      ) : (
                        <svg
                          className="w-6 h-6 text-brown/30"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm text-brown/70 mb-1.5">
                  Lien vers le site{" "}
                  <span className="text-brown/40">(optionnel)</span>
                </label>
                <input
                  type="url"
                  value={formData.lienSite}
                  onChange={(e) =>
                    setFormData({ ...formData, lienSite: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-brown/20 focus:border-brown focus:ring-1 focus:ring-brown/30 outline-none text-brown bg-white/50"
                  placeholder="https://..."
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
                    : "Masqué du site"}
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
                  disabled={saving || !formData.logo}
                  className="flex-1 px-4 py-2.5 bg-brown text-beige rounded-xl hover:bg-brown/90 active:bg-brown/80 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving
                    ? "Enregistrement..."
                    : editingMarque
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
