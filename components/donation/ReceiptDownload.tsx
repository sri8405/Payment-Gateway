"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import type { DonationPlain } from "@/lib/db/repositories/donationRepository";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

type Props = {
  donation: DonationPlain;
  settings: TempleSettingsPlain;
};

export function ReceiptDownload({ donation, settings }: Props) {
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
    doc.text(settings.templeDescription || "Donations & Seva Management", pageWidth / 2, 76, { align: "center" });

    const rows = [
      ["Donation ID", donation.donationId],
      ["Date", new Date(donation.createdAt).toLocaleString()],
      ["Name", donation.name],
      ["Gothra", donation.gothra],
      ["Mobile", donation.mobile || "-"],
      ["Email", donation.email || "-"],
      ["Seva", donation.sevaName],
      ["Amount", `Rs ${donation.amount}`],
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
    doc.save(`${donation.donationId}-receipt.pdf`);
  }

  return (
    <Button onClick={downloadReceipt}>
      <Download className="h-4 w-4" />
      Download Receipt (PDF)
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
