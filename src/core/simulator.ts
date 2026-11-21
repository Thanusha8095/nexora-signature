import { computeReportMetrics, determineHealthStatus } from './calculations.ts';
import type {
  BusinessHealthStatus,
  ReportInputData,
  SimulationAssumptions,
} from './types.ts';

export const DEFAULT_SIMULATION_ASSUMPTIONS: SimulationAssumptions = {
  scenarioName: 'Base Forecast (+5% Customers, 0% ARPU, -2% OpEx)',
  revenueDeltaPct: 5,
  expenseDeltaPct: -2,
  customerDeltaPct: 5,
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
    description: '+6% customers and +2% ARPU (~+8.1% revenue) with -5% operating expense discipline.',
    assumptions: {
      scenarioName: 'Margin Expansion (+6% Cust, +2% ARPU, -5% OpEx)',
      revenueDeltaPct: 8.1,
      expenseDeltaPct: -5,
      customerDeltaPct: 6,
      arpuDeltaPct: 2,
      includeInReport: false,
    },
  },
  {
    id: 'aggressive-scale',
    label: 'Aggressive Scale',
    description: 'Accelerated GTM push (+20% customers, +2% ARPU, ~+22.4% revenue, +14% expenses).',
    assumptions: {
      scenarioName: 'Aggressive Scale (+20% Cust, +2% ARPU, +14% OpEx)',
      revenueDeltaPct: 22.4,
      expenseDeltaPct: 14,
      customerDeltaPct: 20,
      arpuDeltaPct: 2,
      includeInReport: false,
    },
  },
  {
    id: 'downside-stress',
    label: 'Downside Stress Test',
    description: 'Macro contraction (-8% customers, -4% ARPU, ~-11.7% revenue, +3% cost inflation).',
    assumptions: {
      scenarioName: 'Downside Stress Test (-8% Cust, -4% ARPU, +3% OpEx)',
      revenueDeltaPct: -11.7,
      expenseDeltaPct: 3,
      customerDeltaPct: -8,
      arpuDeltaPct: -4,
      includeInReport: false,
    },
  },
  {
    id: 'pricing-power',
    label: 'Pricing & ARPU Lift',
    description: 'Tiered pricing uplift (+4% customers, +10% ARPU, ~+14.4% revenue, flat expenses).',
    assumptions: {
      scenarioName: 'Pricing Power Uplift (+4% Cust, +10% ARPU)',
      revenueDeltaPct: 14.4,
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
  impliedRevenueDeltaPct: number;
  revenueVariance: number;
  expenseVariance: number;
  netProfitVariance: number;
  marginVariancePts: number;
  customerVariance: number;
  arpuVariance: number | null;
  projectedHealthStatus: BusinessHealthStatus;
  projectedMonthlySeries: {
    month: string;
    actualRevenue: number;
    projectedRevenue: number;
    actualProfit: number;
    projectedProfit: number;
  }[];
}

/**
 * Computes consistent revenue delta % from Customer Growth % and ARPU Uplift %:
 * (1 + customerDelta/100) * (1 + arpuDelta/100) - 1
 */
export function computeCombinedRevenueDeltaPct(
  customerDeltaPct: number,
  arpuDeltaPct: number
): number {
  const combined = ((1 + customerDeltaPct / 100) * (1 + arpuDeltaPct / 100) - 1) * 100;
  return Number(combined.toFixed(1));
}

/**
 * Solves implied ARPU delta % when a user adjusts direct top-line revenue delta % while holding customers fixed.
 */
export function solveArpuDeltaFromRevenueAndCustomers(
  revenueDeltaPct: number,
  customerDeltaPct: number
): number {
  const custFactor = 1 + customerDeltaPct / 100;
  if (custFactor <= 0.05) return 0;
  const impliedArpu = (((1 + revenueDeltaPct / 100) / custFactor) - 1) * 100;
  return Number(Math.max(-50, Math.min(100, impliedArpu)).toFixed(1));
}

export function runWhatIfSimulation(
  report: ReportInputData,
  assumptions: SimulationAssumptions
): SimulationProjection {
  const actual = computeReportMetrics(report);

  const actualRev = report.currentPeriod.revenue;
  const actualExp = report.currentPeriod.expenses;
  const actualCust = report.currentPeriod.customerCount;
  const actualArpu = actual.revenuePerCustomer;

  const expFactor = Math.max(0, 1 + assumptions.expenseDeltaPct / 100);
  const custFactor = Math.max(0, 1 + assumptions.customerDeltaPct / 100);
  const projectedCustomers = Math.max(0, Math.round(actualCust * custFactor));

  // Single unified revenue formula avoiding double counting:
  // If customer base exists, Projected Revenue = Projected Customers * Projected ARPU.
  // If both customerDeltaPct & arpuDeltaPct are 0 while legacy revenueDeltaPct != 0, apply revenueDeltaPct directly.
  let projectedRevenue: number;
  if (projectedCustomers > 0 && actualArpu !== null) {
    if (assumptions.customerDeltaPct === 0 && assumptions.arpuDeltaPct === 0 && assumptions.revenueDeltaPct !== 0) {
      projectedRevenue = Math.max(0, Math.round(actualRev * Math.max(0, 1 + assumptions.revenueDeltaPct / 100)));
    } else {
      const targetArpu = Math.max(0, actualArpu * Math.max(0, 1 + assumptions.arpuDeltaPct / 100));
      projectedRevenue = Math.max(0, Math.round(projectedCustomers * targetArpu));
    }
  } else {
    projectedRevenue = Math.max(
      0,
      Math.round(actualRev * Math.max(0, 1 + assumptions.revenueDeltaPct / 100))
    );
  }

  const projectedExpenses = Math.max(0, Math.round(actualExp * expFactor));
  const projectedNetProfit = projectedRevenue - projectedExpenses;
  const projectedMarginPct = projectedRevenue > 0 ? (projectedNetProfit / projectedRevenue) * 100 : 0;

  // Enforce exact identity: Projected ARPU = Projected Revenue / Projected Customers
  const projectedArpu = projectedCustomers > 0 ? projectedRevenue / projectedCustomers : null;
  const arpuVariance =
    projectedArpu !== null && actualArpu !== null ? projectedArpu - actualArpu : null;

  const revGrowthVsActual =
    actualRev > 0 ? ((projectedRevenue - actualRev) / actualRev) * 100 : 0;
  const marginDeltaPts = projectedMarginPct - actual.profitMarginPct;

  const projectedHealthStatus = determineHealthStatus(
    projectedNetProfit,
    projectedMarginPct,
    actualRev > 0 ? revGrowthVsActual : null,
    marginDeltaPts
  );

  const effectiveRevFactor =
    actualRev > 0 ? projectedRevenue / actualRev : Math.max(0, 1 + assumptions.revenueDeltaPct / 100);

  const projectedMonthlySeries = actual.monthlyWithProfit.map((m) => {
    const pRev = Math.max(0, Math.round(m.revenue * effectiveRevFactor));
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
    assumptions: {
      ...assumptions,
      revenueDeltaPct: Number(revGrowthVsActual.toFixed(1)),
    },
    actualRevenue: actualRev,
    actualExpenses: actualExp,
    actualNetProfit: actual.netProfit,
    actualMarginPct: actual.profitMarginPct,
    actualCustomers: actualCust,
    actualArpu,
    projectedRevenue,
    projectedExpenses,
    projectedNetProfit,
    projectedMarginPct,
    projectedCustomers,
    projectedArpu,
    impliedRevenueDeltaPct: Number(revGrowthVsActual.toFixed(1)),
    revenueVariance: projectedRevenue - actualRev,
    expenseVariance: projectedExpenses - actualExp,
    netProfitVariance: projectedNetProfit - actual.netProfit,
    marginVariancePts: marginDeltaPts,
    customerVariance: projectedCustomers - actualCust,
    arpuVariance,
    projectedHealthStatus,
    projectedMonthlySeries,
  };
}
