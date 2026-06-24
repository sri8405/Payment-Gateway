"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { DonationFilters, type DonationFilterState } from "@/components/admin/DonationFilters";
import { DonationEditModal } from "@/components/admin/DonationEditModal";
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
    link.download = "donations.csv";
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
        <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${total} donations`}</p>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <Table>
          <thead>
            <tr>
              <Th>Donation ID</Th>
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
                    <Button asChild variant="ghost" size="icon" aria-label="View donation">
                      <Link href={`/admin/donations/${donation.donationId}`}><Eye className="h-4 w-4" /></Link>
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
    </div>
  );
}
