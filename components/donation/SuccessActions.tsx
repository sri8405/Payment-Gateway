"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptDownload, type SanitizedDonation } from "@/components/donation/ReceiptDownload";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

type Props = {
  donation: SanitizedDonation;
  settings: TempleSettingsPlain;
};

export function SuccessActions({ donation, settings }: Props) {
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    // Simulate the receipt generation time to show the "Generating your receipt..." text
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-saffron" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Generating your receipt...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <ReceiptDownload donation={donation} settings={settings} />
      
      <p className="text-xs text-center text-muted-foreground mt-2 px-4 max-w-sm">
        An SMS and Email with the receipt have been sent to your registered contact details.
      </p>

      <p className="text-sm text-center font-medium mt-2">
        If you ever lose your receipt, you can retrieve it anytime from the 'Find My Receipts' page.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full mt-4 justify-center">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/find-my-receipts">Go to Find My Receipts</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
