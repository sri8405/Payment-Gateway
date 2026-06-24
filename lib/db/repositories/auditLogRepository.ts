import { connectToDatabase } from "@/lib/db/connect";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { AppError } from "@/lib/utils/errors";

export type AuditLogPlain = {
  _id: string;
  adminId: string;
  action: string;
  collection: string;
  recordId: string;
  oldValues?: unknown;
  newValues?: unknown;
  createdAt: Date;
};

function plainAuditLog(doc: any): AuditLogPlain {
  return {
    _id: doc._id.toString(),
    adminId: doc.adminId.toString(),
    action: doc.action,
    collection: doc.collection,
    recordId: doc.recordId,
    oldValues: doc.oldValues,
    newValues: doc.newValues,
    createdAt: doc.createdAt
  };
}

export const auditLogRepository = {
  async create(input: Omit<AuditLogPlain, "_id" | "createdAt">) {
    try {
      await connectToDatabase();
      const log = await AuditLog.create(input);
      return plainAuditLog(log);
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to write audit log");
    }
  }
};
