import { Schema, model, models, type InferSchemaType } from "mongoose";

const webhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["PROCESSING", "PROCESSED", "FAILED"], default: "PROCESSING" },
    error: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);


webhookEventSchema.index({ createdAt: 1 });

export type WebhookEventDocument = InferSchemaType<typeof webhookEventSchema>;
export const WebhookEvent = models.WebhookEvent || model("WebhookEvent", webhookEventSchema);
