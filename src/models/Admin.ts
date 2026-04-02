import mongoose, { Schema, Model } from "mongoose";
import type { Admin } from "@/types";

const AdminSchema = new Schema<Admin>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    googleRefreshToken: { type: String },
    googleCalendarId: { type: String },
  },
  { timestamps: true }
);

const AdminModel: Model<Admin> =
  mongoose.models.Admin || mongoose.model<Admin>("Admin", AdminSchema);

export default AdminModel;
