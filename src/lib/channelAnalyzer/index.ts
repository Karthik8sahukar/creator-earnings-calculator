/**
 * Public entry point for the Channel Analyzer library.
 *
 * Kept as a re-export barrel so consumers can `import { analyzeChannel,
 * type AnalyzerResult } from "@/lib/channelAnalyzer"` without needing
 * to know which internal module a symbol lives in.
 *
 * The orchestrator (`analyzeChannel`) is server-only; the pure
 * helpers (`normalizeChannelInput`, `estimateRevenue`,
 * `calculateEngagement`, `calculateGrowth`) are safe to import from
 * anywhere, but there is no client-side call site in phase 1.
 */

export {
  analyzeChannel,
  YouTubeApiError,
  type AnalyzerFallbackReason,
  type AnalyzerResult,
  type ChannelAnalysis,
  type EngagementMetrics,
  type GrowthLabel,
  type GrowthMetrics,
  type NormalizedChannelInput,
  type RevenueEstimate,
} from "./analyzeChannel";

export { normalizeChannelInput } from "./normalizeInput";
export { calculateEngagement } from "./calculateEngagement";
export {
  calculateGrowth,
  scoreToLabel,
} from "./calculateGrowth";
export {
  estimateRevenue,
  resolveCountryTier,
  CPM_TO_RPM_RATIO,
} from "./estimateRevenue";
