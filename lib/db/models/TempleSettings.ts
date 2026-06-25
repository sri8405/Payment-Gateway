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
    receiptFooter: { type: String, trim: true }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export type TempleSettingsDocument = InferSchemaType<typeof templeSettingsSchema>;
export const TempleSettings = models.TempleSettings || model("TempleSettings", templeSettingsSchema);
