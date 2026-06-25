import { FilterQuery, Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Donation } from "@/lib/db/models/Donation";
import { AppError } from "@/lib/utils/errors";

export type DonationStatus = "PENDING" | "VERIFIED";

export type DonationPlain = {
  _id: string;
  donationId: string;
  name: string;
  gothra: string;
  mobile?: string;
  email?: string;
  sevaId: string;
  sevaName: string;
  amount: number;
  status: DonationStatus;
  createdAt: Date;
};

export type DonationUpdateInput = Partial<
  Pick<DonationPlain, "name" | "gothra" | "mobile" | "email" | "sevaId" | "sevaName" | "amount" | "status">
>;

export type DonationFilters = {
  search?: string;
  from?: Date;
  to?: Date;
  sevaId?: string;
  status?: DonationStatus;
  page?: number;
  limit?: number;
};

function plainDonation(doc: any): DonationPlain {
  return {
    _id: doc._id.toString(),
    donationId: doc.donationId,
    name: doc.name,
    gothra: doc.gothra,
    mobile: doc.mobile,
    email: doc.email,
    sevaId: doc.sevaId.toString(),
    sevaName: doc.sevaName,
    amount: doc.amount,
    status: doc.status,
    createdAt: doc.createdAt
  };
}

function buildFilters(filters: DonationFilters = {}) {
  const query: FilterQuery<unknown> = {};

  if (filters.search) {
    const pattern = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { name: pattern },
      { gothra: pattern },
      { donationId: pattern }
    ];
  }

  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) {
      query.createdAt.$gte = filters.from;
    }
    if (filters.to) {
      query.createdAt.$lte = filters.to;
    }
  }

  if (filters.sevaId) {
    query.sevaId = new Types.ObjectId(filters.sevaId);
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return query;
}

export const donationRepository = {
  async create(input: Omit<DonationPlain, "_id" | "createdAt">) {
    try {
      await connectToDatabase();
      const donation = await Donation.create(input);
      return plainDonation(donation);
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to create donation");
    }
  },

  async findById(id: string) {
    try {
      await connectToDatabase();
      const donation = await Donation.findOne({
        $or: [
          { donationId: id },
          ...(Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      }).lean();

      return donation ? plainDonation(donation) : null;
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to find donation");
    }
  },

  async findAll(filters: DonationFilters = {}) {
    try {
      await connectToDatabase();
      const page = Math.max(filters.page || 1, 1);
      const limit = Math.min(Math.max(filters.limit || 20, 1), 200);
      const query = buildFilters(filters);
      const [rows, total] = await Promise.all([
        Donation.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Donation.countDocuments(query)
      ]);

      return {
        rows: rows.map(plainDonation),
        total,
        page,
        limit
      };
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to list donations");
    }
  },

  async updateStatus(id: string, status: DonationStatus) {
    try {
      await connectToDatabase();
      const donation = await Donation.findOneAndUpdate(
        { donationId: id },
        { status },
        { new: true }
      ).lean();

      if (!donation) {
        throw new AppError("NOT_FOUND", "Donation not found");
      }

      return plainDonation(donation);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("DATABASE_ERROR", "Failed to update donation status");
    }
  },

  async updateById(id: string, input: DonationUpdateInput) {
    try {
      await connectToDatabase();
      const donation = await Donation.findOne({
        $or: [
          { donationId: id },
          ...(Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      });

      if (!donation) {
        throw new AppError("NOT_FOUND", "Donation not found");
      }

      const oldValues = plainDonation(donation.toObject());
      Object.assign(donation, input);
      await donation.save();
      return {
        oldValues,
        newValues: plainDonation(donation.toObject())
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("DATABASE_ERROR", "Failed to update donation");
    }
  },

  async countByPeriod(from: Date, to: Date) {
    try {
      await connectToDatabase();
      return Donation.countDocuments({
        createdAt: { $gte: from, $lt: to }
      });
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to count donations");
    }
  },

  async stats() {
    try {
      await connectToDatabase();
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [overall, today, month, uniqueDonors] = await Promise.all([
        Donation.aggregate([{ $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
        Donation.aggregate([
          { $match: { createdAt: { $gte: startOfDay, $lt: startOfTomorrow } } },
          { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
        ]),
        Donation.aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
        ]),
        Donation.distinct("name")
      ]);

      return {
        totalDonations: overall[0]?.count || 0,
        totalAmount: overall[0]?.amount || 0,
        uniqueDonors: uniqueDonors.length,
        today: { count: today[0]?.count || 0, amount: today[0]?.amount || 0 },
        month: { count: month[0]?.count || 0, amount: month[0]?.amount || 0 }
      };
    } catch (error) {
      throw new AppError("DATABASE_ERROR", "Failed to calculate donation stats");
    }
  },

  async deleteById(id: string): Promise<boolean> {
    try {
      await connectToDatabase();

      if (!Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Donation.deleteOne({ _id: new Types.ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("DATABASE_ERROR", "Failed to delete donation");
    }
  }
};
