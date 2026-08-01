"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { sevaSchema, type SevaInput } from "@/lib/validations/seva";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import { FileUpload } from "@/components/admin/FileUpload";
import { Loader2, Plus, X } from "lucide-react";

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
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl gap-0 max-h-[90vh] flex flex-col">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-border/40 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">
              {seva ? "Edit Seva Configuration" : "Create New Seva"}
            </DialogTitle>
            <DialogDescription>
              {seva ? "Update the details, pricing, and image for this seva." : "Add a new seva offering for devotees."}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="overflow-y-auto p-6 flex-1">
          <form id="seva-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Basic Details</h3>
              </div>
              
              <div className="sm:col-span-2">
                <Field label="Seva Name" error={errors.name?.message}>
                  <Input className="rounded-xl focus-visible:ring-saffron" placeholder="e.g., Archana, Abhishekam" {...register("name")} />
                </Field>
              </div>
              
              <div className="sm:col-span-2">
                <Field label="Description" error={errors.description?.message}>
                  <Textarea className="rounded-xl focus-visible:ring-saffron resize-none min-h-[100px]" placeholder="Explain the significance and details of this seva..." {...register("description")} />
                </Field>
              </div>
              
              <Field label="Category" error={errors.category?.message}>
                <Input className="rounded-xl focus-visible:ring-saffron" {...register("category")} placeholder="e.g., Daily Puja, Special Seva" />
              </Field>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 text-sm font-medium cursor-pointer p-3 rounded-xl border border-border/40 hover:bg-slate-50 transition-colors w-full">
                  <Checkbox
                    checked={watch("active") === true}
                    onCheckedChange={(checked) => setValue("active", checked === true)}
                    className="data-[state=checked]:bg-saffron data-[state=checked]:border-saffron"
                  />
                  <span>Active & Visible to Devotees</span>
                </label>
              </div>

              <div className="sm:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Pricing Configuration</h3>
              </div>

              <div className="sm:col-span-2">
                <Field label="Pricing Mode">
                  <NativeSelect className="rounded-xl focus-visible:ring-saffron" {...register("pricingMode")}>
                    <option value="fixed">Fixed Amount (Single fixed price)</option>
                    <option value="custom">Custom Amount (Devotee enters their own amount)</option>
                    <option value="options">Multiple Fixed Options (Devotee chooses from predefined tiers)</option>
                  </NativeSelect>
                </Field>
              </div>

              {pricingMode === "fixed" ? (
                <div className="sm:col-span-2">
                  <Field label="Fixed Amount (₹)" error={errors.fixedAmount?.message}>
                    <Input className="rounded-xl focus-visible:ring-saffron w-full sm:w-1/2 font-medium" type="number" min={1} {...register("fixedAmount")} />
                  </Field>
                </div>
              ) : pricingMode === "custom" ? (
                <div className="sm:col-span-2">
                  <Field label="Default Amount (₹)" error={errors.defaultAmount?.message}>
                    <Input className="rounded-xl focus-visible:ring-saffron w-full sm:w-1/2 font-medium" type="number" min={1} {...register("defaultAmount")} />
                    <p className="text-xs font-medium text-muted-foreground/80 mt-1">
                      Pre-filled amount — devotees can increase or decrease this value during booking.
                    </p>
                  </Field>
                </div>
              ) : (
                <div className="sm:col-span-2 space-y-4">
                  <Field label="Amount Tiers (₹)" error={errors.amountOptions?.message}>
                    <div className="p-4 bg-slate-50 rounded-xl border border-border/40">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {amountOptions.map((amt, idx) => (
                          <div key={idx} className="relative group">
                            <Input 
                              className="rounded-lg pr-8 font-medium focus-visible:ring-saffron bg-white"
                              type="number" 
                              min={1} 
                              value={amt} 
                              onChange={(e) => {
                                const newOptions = [...amountOptions];
                                newOptions[idx] = parseInt(e.target.value) || 0;
                                setValue("amountOptions", newOptions, { shouldValidate: true });
                              }}
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const newOptions = amountOptions.filter((_, i) => i !== idx);
                                setValue("amountOptions", newOptions, { shouldValidate: true });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg bg-white shadow-sm border-dashed"
                        onClick={() => {
                          setValue("amountOptions", [...amountOptions, 100], { shouldValidate: true });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Tier
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

              <div className="sm:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Media</h3>
              </div>

              <div className="sm:col-span-2">
                <Field label="Seva Image" error={errors.imageUrl?.message}>
                  <div className="rounded-xl overflow-hidden border border-border/40">
                    <FileUpload 
                      value={watch("imageUrl") || ""}
                      onChange={(url) => setValue("imageUrl", url, { shouldValidate: true })}
                      accept="image/*"
                      label="Upload Seva Image"
                    />
                  </div>
                </Field>
              </div>

            </div>
          </form>
        </div>
        
        <div className="bg-slate-50/50 px-6 py-4 border-t border-border/40 shrink-0">
          <DialogFooter className="flex sm:justify-end gap-3 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button form="seva-form" type="submit" className="rounded-xl bg-saffron hover:bg-saffron/90 w-full sm:w-auto sm:ml-2 shadow-sm text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Seva"}
            </Button>
          </DialogFooter>
        </div>
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
