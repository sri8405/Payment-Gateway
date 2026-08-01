"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { adminDonationUpdateSchema, type AdminDonationUpdateInput } from "@/lib/validations/adminDonation";
import type { DonationPlain } from "@/lib/db/repositories/donationRepository";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import { Loader2 } from "lucide-react";

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
    setMessage("");
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
      setMessage(data.error || "Failed to save seva booking");
    }
  }

  const selectedSevaId = watch("sevaId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl gap-0">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Edit Seva Booking</DialogTitle>
            <DialogDescription>Update devotee and booking details below.</DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {message ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {message}
            </div>
          ) : null}
          
          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div className="sm:col-span-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Devotee Information</h3>
            </div>
            
            <Field label="Devotee Name" error={errors.name?.message}>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("name")} />
            </Field>
            
            <Field label="Gothra" error={errors.gothra?.message}>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("gothra")} />
            </Field>
            
            <Field label="Mobile" error={errors.mobile?.message}>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("mobile")} />
            </Field>
            
            <Field label="Email" error={errors.email?.message}>
              <Input className="rounded-xl focus-visible:ring-saffron" type="email" {...register("email")} />
            </Field>

            <div className="sm:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Seva Details</h3>
            </div>
            
            <div className="sm:col-span-2">
              <Field label="Seva" error={errors.sevaId?.message}>
                <NativeSelect
                  className="rounded-xl focus-visible:ring-saffron"
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
            </div>
            
            <Field label="Amount (₹)" error={errors.amount?.message}>
              <Input className="rounded-xl focus-visible:ring-saffron font-medium" type="number" min={1} {...register("amount")} />
            </Field>
            
            <Field label="Verification Status" error={errors.status?.message}>
              <NativeSelect className="rounded-xl focus-visible:ring-saffron" {...register("status")}>
                <option value="PENDING">Pending Verification</option>
                <option value="VERIFIED">Verified</option>
              </NativeSelect>
            </Field>
          </div>
          
          <DialogFooter className="flex sm:justify-end gap-3 sm:gap-0 border-t border-border/40 pt-6">
            <Button type="button" variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-saffron hover:bg-saffron/90 w-full sm:w-auto sm:ml-2 shadow-sm text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
