import { connectToDatabase } from '@/lib/db/connect';
import { Donation } from '@/lib/db/models/Donation';

export async function generateReceiptNumber(): Promise<string> {
  await connectToDatabase();
  const year = new Date().getFullYear();
  const count = await Donation.countDocuments({ receiptNumber: { $regex: `^GS-${year}-` } });
  const next = count + 1;
  return `GS-${year}-${String(next).padStart(5, '0')}`;
}
