"use client";

import { useEffect, useState } from "react";
import * as QRCode from "qrcode";
import { Check, Copy, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  paymentUrl: string;
  upiId: string;
  amount: number;
  name: string;
  sevaName: string;
  donationId: string;
  initialDeviceType?: DeviceType;
};

type DeviceType = "mobile" | "desktop" | "unknown";

export function PaymentSection({
  paymentUrl,
  upiId,
  amount,
  name,
  sevaName,
  donationId,
  initialDeviceType = "unknown"
}: Props) {
  const [deviceType, setDeviceType] = useState<DeviceType>(initialDeviceType);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);

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

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleUPIPayment() {
    setPaymentStarted(true);
    window.location.href = paymentUrl;
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-md border bg-muted p-4">
        <h2 className="text-lg font-semibold">Booking Summary</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Booking ID</dt>
            <dd className="mt-1 font-medium">{donationId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="mt-1 font-medium">{name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Seva</dt>
            <dd className="mt-1 font-medium">{sevaName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="mt-1 font-medium">Rs {amount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">UPI ID</dt>
            <dd className="mt-1 font-medium">{upiId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Payment Type</dt>
            <dd className="mt-1 font-medium">UPI</dd>
          </div>
        </dl>
      </section>

      {deviceType === "mobile" ? (
        <section className="space-y-4 rounded-md border p-4">
          <h2 className="text-lg font-semibold">Pay via UPI</h2>
          <p className="text-sm text-muted-foreground">
            Tap the button below to open your preferred UPI app and complete the seva booking payment.
          </p>
          <Button className="w-full" onClick={handleUPIPayment} disabled={paymentStarted}>
            <CreditCard className="mr-2 h-4 w-4" />
            {paymentStarted ? "Opening UPI app..." : "💳 Pay via UPI"}
          </Button>
          <p className="text-sm text-muted-foreground">
            If the button does not open automatically, use the UPI ID shown below in your app.
          </p>
          <div className="rounded-md border bg-background p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">UPI ID</span>
              <span>{upiId}</span>
            </div>
            <Button variant="outline" className="mt-3 w-full" onClick={copyUpiId}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
          </div>
        </section>
      ) : (
        <section className="space-y-4 rounded-md border p-4">
          <h2 className="text-lg font-semibold">Scan to Pay</h2>
          <p className="text-sm text-muted-foreground">
            Scan this QR code with any UPI app or copy the UPI ID below to complete your seva booking payment.
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
          <div className="rounded-md border bg-background p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">UPI ID</span>
              <span>{upiId}</span>
            </div>
            <Button variant="outline" className="mt-3 w-full" onClick={copyUpiId}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
