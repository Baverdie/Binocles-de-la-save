import mongoose, { Schema, Model } from "mongoose";
import type { Vitrine } from "@/types";

const VitrineSchema = new Schema<Vitrine>(
  {
    titre: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    image: { type: String, required: true },
    date: { type: Date, required: true },
    actif: { type: Boolean, default: true },
    ordre: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const VitrineModel: Model<Vitrine> =
  mongoose.models.Vitrine || mongoose.model<Vitrine>("Vitrine", VitrineSchema);

export default VitrineModel;
