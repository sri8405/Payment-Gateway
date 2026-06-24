"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SevaSelector } from "@/components/donation/SevaSelector";
import { donationSchema, type DonationInput } from "@/lib/validations/donation";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

type Props = {
  sevas: SevaPlain[];
};

export function DonationForm({ sevas }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const sevasById = useMemo(() => new Map(sevas.map((seva) => [seva._id, seva])), [sevas]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof donationSchema>, unknown, DonationInput>({
    resolver: zodResolver(donationSchema),
    defaultValues: { name: "", gothra: "", mobile: "", email: "", sevaId: "", amount: 0 }
  });

  async function onSubmit(values: DonationInput) {
    setError("");
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

    router.push(`/donate/pay?id=${encodeURIComponent(data.donation.donationId)}`);
  }

  const sevaId = watch("sevaId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" />
        </Field>
        <Field label="Gothra" error={errors.gothra?.message}>
          <Input {...register("gothra")} />
        </Field>
        <Field label="Mobile" error={errors.mobile?.message}>
          <Input {...register("mobile")} inputMode="numeric" autoComplete="tel" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="email" />
        </Field>
      </div>
      <Field label="Seva Type" error={errors.sevaId?.message}>
        <SevaSelector
          sevas={sevas}
          value={sevaId}
          onChange={(value) => {
            setValue("sevaId", value, { shouldValidate: true });
            const seva = sevasById.get(value);
            if (seva) {
              setValue("amount", seva.suggestedAmount, { shouldValidate: true });
            }
          }}
        />
      </Field>
      <Field label="Amount" error={errors.amount?.message}>
        <Input {...register("amount")} type="number" min={1} inputMode="numeric" />
      </Field>
      <Button type="submit" disabled={isSubmitting || sevas.length === 0} className="w-full sm:w-auto">
        {isSubmitting ? "Creating..." : "Continue to Payment"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
