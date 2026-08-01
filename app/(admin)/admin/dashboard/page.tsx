import { AdminShell } from "@/components/layout/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { donationRepository } from "@/lib/db/repositories/donationRepository";
import { sevaRepository } from "@/lib/db/repositories/sevaRepository";
import { 
  Banknote, 
  CalendarDays, 
  Wallet, 
  Users, 
  TrendingUp,
  Award,
  BookOpenCheck
} from "lucide-react";

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

  const successRate = stats.totalDonations > 0 
    ? Math.round((stats.successfulPayments / stats.totalDonations) * 100) 
    : 0;

  return (
    <AdminShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">Monitor real-time seva bookings and transaction analytics.</p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Today's Collection"
            value={`₹${stats.today.amount.toLocaleString('en-IN')}`}
            detail={`${stats.today.count} bookings today`}
            icon={<Banknote className="h-6 w-6" />}
            color="saffron"
          />
          <StatCard
            title="Monthly Collection"
            value={`₹${stats.month.amount.toLocaleString('en-IN')}`}
            detail={`${stats.month.count} bookings this month`}
            icon={<CalendarDays className="h-6 w-6" />}
            color="gold"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalAmount.toLocaleString('en-IN')}`}
            detail={`${stats.successfulPayments} successful payments`}
            icon={<Wallet className="h-6 w-6" />}
            color="success"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalDonations.toLocaleString('en-IN')}
            detail={`${stats.uniqueDonors} unique devotees`}
            icon={<Users className="h-6 w-6" />}
            color="copper"
          />
        </div>

        {/* Secondary Insights Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          
          <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="font-serif text-2xl font-bold text-foreground">{successRate}%</p>
                  <p className="text-xs font-medium text-destructive">{stats.failedPayments} failed</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                <Award className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">Top Devotee</h3>
                <p className="mt-1 truncate font-serif text-2xl font-bold text-foreground">
                  {stats.topDonor?.name || "N/A"}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground/80">
                  {stats.topDonor ? `Donated ₹${stats.topDonor.amount.toLocaleString('en-IN')}` : "No donations yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">Popular Seva</h3>
                <p className="mt-1 truncate font-serif text-xl font-bold text-foreground">
                  {stats.topSeva || "N/A"}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground/80">
                  Out of {sevaCount} active sevas
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
