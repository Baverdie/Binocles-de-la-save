import mongoose, { Schema, Model } from "mongoose";
import type { FermetureExceptionnelle } from "@/types";

const FermetureSchema = new Schema<FermetureExceptionnelle>(
  {
    date: { type: Date, required: true },
    journeeComplete: { type: Boolean, default: true },
    heureDebut: { type: String },
    heureFin: { type: String },
    raison: { type: String },
  },
  { timestamps: true, collection: "fermeture" }
);

FermetureSchema.index({ date: 1 });

if (mongoose.models.FermetureExceptionnelle) {
  delete mongoose.models.FermetureExceptionnelle;
}

const FermetureModel: Model<FermetureExceptionnelle> = mongoose.model<FermetureExceptionnelle>(
  "FermetureExceptionnelle",
  FermetureSchema
);

export default FermetureModel;
