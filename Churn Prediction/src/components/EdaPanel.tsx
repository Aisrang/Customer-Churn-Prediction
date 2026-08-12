import { useMemo } from 'react';
import type { Customer } from '@/lib/types';
import {
  churnByCategorical,
  churnByBinned,
  overallStats,
  correlationWithChurn,
} from '@/lib/eda';
import { ChurnRateBarChart } from '@/components/ChurnRateBarChart';
import { ChurnHistogram } from '@/components/ChurnHistogram';
import { StatCard } from '@/components/StatCard';
import { CHART_COLORS, formatPct } from '@/components/chartPrimitives';
import { Users, UserMinus, UserCheck, TrendingDown } from 'lucide-react';

interface EdaPanelProps {
  customers: Customer[];
}

export function EdaPanel({ customers }: EdaPanelProps) {
  const stats = useMemo(() => overallStats(customers), [customers]);
  const contract = useMemo(() => churnByCategorical(customers, 'contract', 'Contract'), [customers]);
  const internet = useMemo(() => churnByCategorical(customers, 'internetService', 'Internet Service'), [customers]);
  const payment = useMemo(() => churnByCategorical(customers, 'paymentMethod', 'Payment Method'), [customers]);
  const tenureBins = useMemo(
    () => churnByBinned(customers, 'tenure', 'Tenure', [0, 6, 12, 24, 36, 48, 72]),
    [customers],
  );
  const monthlyBins = useMemo(
    () => churnByBinned(customers, 'monthlyCharges', 'Monthly Charges', [0, 30, 50, 70, 90, 120]),
    [customers],
  );
  const corrTenure = useMemo(() => correlationWithChurn(customers, 'tenure'), [customers]);
  const corrMonthly = useMemo(() => correlationWithChurn(customers, 'monthlyCharges'), [customers]);
  const corrTotal = useMemo(() => correlationWithChurn(customers, 'totalCharges'), [customers]);

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Customers" value={stats.total} format="count" accent={CHART_COLORS.primary} icon={<Users size={20} />} />
        <StatCard label="Churned" value={stats.churned} format="count" accent={CHART_COLORS.danger} icon={<UserMinus size={20} />} sub={formatPct(stats.churnRate)} />
        <StatCard label="Retained" value={stats.retained} format="count" accent={CHART_COLORS.success} icon={<UserCheck size={20} />} sub={formatPct(1 - stats.churnRate)} />
        <StatCard label="Avg Tenure" value={Math.round(customers.reduce((s, c) => s + c.tenure, 0) / customers.length)} format="count" accent={CHART_COLORS.accent} icon={<TrendingDown size={20} />} sub="months" />
      </div>

      {/* Categorical churn rates */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Churn Rate by Contract">
          <ChurnRateBarChart data={contract.categories} />
        </ChartCard>
        <ChartCard title="Churn Rate by Internet Service">
          <ChurnRateBarChart data={internet.categories} />
        </ChartCard>
        <ChartCard title="Churn Rate by Payment Method">
          <ChurnRateBarChart data={payment.categories} />
        </ChartCard>
      </div>

      {/* Numeric distributions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Tenure Distribution & Churn" subtitle="Blue = total, red = churned">
          <ChurnHistogram data={tenureBins.bins} />
        </ChartCard>
        <ChartCard title="Monthly Charges Distribution & Churn" subtitle="Blue = total, red = churned">
          <ChurnHistogram data={monthlyBins.bins} />
        </ChartCard>
      </div>

      {/* Correlations */}
      <ChartCard title="Numeric Feature Correlation with Churn" subtitle="Pearson correlation coefficient">
        <div className="space-y-3">
          {[
            { name: 'Tenure', r: corrTenure },
            { name: 'Monthly Charges', r: corrMonthly },
            { name: 'Total Charges', r: corrTotal },
          ].map((f) => (
            <div key={f.name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-slate-600">{f.name}</div>
              <div className="relative h-3 flex-1 rounded bg-slate-100">
                <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />
                <div
                  className="absolute top-0 h-full rounded"
                  style={{
                    left: f.r < 0 ? `${50 + f.r * 50}%` : '50%',
                    width: `${Math.abs(f.r) * 50}%`,
                    background: f.r < 0 ? CHART_COLORS.success : CHART_COLORS.danger,
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm font-medium text-slate-700">{f.r.toFixed(3)}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Key insights */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Key Insights</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-red-500">•</span>
            Month-to-month contracts show the highest churn rate — long-term contracts retain customers far better.
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">•</span>
            Fiber optic customers churn more than DSL or no-internet customers, likely due to higher monthly charges.
          </li>
          <li className="flex gap-2">
            <span className="text-red-500">•</span>
            Electronic check payment method correlates with higher churn compared to automatic payment methods.
          </li>
          <li className="flex gap-2">
            <span className="text-green-500">•</span>
            Tenure has a strong negative correlation with churn — newer customers are most at risk.
          </li>
        </ul>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-slate-400">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
