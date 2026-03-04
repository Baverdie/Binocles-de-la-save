import mongoose, { Schema, Model } from "mongoose";
import type { OuvertureExceptionnelle } from "@/types";

const OuvertureExceptionnelleSchema = new Schema<OuvertureExceptionnelle>(
	{
		date: { type: Date, required: true, index: true },
		matin: {
			debut: String,
			fin: String,
		},
		aprem: {
			debut: String,
			fin: String,
		},
		raison: String,
	},
	{ timestamps: true }
);

const OuvertureExceptionnelleModel: Model<OuvertureExceptionnelle> =
	mongoose.models.OuvertureExceptionnelle ||
	mongoose.model<OuvertureExceptionnelle>(
		"OuvertureExceptionnelle",
		OuvertureExceptionnelleSchema
	);

export default OuvertureExceptionnelleModel;
