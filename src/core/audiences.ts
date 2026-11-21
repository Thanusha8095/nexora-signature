import type { AudienceEditionId } from './types.ts';

export type ReportSectionKey =
  | 'story-arc'
  | 'summary'
  | 'trends'
  | 'breakdowns'
  | 'comparison'
  | 'segments'
  | 'intelligence'
  | 'priorities'
  | 'simulation'
  | 'closing';

export interface AudienceEditionSpec {
  id: AudienceEditionId;
  name: string;
  shortLabel: string;
  targetReader: string;
  focusDescription: string;
  heroMetric: 'revenue' | 'netProfit' | 'customers' | 'margin';
  heroLabel: string;
  redactInternalExpenses: boolean;
  showGovernanceDisclaimer: boolean;
  sectionOrder: ReportSectionKey[];
  coverKicker: string;
  summaryHeading: string;
  prioritiesHeading: string;
  closingHeading: string;
}

export const AUDIENCE_EDITIONS: Record<AudienceEditionId, AudienceEditionSpec> = {
  board: {
    id: 'board',
    name: 'Board Governance Edition',
    shortLabel: 'Board',
    targetReader: 'Board of Directors & Audit Committee',
    focusDescription:
      'Fiduciary governance brief prioritizing top-line scale, period-over-period variance ledger, enterprise margin resilience, risk signals, and audited segment performance.',
    heroMetric: 'revenue',
    heroLabel: 'Period Revenue · Fiduciary Governance & Variance',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'summary',
      'comparison',
      'trends',
      'segments',
      'breakdowns',
      'intelligence',
      'priorities',
      'simulation',
      'closing',
    ],
    coverKicker: 'Board of Directors Edition',
    summaryHeading: 'Board Governance Summary',
    prioritiesHeading: 'Board-Reviewed Strategic Priorities',
    closingHeading: 'Fiduciary Conclusion & Accountability',
  },
  ceo: {
    id: 'ceo',
    name: 'CEO Operating Edition',
    shortLabel: 'CEO',
    targetReader: 'Chief Executive & Operating Leadership',
    focusDescription:
      'Action-first command briefing elevating net profit velocity, operating leverage spread, immediate executive decisions, and cost-driver efficiency.',
    heroMetric: 'netProfit',
    heroLabel: 'Net Operating Profit · Executive Command',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'intelligence',
      'priorities',
      'trends',
      'breakdowns',
      'comparison',
      'segments',
      'summary',
      'simulation',
      'closing',
    ],
    coverKicker: 'CEO Operating Edition',
    summaryHeading: 'CEO Operating Narrative',
    prioritiesHeading: 'Executive Decisions & Operating Agenda',
    closingHeading: 'Executive Operating Mandate',
  },
  investor: {
    id: 'investor',
    name: 'Investor & Capital Edition',
    shortLabel: 'Investor',
    targetReader: 'Institutional Shareholders & Capital Partners',
    focusDescription:
      'Capital-efficiency and compounding brief foregrounding annualized run-rate, ARPU expansion, retention/NPS quality, unit margins, and forward scenario yield.',
    heroMetric: 'margin',
    heroLabel: 'Net Operating Margin · Capital Yield View',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'summary',
      'segments',
      'comparison',
      'trends',
      'breakdowns',
      'simulation',
      'intelligence',
      'priorities',
      'closing',
    ],
    coverKicker: 'Shareholder & Investor Edition',
    summaryHeading: 'Shareholder & Capital Commentary',
    prioritiesHeading: 'Value-Creation & Capital Catalysts',
    closingHeading: 'Forward Capital Allocation Outlook',
  },
  team: {
    id: 'team',
    name: 'All-Hands Team Edition',
    shortLabel: 'Team',
    targetReader: 'Company-Wide Operating Teams',
    focusDescription:
      'Execution and milestone brief centering customer wins, department deliverables, named initiative owners, target attainment, and segment momentum.',
    heroMetric: 'customers',
    heroLabel: 'Active Customers Served · Execution Momentum',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: false,
    sectionOrder: [
      'story-arc',
      'priorities',
      'summary',
      'trends',
      'segments',
      'intelligence',
      'closing',
    ],
    coverKicker: 'Internal All-Hands Edition',
    summaryHeading: 'Company-Wide Wins & Progress',
    prioritiesHeading: 'Team Execution Milestones, Owners & Deadlines',
    closingHeading: 'Next Quarter Team Focus',
  },
  client: {
    id: 'client',
    name: 'Client & Partner Edition',
    shortLabel: 'Client',
    targetReader: 'Enterprise Clients & External Strategic Partners',
    focusDescription:
      'External partner value review showcasing delivered scale, adoption trajectory, retention and service quality—automatically redacting internal expenses, profit, margins, and internal owners.',
    heroMetric: 'customers',
    heroLabel: 'Partner Ecosystem Scale & Delivered Value',
    redactInternalExpenses: true,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'summary',
      'trends',
      'breakdowns',
      'segments',
      'priorities',
      'closing',
    ],
    coverKicker: 'External Client & Partner Edition',
    summaryHeading: 'Partnership Value & Delivery Summary',
    prioritiesHeading: 'Client-Facing Value Roadmap',
    closingHeading: 'Partnership Outlook',
  },
};

export const AUDIENCE_EDITION_LIST: AudienceEditionSpec[] = [
  AUDIENCE_EDITIONS.board,
  AUDIENCE_EDITIONS.ceo,
  AUDIENCE_EDITIONS.investor,
  AUDIENCE_EDITIONS.team,
  AUDIENCE_EDITIONS.client,
];

export function getAudienceEdition(id?: AudienceEditionId): AudienceEditionSpec {
  return AUDIENCE_EDITIONS[id ?? 'board'] ?? AUDIENCE_EDITIONS.board;
}
