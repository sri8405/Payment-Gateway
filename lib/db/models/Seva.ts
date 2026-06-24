import { Schema, model, models, type InferSchemaType } from "mongoose";

const sevaSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    suggestedAmount: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type SevaDocument = InferSchemaType<typeof sevaSchema>;
export const Seva = models.Seva || model("Seva", sevaSchema);
