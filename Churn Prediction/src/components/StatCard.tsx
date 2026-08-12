import { useCountUp } from '@/hooks/animation';
import { CHART_COLORS } from './chartPrimitives';

interface StatCardProps {
  label: string;
  value: number;
  format: 'count' | 'percent';
  accent?: string;
  icon?: React.ReactNode;
  sub?: string;
}

export function StatCard({ label, value, format, accent, icon, sub }: StatCardProps) {
  const animated = useCountUp(value, 900, [value]);
  const display =
    format === 'percent' ? `${(animated * 100).toFixed(1)}%` : Math.round(animated).toLocaleString();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent ?? CHART_COLORS.primary }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{display}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `${accent ?? CHART_COLORS.primary}15`, color: accent ?? CHART_COLORS.primary }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
