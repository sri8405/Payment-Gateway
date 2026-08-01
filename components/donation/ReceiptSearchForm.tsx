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
  const [name, setName] = useState("");
  const [gothra, setGothra] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SanitizedDonation[] | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!mobile || !name || !gothra) {
      setError("Please fill in all fields to find your receipts.");
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
        body: JSON.stringify({ mobile, name, gothra }),
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
      <Card className="border-saffron/20 shadow-xl overflow-hidden rounded-2xl bg-white/95 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-gold/10 border-b border-saffron/20 pb-6">
          <CardTitle className="text-xl font-serif text-copper">Find My Receipts</CardTitle>
          <CardDescription>
            Enter the exact details used during your donation to retrieve your receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Mobile Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Devotee Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter the name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Gothra
                </label>
                <Input
                  type="text"
                  placeholder="Enter the gothra"
                  value={gothra}
                  onChange={(e) => setGothra(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-saffron hover:bg-saffron/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Find My Receipts
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-foreground">Matching Receipts</h2>
          <div className="grid gap-4">
            {results.map((receipt) => (
              <Card key={receipt.donationId} className="border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{receipt.sevaName}</h3>
                      <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Date: {new Date(receipt.createdAt).toLocaleDateString()}</span>
                        <span>Amount: ₹{(receipt.totalPaid || receipt.amount).toFixed(2)}</span>
                        <span>Name: {receipt.name}</span>
                        <span>Gothra: {receipt.gothra || "-"}</span>
                        <span className="col-span-2">Receipt No: {receipt.receiptNumber || "-"}</span>
                      </div>
                    </div>
                    <ReceiptDownload donation={receipt} settings={settings} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-2xl border border-border/50">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No completed donations were found with the provided information.
          </p>
        </div>
      )}
    </div>
  );
}
