import mongoose, { Schema, Model } from "mongoose";
import type { Contact } from "@/types";

const ContactSchema = new Schema<Contact>(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true },
    message: { type: String, required: true, maxlength: 1000 },
    type: { type: String, enum: ["question", "lentilles"], default: "question" },
    traite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ContactModel: Model<Contact> =
  mongoose.models.Contact || mongoose.model<Contact>("Contact", ContactSchema);

export default ContactModel;
