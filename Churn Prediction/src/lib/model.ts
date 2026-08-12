export interface TrainedModel {
  name: string;
  predictProba(X: number[][]): number[];
  featureImportance(featureNames: string[]): { feature: string; importance: number }[];
}

export function sigmoid(x: number): number {
  if (x < -30) return 0;
  if (x > 30) return 1;
  return 1 / (1 + Math.exp(-x));
}

export function log1pexp(x: number): number {
  // numerically stable log(1+exp(x))
  if (x > 30) return x;
  if (x < -30) return 0;
  return Math.log1p(Math.exp(x));
}
