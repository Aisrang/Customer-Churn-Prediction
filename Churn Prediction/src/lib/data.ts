import type { Customer, FeatureMeta } from './types';

// Mulberry32 deterministic PRNG so the dataset is reproducible across reloads.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20240715);
const randn = (() => {
  // Box-Muller
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    spare = mag * Math.sin(2.0 * Math.PI * v);
    return mag * Math.cos(2.0 * Math.PI * v);
  };
})();

const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const bool = (p: number) => rand() < p;

const contracts = ['Month-to-month', 'One year', 'Two year'] as const;
const internetOptions = ['DSL', 'Fiber optic', 'No'] as const;
const paymentOptions = [
  'Electronic check',
  'Mailed check',
  'Bank transfer',
  'Credit card',
] as const;

export const FEATURE_META: FeatureMeta[] = [
  { key: 'gender', label: 'Gender', type: 'categorical', categories: ['Male', 'Female'] },
  { key: 'seniorCitizen', label: 'Senior Citizen', type: 'boolean' },
  { key: 'partner', label: 'Partner', type: 'boolean' },
  { key: 'dependents', label: 'Dependents', type: 'boolean' },
  { key: 'tenure', label: 'Tenure (months)', type: 'numeric' },
  { key: 'phoneService', label: 'Phone Service', type: 'boolean' },
  { key: 'multipleLines', label: 'Multiple Lines', type: 'boolean' },
  { key: 'internetService', label: 'Internet Service', type: 'categorical', categories: [...internetOptions] },
  { key: 'onlineSecurity', label: 'Online Security', type: 'boolean' },
  { key: 'onlineBackup', label: 'Online Backup', type: 'boolean' },
  { key: 'deviceProtection', label: 'Device Protection', type: 'boolean' },
  { key: 'techSupport', label: 'Tech Support', type: 'boolean' },
  { key: 'streamingTV', label: 'Streaming TV', type: 'boolean' },
  { key: 'streamingMovies', label: 'Streaming Movies', type: 'boolean' },
  { key: 'contract', label: 'Contract', type: 'categorical', categories: [...contracts] },
  { key: 'paperlessBilling', label: 'Paperless Billing', type: 'boolean' },
  { key: 'paymentMethod', label: 'Payment Method', type: 'categorical', categories: [...paymentOptions] },
  { key: 'monthlyCharges', label: 'Monthly Charges', type: 'numeric' },
  { key: 'totalCharges', label: 'Total Charges', type: 'numeric' },
];

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

// Generate one customer with a churn probability driven by realistic risk factors.
function makeCustomer(i: number): Customer {
  const gender = bool(0.5) ? 'Male' : 'Female';
  const seniorCitizen = bool(0.16);
  const partner = bool(0.48);
  const dependents = bool(0.3);
  const phoneService = bool(0.9);
  const multipleLines = phoneService && bool(0.42);
  const internetService = pick([...internetOptions]);
  const hasInternet = internetService !== 'No';
  const onlineSecurity = hasInternet && bool(0.36);
  const onlineBackup = hasInternet && bool(0.38);
  const deviceProtection = hasInternet && bool(0.34);
  const techSupport = hasInternet && bool(0.29);
  const streamingTV = hasInternet && bool(0.38);
  const streamingMovies = hasInternet && bool(0.39);
  const contract = pick([...contracts]);
  const paperlessBilling = bool(0.59);
  const paymentMethod = pick([...paymentOptions]);

  // Tenure depends on contract type — longer contracts correlate with longer tenure.
  const tenureBase =
    contract === 'Two year' ? 40 : contract === 'One year' ? 24 : 8;
  const tenure = Math.max(
    1,
    Math.min(72, Math.round(tenureBase + randn() * 14)),
  );

  // Monthly charges scale with services.
  let monthly = 18;
  if (phoneService) monthly += 20;
  if (multipleLines) monthly += 10;
  if (internetService === 'DSL') monthly += 25;
  if (internetService === 'Fiber optic') monthly += 55;
  if (onlineSecurity) monthly += 5;
  if (onlineBackup) monthly += 5;
  if (deviceProtection) monthly += 4;
  if (techSupport) monthly += 5;
  if (streamingTV) monthly += 12;
  if (streamingMovies) monthly += 12;
  monthly = Math.round(monthly + randn() * 6);
  monthly = Math.max(18, monthly);

  const totalCharges = Math.round(tenure * monthly + randn() * 30);

  // Churn risk score — mirrors real telecom churn drivers.
  let logit = -2.2;
  if (contract === 'Month-to-month') logit += 1.7;
  if (contract === 'One year') logit -= 0.4;
  if (contract === 'Two year') logit -= 1.3;
  if (tenure < 6) logit += 1.1;
  else if (tenure < 12) logit += 0.5;
  else if (tenure > 36) logit -= 0.8;
  if (internetService === 'Fiber optic') logit += 0.7;
  if (internetService === 'No') logit -= 0.5;
  if (!onlineSecurity && hasInternet) logit += 0.5;
  if (!techSupport && hasInternet) logit += 0.4;
  if (paymentMethod === 'Electronic check') logit += 0.6;
  if (paperlessBilling) logit += 0.25;
  if (monthly > 80) logit += 0.5;
  if (monthly < 30) logit -= 0.4;
  if (seniorCitizen) logit += 0.35;
  if (!partner) logit += 0.25;
  if (!dependents) logit += 0.2;
  logit += randn() * 0.3;

  const p = sigmoid(logit);
  const churn = rand() < p;

  return {
    customerID: `CUST-${String(i + 1).padStart(5, '0')}`,
    gender,
    seniorCitizen,
    partner,
    dependents,
    tenure,
    phoneService,
    multipleLines,
    internetService,
    onlineSecurity,
    onlineBackup,
    deviceProtection,
    techSupport,
    streamingTV,
    streamingMovies,
    contract,
    paperlessBilling,
    paymentMethod,
    monthlyCharges: monthly,
    totalCharges,
    churn,
  };
}

export function generateDataset(n: number = 4000): Customer[] {
  return Array.from({ length: n }, (_, i) => makeCustomer(i));
}
