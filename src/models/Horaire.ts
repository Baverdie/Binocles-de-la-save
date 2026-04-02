import mongoose, { Schema, Model } from "mongoose";
import type { Horaire, PlageHoraire } from "@/types";

const PlageHoraireSchema = new Schema<PlageHoraire>(
  {
    debut: { type: String, required: true },
    fin: { type: String, required: true },
  },
  { _id: false }
);

const HoraireSchema = new Schema<Horaire>(
  {
    jour: { type: Number, required: true, min: 0, max: 6, unique: true },
    ouvert: { type: Boolean, default: true },
    matin: PlageHoraireSchema,
    aprem: PlageHoraireSchema,
  },
  { timestamps: true }
);

const HoraireModel: Model<Horaire> =
  mongoose.models.Horaire || mongoose.model<Horaire>("Horaire", HoraireSchema);

export default HoraireModel;
