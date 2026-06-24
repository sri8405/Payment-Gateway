import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonationForm } from "@/components/donation/DonationForm";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const settings = await templeSettingsRepository.getCurrentOrDefault();
  let sevas: Awaited<ReturnType<typeof sevaRepository.findActive>> = [];

  try {
    sevas = await sevaRepository.findActive();
  } catch (error) {
    console.error("Failed to load active sevas:", error);
  }

  return (
    <main>
      <PublicHeader settings={settings} />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Seva Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DonationForm sevas={sevas} />
            {sevas.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No sevas are available right now. Please try again later after the temple database is connected.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
