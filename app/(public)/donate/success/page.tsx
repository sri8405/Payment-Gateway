import { redirect } from "next/navigation";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export const dynamic = "force-dynamic";

/**
 * Success page – serves as a fallback landing page.
 *
 * With Razorpay Standard Checkout, the primary flow is:
 *   Modal → verify API → client-side redirect to /donate/acknowledgement
 *
 * This page handles edge cases where someone might land here
 * (e.g. via a bookmark or Razorpay redirect mode).
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    txnId?: string;
    merchantTransactionId?: string;
    razorpay_payment_id?: string;
    order_id?: string;
  }>;
}) {
  const params = await searchParams;
  const id = params.txnId || params.merchantTransactionId || params.order_id;

  if (!id) {
    redirect("/donate");
  }

  // Try to find donation by Razorpay order ID or merchantTransactionId
  let donation = await donationRepository.findByRazorpayOrderId(id);
  if (!donation) {
    donation = await donationRepository.findByMerchantTransactionId(id);
  }

  if (!donation) {
    // If not found by order ID, maybe it's the direct donation ID (mock mode)
    const directDonation = await donationRepository.findById(id);
    if (directDonation) {
      redirect(`/donate/acknowledgement?id=${directDonation.donationId}`);
    }
    redirect("/donate");
  }

  redirect(`/donate/acknowledgement?id=${donation.donationId}`);
}
