import { connectToDatabase } from '@/lib/db/connect';
import { Counter } from '@/lib/db/models/Counter';
import { Donation } from '@/lib/db/models/Donation';

/**
 * Generate a unique receipt number.
 *
 * Format: GS-<YYYY>-<NNNNN>
 *
 * Uses an atomic MongoDB counter so concurrent calls cannot receive the same
 * sequence number.
 */
export async function generateReceiptNumber(): Promise<string> {
  await connectToDatabase();
  const year = new Date().getFullYear();

  const latestDonation = await Donation.findOne(
    { receiptNumber: { $regex: new RegExp(`^GS-${year}-\\d{5}$`) } },
    { receiptNumber: 1 }
  )
    .sort({ receiptNumber: -1 })
    .lean() as any;

  let maxSeq = 0;
  if (latestDonation?.receiptNumber) {
    const parts = latestDonation.receiptNumber.split('-');
    const seqStr = parts[parts.length - 1];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq)) {
      maxSeq = seq;
    }
  }

  if (maxSeq > 0) {
    await Counter.findOneAndUpdate(
      { _id: "receiptNumber" },
      { $max: { seq: maxSeq } },
      { upsert: true, new: true }
    );
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: "receiptNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  ).lean() as { seq: number } | null;

  return `GS-${year}-${String(counter?.seq || 1).padStart(5, '0')}`;
}
