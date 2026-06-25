import { connectToDatabase } from "@/lib/db/connect";
import { TempleSettings } from "@/lib/db/models/TempleSettings";
import { AppError } from "@/lib/utils/errors";

export type DefaultPaymentApp = "generic" | "phonepe" | "gpay" | "paytm";

export type TempleSettingsPlain = {
  _id: string;
  templeName: string;
  templeDescription?: string;
  upiId: string;
  upiDisplayName: string;
  /** Account holder / receiver name shown on the payment screen */
  receiverName?: string;
  /** Preferred default payment app */
  defaultPaymentApp?: DefaultPaymentApp;
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
    receiverName: doc.receiverName,
    defaultPaymentApp: doc.defaultPaymentApp ?? "generic",
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
    // Fallback UPI values — these are used only when no settings exist in the database yet.
    // Set FALLBACK_UPI_ID and FALLBACK_UPI_DISPLAY_NAME in your environment variables or
    // save settings from the Admin Settings page to persist them to the database.
    const fallbackUpiId = process.env.FALLBACK_UPI_ID || "9880742348@ybl";
    const fallbackUpiDisplayName = process.env.FALLBACK_UPI_DISPLAY_NAME || templeName;
    return {
      _id: "default",
      templeName,
      templeDescription: "Seva Booking & Management",
      upiId: fallbackUpiId,
      upiDisplayName: fallbackUpiDisplayName,
      receiverName: templeName,
      defaultPaymentApp: "generic" as DefaultPaymentApp,
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
