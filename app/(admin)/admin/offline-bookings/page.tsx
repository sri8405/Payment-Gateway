import { Metadata } from "next";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { OfflineBookingForm } from "@/components/admin/OfflineBookingForm";

export const metadata: Metadata = {
  title: "Offline Bookings | Admin Dashboard",
  description: "Manual entry for offline cash and UPI temple bookings",
};

export default async function OfflineBookingsPage() {
  const sevas = await sevaRepository.findActive();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-copper">Offline Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manually record cash, cheque, or manual UPI bookings made directly at the temple.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <OfflineBookingForm sevas={sevas} />
      </div>
    </div>
  );
}
