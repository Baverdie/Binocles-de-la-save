import mongoose, { Schema, Model } from "mongoose";
import type { Vacances } from "@/types";

const VacancesSchema = new Schema<Vacances>(
  {
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    message: { type: String },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index pour recherche des périodes actives
VacancesSchema.index({ dateDebut: 1, dateFin: 1 });

if (mongoose.models.Vacances) {
  delete mongoose.models.Vacances;
}

const VacancesModel: Model<Vacances> = mongoose.model<Vacances>("Vacances", VacancesSchema);

export default VacancesModel;
