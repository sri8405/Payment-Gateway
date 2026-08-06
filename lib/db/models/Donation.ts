import { Schema, model, models, type InferSchemaType } from "mongoose";

export const PAYMENT_STATUSES = [
  "PENDING",
  "INITIATED",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "REFUND_INITIATED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "REFUND_FAILED",
] as const;

const paymentLogSchema = new Schema(
  {
    status: String,
    timestamp: { type: Date, default: Date.now },
    rawResponse: Schema.Types.Mixed,
  },
  { _id: false }
);

const refundSchema = new Schema(
  {
    refundId: { type: String, required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    processedAt: Date,
    rawResponse: Schema.Types.Mixed,
  },
  { _id: false }
);

const reconciliationLogSchema = new Schema(
  {
    action: { type: String, required: true },
    note: String,
    timestamp: { type: Date, default: Date.now },
    rawResponse: Schema.Types.Mixed,
  },
  { _id: false }
);

const donationSchema = new Schema(
  {
    donationId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    gothra: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    sevaId: { type: Schema.Types.ObjectId, ref: "Seva", required: true },
    sevaName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    /** Gateway fee in rupees (Razorpay processing fee) */
    gatewayFee: { type: Number, default: 0 },
    /** GST on gateway fee in rupees */
    gatewayGST: { type: Number, default: 0 },
    /** Combined processing charge in rupees (gatewayFee + gatewayGST) */
    processingCharge: { type: Number, default: 0 },
    /** Total amount paid by devotee in rupees (amount + processingCharge) */
    totalPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED"],
      default: "PENDING",
      required: true
    },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
    paymentSource: { type: String, enum: ["Online", "Offline"], default: "Online" },
    merchantTransactionId: { type: String },
    phonePeTransactionId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    razorpayOrderId: { type: String },
    razorpayCaptured: { type: Boolean, default: false },
    signatureVerified: { type: Boolean, default: false },
    paymentGateway: { type: String },
    paymentMethod: { type: String, trim: true },
    receiptNumber: { type: String, sparse: true, unique: true },
    transactionTime: { type: Date },
    donationType: { type: String, enum: ["SEVA", "DONATION"], default: "SEVA" },
    bookingStatus: { type: String, enum: ["BOOKED", "COMPLETED", "CANCELLED"], default: "BOOKED" },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    refundStatus: { type: String, enum: ["NONE", "INITIATED", "PROCESSED", "PARTIAL", "FAILED"], default: "NONE" },
    refundedAmount: { type: Number, default: 0 },
    refundId: { type: String },
    refundReason: { type: String },
    refunds: [refundSchema],
    lastReconciledAt: { type: Date },
    reconciliationStatus: { type: String },
    reconciliationLogs: [reconciliationLogSchema],
    paymentLogs: [paymentLogSchema],
    nakshatra: { type: String, trim: true },
    enteredBy: { type: String, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

donationSchema.index({ merchantTransactionId: 1 }, { sparse: true });
donationSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ enteredBy: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1, merchantTransactionId: 1 });
donationSchema.index({ paymentStatus: 1, amount: -1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1, razorpayOrderId: 1, createdAt: 1 });
donationSchema.index({ name: "text", gothra: "text", donationId: "text" });
donationSchema.index({ createdAt: -1 });

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type DonationDocument = InferSchemaType<typeof donationSchema>;
export const Donation =
  models.Donation || model("Donation", donationSchema);
