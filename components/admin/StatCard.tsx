type Props = {
  title: string;
  value: string | number;
  detail?: string;
  icon?: string;
  color?: 'saffron' | 'gold' | 'copper' | 'maroon';
};

const colorMap = {
  saffron: 'from-orange-50 to-amber-50/50 border-saffron/15',
  gold: 'from-yellow-50 to-amber-50/50 border-gold/15',
  copper: 'from-orange-50/50 to-stone-50 border-copper/15',
  maroon: 'from-rose-50/50 to-stone-50 border-maroon/15',
};

export function StatCard({ title, value, detail, icon, color = 'saffron' }: Props) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 font-serif text-2xl font-bold text-foreground">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        {icon ? <span className="text-2xl">{icon}</span> : null}
      </div>
    </div>
  );
}
