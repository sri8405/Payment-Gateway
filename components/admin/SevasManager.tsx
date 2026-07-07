"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { SevaModal } from "@/components/admin/SevaModal";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

type Props = {
  initialSevas: SevaPlain[];
};

export function SevasManager({ initialSevas }: Props) {
  const [sevas, setSevas] = useState(initialSevas);
  const [editing, setEditing] = useState<SevaPlain | null>(null);
  const [open, setOpen] = useState(false);

  function upsertSeva(saved: SevaPlain) {
    setSevas((current) => {
      const exists = current.some((s) => s._id === saved._id);
      if (exists) return current.map((s) => (s._id === saved._id ? saved : s));
      return [...current, saved].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async function toggleActive(seva: SevaPlain) {
    const response = await fetch(`/api/admin/sevas/${seva._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: seva.name,
        description: seva.description || "",
        suggestedAmount: seva.suggestedAmount,
        active: !seva.active,
        pricingMode: seva.pricingMode || "fixed",
        fixedAmount: seva.fixedAmount || seva.suggestedAmount,
        defaultAmount: seva.defaultAmount || seva.suggestedAmount,
        category: seva.category || "",
        imageUrl: seva.imageUrl || "",
      }),
    });
    const data = await response.json();
    if (response.ok) upsertSeva(data.seva);
  }

  async function deleteSeva(seva: SevaPlain) {
    if (!window.confirm(`Delete "${seva.name}"?`)) return;
    const response = await fetch(`/api/admin/sevas/${seva._id}`, { method: "DELETE" });
    if (response.ok) setSevas((c) => c.filter((s) => s._id !== seva._id));
  }

  const getAmountDisplay = (seva: SevaPlain) => {
    if (seva.pricingMode === 'options') return "₹100 - ₹1000";
    if (seva.pricingMode === 'custom') return `₹${seva.defaultAmount || seva.suggestedAmount}+`;
    return `₹${seva.fixedAmount || seva.suggestedAmount}`;
  };

  const getModeDisplay = (mode?: string) => {
    if (mode === 'options') return 'Options';
    if (mode === 'custom') return 'Custom';
    return 'Fixed';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-copper">Manage Sevas</h2>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Add Seva
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {sevas.map((seva) => (
          <div key={seva._id} className="rounded-xl border border-gold/15 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{seva.name}</p>
                {seva.description ? <p className="mt-0.5 text-sm text-muted-foreground">{seva.description}</p> : null}
              </div>
              <Badge variant={seva.active ? "default" : "secondary"}>{seva.active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{getModeDisplay(seva.pricingMode)}</Badge>
              <span className="font-semibold">{getAmountDisplay(seva)}</span>
              {seva.category ? <Badge variant="outline">{seva.category}</Badge> : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(seva); setOpen(true); }}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleActive(seva)}>
                {seva.active ? "Disable" : "Enable"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteSeva(seva)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gold/15 bg-white md:block">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Pricing</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sevas.map((seva) => (
              <tr key={seva._id} className="border-t">
                <Td>
                  <div className="font-medium">{seva.name}</div>
                  {seva.description ? <div className="text-sm text-muted-foreground">{seva.description}</div> : null}
                </Td>
                <Td>{seva.category || "—"}</Td>
                <Td><Badge variant="outline">{getModeDisplay(seva.pricingMode)}</Badge></Td>
                <Td>{getAmountDisplay(seva)}</Td>
                <Td><Badge variant={seva.active ? "default" : "secondary"}>{seva.active ? "Active" : "Inactive"}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(seva); setOpen(true); }}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(seva)}>
                      {seva.active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteSeva(seva)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <SevaModal open={open} seva={editing} onOpenChange={setOpen} onSaved={upsertSeva} />
    </div>
  );
}
