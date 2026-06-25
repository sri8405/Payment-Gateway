"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  templeSettingsSchema,
  DEFAULT_PAYMENT_APP_OPTIONS,
  type TempleSettingsInput
} from "@/lib/validations/templeSettings";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

type Props = {
  initialSettings: TempleSettingsPlain;
};

type ToastState = { type: "success" | "error"; message: string } | null;

export function TempleSettingsForm({ initialSettings }: Props) {
  const [toast, setToast] = useState<ToastState>(null);

  const defaultValues: z.input<typeof templeSettingsSchema> = {
    templeName: initialSettings.templeName,
    templeDescription: initialSettings.templeDescription || "",
    upiId: initialSettings.upiId,
    upiDisplayName: initialSettings.upiDisplayName,
    receiverName: initialSettings.receiverName || initialSettings.templeName,
    defaultPaymentApp: initialSettings.defaultPaymentApp ?? "generic",
    contactNumber: initialSettings.contactNumber || "",
    email: initialSettings.email || "",
    address: initialSettings.address || "",
    logoUrl: initialSettings.logoUrl || "/assets/guruji.jpg",
    receiptFooter: initialSettings.receiptFooter || "May Guruji's blessings always be with you."
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<z.input<typeof templeSettingsSchema>, unknown, TempleSettingsInput>({
    resolver: zodResolver(templeSettingsSchema),
    defaultValues
  });

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }

  async function onSubmit(values: TempleSettingsInput) {
    setToast(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (response.ok) {
        // Update form defaults so "isDirty" resets correctly
        reset(values as z.input<typeof templeSettingsSchema>);
        showToast("success", "Settings saved successfully.");
      } else {
        showToast("error", data.error || "Failed to save settings.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    }
  }

  function handleReset() {
    reset(defaultValues);
    setToast(null);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Toast */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-md border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Temple Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Temple Information</h2>
        <Field label="Temple Name" error={errors.templeName?.message} required>
          <Input {...register("templeName")} />
        </Field>
        <Field label="Description" error={errors.templeDescription?.message}>
          <Textarea {...register("templeDescription")} />
        </Field>
        <Field label="Contact Number" error={errors.contactNumber?.message}>
          <Input {...register("contactNumber")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <Field label="Address" error={errors.address?.message}>
          <Textarea {...register("address")} />
        </Field>
      </section>

      {/* Payment Settings */}
      <section className="space-y-4 rounded-md border p-4">
        <div>
          <h2 className="text-lg font-semibold">Payment Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These values are used to generate UPI payment links and QR codes for every new seva booking.
            Saving here takes effect immediately — no redeployment needed.
          </p>
        </div>

        <Field label="UPI ID" error={errors.upiId?.message} required hint="e.g. 9880742348@ybl">
          <Input
            {...register("upiId")}
            placeholder="username@bank"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <Field
          label="Account Holder / Receiver Name"
          error={errors.receiverName?.message}
          required
          hint="Shown on the payment screen and printed on the PDF receipt (max 100 characters)"
        >
          <Input
            {...register("receiverName")}
            placeholder="Sri Padmananda Guruji Ashrama"
            maxLength={100}
          />
        </Field>

        <Field label="UPI Display Name" error={errors.upiDisplayName?.message} required hint="Short name embedded in the UPI deep link">
          <Input {...register("upiDisplayName")} />
        </Field>

        <Field label="Default Payment App" error={errors.defaultPaymentApp?.message} hint="Pre-selects an app button on the payment page (optional preference)">
          <NativeSelect {...register("defaultPaymentApp")}>
            {DEFAULT_PAYMENT_APP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </section>

      {/* Receipt Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Receipt Settings</h2>
        <Field label="Footer Text" error={errors.receiptFooter?.message}>
          <Textarea {...register("receiptFooter")} />
        </Field>
        <Field label="Logo / Guruji Image URL" error={errors.logoUrl?.message}>
          <Input {...register("logoUrl")} />
        </Field>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting || !isDirty}>
          Reset
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  children
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
