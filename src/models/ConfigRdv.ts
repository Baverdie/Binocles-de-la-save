import mongoose, { Schema, Model } from "mongoose";
import type { ConfigRdv, PlageBloquee } from "@/types";

const PlageBloqueeSchema = new Schema<PlageBloquee>(
	{
		jour: { type: Number, required: true, min: 0, max: 6 },
		debut: { type: String, required: true },
		fin: { type: String, required: true },
		typesRdv: [{ type: String, enum: ["examen", "vente", "reparation"] }],
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
