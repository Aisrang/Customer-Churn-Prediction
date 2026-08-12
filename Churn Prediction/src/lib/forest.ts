import { DecisionTree } from './tree';
import type { TrainedModel } from './model';

// Random Forest — bagged decision trees with feature subsampling.
export class RandomForest implements TrainedModel {
  name = 'Random Forest';
  private trees: DecisionTree[] = [];
  private nFeatures = 0;

  constructor(
    private nTrees = 80,
    private maxDepth = 8,
    private maxFeaturesRatio = 0.6,
    private rng: () => number = Math.random,
  ) {}

  train(X: number[][], y: boolean[]) {
    this.nFeatures = X[0].length;
    const yNum = y.map((v) => (v ? 1 : 0));
    const maxFeatures = Math.max(2, Math.floor(this.nFeatures * this.maxFeaturesRatio));
    for (let t = 0; t < this.nTrees; t++) {
      // Bootstrap sample.
      const sampleIdx: number[] = [];
      for (let i = 0; i < X.length; i++) {
        sampleIdx.push(Math.floor(this.rng() * X.length));
      }
      const Xs = sampleIdx.map((i) => X[i]);
      const ys = sampleIdx.map((i) => yNum[i]);
      const tree = new DecisionTree(this.maxDepth, 8, maxFeatures, this.rng);
      tree.fit(Xs, ys, this.nFeatures);
      this.trees.push(tree);
    }
  }

  predictProba(X: number[][]): number[] {
    return X.map((row) => {
      let s = 0;
      for (const tree of this.trees) s += tree.predictProbaOne(row);
      return s / this.trees.length;
    });
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
