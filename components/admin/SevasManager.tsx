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
      const exists = current.some((seva) => seva._id === saved._id);
      if (exists) {
        return current.map((seva) => (seva._id === saved._id ? saved : seva));
      }
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
        active: !seva.active
      })
    });
    const data = await response.json();
    if (response.ok) {
      upsertSeva(data.seva);
    }
  }

  async function deleteSeva(seva: SevaPlain) {
    if (!window.confirm(`Delete ${seva.name}?`)) {
      return;
    }

    const response = await fetch(`/api/admin/sevas/${seva._id}`, { method: "DELETE" });
    if (response.ok) {
      setSevas((current) => current.filter((item) => item._id !== seva._id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Seva
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Suggested Amount</Th>
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
                <Td>Rs {seva.suggestedAmount}</Td>
                <Td><Badge variant={seva.active ? "default" : "secondary"}>{seva.active ? "Active" : "Disabled"}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(seva);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(seva)}>
                      {seva.active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteSeva(seva)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
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
