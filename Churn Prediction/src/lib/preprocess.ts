import type { Customer, FeatureMeta } from './types';
import { FEATURE_META } from './data';

export interface ProcessedData {
  X: number[][];
  y: boolean[];
  featureNames: string[];
  meta: FeatureMeta[];
  // Encoding maps so we can transform a single new customer later.
  encoders: Map<string, string[]>;
  // Standardization params.
  mean: number[];
  std: number[];
}

// Build the expanded feature-name list (categoricals become one-hot columns).
function expandFeatures(meta: FeatureMeta[], encoders: Map<string, string[]>): string[] {
  const names: string[] = [];
  for (const f of meta) {
    if (f.type === 'categorical' && f.categories) {
      const cats = encoders.get(f.key)!;
      for (const c of cats) names.push(`${f.label}=${c}`);
    } else {
      names.push(f.label);
    }
  }
  return names;
}

function encodeValue(
  f: FeatureMeta,
  value: unknown,
  encoders: Map<string, string[]>,
): number[] {
  if (f.type === 'categorical' && f.categories) {
    const cats = encoders.get(f.key)!;
    return cats.map((c) => (value === c ? 1 : 0));
  }
  if (f.type === 'boolean') return [value ? 1 : 0];
  return [Number(value)];
}

export function preprocess(customers: Customer[]): ProcessedData {
  // Build categorical encoders from the data (drop-first is NOT used — we keep
  // all levels because tree models handle it fine and logistic regression
  // uses L2 regularization to absorb the redundancy).
  const encoders = new Map<string, string[]>();
  for (const f of FEATURE_META) {
    if (f.type === 'categorical' && f.categories) {
      encoders.set(f.key, [...f.categories]);
    }
  }

  const featureNames = expandFeatures(FEATURE_META, encoders);

  const X = customers.map((c) => {
    const row: number[] = [];
    for (const f of FEATURE_META) {
      row.push(...encodeValue(f, c[f.key], encoders));
    }
    return row;
  });
  const y = customers.map((c) => c.churn);

  // Standardize numeric columns (mean/std) — helps logistic regression converge.
  const nCols = X[0].length;
  const mean = new Array(nCols).fill(0);
  const std = new Array(nCols).fill(1);
  for (let j = 0; j < nCols; j++) {
    let s = 0;
    for (let i = 0; i < X.length; i++) s += X[i][j];
    mean[j] = s / X.length;
    let ss = 0;
    for (let i = 0; i < X.length; i++) ss += (X[i][j] - mean[j]) ** 2;
    std[j] = Math.sqrt(ss / X.length) || 1;
  }
  // Only standardize genuinely numeric columns (variance > 0.5 on raw scale).
  // We detect numeric columns by matching against FEATURE_META order.
  let col = 0;
  for (const f of FEATURE_META) {
    const width = f.type === 'categorical' && f.categories ? f.categories.length : 1;
    if (f.type === 'numeric') {
      for (let k = 0; k < width; k++) {
        const j = col + k;
        for (let i = 0; i < X.length; i++) {
          X[i][j] = (X[i][j] - mean[j]) / std[j];
        }
      }
    }
    col += width;
  }

  return { X, y, featureNames, meta: FEATURE_META, encoders, mean, std };
}

export function encodeCustomer(
  c: Customer,
  processed: ProcessedData,
): number[] {
  const row: number[] = [];
  let col = 0;
  for (const f of FEATURE_META) {
    const vals = encodeValue(f, c[f.key], processed.encoders);
    if (f.type === 'numeric') {
      for (let k = 0; k < vals.length; k++) {
        const j = col + k;
        vals[k] = (vals[k] - processed.mean[j]) / processed.std[j];
      }
    }
    row.push(...vals);
    col += vals.length;
  }
  return row;
}

// Deterministic shuffle + split so train/test are stable across runs.
export function trainTestSplit<T>(
  arr: T[],
  testRatio = 0.2,
  seed = 42,
): { train: T[]; test: T[] } {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  const cut = Math.floor(a.length * (1 - testRatio));
  return { train: a.slice(0, cut), test: a.slice(cut) };
}
