"use client";

import { NativeSelect } from "@/components/ui/native-select";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

type Props = {
  sevas: SevaPlain[];
  value?: string;
  onChange: (sevaId: string) => void;
};

export function SevaSelector({ sevas, value, onChange }: Props) {
  return (
    <NativeSelect value={value || ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select seva</option>
      {sevas.map((seva) => (
        <option key={seva._id} value={seva._id}>
          {seva.name} - Rs {seva.suggestedAmount}
        </option>
      ))}
    </NativeSelect>
  );
}
