import type { ReportInputData } from './types.ts';

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const SAMPLE_LOGOS = {
  saas: svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none"><rect width="96" height="96" rx="16" fill="#0B1120"/><path d="M24 64L42 28L56 54L72 30" stroke="#D4FF33" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="72" cy="30" r="5" fill="#0891B2"/></svg>`
  ),
  retail: svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none"><rect width="96" height="96" rx="16" fill="#141413"/><path d="M48 22L72 68H24L48 22Z" stroke="#9A7B2C" stroke-width="5" stroke-linejoin="round"/><circle cx="48" cy="52" r="6" fill="#F8F6F0"/></svg>`
  ),
  finance: svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none"><rect width="96" height="96" rx="16" fill="#0F172A"/><rect x="24" y="50" width="10" height="22" fill="#0891B2"/><rect x="43" y="36" width="10" height="36" fill="#FFFFFF"/><rect x="62" y="24" width="10" height="48" fill="#5B21B6"/></svg>`
  ),
  healthcare: svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none"><rect width="96" height="96" rx="16" fill="#0B1120"/><path d="M48 24V72M24 48H72" stroke="#0891B2" stroke-width="10" stroke-linecap="round"/><circle cx="48" cy="48" r="7" fill="#D4FF33"/></svg>`
  ),
  ecommerce: svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none"><rect width="96" height="96" rx="16" fill="#141413"/><circle cx="48" cy="48" r="24" stroke="#D4FF33" stroke-width="5"/><path d="M36 48L46 58L64 38" stroke="#F8F6F0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  ),
};

export interface SamplePresetMeta {
  key: string;
  industry: string;
  headlineMetric: string;
  summary: string;
  report: ReportInputData;
}

export const SAMPLE_REPORTS: SamplePresetMeta[] = [
  {
    key: 'tech-saas',
    industry: 'Technology SaaS',
    headlineMetric: '$14.85M Quarterly Revenue · 29.3% Net Margin',
    summary: 'B2B cloud telemetry & enterprise revenue platform showing strong operating leverage.',
    report: {
      id: 'sample-tech-saas',
      sampleKey: 'tech-saas',
      isIllustrative: true,
      title: 'Q3 2026 Executive Financial & Operating Review',
      subtitle: 'Enterprise Cloud Telemetry & Subscription Performance (Illustrative Dataset)',
      reportingPeriod: 'Q3 2026 (Jul – Sep)',
      previousPeriodLabel: 'Q2 2026',
      reportDate: 'October 14, 2026',
      currency: 'USD',
      theme: 'midnight-luxe',
      branding: {
        companyName: 'Veloce Cloud Systems',
        tagline: 'Enterprise Revenue & Telemetry Infrastructure',
        logoDataUrl: SAMPLE_LOGOS.saas,
        primaryColor: '#0B1120',
        accentColor: '#D4FF33',
        classification: 'Board & Executive Distribution · Illustrative Sample',
        preparedBy: 'Office of the CFO · FP&A Analytics',
        contactEmail: 'ir@velocecloud.example',
        website: 'https://velocecloud.example',
        disclaimer:
          'Illustrative sample figures prepared for demonstration inside NEXORA Signature. All figures represent a fictional SaaS enterprise.',
      },
      currentPeriod: {
        revenue: 14_850_000,
        expenses: 10_500_000,
        customerCount: 1_840,
        retentionRatePct: 118,
        npsScore: 64,
      },
      previousPeriod: {
        revenue: 12_600_000,
        expenses: 9_450_000,
        customerCount: 1_610,
      },
      monthlySeries: [
        { month: 'Jul 2026', revenue: 4_680_000, expenses: 3_420_000, customers: 1_690 },
        { month: 'Aug 2026', revenue: 4_940_000, expenses: 3_510_000, customers: 1_765 },
        { month: 'Sep 2026', revenue: 5_230_000, expenses: 3_570_000, customers: 1_840 },
      ],
      revenueCategories: [
        { id: 'rev-1', name: 'Enterprise Core Subscriptions', amount: 8_910_000 },
        { id: 'rev-2', name: 'Usage & Telemetry Overages', amount: 3_560_000 },
        { id: 'rev-3', name: 'Implementation & Advisory', amount: 1_480_000 },
        { id: 'rev-4', name: 'API Partner Marketplace', amount: 900_000 },
      ],
      expenseCategories: [
        { id: 'exp-1', name: 'R&D & Platform Engineering', amount: 4_120_000 },
        { id: 'exp-2', name: 'Cloud Hosting & Compute', amount: 2_380_000 },
        { id: 'exp-3', name: 'Sales & Commercial GTM', amount: 2_650_000 },
        { id: 'exp-4', name: 'General & Administrative', amount: 1_350_000 },
      ],
      segments: [
        { id: 'seg-1', name: 'North America Enterprise', revenue: 8_420_000, growthPct: 21.4, marginPct: 33.2 },
        { id: 'seg-2', name: 'EMEA Commercial', revenue: 4_180_000, growthPct: 16.8, marginPct: 26.5 },
        { id: 'seg-3', name: 'APAC Strategic', revenue: 2_250_000, growthPct: 11.2, marginPct: 20.1 },
      ],
      narrative: {
        overview:
          'Veloce Cloud Systems delivered a disciplined third quarter, crossing $14.85M in quarterly revenue while expanding net operating margin by 4.3 percentage points over Q2 2026. Multi-year enterprise expansions drove net dollar retention to 118%.',
        achievements:
          'Closed 14 net-new Fortune 1000 logos, reduced cloud compute unit cost per billion ingested events by 11.4%, and achieved $4.35M in net profit.',
        challenges:
          'Enterprise Core Subscriptions still represent 60% of revenue, and APAC deal cycles elongated by 18 days due to regional procurement reviews.',
        closingTakeaway:
          'With strong operating leverage established in Q3, Q4 priorities shift toward accelerating EMEA & APAC partner channels and expanding usage-tier adoption.',
      },
      strategicPriorities: [
        {
          id: 'sp-1',
          title: 'Scale Usage-Based Telemetry Tiers',
          horizon: 'Immediate (0-30d)',
          owner: 'Chief Revenue Officer',
          rationale: 'Telemetry add-ons grew fastest across existing enterprise cohorts.',
          targetImpact: '+$1.4M incremental ARR in Q4',
        },
        {
          id: 'sp-2',
          title: 'Cloud Inference & Storage Optimization',
          horizon: 'Near-Term (Q+1)',
          owner: 'VP Infrastructure',
          rationale: 'Compute infrastructure remains 22.7% of total operating cost.',
          targetImpact: '+120 bps gross margin lift',
        },
        {
          id: 'sp-3',
          title: 'Expand EMEA Co-Sell Partner Desk',
          horizon: 'Strategic (2-4Q)',
          owner: 'SVP International',
          rationale: 'Shorten regional procurement cycles via certified systems integrators.',
          targetImpact: '24% EMEA revenue mix',
        },
      ],
      updatedAt: '2026-10-14T09:00:00.000Z',
    },
  },
  {
    key: 'retail',
    industry: 'Retail',
    headlineMetric: '€22.40M H1 Revenue · 14.3% Net Margin',
    summary: 'Omnichannel luxury apparel & home atelier balancing flagship expansion with supply costs.',
    report: {
      id: 'sample-retail',
      sampleKey: 'retail',
      isIllustrative: true,
      title: 'H1 2026 Merchandising & Omnichannel Report',
      subtitle: 'Flagship Boutiques, Wholesale & Digital Flagship Performance (Illustrative Dataset)',
      reportingPeriod: 'H1 2026 (Jan – Jun)',
      previousPeriodLabel: 'H2 2025',
      reportDate: 'July 18, 2026',
      currency: 'EUR',
      theme: 'editorial-ivory',
      branding: {
        companyName: 'Aurelia Atelier Group',
        tagline: 'Contemporary Craft, Home Objects & Tailoring',
        logoDataUrl: SAMPLE_LOGOS.retail,
        primaryColor: '#141413',
        accentColor: '#9A7B2C',
        classification: 'Shareholder & Leadership Letter · Illustrative Sample',
        preparedBy: 'Group Finance & Merchandising',
        contactEmail: 'board@aurelia-atelier.example',
        website: 'https://aurelia-atelier.example',
        disclaimer:
          'Illustrative sample figures prepared for demonstration inside NEXORA Signature. All figures represent a fictional retail enterprise.',
      },
      currentPeriod: {
        revenue: 22_400_000,
        expenses: 19_200_000,
        customerCount: 48_600,
        retentionRatePct: 68,
        npsScore: 71,
      },
      previousPeriod: {
        revenue: 20_800_000,
        expenses: 17_100_000,
        customerCount: 44_200,
      },
      monthlySeries: [
        { month: 'Jan 2026', revenue: 3_150_000, expenses: 2_890_000, customers: 44_900 },
        { month: 'Feb 2026', revenue: 3_320_000, expenses: 2_950_000, customers: 45_600 },
        { month: 'Mar 2026', revenue: 3_880_000, expenses: 3_210_000, customers: 46_400 },
        { month: 'Apr 2026', revenue: 3_960_000, expenses: 3_340_000, customers: 47_100 },
        { month: 'May 2026', revenue: 4_140_000, expenses: 3_420_000, customers: 47_900 },
        { month: 'Jun 2026', revenue: 3_950_000, expenses: 3_390_000, customers: 48_600 },
      ],
      revenueCategories: [
        { id: 'r-1', name: 'Flagship Retail Boutiques', amount: 11_200_000 },
        { id: 'r-2', name: 'Direct Digital Storefront', amount: 6_720_000 },
        { id: 'r-3', name: 'Selected Department Wholesale', amount: 3_180_000 },
        { id: 'r-4', name: 'Bespoke Interior Commissions', amount: 1_300_000 },
      ],
      expenseCategories: [
        { id: 'e-1', name: 'Cost of Goods & Atelier Sourcing', amount: 10_400_000 },
        { id: 'e-2', name: 'Boutique Leases & Store Payroll', amount: 4_950_000 },
        { id: 'e-3', name: 'Logistics, Duties & Packaging', amount: 2_150_000 },
        { id: 'e-4', name: 'Brand Editorial & Administration', amount: 1_700_000 },
      ],
      segments: [
        { id: 's-1', name: 'Ready-to-Wear & Tailoring', revenue: 11_900_000, growthPct: 9.1, marginPct: 16.4 },
        { id: 's-2', name: 'Home Objects & Ceramics', revenue: 6_450_000, growthPct: 11.4, marginPct: 14.8 },
        { id: 's-3', name: 'Leather Goods & Accessories', revenue: 4_050_000, growthPct: 2.3, marginPct: 9.2 },
      ],
      narrative: {
        overview:
          'Aurelia Atelier posted €22.40M in first-half revenue (+7.7% vs H2 2025), supported by strong spring collection sell-through in Paris, Milan, and digital channels.',
        achievements:
          'Active clientele grew by 4,400 buyers (+10.0%), while average order value rose 4.2% in Home Objects.',
        challenges:
          'Freight surcharges and linen raw-material inflation pushed expenses up 12.3%, compressing net margin by 3.5 percentage points to 14.3%.',
        closingTakeaway:
          'Autumn/Winter sourcing contracts lock textile pricing through Q1 2027, positioning the group to recover 200+ bps of margin in H2.',
      },
      strategicPriorities: [
        {
          id: 'sp-1',
          title: 'Consolidate European Regional Freight Carriers',
          horizon: 'Immediate (0-30d)',
          owner: 'VP Supply Chain',
          rationale: 'Logistics costs rose faster than unit shipments during Q2.',
          targetImpact: '€480K annualized cost savings',
        },
        {
          id: 'sp-2',
          title: 'Clienteling App for Flagship Stylists',
          horizon: 'Near-Term (Q+1)',
          owner: 'Head of Retail Experience',
          rationale: 'Repeat clients generate 3.1x higher contribution margin.',
          targetImpact: '+6% repeat purchase rate',
        },
        {
          id: 'sp-3',
          title: 'Expand Bespoke Home Commissions',
          horizon: 'Strategic (2-4Q)',
          owner: 'Creative & Commercial Director',
          rationale: 'Highest gross margin category with low return rates.',
          targetImpact: '€2.4M annual run-rate',
        },
      ],
      updatedAt: '2026-07-18T10:30:00.000Z',
    },
  },
  {
    key: 'financial-services',
    industry: 'Financial Services',
    headlineMetric: '£18.60M Fee Revenue · 35.8% Net Margin',
    summary: 'Institutional treasury & wealth advisory demonstrating resilient recurring fee income.',
    report: {
      id: 'sample-financial-services',
      sampleKey: 'financial-services',
      isIllustrative: true,
      title: 'Q3 2026 Institutional Advisory & AUM Performance',
      subtitle: 'Wealth Management, Treasury Advisory & Mandate Flows (Illustrative Dataset)',
      reportingPeriod: 'Q3 2026',
      previousPeriodLabel: 'Q2 2026',
      reportDate: 'October 10, 2026',
      currency: 'GBP',
      theme: 'modern-signal',
      branding: {
        companyName: 'Meridian Capital Advisory',
        tagline: 'Fiduciary Wealth & Corporate Treasury Partners',
        logoDataUrl: SAMPLE_LOGOS.finance,
        primaryColor: '#0F172A',
        accentColor: '#0891B2',
        classification: 'Executive Committee Brief · Illustrative Sample',
        preparedBy: 'Finance & Risk Analytics Desk',
        contactEmail: 'committee@meridian-advisory.example',
        website: 'https://meridian-advisory.example',
        disclaimer:
          'Illustrative sample figures prepared for demonstration inside NEXORA Signature. Not investment advice.',
      },
      currentPeriod: {
        revenue: 18_600_000,
        expenses: 11_950_000,
        customerCount: 412,
        retentionRatePct: 97,
        npsScore: 76,
      },
      previousPeriod: {
        revenue: 16_900_000,
        expenses: 11_250_000,
        customerCount: 386,
      },
      monthlySeries: [
        { month: 'Jul 2026', revenue: 5_980_000, expenses: 3_920_000, customers: 394 },
        { month: 'Aug 2026', revenue: 6_140_000, expenses: 3_980_000, customers: 402 },
        { month: 'Sep 2026', revenue: 6_480_000, expenses: 4_050_000, customers: 412 },
      ],
      revenueCategories: [
        { id: 'f-1', name: 'Recurring AUM Management Fees', amount: 11_160_000 },
        { id: 'f-2', name: 'Corporate Treasury Structuring', amount: 4_280_000 },
        { id: 'f-3', name: 'Performance & Carry Realizations', amount: 2_040_000 },
        { id: 'f-4', name: 'Private Credit Administration', amount: 1_120_000 },
      ],
      expenseCategories: [
        { id: 'fe-1', name: 'Advisory Partner & Analyst Compensation', amount: 7_450_000 },
        { id: 'fe-2', name: 'Regulatory Compliance & Audit', amount: 1_750_000 },
        { id: 'fe-3', name: 'Market Data & Quantitative Platforms', amount: 1_550_000 },
        { id: 'fe-4', name: 'Client Operations & Premises', amount: 1_200_000 },
      ],
      segments: [
        { id: 'fs-1', name: 'Endowments & Foundations', revenue: 7_820_000, growthPct: 12.4, marginPct: 38.5 },
        { id: 'fs-2', name: 'Corporate Treasury Desks', revenue: 6_340_000, growthPct: 9.8, marginPct: 34.1 },
        { id: 'fs-3', name: 'Family Office Mandates', revenue: 4_440_000, growthPct: 7.2, marginPct: 33.4 },
      ],
      narrative: {
        overview:
          'Meridian Capital Advisory generated £18.60M in Q3 fee revenue (+10.1% QoQ), lifting net profit to £6.65M and expanding net margin to 35.8%.',
        achievements:
          'Onboarded 26 new institutional mandates with zero client redemptions across core treasury portfolios.',
        challenges:
          'Updated cross-border reporting rules increased regulatory compliance outlays by 9% sequentially.',
        closingTakeaway:
          'Recurring management fees now cover 93% of fixed operating overhead, providing exceptional earnings visibility entering Q4.',
      },
      strategicPriorities: [
        {
          id: 'sp-1',
          title: 'Automate Cross-Border Regulatory Filings',
          horizon: 'Immediate (0-30d)',
          owner: 'Chief Compliance Officer',
          rationale: 'Compliance spend scaled linearly with mandate count in Q3.',
          targetImpact: 'Reduce manual audit hours by 35%',
        },
        {
          id: 'sp-2',
          title: 'Launch Sovereign Liquidity Sleeve',
          horizon: 'Near-Term (Q+1)',
          owner: 'Head of Fixed Income',
          rationale: 'Strong demand from Corporate Treasury Desks seeking yield.',
          targetImpact: '£650M incremental AUM',
        },
        {
          id: 'sp-3',
          title: 'Deepen Family Office Direct Co-Investment',
          horizon: 'Strategic (2-4Q)',
          owner: 'Managing Partner',
          rationale: 'Improves client stickiness and recurring fee blend.',
          targetImpact: '+18 new family office mandates',
        },
      ],
      updatedAt: '2026-10-10T08:00:00.000Z',
    },
  },
  {
    key: 'healthcare',
    industry: 'Healthcare',
    headlineMetric: '$31.20M Clinical Revenue · 18.6% Net Margin',
    summary: 'Precision diagnostics network balancing lab throughput expansion with reimbursement timing.',
    report: {
      id: 'sample-healthcare',
      sampleKey: 'healthcare',
      isIllustrative: true,
      title: 'Q3 2026 Clinical Diagnostics & Network Operations',
      subtitle: 'Genomic Screening, Outpatient Labs & Hospital Partnerships (Illustrative Dataset)',
      reportingPeriod: 'Q3 2026',
      previousPeriodLabel: 'Q2 2026',
      reportDate: 'October 16, 2026',
      currency: 'USD',
      theme: 'modern-signal',
      branding: {
        companyName: 'Helios Precision Diagnostics',
        tagline: 'Clinical Genomics & Integrated Outpatient Care',
        logoDataUrl: SAMPLE_LOGOS.healthcare,
        primaryColor: '#0B1120',
        accentColor: '#0891B2',
        classification: 'Clinical & Financial Governance Brief · Illustrative Sample',
        preparedBy: 'Health Economics & Finance Office',
        contactEmail: 'governance@helios-dx.example',
        website: 'https://helios-dx.example',
        disclaimer:
          'Illustrative sample figures prepared for demonstration inside NEXORA Signature. All metrics are synthetic.',
      },
      currentPeriod: {
        revenue: 31_200_000,
        expenses: 25_400_000,
        customerCount: 142_000,
        retentionRatePct: 91,
        npsScore: 79,
      },
      previousPeriod: {
        revenue: 28_400_000,
        expenses: 22_900_000,
        customerCount: 129_500,
      },
      monthlySeries: [
        { month: 'Jul 2026', revenue: 10_050_000, expenses: 8_240_000, customers: 133_200 },
        { month: 'Aug 2026', revenue: 10_380_000, expenses: 8_490_000, customers: 137_400 },
        { month: 'Sep 2026', revenue: 10_770_000, expenses: 8_670_000, customers: 142_000 },
      ],
      revenueCategories: [
        { id: 'h-1', name: 'Oncology & Genomic Panels', amount: 14_350_000 },
        { id: 'h-2', name: 'Hospital Reference Lab Contracts', amount: 9_680_000 },
        { id: 'h-3', name: 'Preventive Metabolic Screenings', amount: 4_870_000 },
        { id: 'h-4', name: 'Pharma Companion Trial Assays', amount: 2_300_000 },
      ],
      expenseCategories: [
        { id: 'he-1', name: 'Clinical Reagents & Sequencing Media', amount: 9_850_000 },
        { id: 'he-2', name: 'Pathologists & Lab Technicians', amount: 8_620_000 },
        { id: 'he-3', name: 'Cold-Chain Courier & Specimen Logistics', amount: 3_780_000 },
        { id: 'he-4', name: 'Accreditation, Billing & Facility Overhead', amount: 3_150_000 },
      ],
      segments: [
        { id: 'hs-1', name: 'Integrated Health Systems', revenue: 16_900_000, growthPct: 11.4, marginPct: 20.2 },
        { id: 'hs-2', name: 'Specialty Oncology Clinics', revenue: 9_450_000, growthPct: 9.8, marginPct: 18.9 },
        { id: 'hs-3', name: 'Biopharma Trial Sponsors', revenue: 4_850_000, growthPct: 5.4, marginPct: 12.6 },
      ],
      narrative: {
        overview:
          'Helios Precision Diagnostics processed 142,000 patient diagnostic episodes in Q3 (+9.7% QoQ), lifting revenue to $31.20M while maintaining an 18.6% operating margin.',
        achievements:
          'Turnaround time for targeted oncology sequencing dropped from 96 hours to 68 hours following automation upgrades in the Midwest hub.',
        challenges:
          'Cold-chain courier fuel surcharges and specialized reagent lead times pushed clinical expenses up 10.9%, slightly outpacing top-line growth.',
        closingTakeaway:
          'Volume density in Integrated Health Systems provides a clear path to 20% net margin once Q4 reagent volume rebates activate.',
      },
      strategicPriorities: [
        {
          id: 'sp-1',
          title: 'Activate Tier-2 Reagent Volume Rebate Contracts',
          horizon: 'Immediate (0-30d)',
          owner: 'VP Clinical Procurement',
          rationale: 'Sequencing volume crossed the 45,000-panel quarterly threshold.',
          targetImpact: '$620K quarterly reagent savings',
        },
        {
          id: 'sp-2',
          title: 'Electronic Payer Prior-Authorization Automation',
          horizon: 'Near-Term (Q+1)',
          owner: 'Director of Revenue Cycle',
          rationale: 'Reduce days-sales-outstanding by 6 days across outpatient claims.',
          targetImpact: '+$1.8M cash acceleration',
        },
        {
          id: 'sp-3',
          title: 'Expand Companion Diagnostic Pharma Partnerships',
          horizon: 'Strategic (2-4Q)',
          owner: 'Chief Medical Officer',
          rationale: 'High multi-year contract visibility in Phase III oncology trials.',
          targetImpact: '4 new biopharma master agreements',
        },
      ],
      updatedAt: '2026-10-16T11:15:00.000Z',
    },
  },
  {
    key: 'ecommerce',
    industry: 'E-commerce',
    headlineMetric: '$6.42M D2C Revenue · 16.2% Net Margin',
    summary: 'Specialty direct-to-consumer hardware & subscription consumables brand.',
    report: {
      id: 'sample-ecommerce',
      sampleKey: 'ecommerce',
      isIllustrative: true,
      title: 'Q3 2026 Direct-to-Consumer & Subscription Review',
      subtitle: 'Hardware Launches, Repeat Roastery Subscriptions & Paid Acquisition (Illustrative Dataset)',
      reportingPeriod: 'Q3 2026',
      previousPeriodLabel: 'Q2 2026',
      reportDate: 'October 12, 2026',
      currency: 'USD',
      theme: 'midnight-luxe',
      branding: {
        companyName: 'Kestrel Direct Commerce',
        tagline: 'Precision Brewing Hardware & Single-Origin Subscriptions',
        logoDataUrl: SAMPLE_LOGOS.ecommerce,
        primaryColor: '#141413',
        accentColor: '#D4FF33',
        classification: 'Executive Growth Memo · Illustrative Sample',
        preparedBy: 'D2C Analytics & Finance',
        contactEmail: 'founders@kestrelcommerce.example',
        website: 'https://kestrelcommerce.example',
        disclaimer:
          'Illustrative sample figures prepared for demonstration inside NEXORA Signature. All figures represent a fictional e-commerce brand.',
      },
      currentPeriod: {
        revenue: 6_420_000,
        expenses: 5_380_000,
        customerCount: 64_500,
        retentionRatePct: 82,
        npsScore: 69,
      },
      previousPeriod: {
        revenue: 5_480_000,
        expenses: 4_740_000,
        customerCount: 53_200,
      },
      monthlySeries: [
        { month: 'Jul 2026', revenue: 1_940_000, expenses: 1_690_000, customers: 56_800 },
        { month: 'Aug 2026', revenue: 2_120_000, expenses: 1_780_000, customers: 60_400 },
        { month: 'Sep 2026', revenue: 2_360_000, expenses: 1_910_000, customers: 64_500 },
      ],
      revenueCategories: [
        { id: 'ec-1', name: 'Countertop Precision Brewers', amount: 2_890_000 },
        { id: 'ec-2', name: 'Recurring Coffee Subscriptions', amount: 2_250_000 },
        { id: 'ec-3', name: 'Grinders & Barista Accessories', amount: 890_000 },
        { id: 'ec-4', name: 'Corporate Office Wholesale', amount: 390_000 },
      ],
      expenseCategories: [
        { id: 'ee-1', name: 'Manufacturing & Landed COGS', amount: 2_640_000 },
        { id: 'ee-2', name: 'Performance Paid Acquisition', amount: 1_240_000 },
        { id: 'ee-3', name: '3PL Fulfillment & Last-Mile Shipping', amount: 880_000 },
        { id: 'ee-4', name: 'Product Design, Support & Ops', amount: 620_000 },
      ],
      segments: [
        { id: 'es-1', name: 'US Direct Storefront', revenue: 4_480_000, growthPct: 19.2, marginPct: 17.8 },
        { id: 'es-2', name: 'Canada & UK Cross-Border', revenue: 1_310_000, growthPct: 13.5, marginPct: 12.4 },
        { id: 'es-3', name: 'Boutique Hospitality Partners', revenue: 630_000, growthPct: 8.1, marginPct: 12.7 },
      ],
      narrative: {
        overview:
          'Kestrel Direct Commerce grew quarterly revenue 17.2% to $6.42M, propelled by the Series-II Precision Brewer launch and 21.2% growth in active subscribers.',
        achievements:
          'Net profit climbed 40.5% to $1.04M as blended customer acquisition cost fell 9% via organic creator referrals.',
        challenges:
          '3PL fulfillment costs spiked in September during peak hardware pre-order dispatch.',
        closingTakeaway:
          'Converting Q3 hardware buyers into recurring consumables subscribers is the single highest-leverage driver for Q4 holiday profitability.',
      },
      strategicPriorities: [
        {
          id: 'sp-1',
          title: 'Launch 14-Day Post-Delivery Subscription Bundle',
          horizon: 'Immediate (0-30d)',
          owner: 'Head of Lifecycle Retention',
          rationale: 'Subscribers exhibit 3.4x higher 12-month contribution margin than hardware-only buyers.',
          targetImpact: '+12% hardware-to-subscription attach rate',
        },
        {
          id: 'sp-2',
          title: 'Activate East Coast 3PL Split Inventory',
          horizon: 'Near-Term (Q+1)',
          owner: 'Director of Operations',
          rationale: 'Reduce average shipping zone from Zone 5 to Zone 3 before Q4 holiday surge.',
          targetImpact: '-14% parcel shipping cost per order',
        },
        {
          id: 'sp-3',
          title: 'Expand Corporate Office Turnkey Program',
          horizon: 'Strategic (2-4Q)',
          owner: 'B2B Partnerships Lead',
          rationale: 'Low churn and predictable monthly bean replenishment contracts.',
          targetImpact: '$1.8M annualized B2B revenue',
        },
      ],
      updatedAt: '2026-10-12T14:20:00.000Z',
    },
  },
];

export function cloneReportData(report: ReportInputData): ReportInputData {
  return JSON.parse(JSON.stringify(report)) as ReportInputData;
}
