/**
 * memory-bench types
 *
 * Zod schemas matching nexus-agents memory_query and memory_stats MCP tools.
 */

import { z } from 'zod';

// ============================================================================
// memory_query
// ============================================================================

export const MemoryQueryInputSchema = z.object({
  query: z.string().min(1).max(500),
  source: z
    .enum(['session', 'belief', 'agentic', 'typed', 'all'])
    .optional(),
  limit: z.number().min(1).max(50).optional(),
});

export type MemoryQueryInput = z.infer<typeof MemoryQueryInputSchema>;

export const MemoryQueryResultSchema = z.object({
  query: z.string(),
  results: z.array(z.unknown()),
  count: z.number(),
  source: z.string(),
});

export type MemoryQueryResult = z.infer<typeof MemoryQueryResultSchema>;

// ============================================================================
// memory_stats
// ============================================================================

export const BackendsSchema = z.object({
  session: z.boolean(),
  belief: z.boolean(),
  agentic: z.boolean(),
  adaptive: z.boolean(),
  typed: z.boolean(),
  mobimem: z.boolean(),
  decay: z.boolean(),
});

export const SessionStatsSchema = z.object({
  learningsCount: z.number(),
  tasksCount: z.number(),
  errorsCount: z.number(),
});

export const BeliefStatsSchema = z.object({
  beliefsCount: z.number(),
  available: z.boolean(),
});

export const MobimemProfileSchema = z.object({
  totalEntries: z.number(),
  uniqueEntities: z.number(),
  avgConfidence: z.number(),
});

export const MobimemExperienceSchema = z.object({
  totalPatterns: z.number(),
  uniqueTaskTypes: z.number(),
  avgSuccessRate: z.number(),
});

export const MobimemActionSchema = z.object({
  totalEntries: z.number(),
  totalHits: z.number(),
  hitRate: z.number(),
  timeSavedMs: z.number(),
});

export const MobimemStatsSchema = z.object({
  profile: MobimemProfileSchema,
  experience: MobimemExperienceSchema,
  action: MobimemActionSchema,
});

export const DecayStatsSchema = z.object({
  totalRuns: z.number(),
  lastRunAt: z.string(),
  totalBeliefsPruned: z.number(),
  totalAgenticEvicted: z.number(),
  totalAdaptiveEvicted: z.number(),
  totalMobimemEvicted: z.number(),
  totalCrossReferencesPreserved: z.number(),
  totalErrors: z.number(),
});

export const MemoryStatsResponseSchema = z.object({
  backends: BackendsSchema,
  session: SessionStatsSchema,
  belief: BeliefStatsSchema,
  typed: z.unknown().nullable(),
  mobimem: MobimemStatsSchema,
  decay: DecayStatsSchema,
  collectedAt: z.string(),
});

export type MemoryStatsResponse = z.infer<typeof MemoryStatsResponseSchema>;

// ============================================================================
// Benchmark types
// ============================================================================

export interface BenchmarkConfig {
  /** Queries to run against memory_query. */
  readonly queries: readonly QueryBenchmark[];
  /** Whether to include stats in the report. */
  readonly includeStats?: boolean;
  /** Filter memory source. */
  readonly source?: MemoryQueryInput['source'];
  /** Per-call timeout (ms) for remote tool calls. Omit to use the default. */
  readonly timeoutMs?: number;
}

export interface QueryBenchmark {
  /** Human-readable label for this query. */
  readonly label: string;
  /** The search query string. */
  readonly query: string;
  /** Expected minimum result count (0 = no expectation). */
  readonly minResults?: number;
  /** Maximum results to fetch. */
  readonly limit?: number;
}

export interface BenchmarkResult {
  readonly stats: MemoryStatsResponse | null;
  readonly queryResults: readonly QueryBenchmarkResult[];
  readonly summary: BenchmarkSummary;
}

export interface QueryBenchmarkResult {
  readonly label: string;
  readonly query: string;
  readonly resultCount: number;
  readonly durationMs: number;
  readonly metExpectation: boolean;
}

export interface BenchmarkSummary {
  readonly totalQueries: number;
  readonly totalResults: number;
  readonly avgDurationMs: number;
  readonly expectationsMet: number;
  readonly expectationsFailed: number;
  readonly backendsAvailable: number;
  readonly backendsTotal: number;
}
