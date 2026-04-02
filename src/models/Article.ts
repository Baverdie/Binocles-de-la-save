import mongoose, { Schema, Model } from "mongoose";
import type { Article } from "@/types";

const ArticleSchema = new Schema<Article>(
  {
    titre: { type: String, required: true, maxlength: 150 },
    source: { type: String, required: true, maxlength: 50 },
    datePublication: { type: Date, required: true },
    lienArticle: { type: String, required: true },
    imageCouverture: { type: String },
    resume: { type: String, maxlength: 200 },
    actif: { type: Boolean, default: true },
    ordre: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ArticleModel: Model<Article> =
  mongoose.models.Article || mongoose.model<Article>("Article", ArticleSchema);

export default ArticleModel;
