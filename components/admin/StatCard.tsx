import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  color?: 'saffron' | 'gold' | 'copper' | 'maroon' | 'success';
};

const colorMap = {
  saffron: 'text-orange-500 bg-orange-50',
  gold: 'text-amber-500 bg-amber-50',
  copper: 'text-rose-500 bg-rose-50',
  maroon: 'text-red-500 bg-red-50',
  success: 'text-emerald-500 bg-emerald-50',
};

export function StatCard({ title, value, detail, icon, color = 'saffron' }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-serif text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {detail && (
            <p className="mt-1 text-xs font-medium text-muted-foreground/80">{detail}</p>
          )}
        </div>
        {icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${colorMap[color].split(' ')[1]}`} />
    </div>
  );
}
