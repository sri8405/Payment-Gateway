"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SevaSelector } from "@/components/donation/SevaSelector";
import { offlineBookingSchema, type OfflineBookingInput } from "@/lib/validations/donation";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import { Loader2 } from "lucide-react";

type Props = {
  sevas: SevaPlain[];
};

export function OfflineBookingForm({ sevas }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const sevasById = useMemo(() => new Map(sevas.map((s) => [s._id, s])), [sevas]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof offlineBookingSchema>, unknown, OfflineBookingInput>({
    resolver: zodResolver(offlineBookingSchema),
    defaultValues: {
      name: "",
      gothra: "",
      nakshatra: "",
      mobile: "",
      email: "",
      sevaId: "",
      amount: 0,
      paymentMethod: "Cash",
      bookingDate: new Date().toISOString().slice(0, 10),
    }
  });

  const sevaId = watch("sevaId");
  const selectedSeva = useMemo(() => sevasById.get(sevaId), [sevaId, sevasById]);
  
  const isFixedAmount = selectedSeva?.pricingMode === "fixed";
  const isOptionsMode = selectedSeva?.pricingMode === "options";

  useEffect(() => {
    if (selectedSeva) {
      const defaultAmt = isFixedAmount 
        ? (selectedSeva.fixedAmount || selectedSeva.suggestedAmount)
        : (selectedSeva.defaultAmount || selectedSeva.suggestedAmount);
      setValue("amount", defaultAmt, { shouldValidate: true });
    }
  }, [selectedSeva, setValue, isFixedAmount]);

  async function onSubmit(values: OfflineBookingInput) {
    setError("");
    try {
      const res = await fetch("/api/admin/offline-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save booking");
        return;
      }
      
      reset();
      router.push(`/admin/donations?highlight=${data.donation.donationId}`);
      router.refresh();
      
      // Optionally could redirect to a receipt print page, e.g.
      // window.open(`/donate/receipt?id=${data.donation.donationId}`, '_blank');

    } catch {
      setError("Network error occurred while saving the booking.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Devotee Details */}
      <section className="space-y-4 rounded-xl border border-border bg-white p-5">
        <h2 className="font-serif text-lg font-semibold text-copper">Devotee Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" error={errors.name?.message} required>
            <Input {...register("name")} placeholder="Devotee name" />
          </Field>
          <Field label="Mobile Number" error={errors.mobile?.message} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
              <Input {...register("mobile")} inputMode="numeric" className="pl-10" placeholder="10-digit mobile" />
            </div>
          </Field>
          <Field label="Gothra" error={errors.gothra?.message}>
            <Input {...register("gothra")} placeholder="Optional" />
          </Field>
          <Field label="Nakshatra" error={errors.nakshatra?.message}>
            <Input {...register("nakshatra")} placeholder="Optional" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="Optional" />
          </Field>
        </div>
      </section>

      {/* Booking Details */}
      <section className="space-y-4 rounded-xl border border-border bg-white p-5">
        <h2 className="font-serif text-lg font-semibold text-copper">Booking Details</h2>
        
        <Field label="Select Seva" error={errors.sevaId?.message} required>
          <SevaSelector
            sevas={sevas}
            value={sevaId}
            onChange={(value) => setValue("sevaId", value, { shouldValidate: true })}
          />
        </Field>

        {selectedSeva && (
          <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up pt-2">
            <Field label="Amount (₹)" error={errors.amount?.message} required>
              {isOptionsMode ? (
                <div className="grid grid-cols-5 gap-2">
                  {(selectedSeva.amountOptions?.length ? selectedSeva.amountOptions : [100, 250, 500, 750, 1000]).map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={watch("amount") === amt ? "default" : "outline"}
                      className={watch("amount") === amt ? "bg-saffron text-white" : ""}
                      onClick={() => setValue("amount", amt, { shouldValidate: true })}
                      size="sm"
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>
              ) : (
                <Input 
                  {...register("amount", { valueAsNumber: true })} 
                  type="number" 
                  min={1} 
                  inputMode="numeric" 
                  readOnly={isFixedAmount}
                  disabled={isFixedAmount}
                />
              )}
            </Field>

            <Field label="Payment Method" error={errors.paymentMethod?.message} required>
              <NativeSelect {...register("paymentMethod")}>
                <option value="Cash">Cash</option>
                <option value="Manual UPI">Manual UPI</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </NativeSelect>
            </Field>

            <Field label="Booking Date" error={errors.bookingDate?.message}>
              <Input type="date" {...register("bookingDate")} />
            </Field>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || sevas.length === 0} 
          className="bg-saffron hover:bg-saffron/90 text-white px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Booking...
            </>
          ) : (
            "Save Offline Booking"
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
