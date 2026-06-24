"use client";

import { useEffect, useState, useCallback } from "react";
import * as QRCode from "qrcode";
import { Check, Copy, Smartphone } from "lucide-react";
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

type UpiApp = {
  name: string;
  /** Package name / scheme used in the intent URL */
  packageName: string;
  /** Brand colour for the button */
  color: string;
  /** Hover colour */
  hoverColor: string;
  /** SVG icon path or emoji */
  icon: string;
};

const UPI_APPS: UpiApp[] = [
  {
    name: "PhonePe",
    packageName: "com.phonepe.app",
    color: "#5F259F",
    hoverColor: "#4A1D7A",
    icon: "phonepe",
  },
  {
    name: "Google Pay",
    packageName: "com.google.android.apps.nbu.paisa.user",
    color: "#1A73E8",
    hoverColor: "#1557B0",
    icon: "gpay",
  },
  {
    name: "Paytm",
    packageName: "net.one97.paytm",
    color: "#00BAF2",
    hoverColor: "#0098C7",
    icon: "paytm",
  },
];

function buildGenericUpiUrl(upiId: string, amount: number, donationId: string, displayName: string): string {
  const query = new URLSearchParams({
    pa: upiId,
    pn: displayName,
    am: String(amount),
    cu: "INR",
    tn: donationId,
  });
  return `upi://pay?${query.toString()}`;
}

function buildAppIntentUrl(app: UpiApp, upiId: string, amount: number, donationId: string, displayName: string): string {
  const query = new URLSearchParams({
    pa: upiId,
    pn: displayName,
    am: String(amount),
    cu: "INR",
    tn: donationId,
  });

  // Android intent URL that tries the specific app first, then falls back to generic UPI
  return `intent://pay?${query.toString()}#Intent;scheme=upi;package=${app.packageName};end`;
}

function AppIcon({ app }: { app: UpiApp }) {
  if (app.icon === "phonepe") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="5" fill="white"/>
        <path d="M16.5 5.5L10.5 3V9L7.5 7.5V17.5C7.5 19.5 9 21 11 21C13 21 17 19 17 14.5V8.5L16.5 5.5Z" fill="#5F259F"/>
        <path d="M10.5 9V3L16.5 5.5V8.5L10.5 9Z" fill="#A785D0"/>
      </svg>
    );
  }
  if (app.icon === "gpay") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="5" fill="white"/>
        <path d="M18.5 12.2L13.8 6H11L15.2 11.4L11 17H13.8L18.5 12.2Z" fill="#4285F4"/>
        <path d="M5.5 12.2L10.2 6H13L8.8 11.4L13 17H10.2L5.5 12.2Z" fill="#34A853"/>
        <path d="M8.8 11.4L11 17H13L15.2 11.4L13 6H11L8.8 11.4Z" fill="#FBBC04"/>
        <path d="M15.2 11.4L13 6H11L8.8 11.4H15.2Z" fill="#EA4335"/>
      </svg>
    );
  }
  if (app.icon === "paytm") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="5" fill="white"/>
        <path d="M4 9.5H6.5C7.88 9.5 9 10.12 9 11.5C9 12.88 7.88 13.5 6.5 13.5H5.5V15.5H4V9.5ZM5.5 12.2H6.3C6.96 12.2 7.4 11.9 7.4 11.5C7.4 11.1 6.96 10.8 6.3 10.8H5.5V12.2Z" fill="#00BAF2"/>
        <path d="M14 9.5H16C17.38 9.5 18 10.12 18 11C18 11.6 17.6 12 17 12.2C17.7 12.4 18.2 12.9 18.2 13.5C18.2 14.5 17.3 15.5 15.8 15.5H14V9.5ZM15.5 11.8H15.9C16.4 11.8 16.7 11.5 16.7 11.2C16.7 10.9 16.4 10.7 15.9 10.7H15.5V11.8ZM15.5 14.3H16C16.6 14.3 16.9 14 16.9 13.6C16.9 13.2 16.6 12.9 16 12.9H15.5V14.3Z" fill="#00BAF2"/>
        <path d="M10 10.8H8.5V9.5H13V10.8H11.5V15.5H10V10.8Z" fill="#002E6E"/>
        <path d="M19 9.5H20.5V12L22 9.5V15.5H20.5V12.5L19 15.5V9.5Z" fill="#002E6E"/>
      </svg>
    );
  }
  return <Smartphone className="h-5 w-5" />;
}

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
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);

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

  const handleAppPayment = useCallback((app: UpiApp) => {
    setLaunchingApp(app.name);

    // Build the app-specific Android intent URL
    const intentUrl = buildAppIntentUrl(app, upiId, amount, donationId, name);

    // Build generic UPI fallback
    const fallbackUrl = buildGenericUpiUrl(upiId, amount, donationId, name);

    // Try the app-specific intent first
    window.location.href = intentUrl;

    // If the intent doesn't trigger (app not installed), Android will do nothing.
    // After a short delay, fall back to generic upi:// URL so the OS picker opens.
    const timeout = window.setTimeout(() => {
      window.location.href = fallbackUrl;
      setLaunchingApp(null);
    }, 1500);

    // If the page becomes hidden (app launched), clear the fallback
    function handleVisibility() {
      if (document.hidden) {
        clearTimeout(timeout);
        setLaunchingApp(null);
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    // Cleanup after 5 seconds regardless
    window.setTimeout(() => {
      setLaunchingApp(null);
      document.removeEventListener("visibilitychange", handleVisibility);
    }, 5000);
  }, [upiId, amount, donationId, name]);

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
            Choose your preferred UPI app to complete the seva booking payment.
          </p>

          {/* App-specific buttons */}
          <div className="grid gap-3">
            {UPI_APPS.map((app) => (
              <button
                key={app.packageName}
                id={`upi-pay-${app.icon}`}
                onClick={() => handleAppPayment(app)}
                disabled={launchingApp !== null}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                style={{
                  backgroundColor: launchingApp === app.name ? app.hoverColor : app.color,
                }}
                onMouseEnter={(e) => {
                  if (!launchingApp) (e.currentTarget.style.backgroundColor = app.hoverColor);
                }}
                onMouseLeave={(e) => {
                  if (!launchingApp) (e.currentTarget.style.backgroundColor = app.color);
                }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20 shadow-inner">
                  <AppIcon app={app} />
                </span>
                <span className="flex-1 text-left">
                  {launchingApp === app.name ? `Opening ${app.name}...` : `Pay with ${app.name}`}
                </span>
                <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Fallback UPI ID section */}
          <div className="rounded-md border bg-background p-3 text-sm">
            <p className="mb-2 text-xs text-muted-foreground">
              If the button does not open your app, copy the UPI ID below and pay manually.
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">UPI ID</span>
              <span className="font-mono text-xs">{upiId}</span>
            </div>
            <Button id="copy-upi-mobile" variant="outline" className="mt-3 w-full" onClick={copyUpiId}>
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
              <span className="font-mono text-xs">{upiId}</span>
            </div>
            <Button id="copy-upi-desktop" variant="outline" className="mt-3 w-full" onClick={copyUpiId}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
