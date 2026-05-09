import mongoose, { Schema, Model } from "mongoose";

export interface INotificationPreferences {
  userId: mongoose.Types.ObjectId;
  enabled: boolean;
  events: {
    appointment: boolean;
    lensOrder: boolean;
    contactRequest: boolean;
    appointmentCancellation: boolean;
  };
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, unique: true },
    enabled: { type: Boolean, default: true },
    events: {
      appointment: { type: Boolean, default: true },
      lensOrder: { type: Boolean, default: true },
      contactRequest: { type: Boolean, default: true },
      appointmentCancellation: { type: Boolean, default: true },
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// Retourne les préférences existantes ou crée avec les défauts
NotificationPreferencesSchema.statics.getOrCreate = async function (
  userId: mongoose.Types.ObjectId
): Promise<INotificationPreferences> {
  const existing = await this.findOne({ userId });
  if (existing) return existing;
  return this.create({ userId });
};

const NotificationPreferencesModel: Model<INotificationPreferences> =
  mongoose.models.NotificationPreferences ||
  mongoose.model<INotificationPreferences>(
    "NotificationPreferences",
    NotificationPreferencesSchema
  );

export default NotificationPreferencesModel;
