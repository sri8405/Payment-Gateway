"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Phone, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  paymentUrl: string;
  upiId: string;
  amount: number;
  donationId: string;
  initialDeviceType?: DeviceType;
};

type DeviceType = "mobile" | "desktop" | "unknown";

export function PaymentSection({
  paymentUrl,
  upiId,
  amount,
  donationId,
  initialDeviceType = "unknown"
}: Props) {
  const [deviceType, setDeviceType] = useState<DeviceType>(initialDeviceType);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 768px)").matches;
    setDeviceType(isMobile ? "mobile" : "desktop");
  }, []);

  useEffect(() => {
    let active = true;

    async function buildQr() {
      if (deviceType !== "desktop") {
        setQrDataUrl("");
        return;
      }

      const url = await QRCode.toDataURL(paymentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#111827",
          light: "#FFFFFF"
        }
      });

      if (active) {
        setQrDataUrl(url);
      }
    }

    buildQr();

    return () => {
      active = false;
    };
  }, [deviceType, paymentUrl]);

  const mobileButtons = useMemo(
    () => [
      { label: "Google Pay", icon: Smartphone },
      { label: "PhonePe", icon: Phone },
      { label: "Paytm", icon: Smartphone },
      { label: "BHIM", icon: Smartphone },
      { label: "Any UPI App", icon: Smartphone }
    ],
    []
  );

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
        Device Type: {deviceType === "unknown" ? "Detecting..." : deviceType === "mobile" ? "Mobile" : "Desktop"}
      </div>

      {deviceType === "mobile" ? (
        <section className="space-y-3 rounded-md border p-4">
          <h2 className="text-lg font-semibold">Pay via UPI</h2>
          <div className="space-y-3">
            {mobileButtons.map(({ label, icon: Icon }) => (
              <Button key={label} asChild className="w-full">
                <a href={paymentUrl}>
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              </Button>
            ))}
            <p className="text-sm text-muted-foreground">The same UPI link opens in your selected app.</p>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-md border p-4">
          <h2 className="text-lg font-semibold">Scan to Pay</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code using PhonePe, Google Pay, Paytm, or any UPI application.
            </p>
            <div className="flex justify-center rounded-lg border bg-white p-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR code for seva booking ${donationId}`}
                  className="h-64 w-64"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center text-sm text-muted-foreground">
                  Generating QR code...
                </div>
              )}
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">UPI ID</dt>
                <dd className="font-medium">{upiId}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">Rs {amount}</dd>
              </div>
            </dl>
            <Button variant="outline" className="w-full" onClick={copyUpiId}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
            <p className="text-sm text-muted-foreground">
              If the QR does not load, use the UPI ID above in your app manually.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
