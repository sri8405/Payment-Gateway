import { donationRepository } from "@/lib/db/repositories/donationRepository";

function yyyymmdd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function generateDonationId(date = new Date()) {
  const count = await donationRepository.countByPeriod(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  );

  return `DON-${yyyymmdd(date)}-${String(count + 1).padStart(5, "0")}`;
}
