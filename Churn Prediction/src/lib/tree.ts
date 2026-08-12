// CART-style decision tree with Gini impurity, supporting both classification
// probability (class proportions in leaves) and feature importance accumulation.

interface TreeNode {
  leaf: boolean;
  prediction?: number; // probability of positive class
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export class DecisionTree {
  root!: TreeNode;
  private importances: number[] = [];
  private nFeatures = 0;

  constructor(
    private maxDepth = 6,
    private minSamplesSplit = 10,
    private maxFeatures?: number,
    private rng: () => number = Math.random,
  ) {}

  fit(X: number[][], y: number[], nFeatures: number) {
    this.nFeatures = nFeatures;
    this.importances = new Array(nFeatures).fill(0);
    this.root = this.build(X, y, 0);
  }

  private gini(y: number[]): number {
    const n = y.length;
    if (n === 0) return 0;
    let pos = 0;
    for (const v of y) pos += v;
    const p = pos / n;
    return 1 - p * p - (1 - p) * (1 - p);
  }

  private bestSplit(
    X: number[][],
    y: number[],
    features: number[],
  ): { feature: number; threshold: number; gain: number } | null {
    const n = y.length;
    const parentGini = this.gini(y);
    let best: { feature: number; threshold: number; gain: number } | null = null;
    for (const f of features) {
      // Candidate thresholds = midpoints of sorted unique values (sampled for speed).
      const vals = X.map((row) => row[f]);
      const sorted = [...new Set(vals)].sort((a, b) => a - b);
      const step = Math.max(1, Math.floor(sorted.length / 20));
      for (let t = 0; t < sorted.length - 1; t += step) {
        const threshold = (sorted[t] + sorted[t + 1]) / 2;
        let leftPos = 0;
        let leftN = 0;
        for (let i = 0; i < n; i++) {
          if (X[i][f] <= threshold) {
            leftPos += y[i];
            leftN++;
          }
        }
        const rightN = n - leftN;
        if (leftN === 0 || rightN === 0) continue;
        const leftP = leftPos / leftN;
        const rightPos = y.reduce((s, v, i) => s + (X[i][f] > threshold ? v : 0), 0);
        const rightP = rightPos / rightN;
        const leftGini = 1 - leftP * leftP - (1 - leftP) * (1 - leftP);
        const rightGini = 1 - rightP * rightP - (1 - rightP) * (1 - rightP);
        const gain =
          parentGini -
          (leftN / n) * leftGini -
          (rightN / n) * rightGini;
        if (!best || gain > best.gain) best = { feature: f, threshold, gain };
      }
    }
    return best;
  }

  private build(X: number[][], y: number[], depth: number): TreeNode {
    const pos = y.reduce((s, v) => s + v, 0);
    const p = pos / y.length;
    if (
      depth >= this.maxDepth ||
      y.length < this.minSamplesSplit ||
      p === 0 ||
      p === 1
    ) {
      return { leaf: true, prediction: p };
    }
    // Feature subsampling for random forest.
    const allFeatures = Array.from({ length: this.nFeatures }, (_, i) => i);
    let features = allFeatures;
    if (this.maxFeatures && this.maxFeatures < this.nFeatures) {
      // Fisher-Yates partial shuffle.
      const shuffled = [...allFeatures];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      features = shuffled.slice(0, this.maxFeatures);
    }
    const split = this.bestSplit(X, y, features);
    if (!split || split.gain <= 0) return { leaf: true, prediction: p };

    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];
    for (let i = 0; i < X.length; i++) {
      if (X[i][split.feature] <= split.threshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }
    this.importances[split.feature] += split.gain * y.length;

    return {
      leaf: false,
      feature: split.feature,
      threshold: split.threshold,
      left: this.build(leftX, leftY, depth + 1),
      right: this.build(rightX, rightY, depth + 1),
    };
  }

  predictProbaOne(row: number[]): number {
    let node = this.root;
    while (!node.leaf) {
      if (row[node.feature!] <= node.threshold!) node = node.left!;
      else node = node.right!;
    }
    return node.prediction!;
  }

  predictProba(X: number[][]): number[] {
    return X.map((r) => this.predictProbaOne(r));
  }

  getImportances(): number[] {
    return this.importances;
  }
}
