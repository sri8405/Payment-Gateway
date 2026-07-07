import { Schema, model, models, type InferSchemaType } from "mongoose";

const templeSettingsSchema = new Schema(
  {
    templeName: { type: String, required: true, trim: true },
    templeDescription: { type: String, trim: true },
    upiId: { type: String, required: true, trim: true },
    upiDisplayName: { type: String, required: true, trim: true },
    /** Human-readable account holder / receiver name shown on payment screen */
    receiverName: { type: String, trim: true },
    /** Preferred default payment app: generic | phonepe | gpay | paytm */
    defaultPaymentApp: {
      type: String,
      enum: ["generic", "phonepe", "gpay", "paytm"],
      default: "generic"
    },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    receiptFooter: { type: String, trim: true },
    bannerUrl: { type: String, trim: true },
    websiteFooter: { type: String, trim: true },
    templeTimings: { type: String, trim: true },
    supportContact: { type: String, trim: true },
    socialMediaLinks: {
      facebook: String,
      instagram: String,
      youtube: String,
      twitter: String,
      website: String
    },
    phonepeClientId: { type: String, trim: true },
    phonepeClientSecret: { type: String, trim: true },
    phonepeClientVersion: { type: String, trim: true },
    phonepeMerchantId: { type: String, trim: true },
    phonepeRedirectUrl: { type: String, trim: true },
    phonepeCallbackUrl: { type: String, trim: true },
    audioEnabled: { type: Boolean, default: true },
    audioUrl: { type: String, trim: true, default: "/audio/devotional.mp3" }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export type TempleSettingsDocument = InferSchemaType<typeof templeSettingsSchema>;
export const TempleSettings = models.TempleSettings || model("TempleSettings", templeSettingsSchema);
