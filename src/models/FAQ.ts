import mongoose, { Schema, Model } from "mongoose";
import type { Faq } from "@/types";

const FAQSchema = new Schema<Faq>(
  {
    question: { type: String, required: true, maxlength: 300 },
    reponse: { type: String, required: true, maxlength: 2000 },
    categorie: { type: String, required: true, maxlength: 100 },
    ordre: { type: Number, default: 0 },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FAQSchema.index({ categorie: 1, ordre: 1 });

const FAQModel: Model<Faq> =
  mongoose.models.FAQ || mongoose.model<Faq>("FAQ", FAQSchema);

export default FAQModel;
