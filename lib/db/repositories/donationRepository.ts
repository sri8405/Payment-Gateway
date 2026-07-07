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
  paymentStatus: string;
  merchantTransactionId?: string;
  phonePeTransactionId?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  transactionTime?: Date;
  donationType: string;
  bookingStatus: string;
  paymentLogs: any[];
  paymentSource: string;
  nakshatra?: string;
  enteredBy?: string;
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
  paymentSource?: string;
  paymentMethod?: string;
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
    paymentStatus: doc.paymentStatus || "PENDING",
    merchantTransactionId: doc.merchantTransactionId,
    phonePeTransactionId: doc.phonePeTransactionId,
    paymentMethod: doc.paymentMethod,
    receiptNumber: doc.receiptNumber,
    transactionTime: doc.transactionTime,
    donationType: doc.donationType || "SEVA",
    bookingStatus: doc.bookingStatus || "BOOKED",
    paymentLogs: doc.paymentLogs || [],
    paymentSource: doc.paymentSource || "Online",
    nakshatra: doc.nakshatra,
    enteredBy: doc.enteredBy,
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

  if (filters.paymentSource) {
    query.paymentSource = filters.paymentSource;
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  return query;
}

export const donationRepository = {
  async create(input: Omit<DonationPlain, "_id" | "createdAt">) {
    try {
      await connectToDatabase();
      const donation = await Donation.create(input);
      return plainDonation(donation);
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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

      const [overall, today, month, uniqueDonors, successful, failed, topSeva, topDonor] = await Promise.all([
        Donation.aggregate([{ $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
        Donation.aggregate([
          { $match: { createdAt: { $gte: startOfDay, $lt: startOfTomorrow } } },
          { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
        ]),
        Donation.aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
        ]),
        Donation.distinct("name"),
        Donation.countDocuments({ paymentStatus: 'SUCCESS' }),
        Donation.countDocuments({ paymentStatus: 'FAILED' }),
        Donation.aggregate([{ $group: { _id: "$sevaName", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }]),
        Donation.aggregate([{ $match: { paymentStatus: 'SUCCESS' } }, { $sort: { amount: -1 } }, { $limit: 1 }])
      ]);

      return {
        totalDonations: overall[0]?.count || 0,
        totalAmount: overall[0]?.amount || 0,
        uniqueDonors: uniqueDonors.length,
        successfulPayments: successful,
        failedPayments: failed,
        topSeva: topSeva[0]?._id || null,
        topDonor: topDonor[0] ? { name: topDonor[0].name, amount: topDonor[0].amount } : null,
        today: { count: today[0]?.count || 0, amount: today[0]?.amount || 0 },
        month: { count: month[0]?.count || 0, amount: month[0]?.amount || 0 }
      };
    } catch {
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
  },

  async updatePaymentStatus(merchantTransactionId: string, data: { paymentStatus: string, phonePeTransactionId?: string, paymentMethod?: string, transactionTime?: Date, paymentLog?: any }) {
    try {
      await connectToDatabase();
      const updateDoc: any = { paymentStatus: data.paymentStatus };
      if (data.phonePeTransactionId) updateDoc.phonePeTransactionId = data.phonePeTransactionId;
      if (data.paymentMethod) updateDoc.paymentMethod = data.paymentMethod;
      if (data.transactionTime) updateDoc.transactionTime = data.transactionTime;
      
      const updateOp: any = { $set: updateDoc };
      if (data.paymentLog) {
        updateOp.$push = { paymentLogs: data.paymentLog };
      }

      const donation = await Donation.findOneAndUpdate(
        { merchantTransactionId },
        updateOp,
        { new: true }
      ).lean();

      if (!donation) {
        throw new AppError("NOT_FOUND", "Donation not found by transaction ID");
      }
      return plainDonation(donation);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("DATABASE_ERROR", "Failed to update payment status");
    }
  },

  async findByMerchantTransactionId(merchantTransactionId: string) {
    try {
      await connectToDatabase();
      const donation = await Donation.findOne({ merchantTransactionId }).lean();
      return donation ? plainDonation(donation) : null;
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to find donation by transaction ID");
    }
  },

  async findTopDonors(minAmount: number = 500, limit: number = 50) {
    try {
      await connectToDatabase();
      const donors = await Donation.find({ paymentStatus: 'SUCCESS', amount: { $gte: minAmount } })
        .sort({ amount: -1, createdAt: -1 })
        .limit(limit)
        .select('name amount sevaName createdAt')
        .lean();
      return donors.map(d => ({
        name: d.name,
        amount: d.amount,
        sevaName: d.sevaName,
        createdAt: d.createdAt
      }));
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to get top donors");
    }
  },

  async dailyCollections(days: number = 7) {
    try {
      await connectToDatabase();
      const from = new Date();
      from.setDate(from.getDate() - days);
      
      const result = await Donation.aggregate([
        { $match: { paymentStatus: 'SUCCESS', createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            amount: { $sum: "$amount" }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      return result.map(r => ({ date: r._id, amount: r.amount }));
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to get daily collections");
    }
  },

  async monthlyCollections(months: number = 6) {
    try {
      await connectToDatabase();
      const from = new Date();
      from.setMonth(from.getMonth() - months);
      
      const result = await Donation.aggregate([
        { $match: { paymentStatus: 'SUCCESS', createdAt: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            amount: { $sum: "$amount" }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      return result.map(r => ({ month: r._id, amount: r.amount }));
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to get monthly collections");
    }
  },

  async popularSevas(limit: number = 5) {
    try {
      await connectToDatabase();
      const result = await Donation.aggregate([
        { $match: { paymentStatus: 'SUCCESS' } },
        {
          $group: {
            _id: "$sevaName",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);
      return result.map(r => ({ sevaName: r._id, count: r.count }));
    } catch {
      throw new AppError("DATABASE_ERROR", "Failed to get popular sevas");
    }
  }
};
