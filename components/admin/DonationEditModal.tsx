"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { adminDonationUpdateSchema, type AdminDonationUpdateInput } from "@/lib/validations/adminDonation";
import type { DonationPlain } from "@/lib/db/repositories/donationRepository";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

type Props = {
  open: boolean;
  donation: DonationPlain | null;
  sevas: SevaPlain[];
  onOpenChange: (open: boolean) => void;
  onSaved: (donation: DonationPlain) => void;
};

export function DonationEditModal({ open, donation, sevas, onOpenChange, onSaved }: Props) {
  const [message, setMessage] = useState("");
  const sevaMap = useMemo(() => new Map(sevas.map((seva) => [seva._id, seva])), [sevas]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof adminDonationUpdateSchema>, unknown, AdminDonationUpdateInput>({
    resolver: zodResolver(adminDonationUpdateSchema),
    defaultValues: {
      name: "",
      gothra: "",
      mobile: "",
      email: "",
      sevaId: "",
      amount: 0,
      status: "PENDING"
    }
  });

  useEffect(() => {
    if (!donation) return;
    reset({
      name: donation.name,
      gothra: donation.gothra,
      mobile: donation.mobile || "",
      email: donation.email || "",
      sevaId: donation.sevaId,
      amount: donation.amount,
      status: donation.status
    });
  }, [donation, reset, open]);

  async function onSubmit(values: AdminDonationUpdateInput) {
    if (!donation) return;
    setMessage("");
    const response = await fetch(`/api/admin/donations/${donation.donationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await response.json();
    if (response.ok) {
      onSaved(data.donation);
      onOpenChange(false);
    } else {
      setMessage(data.error || "Failed to save donation");
    }
  }

  const selectedSevaId = watch("sevaId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Donation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message ? <p className="rounded-md border bg-muted p-3 text-sm">{message}</p> : null}
          <Field label="Devotee Name" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Gothra" error={errors.gothra?.message}>
            <Input {...register("gothra")} />
          </Field>
          <Field label="Mobile" error={errors.mobile?.message}>
            <Input {...register("mobile")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Seva" error={errors.sevaId?.message}>
            <NativeSelect
              value={selectedSevaId}
              onChange={(event) => {
                const sevaId = event.target.value;
                setValue("sevaId", sevaId, { shouldValidate: true });
                const seva = sevaMap.get(sevaId);
                if (seva) {
                  setValue("amount", seva.suggestedAmount, { shouldValidate: true });
                }
              }}
            >
              <option value="">Select seva</option>
              {sevas.map((seva) => (
                <option key={seva._id} value={seva._id}>
                  {seva.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Amount" error={errors.amount?.message}>
            <Input type="number" min={1} {...register("amount")} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <NativeSelect {...register("status")}>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
            </NativeSelect>
          </Field>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
