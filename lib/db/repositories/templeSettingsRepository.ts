import { connectToDatabase } from "@/lib/db/connect";
import { TempleSettings } from "@/lib/db/models/TempleSettings";
import { AppError } from "@/lib/utils/errors";

export type TempleSettingsPlain = {
  _id: string;
  templeName: string;
  templeDescription?: string;
  upiId: string;
  upiDisplayName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  receiptFooter?: string;
  updatedAt?: Date;
};

function plainTempleSettings(doc: any): TempleSettingsPlain {
  return {
    _id: doc._id.toString(),
    templeName: doc.templeName,
    templeDescription: doc.templeDescription,
    upiId: doc.upiId,
    upiDisplayName: doc.upiDisplayName,
    contactNumber: doc.contactNumber,
    email: doc.email,
    address: doc.address,
    logoUrl: doc.logoUrl,
    receiptFooter: doc.receiptFooter,
    updatedAt: doc.updatedAt
  };
}

export const templeSettingsRepository = {
  async getCurrent() {
    try {
      await connectToDatabase();
      const settings = await TempleSettings.findOne({}).sort({ updatedAt: -1 }).lean();
      return settings ? plainTempleSettings(settings) : null;
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to load temple settings");
    }
  },

  async getCurrentOrDefault() {
    try {
      const current = await this.getCurrent();
      if (current) {
        return current;
      }
    } catch (error) {
      console.error("Temple settings fallback:", error);
    }

    const templeName = process.env.NEXT_PUBLIC_TEMPLE_NAME || "Sri Padmananda Guruji Ashrama";
    return {
      _id: "default",
      templeName,
      templeDescription: "Donations & Seva Management",
      upiId: "9880742348@ybl",
      upiDisplayName: templeName,
      contactNumber: "",
      email: "",
      address: "",
      logoUrl: "/assets/guruji.jpg",
      receiptFooter: "May Guruji's blessings always be with you."
    } satisfies TempleSettingsPlain;
  },

  async upsertCurrent(input: Omit<TempleSettingsPlain, "_id" | "updatedAt">) {
    try {
      await connectToDatabase();
      const settings = await TempleSettings.findOneAndUpdate(
        {},
        { $set: input },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      if (!settings) {
        throw new AppError("DATABASE_ERROR", "Failed to save temple settings");
      }

      return plainTempleSettings(settings);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("DATABASE_ERROR", "Failed to save temple settings");
    }
  }
};
