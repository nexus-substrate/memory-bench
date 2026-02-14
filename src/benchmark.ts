/**
 * Memory benchmark runner
 *
 * Runs a battery of memory_query operations and collects memory_stats,
 * producing a structured benchmark report.
 */

import type {
  BenchmarkConfig,
  BenchmarkResult,
  QueryBenchmarkResult,
  BenchmarkSummary,
  MemoryStatsResponse,
  MemoryQueryResult,
} from './types.js';
import { MemoryStatsResponseSchema, MemoryQueryResultSchema } from './types.js';

// ============================================================================
// Tool caller abstraction
// ============================================================================

export interface ToolCaller {
  call(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

// ============================================================================
// Individual steps
// ============================================================================

/** Fetch memory system stats. */
export async function fetchStats(
  caller: ToolCaller
): Promise<MemoryStatsResponse> {
  const raw = await caller.call('memory_stats', {});
  return MemoryStatsResponseSchema.parse(raw);
}

/** Run a single memory query and measure duration. */
export async function runQuery(
  caller: ToolCaller,
  query: string,
  source?: string,
  limit?: number
): Promise<{ result: MemoryQueryResult; durationMs: number }> {
  const args: Record<string, unknown> = { query };
  if (source !== undefined) args['source'] = source;
  if (limit !== undefined) args['limit'] = limit;

  const start = Date.now();
  const raw = await caller.call('memory_query', args);
  const durationMs = Date.now() - start;

  const result = MemoryQueryResultSchema.parse(raw);
  return { result, durationMs };
}

/** Count available backends from stats. */
export function countAvailableBackends(
  stats: MemoryStatsResponse
): { available: number; total: number } {
  const backends = stats.backends;
  const entries = Object.values(backends);
  const available = entries.filter((v) => v === true).length;
  return { available, total: entries.length };
}

// ============================================================================
// Full benchmark
// ============================================================================

/** Run the complete benchmark suite. */
export async function runBenchmark(
  caller: ToolCaller,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  // Step 1: Collect stats
  let stats: MemoryStatsResponse | null = null;
  if (config.includeStats !== false) {
    stats = await fetchStats(caller);
  }

  // Step 2: Run all queries
  const queryResults: QueryBenchmarkResult[] = [];
  for (const bench of config.queries) {
    const { result, durationMs } = await runQuery(
      caller,
      bench.query,
      config.source,
      bench.limit
    );

    const minResults = bench.minResults ?? 0;
    const metExpectation = result.count >= minResults;

    queryResults.push({
      label: bench.label,
      query: bench.query,
      resultCount: result.count,
      durationMs,
      metExpectation,
    });
  }

  // Step 3: Compute summary
  const summary = computeSummary(queryResults, stats);

  return { stats, queryResults, summary };
}

/** Compute aggregate benchmark summary. */
export function computeSummary(
  queryResults: readonly QueryBenchmarkResult[],
  stats: MemoryStatsResponse | null
): BenchmarkSummary {
  const totalQueries = queryResults.length;
  const totalResults = queryResults.reduce((sum, q) => sum + q.resultCount, 0);
  const avgDurationMs =
    totalQueries > 0
      ? Math.round(
          queryResults.reduce((sum, q) => sum + q.durationMs, 0) / totalQueries
        )
      : 0;
  const expectationsMet = queryResults.filter((q) => q.metExpectation).length;
  const expectationsFailed = totalQueries - expectationsMet;

  let backendsAvailable = 0;
  let backendsTotal = 7;
  if (stats !== null) {
    const counted = countAvailableBackends(stats);
    backendsAvailable = counted.available;
    backendsTotal = counted.total;
  }

  return {
    totalQueries,
    totalResults,
    avgDurationMs,
    expectationsMet,
    expectationsFailed,
    backendsAvailable,
    backendsTotal,
  };
}
