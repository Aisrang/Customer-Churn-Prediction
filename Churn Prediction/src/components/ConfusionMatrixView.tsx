import { CHART_COLORS } from './chartPrimitives';

interface ConfusionMatrixViewProps {
  confusion: { tn: number; fp: number; fn: number; tp: number };
}

export function ConfusionMatrixView({ confusion }: ConfusionMatrixViewProps) {
  const { tn, fp, fn, tp } = confusion;
  const total = tn + fp + fn + tp || 1;
  const cells = [
    { label: 'True Negative', value: tn, color: CHART_COLORS.success, sub: 'Correctly retained' },
    { label: 'False Positive', value: fp, color: CHART_COLORS.warning, sub: 'Predicted churn, stayed' },
    { label: 'False Negative', value: fn, color: CHART_COLORS.danger, sub: 'Predicted stay, churned' },
    { label: 'True Positive', value: tp, color: CHART_COLORS.primary, sub: 'Correctly churned' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border p-3 text-center"
          style={{ borderColor: `${c.color}40`, background: `${c.color}08` }}
        >
          <p className="text-2xl font-bold" style={{ color: c.color }}>
            {c.value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">{c.label}</p>
          <p className="text-[10px] text-slate-400">{c.sub}</p>
          <p className="mt-1 text-[10px] text-slate-400">{((c.value / total) * 100).toFixed(1)}%</p>
        </div>
      ))}
    </div>
  );
}
