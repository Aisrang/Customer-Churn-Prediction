import { useMemo, useState } from 'react';
import type { ModelMetrics } from '@/lib/types';
import type { TrainResult } from '@/lib/pipeline';
import { RocChart } from '@/components/RocChart';
import { ConfusionMatrixView } from '@/components/ConfusionMatrixView';
import { FeatureImportanceChart } from '@/components/FeatureImportanceChart';
import { MODEL_COLORS, formatPct, formatNum } from '@/components/chartPrimitives';

interface ModelPanelProps {
  result: TrainResult;
}

export function ModelPanel({ result }: ModelPanelProps) {
  const [selected, setSelected] = useState(0);
  const current = result.models[selected];

  const bestAuc = useMemo(
    () => Math.max(...result.models.map((m) => m.metrics.rocAuc)),
    [result],
  );
  const bestRecall = useMemo(
    () => Math.max(...result.models.map((m) => m.metrics.recall)),
    [result],
  );

  return (
    <div className="space-y-6">
      {/* Model comparison table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700">Model Comparison</h3>
          <p className="text-xs text-slate-400">
            Trained on {result.trainSize.toLocaleString()} samples · Evaluated on {result.testSize.toLocaleString()} samples
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Model</th>
                <th className="px-3 py-3 text-right">Accuracy</th>
                <th className="px-3 py-3 text-right">Precision</th>
                <th className="px-3 py-3 text-right">Recall</th>
                <th className="px-3 py-3 text-right">F1</th>
                <th className="px-3 py-3 text-right">ROC-AUC</th>
                <th className="px-3 py-3 text-center">Select</th>
              </tr>
            </thead>
            <tbody>
              {result.models.map((m, i) => {
                const mt = m.metrics;
                const isBestAuc = mt.rocAuc === bestAuc;
                const isBestRecall = mt.recall === bestRecall;
                return (
                  <tr
                    key={m.model.name}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${selected === i ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: MODEL_COLORS[m.model.name] }} />
                        <span className="font-medium text-slate-700">{m.model.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">{formatPct(mt.accuracy)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">{formatNum(mt.precision)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={isBestRecall ? 'font-semibold text-green-600' : 'text-slate-600'}>
                        {formatNum(mt.recall)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">{formatNum(mt.f1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className={isBestAuc ? 'font-semibold text-blue-600' : 'text-slate-600'}>
                        {formatNum(mt.rocAuc)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => setSelected(i)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          selected === i
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {selected === i ? 'Selected' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected model detail */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ROC curve */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">ROC Curves</h3>
          <p className="mb-3 text-xs text-slate-400">All models overlaid — diagonal = random classifier</p>
          <RocChart curves={result.rocCurves} />
          <div className="mt-2 flex flex-wrap gap-3">
            {result.rocCurves.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: MODEL_COLORS[c.name] }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>

        {/* Confusion matrix */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">
            Confusion Matrix — {current.model.name}
          </h3>
          <p className="mb-3 text-xs text-slate-400">Performance breakdown on the test set</p>
          <ConfusionMatrixView confusion={current.metrics.confusion} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-slate-500">Accuracy: </span>
              <span className="font-semibold text-slate-700">{formatPct(current.metrics.accuracy)}</span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-slate-500">Recall: </span>
              <span className="font-semibold text-slate-700">{formatNum(current.metrics.recall)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature importance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-700">
          Feature Importance — {current.model.name}
        </h3>
        <p className="mb-4 text-xs text-slate-400">Top features driving churn predictions</p>
        <FeatureImportanceChart
          data={current.metrics.featureImportance}
          color={MODEL_COLORS[current.model.name]}
          topN={12}
        />
      </div>
    </div>
  );
}
