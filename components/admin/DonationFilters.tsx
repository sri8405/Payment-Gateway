"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

export type DonationFilterState = {
  search: string;
  from: string;
  to: string;
  sevaId: string;
  status: string;
};

type Props = {
  filters: DonationFilterState;
  sevas: SevaPlain[];
  onChange: (filters: DonationFilterState) => void;
};

export function DonationFilters({ filters, sevas, onChange }: Props) {
  function update(key: keyof DonationFilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Input placeholder="Search name, gothra, ID" value={filters.search} onChange={(event) => update("search", event.target.value)} />
      <Input type="date" value={filters.from} onChange={(event) => update("from", event.target.value)} />
      <Input type="date" value={filters.to} onChange={(event) => update("to", event.target.value)} />
      <NativeSelect value={filters.sevaId} onChange={(event) => update("sevaId", event.target.value)}>
        <option value="">All sevas</option>
        {sevas.map((seva) => (
          <option key={seva._id} value={seva._id}>{seva.name}</option>
        ))}
      </NativeSelect>
      <NativeSelect value={filters.status} onChange={(event) => update("status", event.target.value)}>
        <option value="">All statuses</option>
        <option value="PENDING">PENDING</option>
        <option value="VERIFIED">VERIFIED</option>
      </NativeSelect>
    </div>
  );
}
