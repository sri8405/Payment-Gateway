import { ReceiptSearchForm } from "@/components/donation/ReceiptSearchForm";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const dynamic = "force-dynamic";

export default async function FindMyReceiptsPage() {
  const settings = await templeSettingsRepository.getCurrentOrDefault();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          Retrieve Your Receipts
        </h1>
        <p className="text-muted-foreground text-lg">
          Lost your receipt? No problem. Use the form below to find and download receipts for your completed donations.
        </p>
      </div>

      <ReceiptSearchForm settings={settings} />
    </div>
  );
}
