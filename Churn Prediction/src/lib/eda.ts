import type { Customer } from './types';
import { FEATURE_META } from './data';

export interface ChurnByCategory {
  feature: string;
  categories: { name: string; total: number; churned: number; rate: number }[];
}

export interface NumericBins {
  feature: string;
  bins: { range: string; total: number; churned: number; rate: number }[];
}

export function churnByCategorical(
  customers: Customer[],
  key: keyof Customer,
  label: string,
): ChurnByCategory {
  const map = new Map<string, { total: number; churned: number }>();
  for (const c of customers) {
    const val = String(c[key]);
    if (!map.has(val)) map.set(val, { total: 0, churned: 0 });
    const e = map.get(val)!;
    e.total++;
    if (c.churn) e.churned++;
  }
  const categories = Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      total: v.total,
      churned: v.churned,
      rate: v.total ? v.churned / v.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
  return { feature: label, categories };
}

export function churnByBinned(
  customers: Customer[],
  key: keyof Customer,
  label: string,
  bins: number[],
): NumericBins {
  const result = bins.slice(0, -1).map((start, i) => {
    const end = bins[i + 1];
    let total = 0;
    let churned = 0;
    for (const c of customers) {
      const v = Number(c[key]);
      if (v >= start && (i === bins.length - 2 ? v <= end : v < end)) {
        total++;
        if (c.churn) churned++;
      }
    }
    return {
      range: `${start}-${end}`,
      total,
      churned,
      rate: total ? churned / total : 0,
    };
  });
  return { feature: label, bins: result };
}

export function overallStats(customers: Customer[]) {
  const total = customers.length;
  const churned = customers.filter((c) => c.churn).length;
  return {
    total,
    churned,
    retained: total - churned,
    churnRate: total ? churned / total : 0,
  };
}

export function correlationWithChurn(
  customers: Customer[],
  key: keyof Customer,
): number {
  const vals = customers.map((c) => Number(c[key]));
  const labels: number[] = customers.map((c) => (c.churn ? 1 : 0));
  const n = vals.length;
  const meanV = vals.reduce((s, v) => s + v, 0) / n;
  const meanL = labels.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dv = 0;
  let dl = 0;
  for (let i = 0; i < n; i++) {
    num += (vals[i] - meanV) * (labels[i] - meanL);
    dv += (vals[i] - meanV) ** 2;
    dl += (labels[i] - meanL) ** 2;
  }
  if (dv === 0 || dl === 0) return 0;
  return num / Math.sqrt(dv * dl);
}

export const EDA_FEATURES = FEATURE_META.filter(
  (f) => f.type === 'numeric',
).map((f) => f.key);
