import { DecisionTree } from './tree';
import type { TrainedModel } from './model';

// XGBoost-style additive trees fit to the residual of the logistic loss via
// Newton step (hessian = p*(1-p)), with leaf-weight shrinkage.
export class XGBoost implements TrainedModel {
  name = 'XGBoost';
  private trees: DecisionTree[] = [];
  private initScore = 0;
  private learningRate = 0.1;
  private nFeatures = 0;

  constructor(
    private nEstimators = 80,
    private maxDepth = 3,
    private lr = 0.1,
  ) {}

  train(X: number[][], y: boolean[]) {
    this.nFeatures = X[0].length;
    this.learningRate = this.lr;
    const yNum: number[] = y.map((v) => (v ? 1 : 0));
    const pos = yNum.reduce((s, v) => s + v, 0);
    this.initScore = Math.log((pos + 1) / (y.length - pos + 1)); // smoothed prior log-odds

    const scores = new Array(y.length).fill(this.initScore);
    for (let m = 0; m < this.nEstimators; m++) {
      // Gradient & hessian of log-loss.
      const probs = scores.map((s) => 1 / (1 + Math.exp(-s)));
      const grad = probs.map((p, i) => p - yNum[i]);
      const hess = probs.map((p) => p * (1 - p));
      // Newton residual = -grad / hess (the target we fit).
      const residual = grad.map((g, i) => (hess[i] > 1e-6 ? -g / hess[i] : 0));
      const tree = new DecisionTree(this.maxDepth, 10);
      tree.fit(X, residual, this.nFeatures);
      this.trees.push(tree);
      // Update scores with leaf-weight shrinkage.
      const preds = tree.predictProba(X);
      for (let i = 0; i < scores.length; i++) {
        scores[i] += this.learningRate * preds[i];
      }
    }
  }

  private score(row: number[]): number {
    let s = this.initScore;
    for (const tree of this.trees) s += this.learningRate * tree.predictProbaOne(row);
    return s;
  }

  predictProba(X: number[][]): number[] {
    return X.map((row) => 1 / (1 + Math.exp(-this.score(row))));
  }

  featureImportance(featureNames: string[]) {
    const sums = new Array(this.nFeatures).fill(0);
    for (const tree of this.trees) {
      const imp = tree.getImportances();
      for (let j = 0; j < this.nFeatures; j++) sums[j] += imp[j];
    }
    const total = sums.reduce((s, v) => s + v, 0) || 1;
    return featureNames
      .map((f, j) => ({ feature: f, importance: sums[j] / total }))
      .sort((a, b) => b.importance - a.importance);
  }
}
