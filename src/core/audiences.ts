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
}

export const AUDIENCE_EDITIONS: Record<AudienceEditionId, AudienceEditionSpec> = {
  board: {
    id: 'board',
    name: 'Board Governance Edition',
    shortLabel: 'Board',
    targetReader: 'Board of Directors & Audit Committee',
    focusDescription:
      'Balanced fiduciary brief leading with period revenue, full audit comparison ledger, risk observations, and segment unit margins.',
    heroMetric: 'revenue',
    heroLabel: 'Primary Period Revenue · Fiduciary Audit View',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'summary',
      'trends',
      'breakdowns',
      'comparison',
      'segments',
      'intelligence',
      'priorities',
      'simulation',
      'closing',
    ],
    coverKicker: 'Board of Directors Edition',
  },
  ceo: {
    id: 'ceo',
    name: 'CEO Operating Edition',
    shortLabel: 'CEO',
    targetReader: 'Chief Executive & Operating Leadership',
    focusDescription:
      'Action-first execution view centering Net Profit, strategic priorities, cost-driver efficiency, and rule-based operating interventions.',
    heroMetric: 'netProfit',
    heroLabel: 'Net Operating Profit · Executive Command View',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'intelligence',
      'priorities',
      'trends',
      'breakdowns',
      'segments',
      'comparison',
      'summary',
      'simulation',
      'closing',
    ],
    coverKicker: 'CEO Operating Edition',
  },
  investor: {
    id: 'investor',
    name: 'Investor & Capital Edition',
    shortLabel: 'Investor',
    targetReader: 'Institutional Shareholders & Capital Partners',
    focusDescription:
      'Growth and margin expansion narrative emphasizing top-line trajectory, segment mix, ARPU expansion, and forward scenario modeling.',
    heroMetric: 'margin',
    heroLabel: 'Operating Margin & Capital Efficiency',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: true,
    sectionOrder: [
      'story-arc',
      'summary',
      'comparison',
      'segments',
      'trends',
      'breakdowns',
      'intelligence',
      'simulation',
      'priorities',
      'closing',
    ],
    coverKicker: 'Shareholder & Investor Edition',
  },
  team: {
    id: 'team',
    name: 'All-Hands Team Edition',
    shortLabel: 'Team',
    targetReader: 'Company-Wide Operating Teams',
    focusDescription:
      'Transparent momentum brief highlighting customer wins, monthly trajectory, company achievements, and aligned quarterly priorities.',
    heroMetric: 'customers',
    heroLabel: 'Active Customers Served · Momentum View',
    redactInternalExpenses: false,
    showGovernanceDisclaimer: false,
    sectionOrder: [
      'story-arc',
      'summary',
      'priorities',
      'trends',
      'segments',
      'intelligence',
      'closing',
    ],
    coverKicker: 'Internal All-Hands Edition',
  },
  client: {
    id: 'client',
    name: 'Client & Partner Edition',
    shortLabel: 'Client',
    targetReader: 'Enterprise Clients & External Strategic Partners',
    focusDescription:
      'External-safe partnership review showcasing scale, customer growth, product delivery pillars, and key milestones—automatically redacting internal cost structures.',
    heroMetric: 'customers',
    heroLabel: 'Platform Scale & Active Customer Ecosystem',
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
