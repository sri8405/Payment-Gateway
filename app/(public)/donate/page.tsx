import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DonationForm } from "@/components/donation/DonationForm";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  let sevas: Awaited<ReturnType<typeof sevaRepository.findActive>> = [];

  try {
    sevas = await sevaRepository.findActive();
  } catch (error) {
    console.error("Failed to load active sevas:", error);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-saffron mb-4">Book Your Seva</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Fill in your details below to offer your seva. Your contributions help maintain the temple and perform daily rituals.
        </p>
      </div>

      <Card className="border-saffron/20 shadow-xl overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-saffron/10 to-gold/10 border-b border-saffron/20 pb-8">
          <CardTitle className="text-2xl font-serif text-copper">Seva Sankalpa</CardTitle>
          <CardDescription className="text-foreground/70">
            Provide the devotee's name and gothra for the sankalpa during the pooja.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <DonationForm sevas={sevas} />
          {sevas.length === 0 ? (
            <div className="mt-8 p-6 bg-destructive/5 rounded-xl border border-destructive/20 text-center">
              <p className="text-sm text-destructive font-medium">
                No sevas are currently available for online booking. Please try again later.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
