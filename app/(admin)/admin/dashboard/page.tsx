import { AdminShell } from "@/components/layout/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats;
  let sevaCount = 0;

  try {
    stats = await donationRepository.stats();
  } catch {
    stats = {
      totalDonations: 0,
      totalAmount: 0,
      uniqueDonors: 0,
      successfulPayments: 0,
      failedPayments: 0,
      topSeva: null,
      topDonor: null,
      today: { count: 0, amount: 0 },
      month: { count: 0, amount: 0 },
    };
  }

  try {
    const allSevas = await sevaRepository.findAll();
    sevaCount = allSevas.length;
  } catch {
    // Sevas not found or db error, count remains 0
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-copper">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Seva booking activity and summaries</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Today's Collection"
            value={`₹${stats.today.amount.toLocaleString('en-IN')}`}
            detail={`${stats.today.count} bookings today`}
            icon="🪔"
            color="saffron"
          />
          <StatCard
            title="Monthly Collection"
            value={`₹${stats.month.amount.toLocaleString('en-IN')}`}
            detail={`${stats.month.count} bookings this month`}
            icon="📊"
            color="gold"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalAmount.toLocaleString('en-IN')}`}
            detail={`${stats.successfulPayments} successful payments`}
            icon="💰"
            color="copper"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalDonations}
            detail={`${stats.uniqueDonors} unique devotees`}
            icon="📋"
            color="maroon"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gold/15 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Payment Success Rate</h3>
            <p className="mt-2 font-serif text-3xl font-bold text-success">
              {stats.totalDonations > 0 
                ? Math.round((stats.successfulPayments / stats.totalDonations) * 100) 
                : 0}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.failedPayments} failed transactions
            </p>
          </div>
          <div className="rounded-xl border border-gold/15 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Top Devotee</h3>
            <p className="mt-2 font-serif text-2xl font-bold text-saffron truncate">
              {stats.topDonor?.name || "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.topDonor ? `Donated ₹${stats.topDonor.amount.toLocaleString('en-IN')}` : "No donations yet"}
            </p>
          </div>
          <div className="rounded-xl border border-gold/15 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Most Popular Seva</h3>
            <p className="mt-2 font-serif text-2xl font-bold text-copper truncate">
              {stats.topSeva || "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Out of {sevaCount} active sevas
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
