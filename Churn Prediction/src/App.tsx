import { useEffect, useMemo, useState } from 'react';
import { generateDataset } from '@/lib/data';
import { trainModels, type TrainResult } from '@/lib/pipeline';
import { EdaPanel } from '@/components/EdaPanel';
import { ModelPanel } from '@/components/ModelPanel';
import { PredictPanel } from '@/components/PredictPanel';
import { BarChart3, Brain, Wand2, Activity, Database } from 'lucide-react';

type Tab = 'eda' | 'models' | 'predict';

export default function App() {
  const [tab, setTab] = useState<Tab>('eda');
  const [result, setResult] = useState<TrainResult | null>(null);
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState('');

  const dataset = useMemo(() => generateDataset(4000), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setTraining(true);
      // Yield to the UI thread between heavy stages so the progress text can paint.
      setProgress('Generating telecom dataset (4,000 customers)…');
      await new Promise((r) => setTimeout(r, 30));
      if (cancelled) return;
      setProgress('Preprocessing features — encoding & standardization…');
      await new Promise((r) => setTimeout(r, 30));
      if (cancelled) return;
      setProgress('Training Logistic Regression…');
      await new Promise((r) => setTimeout(r, 30));
      // Run training in a microtask so the label updates first.
      const res = trainModels(dataset);
      if (cancelled) return;
      setProgress('Training Random Forest…');
      await new Promise((r) => setTimeout(r, 30));
      setProgress('Training XGBoost…');
      await new Promise((r) => setTimeout(r, 30));
      setProgress('Evaluating models on test set…');
      await new Promise((r) => setTimeout(r, 30));
      if (cancelled) return;
      setResult(res);
      setTraining(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dataset]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 sm:text-lg">ChurnScope</h1>
              <p className="hidden text-xs text-slate-500 sm:block">Customer Churn Prediction Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Database size={14} />
            <span className="hidden sm:inline">Telecom · 4,000 records</span>
          </div>
        </div>
        {/* Tabs */}
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1">
            <TabButton active={tab === 'eda'} onClick={() => setTab('eda')} icon={<BarChart3 size={16} />} label="Exploratory Analysis" />
            <TabButton active={tab === 'models'} onClick={() => setTab('models')} icon={<Brain size={16} />} label="Model Evaluation" />
            <TabButton active={tab === 'predict'} onClick={() => setTab('predict')} icon={<Wand2 size={16} />} label="Predict" />
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {training || !result ? (
          <TrainingScreen progress={progress} />
        ) : (
          <>
            {tab === 'eda' && <EdaPanel customers={dataset} />}
            {tab === 'models' && <ModelPanel result={result} />}
            {tab === 'predict' && <PredictPanel result={result} />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        ChurnScope · Logistic Regression, Random Forest & XGBoost — trained entirely in-browser
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
    </button>
  );
}

function TrainingScreen({ progress }: { progress: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
      </div>
      <p className="mt-6 text-sm font-medium text-slate-600">{progress}</p>
      <p className="mt-1 text-xs text-slate-400">Training classifiers in-browser…</p>
    </div>
  );
}
