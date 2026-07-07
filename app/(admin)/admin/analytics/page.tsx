import { AdminShell } from "@/components/layout/AdminShell";
import { donationRepository } from "@/lib/db/repositories/donationRepository";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let stats;
  let dailyData: any[] = [];
  let monthlyData: any[] = [];
  
  try {
    stats = await donationRepository.stats();
    dailyData = await donationRepository.dailyCollections(7);
    monthlyData = await donationRepository.monthlyCollections(6);
  } catch {
    stats = { totalDonations: 0, totalAmount: 0, uniqueDonors: 0, today: { count: 0, amount: 0 }, month: { count: 0, amount: 0 } };
  }

  // Calculate max values for chart scaling
  const maxDaily = Math.max(...dailyData.map(d => d.amount), 1);
  const maxMonthly = Math.max(...monthlyData.map(d => d.amount), 1);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-copper">Analytics</h1>
          <p className="text-sm text-muted-foreground">Detailed insights into seva bookings and collections</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Summary Card */}
          <div className="rounded-xl border border-gold/15 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-copper">Collection Summary</h3>
            <div className="grid gap-4 grid-cols-2">
              <div className="rounded-lg bg-saffron/10 p-4 border border-saffron/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
                <p className="mt-1 font-serif text-2xl font-bold text-saffron">₹{stats.today.amount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{stats.today.count} bookings</p>
              </div>
              <div className="rounded-lg bg-gold/10 p-4 border border-gold/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month</p>
                <p className="mt-1 font-serif text-2xl font-bold text-gold">₹{stats.month.amount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{stats.month.count} bookings</p>
              </div>
              <div className="rounded-lg bg-copper/10 p-4 border border-copper/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Time</p>
                <p className="mt-1 font-serif text-2xl font-bold text-copper">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{stats.totalDonations} bookings</p>
              </div>
              <div className="rounded-lg bg-maroon/5 p-4 border border-maroon/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Devotees</p>
                <p className="mt-1 font-serif text-2xl font-bold text-maroon">{stats.uniqueDonors}</p>
                <p className="text-xs text-muted-foreground">unique names</p>
              </div>
            </div>
          </div>

          {/* Daily Collections Chart */}
          <div className="rounded-xl border border-gold/15 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-serif text-lg font-semibold text-copper">Last 7 Days Revenue</h3>
            <div className="h-48 flex items-end justify-between gap-2 pt-4">
              {dailyData.map((day, i) => {
                const heightPercentage = (day.amount / maxDaily) * 100;
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full w-full group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₹{day.amount.toLocaleString('en-IN')}
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full bg-saffron/80 hover:bg-saffron rounded-t-sm transition-all"
                      style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                    ></div>
                    {/* Label */}
                    <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
              {dailyData.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No data for the last 7 days
                </div>
              )}
            </div>
          </div>
          
          {/* Monthly Collections Chart */}
          <div className="rounded-xl border border-gold/15 bg-white p-6 space-y-4 shadow-sm lg:col-span-2">
            <h3 className="font-serif text-lg font-semibold text-copper">Last 6 Months Revenue</h3>
            <div className="h-64 flex items-end justify-between gap-4 pt-4">
              {monthlyData.map((month, i) => {
                const heightPercentage = (month.amount / maxMonthly) * 100;
                // month.month is in YYYY-MM format
                const [y, m] = month.month.split('-');
                const monthName = new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full w-full group relative">
                    <div className="absolute -top-10 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₹{month.amount.toLocaleString('en-IN')}
                    </div>
                    <div 
                      className="w-full bg-gold/80 hover:bg-gold rounded-t-sm transition-all"
                      style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                    ></div>
                    <span className="text-xs text-muted-foreground mt-2 truncate w-full text-center font-medium">
                      {monthName}
                    </span>
                  </div>
                );
              })}
              {monthlyData.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No data for the last 6 months
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminShell>
  );
}
