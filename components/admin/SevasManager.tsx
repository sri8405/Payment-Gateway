"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Power, PowerOff, Settings, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    if (!window.confirm(`Are you sure you want to delete the "${seva.name}" seva?`)) return;
    const response = await fetch(`/api/admin/sevas/${seva._id}`, { method: "DELETE" });
    if (response.ok) setSevas((c) => c.filter((s) => s._id !== seva._id));
  }

  const getAmountDisplay = (seva: SevaPlain) => {
    if (seva.pricingMode === 'options') return "₹100 - ₹1000";
    if (seva.pricingMode === 'custom') return `₹${seva.defaultAmount || seva.suggestedAmount}+`;
    return `₹${seva.fixedAmount || seva.suggestedAmount}`;
  };

  const getModeDisplay = (mode?: string) => {
    if (mode === 'options') return 'Tiered Options';
    if (mode === 'custom') return 'Custom Input';
    return 'Fixed Price';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Manage Sevas</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure offerings, pricing, and availability.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-xl shadow-sm bg-saffron hover:bg-saffron/90 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add New Seva
        </Button>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="grid gap-4 md:hidden">
        {sevas.map((seva) => (
          <div key={seva._id} className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all ${seva.active ? 'border-border/40' : 'border-dashed border-border opacity-75'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-lg">{seva.name}</h3>
                  <div className={`h-2 w-2 rounded-full ${seva.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                {seva.description ? <p className="text-sm text-muted-foreground line-clamp-2">{seva.description}</p> : null}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-slate-50/50 p-3 rounded-xl border border-border/40">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Pricing</p>
                <p className="font-semibold text-foreground">{getAmountDisplay(seva)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{getModeDisplay(seva.pricingMode)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Category</p>
                <Badge variant="secondary" className="rounded-lg bg-white border-border/40 font-medium">
                  {seva.category || "General"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
              <Button variant="outline" size="sm" className="rounded-lg flex-1 h-11" onClick={() => { setEditing(seva); setOpen(true); }}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant={seva.active ? "secondary" : "outline"} size="sm" className={`rounded-lg flex-1 h-11 ${!seva.active && 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`} onClick={() => toggleActive(seva)}>
                {seva.active ? <><PowerOff className="mr-2 h-3.5 w-3.5" /> Disable</> : <><Power className="mr-2 h-3.5 w-3.5" /> Enable</>}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => deleteSeva(seva)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {sevas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-slate-50/50 py-12 text-center">
            <Settings className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No sevas configured yet.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/40 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 border-b border-border/40">
              <tr>
                <th className="px-6 py-4 font-medium w-1/3">Seva Details</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Pricing Model</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sevas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <Info className="h-6 w-6 text-slate-400" />
                      </div>
                      <p>No sevas configured yet. Click "Add New Seva" to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sevas.map((seva) => (
                  <tr key={seva._id} className={`transition-colors hover:bg-slate-50/50 ${!seva.active && 'bg-slate-50/30'}`}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-1.5 w-1.5 rounded-full ${seva.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`font-semibold ${seva.active ? 'text-foreground' : 'text-slate-500'}`}>{seva.name}</span>
                      </div>
                      {seva.description ? <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{seva.description}</div> : null}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <Badge variant="secondary" className="rounded-lg bg-slate-100 border-border/40 font-medium text-slate-600">
                        {seva.category || "General"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-foreground">{getAmountDisplay(seva)}</div>
                      <div className="text-xs text-slate-500 mt-1">{getModeDisplay(seva.pricingMode)}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {seva.active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-foreground rounded-lg" onClick={() => { setEditing(seva); setOpen(true); }} title="Edit Seva">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${seva.active ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}`} onClick={() => toggleActive(seva)} title={seva.active ? "Disable Seva" : "Enable Seva"}>
                          {seva.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg" onClick={() => deleteSeva(seva)} title="Delete Seva">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SevaModal open={open} seva={editing} onOpenChange={setOpen} onSaved={upsertSeva} />
    </div>
  );
}
