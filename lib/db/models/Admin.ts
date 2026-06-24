import { Schema, model, models, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN"], default: "ADMIN", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type AdminDocument = InferSchemaType<typeof adminSchema>;
export const Admin = models.Admin || model("Admin", adminSchema);
