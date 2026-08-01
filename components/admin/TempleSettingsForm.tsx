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
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Temple Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure global preferences, branding, and integrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => { reset(defaultValues); setToast(null); }} disabled={isSubmitting || !isDirty}>
            Discard Changes
          </Button>
          <Button type="submit" className="rounded-xl bg-saffron hover:bg-saffron/90 w-full sm:w-auto shadow-sm text-white" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </div>

      {toast ? (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <Section title="🏛️ General Information" description="Basic details about the temple that will be displayed publicly.">
            <Field label="Temple Name" error={errors.templeName?.message} required>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("templeName")} />
            </Field>
            <Field label="Description" error={errors.templeDescription?.message}>
              <Textarea className="rounded-xl focus-visible:ring-saffron resize-none min-h-[100px]" {...register("templeDescription")} />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Contact Number" error={errors.contactNumber?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("contactNumber")} />
              </Field>
              <Field label="Email Address" error={errors.email?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" type="email" {...register("email")} />
              </Field>
            </div>
            <Field label="Physical Address" error={errors.address?.message}>
              <Textarea className="rounded-xl focus-visible:ring-saffron resize-none" {...register("address")} />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Temple Timings" error={errors.templeTimings?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("templeTimings")} placeholder="e.g., 6:00 AM - 9:00 PM" />
              </Field>
              <Field label="Support Contact" error={errors.supportContact?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("supportContact")} placeholder="e.g., Support phone or email" />
              </Field>
            </div>
          </Section>

          <Section title="💳 Payment Configuration" description="Set up how you receive UPI payments and handle receipts.">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="UPI ID / VPA" error={errors.upiId?.message} required>
                <Input className="rounded-xl focus-visible:ring-saffron font-medium" {...register("upiId")} placeholder="username@bank" />
              </Field>
              <Field label="UPI Display Name" error={errors.upiDisplayName?.message} required>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("upiDisplayName")} />
              </Field>
            </div>
            <Field label="Receiver Name (Internal)" error={errors.receiverName?.message} required>
              <Input className="rounded-xl focus-visible:ring-saffron" {...register("receiverName")} />
            </Field>
            <Field label="Default Payment Intent App">
              <NativeSelect className="rounded-xl focus-visible:ring-saffron" {...register("defaultPaymentApp")}>
                {DEFAULT_PAYMENT_APP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </NativeSelect>
            </Field>
          </Section>

          <Section title="🌐 Social Media Presence" description="Links to your official social media profiles.">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Facebook">
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("socialMediaLinks.facebook")} placeholder="https://facebook.com/..." />
              </Field>
              <Field label="Instagram">
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("socialMediaLinks.instagram")} placeholder="https://instagram.com/..." />
              </Field>
              <Field label="YouTube">
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("socialMediaLinks.youtube")} placeholder="https://youtube.com/..." />
              </Field>
              <Field label="Twitter / X">
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("socialMediaLinks.twitter")} placeholder="https://twitter.com/..." />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Official Website">
                  <Input className="rounded-xl focus-visible:ring-saffron" {...register("socialMediaLinks.website")} placeholder="https://..." />
                </Field>
              </div>
            </div>
          </Section>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <Section title="🎨 Visual Branding" description="Manage logos, banners, and footer text.">
            <div className="space-y-6">
              <Field label="Temple Logo" error={errors.logoUrl?.message}>
                <div className="rounded-xl overflow-hidden border border-border/40">
                  <FileUpload 
                    value={watch("logoUrl") || ""}
                    onChange={(url) => setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true })}
                    accept="image/*"
                    label="Upload Logo"
                  />
                </div>
              </Field>
              <Field label="Hero Banner" error={errors.bannerUrl?.message}>
                <div className="rounded-xl overflow-hidden border border-border/40">
                  <FileUpload 
                    value={watch("bannerUrl") || ""}
                    onChange={(url) => setValue("bannerUrl", url, { shouldDirty: true, shouldValidate: true })}
                    accept="image/*"
                    label="Upload Banner"
                  />
                </div>
              </Field>
              <Field label="Website Footer Text" error={errors.websiteFooter?.message}>
                <Textarea className="rounded-xl focus-visible:ring-saffron resize-none min-h-[80px]" {...register("websiteFooter")} placeholder="Copyright info, etc." />
              </Field>
              <Field label="Receipt Footer Text" error={errors.receiptFooter?.message}>
                <Textarea className="rounded-xl focus-visible:ring-saffron resize-none min-h-[80px]" {...register("receiptFooter")} placeholder="Thank you message for printed receipts." />
              </Field>
            </div>
          </Section>

          <Section title="🔔 Ambience & Audio" description="Background devotional music settings.">
            <Field label="Devotional Audio File">
              <div className="rounded-xl overflow-hidden border border-border/40">
                <FileUpload 
                  value={watch("audioUrl") || ""}
                  onChange={(url) => setValue("audioUrl", url, { shouldDirty: true, shouldValidate: true })}
                  accept="audio/*"
                  label="Upload Audio (MP3)"
                />
              </div>
            </Field>
          </Section>

        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/40 bg-white overflow-hidden shadow-sm">
      <div className="border-b border-border/40 bg-slate-50/50 px-6 py-4">
        <h3 className="font-serif text-lg font-bold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="p-6 space-y-6">
        {children}
      </div>
    </section>
  );
}

function Field({ label, error, hint, required, children }: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground/80 font-medium">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
