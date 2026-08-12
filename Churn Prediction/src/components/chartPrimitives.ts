// Shared SVG chart primitives — no external chart library.

export const CHART_COLORS = {
  primary: '#2563eb',
  primaryLight: '#60a5fa',
  accent: '#0ea5e9',
  danger: '#ef4444',
  dangerLight: '#fca5a5',
  success: '#10b981',
  warning: '#f59e0b',
  neutral: '#64748b',
  grid: '#e2e8f0',
  axis: '#94a3b8',
  text: '#475569',
};

export const MODEL_COLORS: Record<string, string> = {
  'Logistic Regression': '#2563eb',
  'Random Forest': '#10b981',
  'XGBoost': '#f59e0b',
};

export function formatPct(v: number, digits = 1) {
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatNum(v: number, digits = 3) {
  return v.toFixed(digits);
}
