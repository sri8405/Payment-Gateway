"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { loadRazorpaySDK } from "@/lib/payment/razorpayLoader";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

type PaymentState =
  | "loading"
  | "summary"
  | "ready"
  | "modal-open"
  | "verifying"
  | "success"
  | "cancelled"
  | "failed"
  | "error";

type FeeBreakdown = {
  sevaAmount: number;
  gatewayFee: number;
  gatewayGST: number;
  processingCharge: number;
  totalPayable: number;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PayPage({ searchParams }: Props) {
  const router = useRouter();
  const { id } = use(searchParams);
  const [state, setState] = useState<PaymentState>("loading");
  const [error, setError] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [fees, setFees] = useState<FeeBreakdown | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  const initiatedRef = useRef(false);
  const verifyingRef = useRef(false);

  const createOrder = useCallback(async () => {
    if (!id) {
      router.push("/donate");
      return;
    }

    if (initiatedRef.current) return;
    initiatedRef.current = true;

    try {
      // Start both in parallel: the create-order backend call and the Razorpay SDK download
      // are completely independent. Running them concurrently saves ~500ms–2s of CDN latency.
      console.log(`[PayPage] Fetching order + loading Razorpay SDK in parallel for donationId: ${id}`);
      const [response, scriptResult] = await Promise.all([
        fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId: id }),
        }),
        loadRazorpaySDK(),
      ]);

      const data = await response.json();
      console.log("[PayPage] Create-order response:", data);

      if (!response.ok || !data.success) {
        const orderErr = data.error || "Failed to create payment order";
        console.error("[PayPage] Create order failed:", orderErr);
        setError(orderErr);
        setState("error");
        return;
      }

      if (!scriptResult.success) {
        console.error("[PayPage] Razorpay SDK load failed:", scriptResult.error);
        setError(scriptResult.error || "Failed to load payment gateway.");
        setState("error");
        return;
      }

      if (typeof window.Razorpay !== "function") {
        console.error("[PayPage] window.Razorpay is missing or not a function.");
        setError("Razorpay SDK is not available in the browser. Please disable any active ad blockers or privacy extensions and reload.");
        setState("error");
        return;
      }

      // Store order data and fees for the summary screen
      setOrderData(data);
      if (data.fees) {
        setFees(data.fees);
      }
      setState("summary");
    } catch (err: any) {
      console.error("[PayPage] Unexpected exception during order creation:", err);
      setError(err.message || "An unexpected error occurred");
      setState("error");
    }
  }, [id, router]);

  const proceedToPay = useCallback(() => {
    if (!orderData || !id) return;

    const data = orderData;

    const options = {
      key: data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: data.currency,
      name: process.env.NEXT_PUBLIC_TEMPLE_NAME || "GuruSeva",
      description: data.notes?.sevaName ? `Seva: ${data.notes.sevaName}` : "Seva Booking Payment",
      order_id: data.orderId,
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        if (verifyingRef.current) return;
        verifyingRef.current = true;

        console.log("[PayPage] Razorpay checkout handler called. Verifying payment on backend...", response);
        setState("verifying");
        try {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          console.log("[PayPage] Verify-payment response:", verifyData);

          if (verifyRes.ok && verifyData.success) {
            console.log("[PayPage] Payment verified successfully! Redirecting...");
            setState("success");
            if (verifyData.secureToken) {
              router.push(`/donate/acknowledgement?token=${encodeURIComponent(verifyData.secureToken)}`);
            } else {
              router.push(`/donate/acknowledgement?id=${encodeURIComponent(verifyData.donationId || id)}`);
            }
          } else {
            const vErr = verifyData.error || "Payment verification failed";
            console.error("[PayPage] Payment verification error:", vErr);
            setError(vErr);
            setState("failed");
            verifyingRef.current = false;
          }
        } catch (err: any) {
          console.error("[PayPage] Verify payment exception:", err);
          setError(err.message || "Failed to verify payment");
          setState("failed");
          verifyingRef.current = false;
        }
      },
      prefill: {
        name: data.prefill?.name || "",
        contact: data.prefill?.contact || "",
        email: data.prefill?.email || "",
      },
      notes: {
        donationId: data.donationId,
        ...(data.notes || {}),
      },
      theme: {
        color: "#c65910",
      },
      modal: {
        ondismiss: function () {
          console.log("[PayPage] Razorpay checkout modal dismissed by user.");
          setState("cancelled");
        },
        escape: true,
        confirm_close: true,
      },
    };

    console.log("[PayPage] Instantiating Razorpay modal...");
    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response: any) {
      console.error("[PayPage] Razorpay payment.failed event:", response);
      const reason =
        response?.error?.description ||
        response?.error?.reason ||
        response?.description ||
        response?.reason ||
        (typeof response === "string" ? response : null) ||
        "Payment could not be processed or was declined";
      setFailureReason(reason);
      setState("failed");
    });

    setState("modal-open");
    console.log("[PayPage] Opening Razorpay checkout popup...");
    rzp.open();
  }, [orderData, id, router]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window && id) {
      try {
        channel = new BroadcastChannel("guruseva_payment_channel");
        channel.postMessage({ type: "PAYMENT_INITIATED", donationId: id });
        channel.onmessage = (event) => {
          if (event.data?.type === "PAYMENT_INITIATED" && event.data?.donationId === id) {
            console.warn("[PayPage] Payment is already in progress in another tab.");
            setError("Payment is currently open in another tab. Please switch to that tab to complete your payment.");
            setState("error");
          }
        };
      } catch {
        // Ignore BroadcastChannel errors
      }
    }

    const handleOnline = () => {
      console.log("[PayPage] Network connection restored. Retrying payment setup...");
      if (state === "error") {
        initiatedRef.current = false;
        createOrder();
      }
    };

    window.addEventListener("online", handleOnline);
    createOrder();

    return () => {
      window.removeEventListener("online", handleOnline);
      if (channel) channel.close();
    };
  }, [id, createOrder, state]);

  // Prevent accidental back navigation during verification
  useEffect(() => {
    if (state === "verifying" || state === "success") {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [state]);

  // Full-screen verification overlay
  if (state === "verifying") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center px-6 max-w-md mx-auto animate-fade-in-up">
          {/* Animated Om Symbol */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-saffron/10 animate-ping" style={{ animationDuration: "2s" }}></div>
            <div className="absolute inset-2 rounded-full bg-saffron/15 animate-ping" style={{ animationDuration: "2.5s" }}></div>
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-saffron/20 to-gold/20 border-2 border-saffron/30 flex items-center justify-center">
              <span className="text-5xl" role="img" aria-label="Om">🕉️</span>
            </div>
          </div>

          <h1 className="font-serif text-2xl font-bold text-copper mb-3">
            Generating Your Receipt
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Please wait while we securely verify your payment and prepare your seva receipt.
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Please do not close this page or press the back button.
          </p>
        </div>
      </div>
    );
  }

  // Full-screen success overlay
  if (state === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center px-6 max-w-md mx-auto animate-fade-in-up">
          <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200/50">
            <ShieldCheck className="w-14 h-14 text-green-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-green-700 mb-3">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Redirecting to your receipt...
          </p>
          <div className="w-48 h-1 bg-green-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full border-saffron/20 shadow-2xl rounded-2xl overflow-hidden bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-gold/10 border-b border-saffron/10 text-center pb-8">
          <CardTitle className="text-2xl font-serif text-copper">Secure Payment</CardTitle>
          <CardDescription>
            {state === "cancelled"
              ? "Payment was cancelled"
              : state === "failed"
              ? "Payment could not be completed"
              : state === "summary"
              ? "Review your payment details"
              : "Complete your seva booking payment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          {/* Loading / Creating order */}
          {state === "loading" && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-saffron/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-saffron" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-foreground">Preparing Payment...</h3>
                <p className="text-muted-foreground text-sm">Setting up your secure payment</p>
              </div>
            </div>
          )}

          {/* Payment Summary with Fee Breakdown */}
          {state === "summary" && fees && (
            <div className="w-full space-y-6 animate-fade-in-up">
              {/* Fee Breakdown Card */}
              <div className="w-full rounded-xl border border-saffron/20 bg-gradient-to-b from-amber-50/50 to-white overflow-hidden">
                <div className="px-5 py-4 border-b border-saffron/10 bg-saffron/5">
                  <h3 className="font-serif text-lg font-semibold text-copper text-left">Payment Summary</h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* Seva Amount */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Seva Amount</span>
                    <span className="font-medium text-foreground">₹{fees.sevaAmount.toFixed(2)}</span>
                  </div>

                  {/* Processing Charges */}
                  {fees.processingCharge > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Payment Processing Charges (incl. GST)</span>
                      <span className="font-medium text-foreground">₹{fees.processingCharge.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-saffron/20 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground text-base">Total Payable</span>
                      <span className="font-bold text-xl text-saffron">₹{fees.totalPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={proceedToPay}
                className="w-full py-3.5 bg-gradient-to-r from-saffron to-amber-600 text-white rounded-full font-semibold text-base hover:from-saffron/90 hover:to-amber-600/90 transition-all duration-200 shadow-lg shadow-saffron/25 active:scale-[0.98]"
              >
                Proceed to Pay ₹{fees.totalPayable.toFixed(2)}
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-green-600" /> 100% Secure
                </span>
                <span>•</span>
                <span>Powered by Razorpay</span>
              </div>
            </div>
          )}

          {/* Ready / Modal open */}
          {(state === "ready" || state === "modal-open") && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-saffron/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-saffron" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-foreground">Complete Your Payment</h3>
                <p className="text-muted-foreground text-sm">
                  Please complete the payment in the Razorpay window.
                  <br />
                  Do not close this page.
                </p>
              </div>
              <div className="pt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-green-600" /> 100% Secure
                </span>
                <span>•</span>
                <span>Powered by Razorpay</span>
              </div>
            </div>
          )}

          {/* Cancelled */}
          {state === "cancelled" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-amber-700 mb-2">Payment Cancelled</h3>
                <p className="text-muted-foreground text-sm">
                  You closed the payment window. No amount has been charged.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    // Go back to summary to try again
                    if (orderData && fees) {
                      setState("summary");
                    } else {
                      initiatedRef.current = false;
                      setState("loading");
                      setError("");
                      createOrder();
                    }
                  }}
                  className="px-6 py-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/donate")}
                  className="px-6 py-2 bg-secondary/20 text-secondary-foreground rounded-full hover:bg-secondary/30 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Failed */}
          {state === "failed" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-destructive mb-2">Payment Failed</h3>
                <p className="text-muted-foreground">
                  {failureReason || error || "Your payment could not be processed. Please try again."}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    if (orderData && fees) {
                      setState("summary");
                      setError("");
                      setFailureReason("");
                    } else {
                      initiatedRef.current = false;
                      setState("loading");
                      setError("");
                      setFailureReason("");
                      createOrder();
                    }
                  }}
                  className="px-6 py-2 bg-saffron text-white rounded-full hover:bg-saffron/90 transition-colors font-medium"
                >
                  Retry Payment
                </button>
                <button
                  onClick={() => router.push("/donate")}
                  className="px-6 py-2 bg-secondary/20 text-secondary-foreground rounded-full hover:bg-secondary/30 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Generic error */}
          {state === "error" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-destructive mb-2">Payment Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <button
                onClick={() => router.push("/donate")}
                className="px-6 py-2 bg-secondary/20 text-secondary-foreground rounded-full hover:bg-secondary/30 transition-colors"
              >
                Go Back
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
