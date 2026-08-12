import { sigmoid } from './model';
import type { TrainedModel } from './model';

// L2-regularized logistic regression trained with full-batch gradient descent.
export class LogisticRegression implements TrainedModel {
  name = 'Logistic Regression';
  private weights: number[];
  private bias: number;

  constructor(
    private nFeatures: number,
    private lr = 0.1,
    private l2 = 0.01,
    private epochs = 400,
  ) {
    this.weights = new Array(nFeatures).fill(0);
    this.bias = 0;
  }

  train(X: number[][], y: boolean[]) {
    const n = X.length;
    const yNum = y.map((v) => (v ? 1 : 0));
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const gradW = new Array(this.nFeatures).fill(0);
      let gradB = 0;
      for (let i = 0; i < n; i++) {
        const z = this.dot(X[i]) + this.bias;
        const p = sigmoid(z);
        const err = p - yNum[i];
        for (let j = 0; j < this.nFeatures; j++) gradW[j] += err * X[i][j];
        gradB += err;
      }
      for (let j = 0; j < this.nFeatures; j++) {
        gradW[j] = gradW[j] / n + this.l2 * this.weights[j];
        this.weights[j] -= this.lr * gradW[j];
      }
      this.bias -= this.lr * (gradB / n);
    }
  }

  private dot(row: number[]): number {
    let s = 0;
    for (let j = 0; j < this.nFeatures; j++) s += this.weights[j] * row[j];
    return s;
  }

  predictProba(X: number[][]): number[] {
    return X.map((row) => sigmoid(this.dot(row) + this.bias));
  }

  featureImportance(featureNames: string[]) {
    return featureNames
      .map((f, j) => ({ feature: f, importance: Math.abs(this.weights[j]) }))
      .sort((a, b) => b.importance - a.importance);
  }
}
