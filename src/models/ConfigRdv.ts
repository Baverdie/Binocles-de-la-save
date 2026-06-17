import mongoose, { Schema, Model } from "mongoose";
import type { ConfigRdv, PlageBloquee } from "@/types";

const PlageBloqueeSchema = new Schema<PlageBloquee>(
	{
		recurrente: { type: Boolean, default: true },
		jour: { type: Number, min: 0, max: 6 },
		dateDebut: { type: String },
		dateFin: { type: String },
		debut: { type: String, required: true },
		fin: { type: String, required: true },
		typesRdv: [{ type: String, enum: ["examen", "vente", "reparation", "livraison"] }],
		raison: String,
	},
	{ _id: false }
);

const ConfigRdvSchema = new Schema<ConfigRdv>(
	{
		durees: {
			examen: { type: Number, default: 60 },
			vente: { type: Number, default: 45 },
			reparation: { type: Number, default: 30 },
			livraison: { type: Number, default: 15 },
		},
		marge: { type: Number, default: 15 },
		plagesBloquees: [PlageBloqueeSchema],
	},
	{ timestamps: true }
);

const ConfigRdvModel: Model<ConfigRdv> =
	mongoose.models.ConfigRdv ||
	mongoose.model<ConfigRdv>("ConfigRdv", ConfigRdvSchema);

export default ConfigRdvModel;
