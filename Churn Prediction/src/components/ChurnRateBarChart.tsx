import { useGrowIn } from '@/hooks/animation';
import { CHART_COLORS } from './chartPrimitives';

interface BarChartProps {
  data: { name: string; rate: number; total: number }[];
  color?: string;
  height?: number;
  horizontal?: boolean;
}

export function ChurnRateBarChart({
  data,
  color = CHART_COLORS.danger,
  height = 220,
}: BarChartProps) {
  const grow = useGrowIn(800, [data]);
  const max = Math.max(...data.map((d) => d.rate), 0.01);
  const chartH = height - 40;
  return (
    <div className="w-full">
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
          const barH = (d.rate / max) * chartH * grow;
          const bw = (400 - 50) / data.length;
          const x = 44 + i * bw;
          return (
            <g key={d.name}>
              <rect
                x={x}
                y={10 + chartH - barH}
                width={bw * 0.7}
                height={barH}
                rx={3}
                fill={color}
                opacity={0.85}
              >
                <title>{`${d.name}: ${(d.rate * 100).toFixed(1)}% (${d.total})`}</title>
              </rect>
              <text
                x={x + (bw * 0.7) / 2}
                y={10 + chartH - barH - 5}
                textAnchor="middle"
                fontSize={10}
                fill={CHART_COLORS.text}
                fontWeight={600}
              >
                {(d.rate * 100).toFixed(0)}%
              </text>
              <text
                x={x + (bw * 0.7) / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={9}
                fill={CHART_COLORS.text}
              >
                {d.name.length > 12 ? d.name.slice(0, 11) + '…' : d.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
