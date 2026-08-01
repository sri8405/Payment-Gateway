"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Download, Eye, Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
const cancellableStatuses = new Set(["PENDING", "INITIATED", "FAILED"]);

export function DonationsTable({ initialRows, initialTotal, sevas }: Props) {
  const [filters, setFilters] = useState<DonationFilterState>({ search: "", from: "", to: "", sevaId: "", status: "", paymentSource: "", paymentMethod: "" });
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingDonation, setEditingDonation] = useState<DonationPlain | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DonationPlain | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DonationPlain | null>(null);
  const [refundTarget, setRefundTarget] = useState<DonationPlain | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
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
      const response = await fetch(`/api/admin/donations/${deleteTarget._id}`, { method: "DELETE" });
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

  async function cancelDonation() {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/donations/${cancelTarget.donationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Cancelled by admin" })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to cancel booking.");
      upsertDonation(data.donation);
      showToast("Booking cancelled.", "success");
      setCancelTarget(null);
      setCancelReason("");
    } catch (error: any) {
      showToast(error.message || "Failed to cancel booking.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function refundDonation() {
    if (!refundTarget) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/donations/${refundTarget.donationId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason, amount: refundAmount || undefined })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to start refund.");
      upsertDonation(data.donation);
      showToast("Refund initiated.", "success");
      setRefundTarget(null);
      setRefundReason("");
      setRefundAmount("");
    } catch (error: any) {
      showToast(error.message || "Failed to start refund.", "error");
    } finally {
      setActionLoading(false);
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
        processingCharge: row.processingCharge || 0,
        totalPaid: row.totalPaid || row.amount,
        status: row.status,
        paymentStatus: row.paymentStatus,
        refundStatus: row.refundStatus,
        refundedAmount: row.refundedAmount,
        paymentSource: row.paymentSource,
        paymentMethod: row.paymentMethod,
        createdAt: new Date(row.createdAt)
      })),
      ["donationId", "name", "gothra", "mobile", "email", "sevaName", "amount", "processingCharge", "totalPaid", "status", "paymentStatus", "refundStatus", "refundedAmount", "paymentSource", "paymentMethod", "createdAt"]
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
      <DonationFilters filters={filters} sevas={sevas} onChange={(next) => { setFilters(next); setPage(1); }} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${total} seva bookings`}</p>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <thead>
            <tr>
              <Th>Seva Booking ID</Th><Th>Name</Th><Th>Seva</Th><Th>Seva Amt</Th><Th>Total Paid</Th><Th>Date</Th><Th>Status</Th><Th>Payment</Th><Th>Refund</Th><Th>Reconciliation</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((donation) => (
              <tr key={donation._id} className="border-t">
                <Td>{donation.donationId}</Td>
                <Td>{donation.name}</Td>
                <Td>{donation.sevaName}</Td>
                <Td>₹{donation.amount}</Td>
                <Td>₹{(donation.totalPaid || donation.amount).toFixed(2)}</Td>
                <Td>{new Date(donation.createdAt).toLocaleDateString()}</Td>
                <Td><Badge variant={donation.status === "VERIFIED" ? "default" : "secondary"}>{donation.status}</Badge></Td>
                <Td><Badge variant={donation.paymentStatus === "SUCCESS" ? "default" : "outline"}>{donation.paymentStatus}</Badge></Td>
                <Td className="text-xs">
                  <div>{donation.refundStatus || "NONE"}</div>
                  <div>Rs {donation.refundedAmount || 0}</div>
                </Td>
                <Td className="text-xs">
                  <div>{donation.reconciliationStatus || "-"}</div>
                  <div>{donation.lastReconciledAt ? new Date(donation.lastReconciledAt).toLocaleString() : ""}</div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingDonation(donation); setEditOpen(true); }}><Pencil className="h-4 w-4" />Edit</Button>
                    <Button asChild variant="ghost" size="icon" aria-label="View seva booking"><Link href={`/admin/donations/${donation.donationId}`}><Eye className="h-4 w-4" /></Link></Button>
                    {donation.paymentStatus === "SUCCESS" && (
                      <Button variant="outline" size="sm" onClick={() => setRefundTarget(donation)}><RotateCcw className="h-4 w-4" />Refund</Button>
                    )}
                    {cancellableStatuses.has(donation.paymentStatus) && (
                      <Button variant="outline" size="sm" onClick={() => setCancelTarget(donation)}><Ban className="h-4 w-4" />Cancel</Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Delete seva booking" disabled={deletingId === donation.donationId} onClick={() => confirmDelete(donation)}>
                      {deletingId === donation.donationId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
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
      <DonationEditModal open={editOpen} donation={editingDonation} sevas={sevas} onOpenChange={setEditOpen} onSaved={upsertDonation} />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Booking?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this seva booking? This action cannot be undone.</p><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button variant="destructive" onClick={deleteDonation}>Delete</Button></div></DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Cancel Booking</DialogTitle></DialogHeader><Textarea placeholder="Cancellation reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setCancelTarget(null)}>Close</Button><Button variant="destructive" disabled={actionLoading} onClick={cancelDonation}>{actionLoading ? "Cancelling..." : "Cancel Booking"}</Button></div></DialogContent>
      </Dialog>

      <Dialog open={Boolean(refundTarget)} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Refund Payment</DialogTitle></DialogHeader><div className="space-y-3"><Textarea placeholder="Refund reason (required)" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} /><Input type="number" min="1" max={refundTarget?.amount} placeholder={`Amount, default full Rs ${refundTarget?.amount || 0}`} value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} /></div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setRefundTarget(null)}>Close</Button><Button disabled={actionLoading || !refundReason.trim()} onClick={refundDonation}>{actionLoading ? "Starting..." : "Start Refund"}</Button></div></DialogContent>
      </Dialog>

      {toastMessage && <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toastMessage.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{toastMessage.text}</div>}
    </div>
  );
}
