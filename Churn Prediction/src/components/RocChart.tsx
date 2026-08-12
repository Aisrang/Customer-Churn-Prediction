import { CHART_COLORS, MODEL_COLORS } from './chartPrimitives';

interface RocChartProps {
  curves: { name: string; points: { fpr: number; tpr: number }[] }[];
  height?: number;
}

export function RocChart({ curves, height = 280 }: RocChartProps) {
  const size = 280;
  const pad = 36;
  const plot = size - pad * 2;
  const toX = (fpr: number) => pad + fpr * plot;
  const toY = (tpr: number) => pad + plot - tpr * plot;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${size} ${size}`}>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={pad} x2={pad + plot} y1={toY(g)} y2={toY(g)} stroke={CHART_COLORS.grid} strokeWidth={1} />
          <line x1={toX(g)} x2={toX(g)} y1={pad} y2={pad + plot} stroke={CHART_COLORS.grid} strokeWidth={1} />
        </g>
      ))}
      {/* diagonal */}
      <line x1={pad} y1={pad + plot} x2={pad + plot} y2={pad} stroke={CHART_COLORS.axis} strokeWidth={1} strokeDasharray="4 4" />
      {/* axes */}
      <line x1={pad} y1={pad} x2={pad} y2={pad + plot} stroke={CHART_COLORS.axis} strokeWidth={1.5} />
      <line x1={pad} y1={pad + plot} x2={pad + plot} y2={pad + plot} stroke={CHART_COLORS.axis} strokeWidth={1.5} />
      {/* curves */}
      {curves.map((c) => {
        const color = MODEL_COLORS[c.name] ?? CHART_COLORS.primary;
        const path = c.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.fpr)} ${toY(p.tpr)}`)
          .join(' ');
        return (
          <path key={c.name} d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        );
      })}
      {/* labels */}
      <text x={pad + plot / 2} y={size - 6} textAnchor="middle" fontSize={10} fill={CHART_COLORS.text}>False Positive Rate</text>
      <text x={10} y={pad + plot / 2} textAnchor="middle" fontSize={10} fill={CHART_COLORS.text} transform={`rotate(-90 10 ${pad + plot / 2})`}>True Positive Rate</text>
    </svg>
  );
}
