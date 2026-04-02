import mongoose, { Schema, Model } from "mongoose";
import type { Rdv } from "@/types";

const RdvSchema = new Schema<Rdv>(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true },
    message: { type: String, maxlength: 500 },
    typeRdv: {
      type: String,
      required: true,
      enum: ["examen", "vente", "reparation"]
    },
    dateRdv: { type: Date, required: true },
    heureDebut: { type: String, required: true },
    heureFin: { type: String, required: true },
    duree: { type: Number, required: true },
    statut: {
      type: String,
      default: "confirme",
      enum: ["confirme", "annule", "effectue", "reporte"]
    },
    raisonAnnulation: { type: String },
    notes: { type: String },
    cancelToken: { type: String, index: true, sparse: true },
    googleEventId: { type: String },
    rappelEnvoye: { type: Boolean, default: false },
    effectueAt: { type: Date },
    annuleAt: { type: Date },
  },
  { timestamps: true }
);

RdvSchema.index({ dateRdv: 1, statut: 1 });
RdvSchema.index({ email: 1 });

const RdvModel: Model<Rdv> =
  mongoose.models.Rdv || mongoose.model<Rdv>("Rdv", RdvSchema);

export default RdvModel;
