"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { DonationFilters, type DonationFilterState } from "@/components/admin/DonationFilters";
import { DonationEditModal } from "@/components/admin/DonationEditModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { serializeCsv } from "@/lib/utils/csv";
import type { DonationPlain } from "@/lib/db/repositories/donationRepository";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";

type Props = {
  initialRows: DonationPlain[];
  initialTotal: number;
  sevas: SevaPlain[];
};

const pageSize = 20;

export function DonationsTable({ initialRows, initialTotal, sevas }: Props) {
  const [filters, setFilters] = useState<DonationFilterState>({ search: "", from: "", to: "", sevaId: "", status: "" });
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingDonation, setEditingDonation] = useState<DonationPlain | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DonationPlain | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, page]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/admin/donations?${query}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setRows(data.rows || []);
        setTotal(data.total || 0);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  async function toggleStatus(donation: DonationPlain) {
    const nextStatus = donation.status === "VERIFIED" ? "PENDING" : "VERIFIED";
    const response = await fetch(`/api/admin/donations/${donation.donationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (response.ok) {
      const data = await response.json();
      setRows((current) => current.map((row) => (row.donationId === donation.donationId ? data.donation : row)));
    }
  }

  function upsertDonation(saved: DonationPlain) {
    setRows((current) => current.map((row) => (row.donationId === saved.donationId ? saved : row)));
  }

  function showToast(text: string, type: "success" | "error") {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 3000);
  }

  function confirmDelete(donation: DonationPlain) {
    setDeleteTarget(donation);
    setDeleteConfirmOpen(true);
  }

  async function deleteDonation() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.donationId);
    setDeleteConfirmOpen(false);
    try {
      const response = await fetch(`/api/admin/donations/${deleteTarget._id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setRows((current) => current.filter((row) => row.donationId !== deleteTarget.donationId));
        setTotal((current) => current - 1);
        showToast("Booking deleted successfully.", "success");
      } else {
        const data = await response.json().catch(() => ({}));
        showToast(data.error || "Failed to delete booking.", "error");
      }
    } catch {
      showToast("Failed to delete booking.", "error");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  function exportCsv() {
    const csv = serializeCsv(
      rows.map((row) => ({
        donationId: row.donationId,
        name: row.name,
        gothra: row.gothra,
        mobile: row.mobile,
        email: row.email,
        sevaName: row.sevaName,
        amount: row.amount,
        status: row.status,
        createdAt: new Date(row.createdAt)
      })),
      ["donationId", "name", "gothra", "mobile", "email", "sevaName", "amount", "status", "createdAt"]
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seva-bookings.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="space-y-4">
      <DonationFilters
        filters={filters}
        sevas={sevas}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${total} seva bookings`}</p>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <thead>
            <tr>
              <Th>Seva Booking ID</Th>
              <Th>Name</Th>
              <Th>Gothra</Th>
              <Th>Seva</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((donation) => (
              <tr key={donation._id} className="border-t">
                <Td>{donation.donationId}</Td>
                <Td>{donation.name}</Td>
                <Td>{donation.gothra}</Td>
                <Td>{donation.sevaName}</Td>
                <Td>Rs {donation.amount}</Td>
                <Td>{new Date(donation.createdAt).toLocaleDateString()}</Td>
                <Td><Badge variant={donation.status === "VERIFIED" ? "default" : "secondary"}>{donation.status}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDonation(donation);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button asChild variant="ghost" size="icon" aria-label="View seva booking">
                      <Link href={`/admin/donations/${donation.donationId}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete seva booking"
                      disabled={deletingId === donation.donationId}
                      onClick={() => confirmDelete(donation)}
                    >
                      {deletingId === donation.donationId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(donation)}>
                      {donation.status === "VERIFIED" ? "Mark Pending" : "Mark Verified"}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
        <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div>
      <DonationEditModal
        open={editOpen}
        donation={editingDonation}
        sevas={sevas}
        onOpenChange={setEditOpen}
        onSaved={upsertDonation}
      />
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Booking?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete this seva booking? This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteDonation}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toastMessage.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
