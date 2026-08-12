import type { Customer, ModelMetrics } from './types';
import { preprocess, trainTestSplit, encodeCustomer, type ProcessedData } from './preprocess';
import { computeMetrics, rocCurve } from './metrics';
import { LogisticRegression } from './logistic';
import { RandomForest } from './forest';
import { XGBoost } from './xgboost';
import type { TrainedModel } from './model';

export interface TrainResult {
  models: { model: TrainedModel; metrics: ModelMetrics }[];
  processed: ProcessedData;
  testCustomers: Customer[];
  rocCurves: { name: string; points: { fpr: number; tpr: number }[] }[];
  trainSize: number;
  testSize: number;
}

// Seeded RNG shared across models for reproducibility.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function trainModels(dataset: Customer[]): TrainResult {
  const { train, test } = trainTestSplit(dataset, 0.2, 42);
  const processed = preprocess(train);
  const testProcessed = preprocess(test);

  // Re-encode the test set using the TRAIN encoders/scalers for a fair evaluation.
  const Xtest = test.map((c) => encodeCustomer(c, processed));
  const ytest = test.map((c) => c.churn);

  const models: TrainedModel[] = [
    new LogisticRegression(processed.featureNames.length, 0.1, 0.01, 400),
    new RandomForest(60, 8, 0.6, rng(7)),
    new XGBoost(80, 3, 0.1),
  ];

  const results = models.map((model) => {
    // Each model trains on the train set.
    if (model instanceof LogisticRegression) {
      model.train(processed.X, processed.y);
    } else if (model instanceof RandomForest) {
      model.train(processed.X, processed.y);
    } else if (model instanceof XGBoost) {
      model.train(processed.X, processed.y);
    }
    const proba = model.predictProba(Xtest);
    const m = computeMetrics(ytest, proba, 0.5);
    const metrics: ModelMetrics = {
      name: model.name,
      accuracy: m.accuracy,
      precision: m.precision,
      recall: m.recall,
      f1: m.f1,
      rocAuc: m.rocAuc,
      confusion: m.confusion,
      featureImportance: model.featureImportance(processed.featureNames),
    };
    return { model, metrics };
  });

  const rocCurves = results.map(({ model, metrics }) => ({
    name: model.name,
    points: rocCurve(ytest, model.predictProba(Xtest)),
  }));

  return {
    models: results,
    processed,
    testCustomers: test,
    rocCurves,
    trainSize: train.length,
    testSize: test.length,
  };
}

export function predictCustomer(
  customer: Customer,
  models: { model: TrainedModel; metrics: ModelMetrics }[],
  processed: ProcessedData,
): { name: string; probability: number; label: boolean }[] {
  const x = encodeCustomer(customer, processed);
  return models.map(({ model }) => {
    const p = model.predictProba([x])[0];
    return { name: model.name, probability: p, label: p >= 0.5 };
  });
}
