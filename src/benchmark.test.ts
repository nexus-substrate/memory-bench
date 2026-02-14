/**
 * Benchmark runner tests
 */

import { describe, it, expect, vi } from 'vitest';
import type { ToolCaller } from './benchmark.js';
import {
  fetchStats,
  runQuery,
  countAvailableBackends,
  computeSummary,
  runBenchmark,
} from './benchmark.js';
import type { BenchmarkConfig, QueryBenchmarkResult } from './types.js';
import {
  MOCK_STATS_RESPONSE,
  MOCK_STATS_ALL_DOWN,
  MOCK_STATS_ALL_UP,
  MOCK_QUERY_RESULT_WITH_MATCHES,
  MOCK_QUERY_RESULT_EMPTY,
  MOCK_QUERY_RESULT_SESSION_ONLY,
} from './fixtures/mock-responses.js';

function createMockCaller(
  responses: Record<string, unknown>
): ToolCaller & { calls: Array<{ tool: string; args: Record<string, unknown> }> } {
  const calls: Array<{ tool: string; args: Record<string, unknown> }> = [];
  return {
    calls,
    call: vi.fn(async (toolName: string, args: Record<string, unknown>) => {
      calls.push({ tool: toolName, args });
      const response = responses[toolName];
      if (response === undefined) throw new Error(`No mock: ${toolName}`);
      return response;
    }),
  };
}

// ============================================================================
// fetchStats
// ============================================================================

describe('fetchStats', () => {
  it('calls memory_stats and validates response', async () => {
    const caller = createMockCaller({ memory_stats: MOCK_STATS_RESPONSE });

    const result = await fetchStats(caller);

    expect(caller.calls).toHaveLength(1);
    expect(caller.calls[0]?.tool).toBe('memory_stats');
    expect(result.backends.session).toBe(true);
    expect(result.session.learningsCount).toBe(37);
    expect(result.collectedAt).toBeDefined();
  });

  it('validates decay stats', async () => {
    const caller = createMockCaller({ memory_stats: MOCK_STATS_RESPONSE });

    const result = await fetchStats(caller);

    expect(result.decay.totalRuns).toBe(10);
    expect(result.decay.totalBeliefsPruned).toBe(3);
    expect(typeof result.decay.lastRunAt).toBe('string');
  });

  it('validates mobimem stats', async () => {
    const caller = createMockCaller({ memory_stats: MOCK_STATS_RESPONSE });

    const result = await fetchStats(caller);

    expect(result.mobimem.profile.avgConfidence).toBe(0.75);
    expect(result.mobimem.experience.avgSuccessRate).toBe(0.82);
    expect(result.mobimem.action.hitRate).toBe(0.6);
  });

  it('rejects invalid response', async () => {
    const caller = createMockCaller({ memory_stats: { invalid: true } });

    await expect(fetchStats(caller)).rejects.toThrow();
  });
});

// ============================================================================
// runQuery
// ============================================================================

describe('runQuery', () => {
  it('calls memory_query with correct args', async () => {
    const caller = createMockCaller({
      memory_query: MOCK_QUERY_RESULT_WITH_MATCHES,
    });

    const { result, durationMs } = await runQuery(
      caller,
      'routing optimization',
      'all',
      10
    );

    expect(caller.calls[0]?.args).toEqual({
      query: 'routing optimization',
      source: 'all',
      limit: 10,
    });
    expect(result.count).toBe(2);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it('handles empty results', async () => {
    const caller = createMockCaller({
      memory_query: MOCK_QUERY_RESULT_EMPTY,
    });

    const { result } = await runQuery(caller, 'nonexistent');

    expect(result.count).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  it('omits optional args when not provided', async () => {
    const caller = createMockCaller({
      memory_query: MOCK_QUERY_RESULT_EMPTY,
    });

    await runQuery(caller, 'test');

    expect(caller.calls[0]?.args).toEqual({ query: 'test' });
  });

  it('passes source filter', async () => {
    const caller = createMockCaller({
      memory_query: MOCK_QUERY_RESULT_SESSION_ONLY,
    });

    const { result } = await runQuery(caller, 'error handling', 'session');

    expect(caller.calls[0]?.args).toEqual({
      query: 'error handling',
      source: 'session',
    });
    expect(result.source).toBe('session');
    expect(result.count).toBe(1);
  });

  it('rejects invalid response', async () => {
    const caller = createMockCaller({ memory_query: 'not an object' });

    await expect(runQuery(caller, 'test')).rejects.toThrow();
  });
});

// ============================================================================
// countAvailableBackends
// ============================================================================

describe('countAvailableBackends', () => {
  it('counts mixed availability', () => {
    const { available, total } = countAvailableBackends(MOCK_STATS_RESPONSE);
    expect(available).toBe(4); // session, belief, mobimem, decay
    expect(total).toBe(7);
  });

  it('counts all down', () => {
    const { available, total } = countAvailableBackends(MOCK_STATS_ALL_DOWN);
    expect(available).toBe(0);
    expect(total).toBe(7);
  });

  it('counts all up', () => {
    const { available, total } = countAvailableBackends(MOCK_STATS_ALL_UP);
    expect(available).toBe(7);
    expect(total).toBe(7);
  });
});

// ============================================================================
// computeSummary
// ============================================================================

describe('computeSummary', () => {
  it('computes correct summary from query results', () => {
    const queryResults: QueryBenchmarkResult[] = [
      {
        label: 'q1',
        query: 'routing',
        resultCount: 3,
        durationMs: 10,
        metExpectation: true,
      },
      {
        label: 'q2',
        query: 'memory',
        resultCount: 0,
        durationMs: 5,
        metExpectation: false,
      },
      {
        label: 'q3',
        query: 'security',
        resultCount: 2,
        durationMs: 15,
        metExpectation: true,
      },
    ];

    const summary = computeSummary(queryResults, MOCK_STATS_RESPONSE);

    expect(summary.totalQueries).toBe(3);
    expect(summary.totalResults).toBe(5);
    expect(summary.avgDurationMs).toBe(10);
    expect(summary.expectationsMet).toBe(2);
    expect(summary.expectationsFailed).toBe(1);
    expect(summary.backendsAvailable).toBe(4);
    expect(summary.backendsTotal).toBe(7);
  });

  it('handles empty query results', () => {
    const summary = computeSummary([], MOCK_STATS_RESPONSE);

    expect(summary.totalQueries).toBe(0);
    expect(summary.totalResults).toBe(0);
    expect(summary.avgDurationMs).toBe(0);
  });

  it('defaults backends when stats is null', () => {
    const summary = computeSummary([], null);

    expect(summary.backendsAvailable).toBe(0);
    expect(summary.backendsTotal).toBe(7);
  });
});

// ============================================================================
// runBenchmark (full pipeline)
// ============================================================================

describe('runBenchmark', () => {
  it('runs full benchmark with stats and queries', async () => {
    let queryCallIndex = 0;
    const queryResponses = [
      MOCK_QUERY_RESULT_WITH_MATCHES,
      MOCK_QUERY_RESULT_EMPTY,
    ];
    const caller: ToolCaller = {
      call: vi.fn(async (toolName: string) => {
        if (toolName === 'memory_stats') return MOCK_STATS_RESPONSE;
        return queryResponses[queryCallIndex++];
      }),
    };

    const config: BenchmarkConfig = {
      queries: [
        { label: 'Routing', query: 'routing optimization', minResults: 1 },
        { label: 'Missing', query: 'nonexistent', minResults: 0 },
      ],
      includeStats: true,
    };

    const result = await runBenchmark(caller, config);

    expect(result.stats).not.toBeNull();
    expect(result.queryResults).toHaveLength(2);
    expect(result.queryResults[0]?.metExpectation).toBe(true);
    expect(result.queryResults[1]?.metExpectation).toBe(true);
    expect(result.summary.totalQueries).toBe(2);
  });

  it('skips stats when includeStats is false', async () => {
    const caller: ToolCaller = {
      call: vi.fn(async () => MOCK_QUERY_RESULT_EMPTY),
    };

    const config: BenchmarkConfig = {
      queries: [{ label: 'Test', query: 'test' }],
      includeStats: false,
    };

    const result = await runBenchmark(caller, config);

    expect(result.stats).toBeNull();
    expect(result.queryResults).toHaveLength(1);
  });

  it('fails expectation when results below minimum', async () => {
    const caller: ToolCaller = {
      call: vi.fn(async (toolName: string) => {
        if (toolName === 'memory_stats') return MOCK_STATS_RESPONSE;
        return MOCK_QUERY_RESULT_EMPTY;
      }),
    };

    const config: BenchmarkConfig = {
      queries: [
        { label: 'Expected results', query: 'routing', minResults: 5 },
      ],
    };

    const result = await runBenchmark(caller, config);

    expect(result.queryResults[0]?.metExpectation).toBe(false);
    expect(result.summary.expectationsFailed).toBe(1);
  });

  it('propagates tool errors', async () => {
    const caller: ToolCaller = {
      call: vi.fn(async () => {
        throw new Error('Memory backend unavailable');
      }),
    };

    const config: BenchmarkConfig = {
      queries: [{ label: 'Test', query: 'test' }],
    };

    await expect(runBenchmark(caller, config)).rejects.toThrow(
      'Memory backend unavailable'
    );
  });

  it('passes source filter to all queries', async () => {
    const calls: Record<string, unknown>[] = [];
    const caller: ToolCaller = {
      call: vi.fn(async (toolName: string, args: Record<string, unknown>) => {
        calls.push(args);
        if (toolName === 'memory_stats') return MOCK_STATS_RESPONSE;
        return MOCK_QUERY_RESULT_SESSION_ONLY;
      }),
    };

    const config: BenchmarkConfig = {
      queries: [{ label: 'Session', query: 'test' }],
      source: 'session',
    };

    await runBenchmark(caller, config);

    // Second call (after stats) should have source
    const queryCall = calls.find(
      (c) => typeof c['query'] === 'string'
    );
    expect(queryCall?.source).toBe('session');
  });
});
