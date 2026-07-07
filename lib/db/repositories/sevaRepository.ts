import { connectToDatabase } from "@/lib/db/connect";
import { Seva } from "@/lib/db/models/Seva";
import { AppError } from "@/lib/utils/errors";

export type SevaPlain = {
  _id: string;
  name: string;
  description?: string;
  suggestedAmount: number;
  active: boolean;
  isSystem: boolean;
  pricingMode?: "fixed" | "custom" | "options";
  fixedAmount?: number;
  defaultAmount?: number;
  category?: string;
  imageUrl?: string;
  createdAt: Date;
};

function plainSeva(doc: any): SevaPlain {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    suggestedAmount: doc.suggestedAmount,
    active: doc.active,
    isSystem: doc.isSystem,
    pricingMode: doc.pricingMode || "fixed",
    fixedAmount: doc.fixedAmount || doc.suggestedAmount,
    defaultAmount: doc.defaultAmount || doc.suggestedAmount,
    category: doc.category,
    imageUrl: doc.imageUrl,
    createdAt: doc.createdAt
  };
}

export const sevaRepository = {
  async create(input: Omit<SevaPlain, "_id" | "createdAt" | "isSystem"> & { isSystem?: boolean }) {
    try {
      await connectToDatabase();
      const seva = await Seva.create({ ...input, isSystem: input.isSystem ?? false });
      return plainSeva(seva);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new AppError("CONFLICT", "A seva with this name already exists");
      }
      throw new AppError("DATABASE_ERROR", "Failed to create seva");
    }
  },

  async findAll() {
    try {
      await connectToDatabase();
      const sevas = await Seva.find({}).sort({ isSystem: -1, name: 1 }).lean();
      return sevas.map(plainSeva);
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to list sevas");
    }
  },

  async findActive() {
    try {
      await connectToDatabase();
      const sevas = await Seva.find({ active: true }).sort({ name: 1 }).lean();
      return sevas.map(plainSeva);
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to list active sevas");
    }
  },

  async findByCategory(category: string) {
    try {
      await connectToDatabase();
      const sevas = await Seva.find({ category, active: true }).sort({ name: 1 }).lean();
      return sevas.map(plainSeva);
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to find sevas by category");
    }
  },

  async getCategories() {
    try {
      await connectToDatabase();
      const categories = await Seva.distinct("category", { active: true });
      return categories.filter(Boolean).sort();
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to list categories");
    }
  },

  async findById(id: string) {
    try {
      await connectToDatabase();
      const seva = await Seva.findById(id).lean();
      return seva ? plainSeva(seva) : null;
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to find seva");
    }
  },

  async update(id: string, input: Partial<Omit<SevaPlain, "_id" | "createdAt">>) {
    try {
      await connectToDatabase();
      const existing = await Seva.findById(id);

      if (!existing) {
        throw new AppError("NOT_FOUND", "Seva not found");
      }

      Object.assign(existing, input);
      await existing.save();
      return plainSeva(existing);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error?.code === 11000) {
        throw new AppError("CONFLICT", "A seva with this name already exists");
      }
      throw new AppError("DATABASE_ERROR", "Failed to update seva");
    }
  },

  async delete(id: string) {
    try {
      await connectToDatabase();
      const deleted = await Seva.findByIdAndDelete(id).lean();

      if (!deleted) {
        throw new AppError("NOT_FOUND", "Seva not found");
      }

      return plainSeva(deleted);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("DATABASE_ERROR", "Failed to delete seva");
    }
  }
};
