export interface Customer {
  customerID: string;
  gender: 'Male' | 'Female';
  seniorCitizen: boolean;
  partner: boolean;
  dependents: boolean;
  tenure: number; // months
  phoneService: boolean;
  multipleLines: boolean;
  internetService: 'DSL' | 'Fiber optic' | 'No';
  onlineSecurity: boolean;
  onlineBackup: boolean;
  deviceProtection: boolean;
  techSupport: boolean;
  streamingTV: boolean;
  streamingMovies: boolean;
  contract: 'Month-to-month' | 'One year' | 'Two year';
  paperlessBilling: boolean;
  paymentMethod: 'Electronic check' | 'Mailed check' | 'Bank transfer' | 'Credit card';
  monthlyCharges: number;
  totalCharges: number;
  churn: boolean;
}

export interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  confusion: { tn: number; fp: number; fn: number; tp: number };
  featureImportance: { feature: string; importance: number }[];
}

export interface PredictionResult {
  probability: number;
  label: boolean;
  topFactors: { feature: string; contribution: number }[];
}

export interface FeatureMeta {
  key: keyof Customer;
  label: string;
  type: 'numeric' | 'categorical' | 'boolean';
  categories?: string[];
}
