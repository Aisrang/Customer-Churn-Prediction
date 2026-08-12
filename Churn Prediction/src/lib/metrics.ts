export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  confusion: ConfusionMatrix;
}

export function confusionMatrix(yTrue: boolean[], yPred: boolean[]): ConfusionMatrix {
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let tp = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] && yPred[i]) tp++;
    else if (yTrue[i] && !yPred[i]) fn++;
    else if (!yTrue[i] && yPred[i]) fp++;
    else tn++;
  }
  return { tn, fp, fn, tp };
}

export function computeMetrics(
  yTrue: boolean[],
  yProb: number[],
  threshold = 0.5,
): Metrics {
  const yPred = yProb.map((p) => p >= threshold);
  const c = confusionMatrix(yTrue, yPred);
  const accuracy = (c.tp + c.tn) / (yTrue.length || 1);
  const precision = c.tp / (c.tp + c.fp || 1);
  const recall = c.tp / (c.tp + c.fn || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);
  const rocAuc = rocAucScore(yTrue, yProb);
  return { accuracy, precision, recall, f1, rocAuc, confusion: c };
}

// ROC-AUC via the rank / Mann-Whitney U formulation — O(n log n), no threshold sweep.
export function rocAucScore(yTrue: boolean[], yProb: number[]): number {
  const pos = yTrue.filter(Boolean).length;
  const neg = yTrue.length - pos;
  if (pos === 0 || neg === 0) return 0.5;
  const indexed = yProb.map((p, i) => ({ p, t: yTrue[i] }));
  indexed.sort((a, b) => a.p - b.p);
  // Assign ranks, handling ties with average rank.
  const ranks = new Array(indexed.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1].p === indexed[i].p) j++;
    const avg = (i + j) / 2 + 1; // 1-based average rank
    for (let k = i; k <= j; k++) ranks[k] = avg;
    i = j + 1;
  }
  let sumPosRanks = 0;
  for (let k = 0; k < indexed.length; k++) {
    if (indexed[k].t) sumPosRanks += ranks[k];
  }
  return (sumPosRanks - (pos * (pos + 1)) / 2) / (pos * neg);
}

// Produce ROC curve points for plotting.
export function rocCurve(
  yTrue: boolean[],
  yProb: number[],
): { fpr: number; tpr: number }[] {
  const indexed = yProb.map((p, i) => ({ p, t: yTrue[i] }));
  indexed.sort((a, b) => b.p - a.p);
  const points: { fpr: number; tpr: number }[] = [{ fpr: 0, tpr: 0 }];
  let tp = 0;
  let fp = 0;
  const pos = yTrue.filter(Boolean).length;
  const neg = yTrue.length - pos;
  for (const { t } of indexed) {
    if (t) tp++;
    else fp++;
    points.push({
      fpr: neg ? fp / neg : 0,
      tpr: pos ? tp / pos : 0,
    });
  }
  return points;
}
