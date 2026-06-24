import { StatCard } from "@/components/admin/StatCard";
import { AdminShell } from "@/components/layout/AdminShell";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await donationRepository.stats();

  return (
    <AdminShell>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Donation activity and daily summaries</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Donations" value={stats.totalDonations} detail={`Rs ${stats.totalAmount} all time`} />
        <StatCard title="Unique Donors" value={stats.uniqueDonors} detail="Approximate distinct names" />
        <StatCard title="Today's Donations" value={stats.today.count} detail={`Rs ${stats.today.amount}`} />
        <StatCard title="This Month's Donations" value={stats.month.count} detail={`Rs ${stats.month.amount}`} />
      </div>
    </div>
    </AdminShell>
  );
}
