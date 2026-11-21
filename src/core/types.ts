export type ReportThemeId = 'midnight-luxe' | 'editorial-ivory' | 'modern-signal';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'SGD';

export type ExportFormat =
  | 'email-html'
  | 'plain-text'
  | 'web-html'
  | 'pdf'
  | 'native-pdf'
  | 'png'
  | 'canvas-png';

export type PreviewMode =
  | 'web'
  | 'email'
  | 'plain-text'
  | 'pdf'
  | 'native-pdf'
  | 'png'
  | 'canvas-png'
  | 'canvas'
  | 'document'
  | 'json';

export type AudienceEditionId = 'board' | 'ceo' | 'investor' | 'team' | 'client';

export type BrandFontPreset =
  | 'theme-default'
  | 'editorial-serif'
  | 'swiss-sans'
  | 'classic-broadsheet'
  | 'executive-mono';

export type CoverStyleOverride =
  | 'theme-default'
  | 'architectural-dark'
  | 'editorial-broadsheet'
  | 'swiss-precision';

export type LogoShape = 'rounded' | 'square' | 'circle';

export interface MonthlyPoint {
  month: string;
  revenue: number;
  expenses: number;
  customers?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  amount: number;
}

export interface SegmentItem {
  id: string;
  name: string;
  revenue: number;
  growthPct: number;
  marginPct: number;
}

export interface StrategicPriority {
  id: string;
  title: string;
  horizon: 'Immediate (0-30d)' | 'Near-Term (Q+1)' | 'Strategic (2-4Q)';
  owner: string;
  rationale: string;
  targetImpact: string;
}

export interface CompanyBranding {
  companyName: string;
  tagline: string;
  logoDataUrl: string;
  logoShape?: LogoShape;
  primaryColor: string;
  accentColor: string;
  fontPreset?: BrandFontPreset;
  coverStyle?: CoverStyleOverride;
  classification: string;
  preparedBy: string;
  contactEmail: string;
  website: string;
  disclaimer: string;
}

export interface PeriodMetricsInput {
  revenue: number;
  expenses: number;
  customerCount: number;
  retentionRatePct?: number;
  npsScore?: number;
}

export interface ReportNarrative {
  overview: string;
  achievements: string;
  challenges: string;
  closingTakeaway: string;
  clientSummary?: string;
}

export interface SimulationAssumptions {
  scenarioName: string;
  revenueDeltaPct: number;
  expenseDeltaPct: number;
  customerDeltaPct: number;
  arpuDeltaPct: number;
  includeInReport?: boolean;
}

export interface ReportInputData {
  id: string;
  sampleKey?: string;
  isIllustrative: boolean;
  audienceEdition?: AudienceEditionId;
  title: string;
  subtitle: string;
  reportingPeriod: string;
  previousPeriodLabel: string;
  reportDate: string;
  currency: CurrencyCode;
  theme: ReportThemeId;
  branding: CompanyBranding;
  currentPeriod: PeriodMetricsInput;
  previousPeriod: PeriodMetricsInput;
  monthlySeries: MonthlyPoint[];
  revenueCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  segments: SegmentItem[];
  narrative: ReportNarrative;
  strategicPriorities: StrategicPriority[];
  simulation?: SimulationAssumptions;
  updatedAt: string;
}

export interface ComputedMonthlyPoint extends MonthlyPoint {
  netProfit: number;
  marginPct: number;
}

export interface ComputedCategoryItem extends CategoryItem {
  sharePct: number;
}

export interface ComputedSegmentItem extends SegmentItem {
  sharePct: number;
}

export type BusinessHealthStatus =
  | 'Strong Expansion'
  | 'Healthy & Stable'
  | 'Margin Pressure'
  | 'Contraction Watch';

export type ClientTrajectoryStatus =
  | 'Strong Partner Momentum'
  | 'Steady Expansion'
  | 'Retention Focus'
  | 'Scale Moderation';

export interface ComputedMetrics {
  netProfit: number;
  previousNetProfit: number;
  profitMarginPct: number;
  previousProfitMarginPct: number;
  marginDeltaPts: number;
  revenueGrowthPct: number | null;
  expenseGrowthPct: number | null;
  profitGrowthPct: number | null;
  customerGrowthPct: number | null;
  revenuePerCustomer: number | null;
  previousRevenuePerCustomer: number | null;
  arpuGrowthPct: number | null;
  operatingExpenseRatioPct: number;
  annualizedRevenueEstimate: number;
  monthlyWithProfit: ComputedMonthlyPoint[];
  revenueCategoriesComputed: ComputedCategoryItem[];
  expenseCategoriesComputed: ComputedCategoryItem[];
  segmentsComputed: ComputedSegmentItem[];
  revenueCategoryTotal: number;
  expenseCategoryTotal: number;
  segmentTotal: number;
  averageMonthlyRevenue: number;
  averageMonthlyProfit: number;
  bestMonth: ComputedMonthlyPoint | null;
  worstMonth: ComputedMonthlyPoint | null;
  bestRevenueMonth: ComputedMonthlyPoint | null;
  worstRevenueMonth: ComputedMonthlyPoint | null;
  healthStatus: BusinessHealthStatus;
  clientSafeTrajectory: ClientTrajectoryStatus;
}

export interface ExecutiveInsight {
  id: string;
  headline: string;
  explanation: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  supportingMetric: string;
  category: 'Growth' | 'Profitability' | 'Efficiency' | 'Customers' | 'Concentration' | 'Momentum';
  ruleTriggered?: string;
  formulaTrace?: string;
}

export type MomentumSignal = 'Accelerating' | 'Steady' | 'Decelerating';

export interface TrendMetricComparison {
  id: 'revenue' | 'expenses' | 'net-profit' | 'net-margin' | 'customers';
  label: string;
  sensitive: boolean;
  unit: 'currency' | 'percent' | 'count';
  currentMonthValue: number;
  currentMonthFormatted: string;
  periodPaceValue: number;
  periodPaceFormatted: string;
  rolling3MoAvg: number;
  rolling3MoAvgFormatted: string;
  deltaValue: number;
  deltaPct: number | null;
  deltaFormatted: string;
  periodPaceDeltaPct: number | null;
  periodPaceDeltaFormatted: string;
  signal: MomentumSignal;
  periodPaceSignal: MomentumSignal;
  signalReason: string;
  formulaTrace: string;
  periodPaceFormulaTrace: string;
}

export interface RollingMonthPoint {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  marginPct: number;
  customers?: number;
  rolling3MoRevenueAvg: number;
  rolling3MoExpensesAvg: number;
  rolling3MoProfitAvg: number;
  rolling3MoMarginAvg: number;
  revenueVsRollingPct: number | null;
}

export interface TrendAnalysisResult {
  hasSufficientData: boolean;
  windowMonthsCount: number;
  totalMonthsCount: number;
  windowPeriodLabel: string;
  latestMonthLabel: string;
  overallSignal: MomentumSignal;
  summaryHeadline: string;
  summaryNarrative: string;
  metrics: TrendMetricComparison[];
  rollingSeries: RollingMonthPoint[];
}

export interface StrategicRecommendation {
  id: string;
  title: string;
  basis: 'Derived from Financial Facts';
  rationale: string;
  suggestedAction: string;
  priority: 'High' | 'Medium';
  ruleTriggered?: string;
}

export interface DataQualityCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  sectionHint?: 'general' | 'financials' | 'categories' | 'narrative' | 'branding';
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  checks?: DataQualityCheck[];
}

export interface ThemeSpec {
  id: ReportThemeId;
  name: string;
  subtitle: string;
  description: string;
  layoutStyle: 'architectural-dark' | 'editorial-broadsheet' | 'swiss-precision';
  colors: {
    canvas: string;
    surface: string;
    elevated: string;
    text: string;
    textMuted: string;
    accent: string;
    accentInk: string;
    accentText: string;
    secondary: string;
    border: string;
    tableHeaderBg: string;
    tableHeaderText: string;
    tableStripeBg: string;
    positive: string;
    positiveBg: string;
    warning: string;
    warningBg: string;
    critical: string;
    criticalBg: string;
    chartRevenue: string;
    chartExpense: string;
    chartProfit: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    googleFontsUrl: string;
  };
}
