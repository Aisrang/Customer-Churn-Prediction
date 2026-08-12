import { useGrowIn } from '@/hooks/animation';
import { CHART_COLORS } from './chartPrimitives';

interface FeatureImportanceProps {
  data: { feature: string; importance: number }[];
  color?: string;
  topN?: number;
}

export function FeatureImportanceChart({ data, color = CHART_COLORS.primary, topN = 10 }: FeatureImportanceProps) {
  const grow = useGrowIn(700, [data]);
  const top = data.slice(0, topN);
  const max = Math.max(...top.map((d) => d.importance), 0.0001);
  return (
    <div className="space-y-1.5">
      {top.map((d) => {
        const w = (d.importance / max) * 100 * grow;
        return (
          <div key={d.feature} className="flex items-center gap-2">
            <div className="w-32 shrink-0 truncate text-xs text-slate-600" title={d.feature}>
              {d.feature}
            </div>
            <div className="h-5 flex-1 rounded bg-slate-100">
              <div
                className="h-5 rounded transition-all"
                style={{ width: `${w}%`, background: color }}
              >
                <title>{d.importance.toFixed(4)}</title>
              </div>
            </div>
            <div className="w-12 shrink-0 text-right text-xs font-medium text-slate-500">
              {(d.importance * 100).toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
