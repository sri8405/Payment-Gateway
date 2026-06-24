import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-foreground">Donations & Seva Management</p>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">{settings.templeName}</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {settings.templeDescription || "Offer seva donations with a simple acknowledgement flow for devotees and a focused management console for temple administrators."}
            </p>
            <Button asChild size="md">
              <Link href="/donate">Donate Now</Link>
            </Button>
          </div>
          <div className="rounded-lg border bg-secondary p-6">
            <p className="text-sm font-medium text-secondary-foreground">Active Sevas</p>
            <p className="mt-2 text-3xl font-bold">{sevas.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Available for online donation today</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <h2 className="text-2xl font-semibold">Available Sevas</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sevas.map((seva) => (
            <Card key={seva._id}>
              <CardHeader>
                <CardTitle>{seva.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-10 text-sm text-muted-foreground">{seva.description || "Offer your donation for this seva."}</p>
                <p className="mt-4 font-semibold">Suggested: Rs {seva.suggestedAmount}</p>
              </CardContent>
            </Card>
          ))}
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Temple Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-medium">UPI ID:</span> {settings.upiId || "-"}</p>
              <p><span className="font-medium">UPI Name:</span> {settings.upiDisplayName || "-"}</p>
              <p><span className="font-medium">Contact:</span> {settings.contactNumber || "-"}</p>
              <p><span className="font-medium">Email:</span> {settings.email || "-"}</p>
              <p><span className="font-medium">Address:</span> {settings.address || "-"}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
