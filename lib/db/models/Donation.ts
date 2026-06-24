import { Schema, model, models, type InferSchemaType } from "mongoose";

const donationSchema = new Schema(
  {
    donationId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    gothra: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    sevaId: { type: Schema.Types.ObjectId, ref: "Seva", required: true },
    sevaName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED"],
      default: "PENDING",
      required: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

donationSchema.index({ name: "text", gothra: "text", donationId: "text" });
donationSchema.index({ createdAt: -1 });

export type DonationDocument = InferSchemaType<typeof donationSchema>;
export const Donation =
  models.Donation || model("Donation", donationSchema);
