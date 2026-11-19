import { computeReportMetrics, determineHealthStatus } from './calculations.ts';
import type {
  BusinessHealthStatus,
  ReportInputData,
  SimulationAssumptions,
} from './types.ts';

export const DEFAULT_SIMULATION_ASSUMPTIONS: SimulationAssumptions = {
  scenarioName: 'Base Forecast (+5% Revenue, -2% OpEx)',
  revenueDeltaPct: 5,
  expenseDeltaPct: -2,
  customerDeltaPct: 6,
  arpuDeltaPct: 0,
  includeInReport: false,
};

export interface SimulationPreset {
  id: string;
  label: string;
  description: string;
  assumptions: SimulationAssumptions;
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'margin-expansion',
    label: 'Margin Expansion',
    description: 'Disciplined +8% revenue growth with -5% operating expense optimization.',
    assumptions: {
      scenarioName: 'Margin Expansion (+8% Rev, -5% OpEx)',
      revenueDeltaPct: 8,
      expenseDeltaPct: -5,
      customerDeltaPct: 6,
      arpuDeltaPct: 2,
      includeInReport: false,
    },
  },
  {
    id: 'aggressive-scale',
    label: 'Aggressive Scale',
    description: 'Accelerated GTM expansion (+22% revenue, +14% expenses, +20% customers).',
    assumptions: {
      scenarioName: 'Aggressive Scale (+22% Rev, +14% OpEx)',
      revenueDeltaPct: 22,
      expenseDeltaPct: 14,
      customerDeltaPct: 20,
      arpuDeltaPct: 2,
      includeInReport: false,
    },
  },
  {
    id: 'downside-stress',
    label: 'Downside Stress Test',
    description: 'Macro contraction scenario (-12% revenue, +3% cost inflation).',
    assumptions: {
      scenarioName: 'Downside Stress Test (-12% Rev, +3% OpEx)',
      revenueDeltaPct: -12,
      expenseDeltaPct: 3,
      customerDeltaPct: -5,
      arpuDeltaPct: -4,
      includeInReport: false,
    },
  },
  {
    id: 'pricing-power',
    label: 'Pricing & ARPU Lift',
    description: 'Tiered pricing uplift (+10% ARPU, +4% customers, flat expenses).',
    assumptions: {
      scenarioName: 'Pricing Power Uplift (+10% ARPU)',
      revenueDeltaPct: 4,
      expenseDeltaPct: 0,
      customerDeltaPct: 4,
      arpuDeltaPct: 10,
      includeInReport: false,
    },
  },
];

export interface SimulationProjection {
  isProjection: true;
  assumptions: SimulationAssumptions;
  actualRevenue: number;
  actualExpenses: number;
  actualNetProfit: number;
  actualMarginPct: number;
  actualCustomers: number;
  actualArpu: number | null;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedNetProfit: number;
  projectedMarginPct: number;
  projectedCustomers: number;
  projectedArpu: number | null;
  revenueVariance: number;
  expenseVariance: number;
  netProfitVariance: number;
  marginVariancePts: number;
  customerVariance: number;
  projectedHealthStatus: BusinessHealthStatus;
  projectedMonthlySeries: {
    month: string;
    actualRevenue: number;
    projectedRevenue: number;
    actualProfit: number;
    projectedProfit: number;
  }[];
}

export function runWhatIfSimulation(
  report: ReportInputData,
  assumptions: SimulationAssumptions
): SimulationProjection {
  const actual = computeReportMetrics(report);

  const actualRev = report.currentPeriod.revenue;
  const actualExp = report.currentPeriod.expenses;
  const actualCust = report.currentPeriod.customerCount;

  const revFactor = (1 + assumptions.revenueDeltaPct / 100) * (1 + assumptions.arpuDeltaPct / 100);
  const expFactor = 1 + assumptions.expenseDeltaPct / 100;
  const custFactor = 1 + assumptions.customerDeltaPct / 100;

  const projectedRevenue = Math.max(0, Math.round(actualRev * revFactor));
  const projectedExpenses = Math.max(0, Math.round(actualExp * expFactor));
  const projectedNetProfit = projectedRevenue - projectedExpenses;
  const projectedMarginPct = projectedRevenue > 0 ? (projectedNetProfit / projectedRevenue) * 100 : 0;
  const projectedCustomers = Math.max(0, Math.round(actualCust * custFactor));

  const projectedArpu = projectedCustomers > 0 ? projectedRevenue / projectedCustomers : null;

  const revGrowthVsActual =
    actualRev > 0 ? ((projectedRevenue - actualRev) / actualRev) * 100 : null;
  const marginDeltaPts = projectedMarginPct - actual.profitMarginPct;

  const projectedHealthStatus = determineHealthStatus(
    projectedNetProfit,
    projectedMarginPct,
    revGrowthVsActual,
    marginDeltaPts
  );

  const projectedMonthlySeries = actual.monthlyWithProfit.map((m) => {
    const pRev = Math.max(0, Math.round(m.revenue * revFactor));
    const pExp = Math.max(0, Math.round(m.expenses * expFactor));
    return {
      month: m.month,
      actualRevenue: m.revenue,
      projectedRevenue: pRev,
      actualProfit: m.netProfit,
      projectedProfit: pRev - pExp,
    };
  });

  return {
    isProjection: true,
    assumptions,
    actualRevenue: actualRev,
    actualExpenses: actualExp,
    actualNetProfit: actual.netProfit,
    actualMarginPct: actual.profitMarginPct,
    actualCustomers: actualCust,
    actualArpu: actual.revenuePerCustomer,
    projectedRevenue,
    projectedExpenses,
    projectedNetProfit,
    projectedMarginPct,
    projectedCustomers,
    projectedArpu,
    revenueVariance: projectedRevenue - actualRev,
    expenseVariance: projectedExpenses - actualExp,
    netProfitVariance: projectedNetProfit - actual.netProfit,
    marginVariancePts: marginDeltaPts,
    customerVariance: projectedCustomers - actualCust,
    projectedHealthStatus,
    projectedMonthlySeries,
  };
}
