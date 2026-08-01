"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import { Search, Calendar, Filter, CreditCard } from "lucide-react";

export type DonationFilterState = {
  search: string;
  from: string;
  to: string;
  sevaId: string;
  status: string;
  paymentSource?: string;
  paymentMethod?: string;
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
    <div className="rounded-xl border border-border/40 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
        <Filter className="h-4 w-4 text-saffron" />
        Filters
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 rounded-xl focus-visible:ring-saffron" 
            placeholder="Search name, phone, ID..." 
            value={filters.search} 
            onChange={(event) => update("search", event.target.value)} 
          />
        </div>
        
        <div className="relative">
          <Input 
            className="rounded-xl focus-visible:ring-saffron" 
            type="date" 
            value={filters.from} 
            onChange={(event) => update("from", event.target.value)} 
            title="From Date"
          />
        </div>
        
        <div className="relative">
          <Input 
            className="rounded-xl focus-visible:ring-saffron" 
            type="date" 
            value={filters.to} 
            onChange={(event) => update("to", event.target.value)} 
            title="To Date"
          />
        </div>
        
        <div className="relative">
          <NativeSelect 
            className="rounded-xl focus-visible:ring-saffron" 
            value={filters.sevaId} 
            onChange={(event) => update("sevaId", event.target.value)}
          >
            <option value="">All Sevas</option>
            {sevas.map((seva) => (
              <option key={seva._id} value={seva._id}>{seva.name}</option>
            ))}
          </NativeSelect>
        </div>
        
        <div className="relative">
          <NativeSelect 
            className="rounded-xl focus-visible:ring-saffron" 
            value={filters.status} 
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
          </NativeSelect>
        </div>
        
        <div className="relative">
          <NativeSelect 
            className="rounded-xl focus-visible:ring-saffron" 
            value={filters.paymentSource || ""} 
            onChange={(event) => update("paymentSource", event.target.value)}
          >
            <option value="">All Sources</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </NativeSelect>
        </div>

      </div>
    </div>
  );
}
