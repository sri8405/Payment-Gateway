"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SevaSelector } from "@/components/donation/SevaSelector";
import { donationSchema, type DonationInput } from "@/lib/validations/donation";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import { Loader2 } from "lucide-react";

type Props = {
  sevas: SevaPlain[];
};

const SESSION_KEY = "guruseva_donation_form";
const SESSION_DONATION_KEY = "guruseva_in_progress_donation";
// Discard saved form data older than 2 hours
const MAX_SESSION_AGE_MS = 2 * 60 * 60 * 1000;

function loadFormSession(): Partial<DonationInput> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > MAX_SESSION_AGE_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data as Partial<DonationInput>;
  } catch {
    return null;
  }
}

function saveFormSession(values: Partial<DonationInput>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data: values, savedAt: Date.now() }));
  } catch {
    // sessionStorage not available (e.g. private mode with strict settings) — ignore silently
  }
}

function clearFormSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_DONATION_KEY);
  } catch {
    // ignore
  }
}

export function DonationForm({ sevas }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSevaId = searchParams?.get("seva");
  
  const [error, setError] = useState("");
  const sevasById = useMemo(() => new Map(sevas.map((seva) => [seva._id, seva])), [sevas]);

  // Stable defaultValues — created once per component instance (keyed to preselectedSevaId).
  // Must NOT be recreated on every render, because react-hook-form re-applies defaultValues
  // when the object reference changes, wiping user-entered data.
  const defaultValues = useMemo<z.input<typeof donationSchema>>(() => {
    const saved = loadFormSession();
    return {
      name: saved?.name ?? "",
      gothra: saved?.gothra ?? "",
      mobile: saved?.mobile ?? "",
      email: saved?.email ?? "",
      sevaId: saved?.sevaId ?? preselectedSevaId ?? "",
      amount: saved?.amount ?? 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — compute once on mount from sessionStorage

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof donationSchema>, unknown, DonationInput>({
    resolver: zodResolver(donationSchema),
    defaultValues,
  });

  const sevaId = watch("sevaId");
  const selectedSeva = useMemo(() => sevasById.get(sevaId), [sevaId, sevasById]);
  
  const isFixedAmount = selectedSeva?.pricingMode === "fixed";

  // Persist form values to sessionStorage on every change.
  // This ensures values survive React component remounts, Strict Mode double-invocation,
  // and navigation events that may cause the component to unmount and remount.
  const watchedValues = watch();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Debounce to avoid writing to sessionStorage on every keystroke
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveFormSession(watchedValues);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  // When selected seva changes, update the amount field.
  // Guard: only overwrite amount if user hasn't already entered a custom amount for this seva.
  const amountSetForSevaRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedSeva && amountSetForSevaRef.current !== sevaId) {
      amountSetForSevaRef.current = sevaId;
      const amount = selectedSeva.pricingMode === "fixed"
        ? (selectedSeva.fixedAmount || selectedSeva.suggestedAmount)
        : (selectedSeva.defaultAmount || selectedSeva.suggestedAmount);
      // Only set the amount if the current value is 0 (unset) or we're changing sevas
      const currentAmount = watchedValues.amount;
      if (currentAmount === 0 || currentAmount === undefined) {
        setValue("amount", amount, { shouldValidate: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sevaId, selectedSeva, setValue]);

  async function onSubmit(values: DonationInput) {
    setError("");

    // Check if there's an in-progress donation for this exact seva+amount combination.
    // This prevents duplicate donation records when the user navigates back and resubmits.
    try {
      const inProgressRaw = sessionStorage.getItem(SESSION_DONATION_KEY);
      if (inProgressRaw) {
        const { donationId: existingId, sevaId: savedSevaId, amount: savedAmount } = JSON.parse(inProgressRaw);
        if (existingId && savedSevaId === values.sevaId && savedAmount === values.amount) {
          // Verify the existing donation is still awaiting payment
          const checkRes = await fetch(`/api/payments/status?id=${encodeURIComponent(existingId)}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.paymentStatus === "PENDING" || checkData.paymentStatus === "INITIATED") {
              // Reuse the existing in-progress donation — do not create a duplicate
              router.push(`/donate/pay?id=${encodeURIComponent(existingId)}`);
              return;
            }
          }
          // If status check fails or donation is no longer pending, fall through to create new
          sessionStorage.removeItem(SESSION_DONATION_KEY);
        }
      }
    } catch {
      // sessionStorage or fetch error — proceed normally
    }

    const response = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to create seva booking");
      return;
    }

    // Store the in-progress donationId so we can reuse it on duplicate submission
    try {
      sessionStorage.setItem(SESSION_DONATION_KEY, JSON.stringify({
        donationId: data.donation.donationId,
        sevaId: values.sevaId,
        amount: values.amount,
      }));
    } catch {
      // ignore
    }

    // Clear form session only after the donation record is successfully created and we navigate away.
    // We intentionally keep form data alive until this point so the user can see their values
    // if the API call fails and they need to retry.
    clearFormSession();

    router.push(`/donate/pay?id=${encodeURIComponent(data.donation.donationId)}`);
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
           <span className="text-xl">⚠️</span>
           <p>{error}</p>
        </div>
      ) : null}
      
      <div className="bg-saffron/5 p-6 rounded-xl border border-saffron/20 space-y-6">
        <h3 className="font-serif text-xl font-semibold text-copper border-b border-saffron/20 pb-2">Devotee Details</h3>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Full Name" error={errors.name?.message} required>
            <Input {...register("name")} autoComplete="name" className="bg-white" placeholder="e.g. Rahul Sharma" />
          </Field>
          <Field label="Gothra" error={errors.gothra?.message}>
            <Input {...register("gothra")} className="bg-white" placeholder="e.g. Kashyapa" />
          </Field>
          <Field label="Mobile Number" error={errors.mobile?.message} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
              <Input {...register("mobile")} inputMode="numeric" autoComplete="tel" className="bg-white pl-10" placeholder="10-digit mobile" />
            </div>
          </Field>
          <Field label="Email Address" error={errors.email?.message}>
            <Input {...register("email")} type="email" autoComplete="email" className="bg-white" placeholder="For receiving receipts" />
          </Field>
        </div>
      </div>

      <div className="bg-gold/5 p-6 rounded-xl border border-gold/20 space-y-6">
        <h3 className="font-serif text-xl font-semibold text-copper border-b border-gold/20 pb-2">Seva Details</h3>
        
        <Field label="Select Seva" error={errors.sevaId?.message} required>
          <SevaSelector
            sevas={sevas}
            value={sevaId}
            onChange={(value) => {
              setValue("sevaId", value, { shouldValidate: true });
            }}
          />
        </Field>
        
        {selectedSeva && (
          <div className="animate-fade-in-up">
            <Field label="Offering Amount (₹)" error={errors.amount?.message} required>
              {selectedSeva.pricingMode === 'options' ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {(selectedSeva.amountOptions?.length ? selectedSeva.amountOptions : [100, 250, 500, 750, 1000]).map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={watch("amount") === amt ? "default" : "outline"}
                      className={watch("amount") === amt ? "bg-saffron hover:bg-saffron/90 text-white border-saffron" : "border-saffron/30 hover:border-saffron/60 text-foreground"}
                      onClick={() => setValue("amount", amt, { shouldValidate: true })}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                  {/* Hidden input to keep react-hook-form registered properly */}
                  <input type="hidden" {...register("amount", { valueAsNumber: true })} />
                </div>
              ) : (
                <Input 
                  {...register("amount", { valueAsNumber: true })} 
                  type="number" 
                  min={1} 
                  inputMode="numeric" 
                  className="bg-white text-lg font-semibold text-copper"
                  readOnly={isFixedAmount}
                  disabled={isFixedAmount}
                />
              )}
            </Field>
            {isFixedAmount && (
              <p className="text-xs text-muted-foreground mt-2">
                * This seva has a fixed offering amount.
              </p>
            )}
            {selectedSeva.pricingMode === 'custom' && (
              <p className="text-xs text-muted-foreground mt-2">
                * You may enter any amount of your choice for this offering.
              </p>
            )}
            {selectedSeva.pricingMode === 'options' && (
              <p className="text-xs text-muted-foreground mt-2">
                * Please select one of the fixed offering amounts.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || sevas.length === 0} 
          className="w-full sm:w-auto bg-gradient-to-r from-saffron to-gold hover:from-gold hover:to-saffron text-white px-8 py-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Proceed to Payment"
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
    <div className="space-y-2">
      <Label className="font-semibold text-foreground/90">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive font-medium">{error}</p> : null}
    </div>
  );
}
