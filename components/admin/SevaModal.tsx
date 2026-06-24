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
import { sevaSchema, type SevaInput } from "@/lib/validations/seva";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

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
    formState: { errors, isSubmitting }
  } = useForm<z.input<typeof sevaSchema>, unknown, SevaInput>({
    resolver: zodResolver(sevaSchema),
    defaultValues: { name: "", description: "", suggestedAmount: 100, active: true }
  });

  useEffect(() => {
    reset({
      name: seva?.name || "",
      description: seva?.description || "",
      suggestedAmount: seva?.suggestedAmount || 100,
      active: seva?.active ?? true
    });
  }, [reset, seva, open]);

  async function onSubmit(values: SevaInput) {
    const response = await fetch(seva ? `/api/admin/sevas/${seva._id}` : "/api/admin/sevas", {
      method: seva ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await response.json();
    if (response.ok) {
      onSaved(data.seva);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seva ? "Edit Seva" : "Add Seva"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea {...register("description")} />
          </Field>
          <Field label="Suggested Amount" error={errors.suggestedAmount?.message}>
            <Input type="number" min={1} {...register("suggestedAmount")} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={watch("active") === true} onCheckedChange={(checked) => setValue("active", checked === true)} />
            Active
          </label>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Seva"}</Button>
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
