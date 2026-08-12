import { useGrowIn } from '@/hooks/animation';
import { CHART_COLORS } from './chartPrimitives';

interface HistogramProps {
  data: { range: string; total: number; churned: number; rate: number }[];
  height?: number;
}

export function ChurnHistogram({ data, height = 220 }: HistogramProps) {
  const grow = useGrowIn(800, [data]);
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const chartH = height - 40;
  return (
    <svg width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={40}
          x2={400}
          y1={10 + g * chartH}
          y2={10 + g * chartH}
          stroke={CHART_COLORS.grid}
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const bw = (400 - 50) / data.length;
        const x = 44 + i * bw;
        const totalH = (d.total / maxTotal) * chartH * grow;
        const churnH = (d.churned / maxTotal) * chartH * grow;
        return (
          <g key={d.range}>
            <rect x={x} y={10 + chartH - totalH} width={bw * 0.7} height={totalH} rx={3} fill={CHART_COLORS.primaryLight} opacity={0.35} />
            <rect x={x} y={10 + chartH - churnH} width={bw * 0.7} height={churnH} rx={3} fill={CHART_COLORS.danger} opacity={0.9}>
              <title>{`${d.range}: ${(d.rate * 100).toFixed(1)}% churn (${d.churned}/${d.total})`}</title>
            </rect>
            <text x={x + (bw * 0.7) / 2} y={height - 8} textAnchor="middle" fontSize={9} fill={CHART_COLORS.text}>
              {d.range}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
