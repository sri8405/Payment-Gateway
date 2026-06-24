"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { templeSettingsSchema, type TempleSettingsInput } from "@/lib/validations/templeSettings";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

type Props = {
  initialSettings: TempleSettingsPlain;
};

export function TempleSettingsForm({ initialSettings }: Props) {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof templeSettingsSchema>, unknown, TempleSettingsInput>({
    resolver: zodResolver(templeSettingsSchema),
    defaultValues: {
      templeName: initialSettings.templeName,
      templeDescription: initialSettings.templeDescription || "",
      upiId: initialSettings.upiId,
      upiDisplayName: initialSettings.upiDisplayName,
      contactNumber: initialSettings.contactNumber || "",
      email: initialSettings.email || "",
      address: initialSettings.address || "",
      logoUrl: initialSettings.logoUrl || "/assets/guruji.jpg",
      receiptFooter: initialSettings.receiptFooter || "May Guruji's blessings always be with you."
    }
  });

  async function onSubmit(values: TempleSettingsInput) {
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Settings saved successfully.");
    } else {
      setMessage(data.error || "Failed to save settings.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {message ? <p className="rounded-md border bg-muted p-3 text-sm">{message}</p> : null}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Temple Information</h2>
        <Field label="Temple Name" error={errors.templeName?.message}>
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
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Payment Settings</h2>
        <Field label="UPI ID" error={errors.upiId?.message}>
          <Input {...register("upiId")} />
        </Field>
        <Field label="UPI Display Name" error={errors.upiDisplayName?.message}>
          <Input {...register("upiDisplayName")} />
        </Field>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Receipt Settings</h2>
        <Field label="Footer Text" error={errors.receiptFooter?.message}>
          <Textarea {...register("receiptFooter")} />
        </Field>
        <Field label="Logo / Guruji Image URL" error={errors.logoUrl?.message}>
          <Input {...register("logoUrl")} />
        </Field>
      </section>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
    </form>
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
