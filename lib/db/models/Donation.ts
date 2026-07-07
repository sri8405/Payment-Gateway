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
    },
    paymentStatus: { type: String, enum: ["PENDING", "INITIATED", "SUCCESS", "FAILED", "REFUNDED"], default: "PENDING" },
    paymentSource: { type: String, enum: ["Online", "Offline"], default: "Online" },
    merchantTransactionId: { type: String, sparse: true, index: true },
    phonePeTransactionId: { type: String },
    paymentMethod: { type: String, trim: true },
    receiptNumber: { type: String, sparse: true, unique: true },
    transactionTime: { type: Date },
    donationType: { type: String, enum: ["SEVA", "DONATION"], default: "SEVA" },
    bookingStatus: { type: String, enum: ["BOOKED", "COMPLETED", "CANCELLED"], default: "BOOKED" },
    paymentLogs: [{ status: String, timestamp: { type: Date, default: Date.now }, rawResponse: Schema.Types.Mixed }],
    nakshatra: { type: String, trim: true },
    enteredBy: { type: String, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

donationSchema.index({ paymentStatus: 1, merchantTransactionId: 1 });
donationSchema.index({ paymentStatus: 1, amount: -1, createdAt: -1 });
donationSchema.index({ name: "text", gothra: "text", donationId: "text" });
donationSchema.index({ createdAt: -1 });

export type DonationDocument = InferSchemaType<typeof donationSchema>;
export const Donation =
  models.Donation || model("Donation", donationSchema);
