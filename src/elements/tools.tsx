export {
  NexoraCoverBanner,
  NexoraHeroKpi,
  NexoraKpiStrip,
  NexoraStoryArc,
  NexoraTrendChart,
  NexoraBreakdownChart,
  NexoraInsightsBlock,
  NexoraSimulationAppendix,
  parsePayload,
  resolveHeroDetails,
} from './custom/index.ts';
export type { HyperTarget, SerializedReportPayload } from './custom/index.ts';

import {
  NexoraBreakdownChart,
  NexoraCoverBanner,
  NexoraHeroKpi,
  NexoraInsightsBlock,
  NexoraKpiStrip,
  NexoraSimulationAppendix,
  NexoraStoryArc,
  NexoraTrendChart,
} from './custom/index.ts';

export const NEXORA_CUSTOM_ELEMENTS = [
  NexoraCoverBanner,
  NexoraHeroKpi,
  NexoraKpiStrip,
  NexoraStoryArc,
  NexoraTrendChart,
  NexoraBreakdownChart,
  NexoraInsightsBlock,
  NexoraSimulationAppendix,
] as const;
