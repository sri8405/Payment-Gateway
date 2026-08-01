"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

export type SanitizedDonation = {
  donationId: string;
  createdAt: string | Date;
  name: string;
  gothra?: string;
  nakshatra?: string;
  mobile?: string;
  email?: string;
  sevaName: string;
  amount: number;
  paymentMethod?: string;
  paymentSource?: string;
  status: string;
  receiptNumber?: string;
  processingCharge?: number;
  totalPaid?: number;
};

type Props = {
  donation: SanitizedDonation;
  settings: TempleSettingsPlain;
  className?: string;
};

export function ReceiptDownload({ donation, settings, className }: Props) {
  async function downloadReceipt() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoSize = 42;
    const logoX = (pageWidth - logoSize) / 2;
    const logoUrl = settings.logoUrl || "/assets/guruji.jpg";

    try {
      const logoDataUrl = await loadImageAsDataUrl(logoUrl);
      doc.addImage(logoDataUrl, getImageFormat(logoDataUrl), logoX, 14, logoSize, logoSize);
    } catch {
      doc.setFillColor(230, 230, 230);
      doc.circle(pageWidth / 2, 35, logoSize / 2, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(settings.templeName, pageWidth / 2, 68, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(settings.templeDescription || "Seva Booking & Management", pageWidth / 2, 76, { align: "center" });

    const rows = [
      ["Seva Booking ID", donation.donationId],
      ["Date", new Date(donation.createdAt).toLocaleString()],
      ["Name", donation.name],
      ["Gothra", donation.gothra || "-"],
      ...(donation.nakshatra ? [["Nakshatra", donation.nakshatra]] : []),
      ["Mobile", donation.mobile || "-"],
      ["Email", donation.email || "-"],
      ["Seva", donation.sevaName],
      ["Seva Amount", `Rs ${donation.amount.toFixed(2)}`],
      ...(donation.processingCharge ? [["Processing Charges (incl. GST)", `Rs ${donation.processingCharge.toFixed(2)}`]] : []),
      ["Total Paid", `Rs ${(donation.totalPaid || donation.amount).toFixed(2)}`],
      ["Payment Method", donation.paymentMethod || "Online"],
      ["Payment Source", donation.paymentSource || "Online"],
      ["Status", donation.status]
    ];

    let y = 96;
    rows.forEach(([label, value]) => {
      doc.setDrawColor(210);
      doc.rect(24, y - 7, 58, 10);
      doc.rect(82, y - 7, 104, 10);
      doc.setFont("helvetica", "bold");
      doc.text(label, 28, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 86, y);
      y += 10;
    });

    doc.setFontSize(10);
    doc.text(settings.receiptFooter || "May Guruji's blessings always be with you.", pageWidth / 2, y + 18, {
      align: "center"
    });
    if (donation.processingCharge && donation.processingCharge > 0) {
      doc.setFontSize(8);
      doc.text(
        "Payment Processing Charges (incl. GST) are charged by Razorpay. The temple receives the full Seva amount.",
        pageWidth / 2,
        y + 28,
        { align: "center", maxWidth: pageWidth - 48 }
      );
    }
    doc.save(`${donation.donationId}-receipt.pdf`);
  }

  return (
    <Button onClick={downloadReceipt} className={className}>
      <Download className="mr-1.5 h-4 w-4" />
      <span className="hidden sm:inline">Download Receipt (PDF)</span>
      <span className="sm:hidden">Receipt</span>
    </Button>
  );
}

function getImageFormat(dataUrl: string) {
  return dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
}

async function loadImageAsDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load receipt image");
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
