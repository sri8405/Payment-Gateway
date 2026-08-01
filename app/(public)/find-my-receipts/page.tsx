import { ReceiptSearchForm } from "@/components/donation/ReceiptSearchForm";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const dynamic = "force-dynamic";

export default async function FindMyReceiptsPage() {
  const settings = await templeSettingsRepository.getCurrentOrDefault();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-saffron/5 to-transparent -z-10 pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-saffron/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="container mx-auto max-w-3xl px-6 py-20 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full bg-saffron/10 text-saffron font-medium text-sm mb-6 tracking-wide uppercase">
            Receipt Retrieval
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
            Find Your Receipts
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Lost your receipt? No problem. Simply enter your registered mobile number below to access all your successful donations.
          </p>
        </div>

        <ReceiptSearchForm settings={settings} />
      </div>
    </div>
  );
}
