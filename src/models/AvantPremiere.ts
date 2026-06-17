import mongoose, { Schema, Model } from "mongoose";
import type { AvantPremiere } from "@/types";

const AvantPremiereSchema = new Schema<AvantPremiere>(
  {
    titre: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 300 },
    image: { type: String, required: true },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AvantPremiereModel: Model<AvantPremiere> =
  mongoose.models.AvantPremiere || mongoose.model<AvantPremiere>("AvantPremiere", AvantPremiereSchema);

export default AvantPremiereModel;
