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
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Offline Booking</h2>
          <p className="text-sm text-muted-foreground mt-1">Record a seva booking made physically at the temple.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            type="submit" 
            disabled={isSubmitting || sevas.length === 0} 
            className="rounded-xl bg-saffron hover:bg-saffron/90 shadow-sm text-white px-6 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Booking</>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 animate-in fade-in slide-in-from-top-2">
          <XCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Devotee Details */}
        <section className="rounded-2xl border border-border/40 bg-white overflow-hidden shadow-sm h-fit">
          <div className="border-b border-border/40 bg-slate-50/50 px-6 py-4">
            <h2 className="font-serif text-lg font-bold text-foreground">Devotee Information</h2>
            <p className="text-xs text-muted-foreground mt-1">Details of the person offering the seva.</p>
          </div>
          <div className="p-6 space-y-6">
            <Field label="Full Name" error={errors.name?.message} required>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("name")} placeholder="Devotee name" />
            </Field>
            
            <Field label="Mobile Number" error={errors.mobile?.message} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">+91</span>
                <Input className="rounded-xl pl-10 focus-visible:ring-saffron" {...register("mobile")} inputMode="numeric" placeholder="10-digit mobile" />
              </div>
            </Field>
            
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gothra" error={errors.gothra?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("gothra")} placeholder="Optional" />
              </Field>
              <Field label="Nakshatra" error={errors.nakshatra?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("nakshatra")} placeholder="Optional" />
              </Field>
            </div>
            
            <Field label="Email Address" error={errors.email?.message}>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("email")} type="email" placeholder="Optional" />
            </Field>
          </div>
        </section>

        {/* Booking Details */}
        <section className="rounded-2xl border border-border/40 bg-white overflow-hidden shadow-sm h-fit">
          <div className="border-b border-border/40 bg-slate-50/50 px-6 py-4">
            <h2 className="font-serif text-lg font-bold text-foreground">Booking Details</h2>
            <p className="text-xs text-muted-foreground mt-1">Select the seva and payment method.</p>
          </div>
          <div className="p-6 space-y-6">
            <Field label="Select Seva" error={errors.sevaId?.message} required>
              <SevaSelector
                sevas={sevas}
                value={sevaId}
                onChange={(value) => setValue("sevaId", value, { shouldValidate: true })}
              />
            </Field>

            {selectedSeva && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-6 pt-2 border-t border-border/40">
                <Field label="Amount (₹)" error={errors.amount?.message} required>
                  {isOptionsMode ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(selectedSeva.amountOptions?.length ? selectedSeva.amountOptions : [100, 250, 500, 750, 1000]).map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={watch("amount") === amt ? "default" : "outline"}
                          className={`rounded-xl transition-all ${watch("amount") === amt ? "bg-saffron hover:bg-saffron/90 text-white shadow-sm ring-2 ring-saffron ring-offset-2" : "hover:bg-slate-50"}`}
                          onClick={() => setValue("amount", amt, { shouldValidate: true })}
                          size="sm"
                        >
                          ₹{amt}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Input 
                      className={`rounded-xl font-medium focus-visible:ring-saffron ${isFixedAmount ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                      {...register("amount", { valueAsNumber: true })} 
                      type="number" 
                      min={1} 
                      inputMode="numeric" 
                      readOnly={isFixedAmount}
                      disabled={isFixedAmount}
                    />
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Payment Method" error={errors.paymentMethod?.message} required>
                    <NativeSelect className="rounded-xl focus-visible:ring-saffron" {...register("paymentMethod")}>
                      <option value="Cash">Cash</option>
                      <option value="Manual UPI">Manual UPI</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </NativeSelect>
                  </Field>

                  <Field label="Booking Date" error={errors.bookingDate?.message}>
                    <Input className="rounded-xl focus-visible:ring-saffron" type="date" {...register("bookingDate")} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        </section>
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
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
