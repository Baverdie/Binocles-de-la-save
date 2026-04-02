import mongoose, { Schema, Model } from "mongoose";
import type { Marque } from "@/types";

const MarqueSchema = new Schema<Marque>(
  {
    nom: { type: String, required: true, maxlength: 100 },
    logo: { type: String, required: true },
    origine: { type: String, maxlength: 50 },
    resume: { type: String, maxlength: 200 },
    descriptionLongue: { type: String, maxlength: 1000 },
    tags: [{ type: String }],
    images: [{ type: String }],
    lienSite: { type: String },
    ordre: { type: Number, default: 0 },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MarqueModel: Model<Marque> =
  mongoose.models.Marque || mongoose.model<Marque>("Marque", MarqueSchema);

export default MarqueModel;
