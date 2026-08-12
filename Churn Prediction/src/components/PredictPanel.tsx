import { useMemo, useState } from 'react';
import type { Customer } from '@/lib/types';
import type { TrainResult } from '@/lib/pipeline';
import { predictCustomer } from '@/lib/pipeline';
import { FEATURE_META } from '@/lib/data';
import { MODEL_COLORS, formatPct } from '@/components/chartPrimitives';
import { Wand2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PredictPanelProps {
  result: TrainResult;
}

function blankCustomer(): Customer {
  return {
    customerID: 'NEW',
    gender: 'Female',
    seniorCitizen: false,
    partner: false,
    dependents: false,
    tenure: 12,
    phoneService: true,
    multipleLines: false,
    internetService: 'DSL',
    onlineSecurity: false,
    onlineBackup: false,
    deviceProtection: false,
    techSupport: false,
    streamingTV: false,
    streamingMovies: false,
    contract: 'Month-to-month',
    paperlessBilling: true,
    paymentMethod: 'Electronic check',
    monthlyCharges: 50,
    totalCharges: 600,
    churn: false,
  };
}

export function PredictPanel({ result }: PredictPanelProps) {
  const [customer, setCustomer] = useState<Customer>(blankCustomer);
  const predictions = useMemo(
    () => predictCustomer(customer, result.models, result.processed),
    [customer, result],
  );

  const update = (key: keyof Customer, value: unknown) => {
    setCustomer((c) => ({ ...c, [key]: value }));
  };

  const avgProb = predictions.reduce((s, p) => s + p.probability, 0) / predictions.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Wand2 size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-700">Customer Profile</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_META.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === 'boolean' ? (
                <Toggle value={customer[f.key] as boolean} onChange={(v) => update(f.key, v)} />
              ) : f.type === 'categorical' ? (
                <Select
                  value={String(customer[f.key])}
                  options={f.categories!}
                  onChange={(v) => update(f.key, v)}
                />
              ) : (
                <NumberInput
                  value={Number(customer[f.key])}
                  onChange={(v) => update(f.key, v)}
                />
              )}
            </Field>
          ))}
        </div>
      </div>

      {/* Prediction results */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Ensemble Verdict</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Gauge probability={avgProb} />
            <div className="mt-3 flex items-center gap-2">
              {avgProb >= 0.5 ? (
                <AlertTriangle size={18} className="text-red-500" />
              ) : (
                <CheckCircle2 size={18} className="text-green-500" />
              )}
              <span className={`text-lg font-bold ${avgProb >= 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                {avgProb >= 0.5 ? 'Likely to Churn' : 'Likely to Stay'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Average probability across all models
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Per-Model Predictions</h3>
          <div className="space-y-3">
            {predictions.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: MODEL_COLORS[p.name] }} />
                    <span className="font-medium text-slate-700">{p.name}</span>
                  </div>
                  <span className={`font-semibold tabular-nums ${p.label ? 'text-red-600' : 'text-green-600'}`}>
                    {formatPct(p.probability)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${p.probability * 100}%`,
                      background: `linear-gradient(90deg, ${MODEL_COLORS[p.name]}, ${MODEL_COLORS[p.name]}cc)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Gauge({ probability }: { probability: number }) {
  const r = 52;
  const circ = Math.PI * r; // semicircle
  const offset = circ * (1 - probability);
  return (
    <svg width="140" height="80" viewBox="0 0 140 80">
      <path d={`M 14 70 A ${r} ${r} 0 0 1 126 70`} fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
      <path
        d={`M 14 70 A ${r} ${r} 0 0 1 126 70`}
        fill="none"
        stroke={probability >= 0.5 ? '#ef4444' : '#10b981'}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s' }}
      />
      <text x="70" y="62" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1e293b">
        {formatPct(probability, 0)}
      </text>
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-7 w-12 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  );
}
