import { redirect } from "next/navigation";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ txnId?: string; merchantTransactionId?: string }> }) {
  const { txnId, merchantTransactionId } = await searchParams;
  const id = txnId || merchantTransactionId;

  if (!id) {
    redirect("/donate");
  }

  // Find the donation using merchantTransactionId
  const donation = await donationRepository.findByMerchantTransactionId(id);
  
  if (!donation) {
    // If not found by merchant ID, maybe it's the direct donation ID (mock mode)
    const directDonation = await donationRepository.findById(id);
    if (directDonation) {
      redirect(`/donate/acknowledgement?id=${directDonation.donationId}`);
    }
    redirect("/donate");
  }

  redirect(`/donate/acknowledgement?id=${donation.donationId}`);
}
