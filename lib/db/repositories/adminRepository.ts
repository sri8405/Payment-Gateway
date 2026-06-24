import { connectToDatabase } from "@/lib/db/connect";
import { Admin } from "@/lib/db/models/Admin";
import { AppError } from "@/lib/utils/errors";

export type AdminPlain = {
  _id: string;
  username: string;
  passwordHash: string;
  role: "ADMIN";
  createdAt: Date;
};

function plainAdmin(doc: any): AdminPlain {
  return {
    _id: doc._id.toString(),
    username: doc.username,
    passwordHash: doc.passwordHash,
    role: doc.role,
    createdAt: doc.createdAt
  };
}

export const adminRepository = {
  async findByUsername(username: string) {
    try {
      await connectToDatabase();
      const admin = await Admin.findOne({ username }).lean();
      return admin ? plainAdmin(admin) : null;
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to find admin");
    }
  }
};
