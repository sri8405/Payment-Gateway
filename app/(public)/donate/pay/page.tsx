"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default function PayPage({ searchParams }: Props) {
  const router = useRouter();
  const { id } = use(searchParams);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      router.push("/donate");
      return;
    }

    const initiatePayment = async () => {
      try {
        const response = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId: id }),
        });
        
        const data = await response.json();
        
        if (data.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          setError(data.error || "Failed to initialize payment gateway");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      }
    };

    initiatePayment();
  }, [id, router]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full border-saffron/20 shadow-2xl rounded-2xl overflow-hidden bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-gold/10 border-b border-saffron/10 text-center pb-8">
          <CardTitle className="text-2xl font-serif text-copper">Secure Payment</CardTitle>
          <CardDescription>You are being redirected to our secure payment partner</CardDescription>
        </CardHeader>
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          {error ? (
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
          ) : (
            <div className="space-y-8 animate-fade-in-up">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-saffron/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-saffron" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-foreground">Processing...</h3>
                <p className="text-muted-foreground text-sm">Please do not close this window or press back</p>
              </div>
              
              <div className="pt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-600"/> 100% Secure</span>
                <span>•</span>
                <span>Powered by PhonePe</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
