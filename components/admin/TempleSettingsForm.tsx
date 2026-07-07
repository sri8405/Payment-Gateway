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
  type TempleSettingsInput,
} from "@/lib/validations/templeSettings";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";
import { FileUpload } from "@/components/admin/FileUpload";

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
    receiptFooter: initialSettings.receiptFooter || "",
    bannerUrl: initialSettings.bannerUrl || "",
    websiteFooter: initialSettings.websiteFooter || "",
    templeTimings: initialSettings.templeTimings || "",
    supportContact: initialSettings.supportContact || "",
    socialMediaLinks: {
      facebook: initialSettings.socialMediaLinks?.facebook || "",
      instagram: initialSettings.socialMediaLinks?.instagram || "",
      youtube: initialSettings.socialMediaLinks?.youtube || "",
      twitter: initialSettings.socialMediaLinks?.twitter || "",
      website: initialSettings.socialMediaLinks?.website || "",
    },
    phonepeClientId: initialSettings.phonepeClientId || "",
    phonepeClientSecret: initialSettings.phonepeClientSecret || "",
    phonepeClientVersion: initialSettings.phonepeClientVersion || "",
    phonepeMerchantId: initialSettings.phonepeMerchantId || "",
    phonepeRedirectUrl: initialSettings.phonepeRedirectUrl || "",
    phonepeCallbackUrl: initialSettings.phonepeCallbackUrl || "",
    audioEnabled: initialSettings.audioEnabled ?? true,
    audioUrl: initialSettings.audioUrl || "/audio/devotional.mp3",
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.input<typeof templeSettingsSchema>, unknown, TempleSettingsInput>({
    resolver: zodResolver(templeSettingsSchema),
    defaultValues,
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
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        reset(values as z.input<typeof templeSettingsSchema>);
        showToast("success", "Settings saved successfully.");
      } else {
        showToast("error", data.error || "Failed to save settings.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {toast ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Temple Information */}
      <Section title="🏛️ Temple Information">
        <Field label="Temple Name" error={errors.templeName?.message} required>
          <Input {...register("templeName")} />
        </Field>
        <Field label="Description" error={errors.templeDescription?.message}>
          <Textarea {...register("templeDescription")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Number" error={errors.contactNumber?.message}>
            <Input {...register("contactNumber")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
        </div>
        <Field label="Address" error={errors.address?.message}>
          <Textarea {...register("address")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Temple Timings" error={errors.templeTimings?.message}>
            <Input {...register("templeTimings")} placeholder="e.g., 6:00 AM - 9:00 PM" />
          </Field>
          <Field label="Support Contact" error={errors.supportContact?.message}>
            <Input {...register("supportContact")} />
          </Field>
        </div>
      </Section>

      {/* Branding */}
      <Section title="🎨 Branding">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo Image" error={errors.logoUrl?.message}>
            <FileUpload 
              value={watch("logoUrl") || ""}
              onChange={(url) => setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true })}
              accept="image/*"
              label="Upload Logo"
            />
          </Field>
          <Field label="Banner Image" error={errors.bannerUrl?.message}>
            <FileUpload 
              value={watch("bannerUrl") || ""}
              onChange={(url) => setValue("bannerUrl", url, { shouldDirty: true, shouldValidate: true })}
              accept="image/*"
              label="Upload Banner"
            />
          </Field>
        </div>
        <Field label="Website Footer Text" error={errors.websiteFooter?.message}>
          <Input {...register("websiteFooter")} />
        </Field>
        <Field label="Receipt Footer Text" error={errors.receiptFooter?.message}>
          <Textarea {...register("receiptFooter")} />
        </Field>
      </Section>

      {/* Payment Settings */}
      <Section title="💳 UPI Payment Settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="UPI ID" error={errors.upiId?.message} required>
            <Input {...register("upiId")} placeholder="username@bank" />
          </Field>
          <Field label="UPI Display Name" error={errors.upiDisplayName?.message} required>
            <Input {...register("upiDisplayName")} />
          </Field>
        </div>
        <Field label="Receiver Name" error={errors.receiverName?.message} required>
          <Input {...register("receiverName")} />
        </Field>
        <Field label="Default Payment App">
          <NativeSelect {...register("defaultPaymentApp")}>
            {DEFAULT_PAYMENT_APP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </Section>

      {/* Social Media */}
      <Section title="🌐 Social Media">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook">
            <Input {...register("socialMediaLinks.facebook")} placeholder="https://facebook.com/..." />
          </Field>
          <Field label="Instagram">
            <Input {...register("socialMediaLinks.instagram")} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="YouTube">
            <Input {...register("socialMediaLinks.youtube")} placeholder="https://youtube.com/..." />
          </Field>
          <Field label="Twitter">
            <Input {...register("socialMediaLinks.twitter")} placeholder="https://twitter.com/..." />
          </Field>
          <Field label="Website">
            <Input {...register("socialMediaLinks.website")} placeholder="https://..." />
          </Field>
        </div>
      </Section>

      {/* Audio */}
      <Section title="🔔 Devotional Audio">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Devotional Audio File">
            <FileUpload 
              value={watch("audioUrl") || ""}
              onChange={(url) => setValue("audioUrl", url, { shouldDirty: true, shouldValidate: true })}
              accept="audio/*"
              label="Upload Audio"
            />
          </Field>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => { reset(defaultValues); setToast(null); }} disabled={isSubmitting || !isDirty}>
          Reset
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-gold/15 bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-copper">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, error, hint, required, children }: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
