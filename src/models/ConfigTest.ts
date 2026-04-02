import mongoose, { Schema, Model } from "mongoose";

interface IConfigTest {
  emailRedirection: string;
  actif: boolean;
  updatedAt: Date;
}

const ConfigTestSchema = new Schema<IConfigTest>(
  {
    emailRedirection: { type: String, required: true },
    actif: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.ConfigTest) {
  delete mongoose.models.ConfigTest;
}

const ConfigTestModel: Model<IConfigTest> = mongoose.model<IConfigTest>(
  "ConfigTest",
  ConfigTestSchema
);

export default ConfigTestModel;
