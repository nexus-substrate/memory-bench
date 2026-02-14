/**
 * memory-bench — Memory system benchmark
 *
 * E2E test project for nexus-agents memory_query and memory_stats MCP tools.
 */

export type { ToolCaller } from './benchmark.js';
export {
  runBenchmark,
  fetchStats,
  runQuery,
  countAvailableBackends,
  computeSummary,
} from './benchmark.js';
export { generateReport, type ReportFormat } from './reporter.js';
export type {
  BenchmarkConfig,
  BenchmarkResult,
  QueryBenchmark,
  QueryBenchmarkResult,
  BenchmarkSummary,
  MemoryQueryInput,
  MemoryQueryResult,
  MemoryStatsResponse,
} from './types.js';
export {
  MemoryQueryInputSchema,
  MemoryQueryResultSchema,
  MemoryStatsResponseSchema,
  BackendsSchema,
  SessionStatsSchema,
  DecayStatsSchema,
} from './types.js';
