"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { sevaSchema, type SevaInput } from "@/lib/validations/seva";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import { FileUpload } from "@/components/admin/FileUpload";

type Props = {
  open: boolean;
  seva?: SevaPlain | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (seva: SevaPlain) => void;
};

export function SevaModal({ open, seva, onOpenChange, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof sevaSchema>, unknown, SevaInput>({
    resolver: zodResolver(sevaSchema),
    defaultValues: {
      name: "",
      description: "",
      suggestedAmount: 100,
      active: true,
      pricingMode: "fixed",
      fixedAmount: 100,
      defaultAmount: 100,
      amountOptions: [100, 250, 500, 750, 1000],
      category: "",
      imageUrl: "",
    },
  });

  const pricingMode = watch("pricingMode");
  const amountOptions = watch("amountOptions") || [];

  useEffect(() => {
    reset({
      name: seva?.name || "",
      description: seva?.description || "",
      suggestedAmount: seva?.suggestedAmount || 100,
      active: seva?.active ?? true,
      pricingMode: seva?.pricingMode || "fixed",
      fixedAmount: seva?.fixedAmount || seva?.suggestedAmount || 100,
      defaultAmount: seva?.defaultAmount || seva?.suggestedAmount || 100,
      amountOptions: seva?.amountOptions?.length ? seva.amountOptions : [100, 250, 500, 750, 1000],
      category: seva?.category || "",
      imageUrl: seva?.imageUrl || "",
    });
  }, [reset, seva, open]);

  async function onSubmit(values: SevaInput) {
    const response = await fetch(
      seva ? `/api/admin/sevas/${seva._id}` : "/api/admin/sevas",
      {
        method: seva ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );
    const data = await response.json();
    if (response.ok) {
      onSaved(data.seva);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-copper">
            {seva ? "Edit Seva" : "Add Seva"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register("description")} />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <Input {...register("category")} placeholder="e.g., Daily Puja, Special Seva" />
          </Field>

          {/* Pricing Mode */}
          <Field label="Pricing Mode">
            <NativeSelect {...register("pricingMode")}>
              <option value="fixed">Fixed Amount</option>
              <option value="custom">Custom Amount (devotee can adjust)</option>
              <option value="options">Multiple Fixed Options</option>
            </NativeSelect>
          </Field>

          {pricingMode === "fixed" ? (
            <Field label="Fixed Amount (₹)" error={errors.fixedAmount?.message}>
              <Input type="number" min={1} {...register("fixedAmount")} />
            </Field>
          ) : pricingMode === "custom" ? (
            <Field label="Default Amount (₹)" error={errors.defaultAmount?.message}>
              <Input type="number" min={1} {...register("defaultAmount")} />
              <p className="text-xs text-muted-foreground">
                Pre-filled amount — devotees can increase or decrease
              </p>
            </Field>
          ) : (
            <div className="space-y-4">
              <Field label="Amount Options (₹)" error={errors.amountOptions?.message}>
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex flex-col gap-2">
                    {amountOptions.map((amt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min={1} 
                          value={amt} 
                          onChange={(e) => {
                            const newOptions = [...amountOptions];
                            newOptions[idx] = parseInt(e.target.value) || 0;
                            setValue("amountOptions", newOptions, { shouldValidate: true });
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const newOptions = amountOptions.filter((_, i) => i !== idx);
                            setValue("amountOptions", newOptions, { shouldValidate: true });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setValue("amountOptions", [...amountOptions, 100], { shouldValidate: true });
                    }}
                  >
                    + Add Amount Option
                  </Button>
                </div>
              </Field>
              <input type="hidden" {...register("suggestedAmount")} value={amountOptions[0] || 100} />
            </div>
          )}

          {/* Hidden suggestedAmount for backward compatibility */}
          {pricingMode !== 'options' && (
            <input type="hidden" {...register("suggestedAmount")} value={pricingMode === 'fixed' ? watch('fixedAmount') : watch('defaultAmount')} />
          )}

          <Field label="Image" error={errors.imageUrl?.message}>
            <FileUpload 
              value={watch("imageUrl") || ""}
              onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })}
              accept="image/*"
              label="Upload Seva Image"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={watch("active") === true}
              onCheckedChange={(checked) => setValue("active", checked === true)}
            />
            Active
          </label>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Seva"}
          </Button>
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
