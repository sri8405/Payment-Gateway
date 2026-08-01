"use client";

import { useState } from "react";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReceiptDownload, type SanitizedDonation } from "@/components/donation/ReceiptDownload";
import type { TempleSettingsPlain } from "@/lib/db/repositories/templeSettingsRepository";

type Props = {
  settings: TempleSettingsPlain;
};

export function ReceiptSearchForm({ settings }: Props) {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SanitizedDonation[] | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!mobile) {
      setError("Please enter your mobile number to find your receipts.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/donations/search-receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find receipts.");
      }

      setResults(data.receipts);
    } catch (err: any) {
      setError(err.message || "An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Card className="border-saffron/20 shadow-xl overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md transition-shadow hover:shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-gold/10 border-b border-saffron/20 pb-6">
          <CardTitle className="text-2xl font-serif text-copper">Find My Receipts</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the mobile number used during your donation to retrieve your receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Mobile Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-xl focus:ring-saffron focus:border-saffron bg-background/50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-xl">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-saffron hover:bg-saffron/90 text-white rounded-xl py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Find My Receipts
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && results.length > 0 && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <span className="w-8 h-1 bg-gradient-to-r from-saffron to-gold rounded-full"></span>
            Matching Receipts
          </h2>
          <div className="grid gap-6">
            {results.map((receipt, index) => (
              <Card key={receipt.donationId} className="border-border shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch">
                    <div className="p-6 space-y-3 flex-grow bg-card">
                      <h3 className="font-semibold text-xl text-copper font-serif">{receipt.sevaName}</h3>
                      <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-70">Date</span>
                          <span className="font-medium text-foreground">{new Date(receipt.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-70">Amount</span>
                          <span className="font-medium text-saffron">₹{(receipt.totalPaid || receipt.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-70">Name</span>
                          <span className="font-medium text-foreground">{receipt.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-wider opacity-70">Receipt No</span>
                          <span className="font-medium text-foreground">{receipt.receiptNumber || "-"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-muted/20 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-border/50">
                      <ReceiptDownload donation={receipt} settings={settings} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-border shadow-sm animate-fade-in-up">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground mb-2">No Receipts Found</h3>
          <p className="text-muted-foreground max-w-md">
            No completed donations were found with the provided mobile number. Please check the number and try again.
          </p>
        </div>
      )}
    </div>
  );
}
