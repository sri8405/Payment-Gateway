"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Download, Eye, Loader2, Pencil, RotateCcw, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DonationFilters, type DonationFilterState } from "@/components/admin/DonationFilters";
import { DonationEditModal } from "@/components/admin/DonationEditModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { serializeCsv } from "@/lib/utils/csv";
import type { DonationPlain } from "@/lib/db/repositories/donationRepository";
import type { SevaPlain } from "@/lib/db/repositories/sevaRepository";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";
import { ReceiptDownload } from "@/components/donation/ReceiptDownload";

type Props = {
  initialRows: DonationPlain[];
  initialTotal: number;
  sevas: SevaPlain[];
  settings: TempleSettingsPlain;
};

const pageSize = 20;
const cancellableStatuses = new Set(["PENDING", "INITIATED", "FAILED"]);

function StatusPill({ status, type = "payment" }: { status: string; type?: "payment" | "general" }) {
  if (type === "payment") {
    switch (status) {
      case "SUCCESS":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><CheckCircle2 className="h-3 w-3" /> SUCCESS</span>;
      case "FAILED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20"><XCircle className="h-3 w-3" /> FAILED</span>;
      case "REFUNDED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20"><RotateCcw className="h-3 w-3" /> REFUNDED</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"><Clock className="h-3 w-3" /> {status}</span>;
    }
  }
  
  // General status
  if (status === "VERIFIED") {
    return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">VERIFIED</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/20">{status}</span>;
}

export function DonationsTable({ initialRows, initialTotal, sevas, settings }: Props) {
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
    <div className="space-y-6">
      
      <DonationFilters filters={filters} sevas={sevas} onChange={(next) => { setFilters(next); setPage(1); }} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Recent Bookings</h2>
          <span className="rounded-full bg-saffron/10 px-2.5 py-0.5 text-xs font-semibold text-saffron">
            {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : total}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="rounded-lg shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 border-b border-border/40">
              <tr>
                <th className="px-4 py-3 font-medium">ID & Devotee</th>
                <th className="px-4 py-3 font-medium">Seva Details</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <Loader2 className={`h-6 w-6 ${loading ? 'animate-spin' : 'hidden'}`} />
                        <Ban className={`h-6 w-6 text-slate-400 ${!loading ? 'block' : 'hidden'}`} />
                      </div>
                      <p>{loading ? 'Loading...' : 'No bookings found.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((donation) => (
                  <tr key={donation._id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-foreground">{donation.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-500">{donation.donationId}</span>
                        <span className="text-slate-400">•</span>
                        <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-foreground">{donation.sevaName}</div>
                      <div className="mt-1 text-xs">{donation.mobile}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-foreground">₹{(donation.totalPaid || donation.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="mt-1 text-xs capitalize">{donation.paymentMethod || "Offline"}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1.5 items-start">
                        <StatusPill status={donation.paymentStatus} type="payment" />
                        <StatusPill status={donation.status} type="general" />
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-foreground rounded-lg" onClick={() => { setEditingDonation(donation); setEditOpen(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-foreground rounded-lg" title="View Details">
                          <Link href={`/admin/donations/${donation.donationId}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        {donation.paymentStatus === "SUCCESS" && (
                          <div className="inline-block" title="Download Receipt">
                            <ReceiptDownload donation={donation} settings={settings} />
                          </div>
                        )}
                        {donation.paymentStatus === "SUCCESS" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-purple-600 rounded-lg" onClick={() => setRefundTarget(donation)} title="Refund"><RotateCcw className="h-4 w-4" /></Button>
                        )}
                        {cancellableStatuses.has(donation.paymentStatus) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-amber-600 rounded-lg" onClick={() => setCancelTarget(donation)} title="Cancel Booking"><Ban className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg" disabled={deletingId === donation.donationId} onClick={() => confirmDelete(donation)} title="Delete">
                          {deletingId === donation.donationId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      {/* Mobile Stacked Card View */}
      <div className="lg:hidden space-y-4">
        {rows.length === 0 && !loading ? (
          <div className="rounded-xl border border-border/40 bg-white py-12 text-center shadow-sm">
            <Ban className="mx-auto h-8 w-8 text-slate-400 mb-3" />
            <p className="text-sm text-muted-foreground">No bookings found.</p>
          </div>
        ) : null}
        
        {rows.map((donation) => (
          <div key={donation._id} className="rounded-xl border border-border/40 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex justify-between items-start mb-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{donation.name}</p>
                <p className="font-mono text-xs text-slate-500 mt-0.5 break-all">{donation.donationId}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-foreground text-lg">₹{(donation.totalPaid || donation.amount).toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(donation.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-foreground font-medium">{donation.sevaName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{donation.mobile}</p>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusPill status={donation.paymentStatus} type="payment" />
              <StatusPill status={donation.status} type="general" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
              <Button variant="outline" size="sm" className="h-10 text-xs rounded-lg w-full" onClick={() => { setEditingDonation(donation); setEditOpen(true); }}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 text-xs rounded-lg w-full">
                <Link href={`/admin/donations/${donation.donationId}`}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                </Link>
              </Button>
              {donation.paymentStatus === "SUCCESS" && (
                <>
                  <ReceiptDownload donation={donation} settings={settings} className="h-10 text-xs rounded-lg w-full bg-saffron/10 text-saffron hover:bg-saffron/20 border-0" />
                  <Button variant="outline" size="sm" className="h-10 text-xs rounded-lg w-full text-purple-600 hover:bg-purple-50 hover:text-purple-700" onClick={() => setRefundTarget(donation)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Refund
                  </Button>
                </>
              )}
              {cancellableStatuses.has(donation.paymentStatus) && (
                <Button variant="outline" size="sm" className="h-10 text-xs rounded-lg w-full text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => setCancelTarget(donation)}>
                  <Ban className="mr-1.5 h-3.5 w-3.5" /> Cancel
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-10 text-xs rounded-lg w-full text-red-600 hover:bg-red-50 hover:text-red-700" disabled={deletingId === donation.donationId} onClick={() => confirmDelete(donation)}>
                {deletingId === donation.donationId ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <p className="text-sm text-muted-foreground hidden sm:block">
          Showing <span className="font-medium text-foreground">{Math.min(1 + (page - 1) * pageSize, total)}</span> to <span className="font-medium text-foreground">{Math.min(page * pageSize, total)}</span> of <span className="font-medium text-foreground">{total}</span> results
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg shadow-sm">Previous</Button>
          <span className="text-sm text-muted-foreground sm:hidden">Page {page} of {pageCount}</span>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-lg shadow-sm">Next</Button>
        </div>
      </div>

      {/* Modals */}
      <DonationEditModal open={editOpen} donation={editingDonation} sevas={sevas} onOpenChange={setEditOpen} onSaved={upsertDonation} />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Delete Booking?</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to permanently delete this seva booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex sm:justify-end gap-3 sm:gap-0">
            <Button variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl w-full sm:w-auto sm:ml-2 shadow-sm" onClick={deleteDonation}>Delete Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Cancel Booking</DialogTitle>
            <DialogDescription>Please provide a reason for cancelling this booking.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea className="resize-none rounded-xl focus-visible:ring-saffron" placeholder="Cancellation reason (optional)" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
          </div>
          <DialogFooter className="flex sm:justify-end gap-3 sm:gap-0">
            <Button variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => setCancelTarget(null)}>Close</Button>
            <Button variant="destructive" className="rounded-xl w-full sm:w-auto sm:ml-2 shadow-sm" disabled={actionLoading} onClick={cancelDonation}>
              {actionLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</> : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(refundTarget)} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Refund Payment</DialogTitle>
            <DialogDescription>Initiate a refund for this successful payment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Refund Reason</label>
              <Textarea className="resize-none rounded-xl focus-visible:ring-saffron" placeholder="Enter reason for refund (required)" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (₹)</label>
              <Input className="rounded-xl focus-visible:ring-saffron" type="number" min="1" max={refundTarget?.amount} placeholder={`Default: Full amount (₹${refundTarget?.amount || 0})`} value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-end gap-3 sm:gap-0">
            <Button variant="outline" className="rounded-xl w-full sm:w-auto" onClick={() => setRefundTarget(null)}>Close</Button>
            <Button className="rounded-xl bg-saffron hover:bg-saffron/90 w-full sm:w-auto sm:ml-2 shadow-sm text-white" disabled={actionLoading || !refundReason.trim()} onClick={refundDonation}>
              {actionLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</> : "Start Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl animate-in slide-in-from-bottom-5 ${toastMessage.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
