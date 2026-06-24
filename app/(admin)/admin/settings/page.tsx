import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { templeSettingsRepository } from "@/lib/db/repositories/templeSettingsRepository";
import { TempleSettingsForm } from "@/components/admin/TempleSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await templeSettingsRepository.getCurrentOrDefault();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage temple, payment, and receipt configuration.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Temple Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <TempleSettingsForm initialSettings={settings} />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
