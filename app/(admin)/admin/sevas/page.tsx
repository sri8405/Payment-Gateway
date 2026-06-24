import { SevasManager } from "@/components/admin/SevasManager";
import { AdminShell } from "@/components/layout/AdminShell";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";

export const dynamic = "force-dynamic";

export default async function AdminSevasPage() {
  const sevas = await sevaRepository.findAll();

  return (
    <AdminShell>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sevas</h1>
        <p className="text-sm text-muted-foreground">Manage donation seva options and suggested amounts</p>
      </div>
      <SevasManager initialSevas={sevas} />
    </div>
    </AdminShell>
  );
}
