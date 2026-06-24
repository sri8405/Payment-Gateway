import { Schema, model, models, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    action: { type: String, required: true, trim: true },
    collection: { type: String, required: true, trim: true },
    recordId: { type: String, required: true, trim: true },
    oldValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false }, suppressReservedKeysWarning: true }
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);
