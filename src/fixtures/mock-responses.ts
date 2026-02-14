/**
 * Mock MCP tool responses for deterministic testing.
 */

import type { MemoryStatsResponse, MemoryQueryResult } from '../types.js';

export const MOCK_STATS_RESPONSE: MemoryStatsResponse = {
  backends: {
    session: true,
    belief: true,
    agentic: false,
    adaptive: false,
    typed: false,
    mobimem: true,
    decay: true,
  },
  session: {
    learningsCount: 37,
    tasksCount: 5,
    errorsCount: 1,
  },
  belief: {
    beliefsCount: 12,
    available: true,
  },
  typed: null,
  mobimem: {
    profile: {
      totalEntries: 8,
      uniqueEntities: 3,
      avgConfidence: 0.75,
    },
    experience: {
      totalPatterns: 15,
      uniqueTaskTypes: 4,
      avgSuccessRate: 0.82,
    },
    action: {
      totalEntries: 20,
      totalHits: 12,
      hitRate: 0.6,
      timeSavedMs: 4500,
    },
  },
  decay: {
    totalRuns: 10,
    lastRunAt: '2026-02-13T12:00:00Z',
    totalBeliefsPruned: 3,
    totalAgenticEvicted: 0,
    totalAdaptiveEvicted: 0,
    totalMobimemEvicted: 2,
    totalCrossReferencesPreserved: 1,
    totalErrors: 0,
  },
  collectedAt: '2026-02-13T12:00:00Z',
};

export const MOCK_QUERY_RESULT_WITH_MATCHES: MemoryQueryResult = {
  query: 'routing optimization',
  results: [
    { source: 'session', content: 'LinUCB bandit used for routing', score: 0.9 },
    { source: 'belief', content: 'Composite router is canonical', score: 0.7 },
  ],
  count: 2,
  source: 'all',
};

export const MOCK_QUERY_RESULT_EMPTY: MemoryQueryResult = {
  query: 'nonexistent topic xyz123',
  results: [],
  count: 0,
  source: 'all',
};

export const MOCK_QUERY_RESULT_SESSION_ONLY: MemoryQueryResult = {
  query: 'error handling patterns',
  results: [
    { source: 'session', content: 'Use Result<T,E> pattern', score: 0.85 },
  ],
  count: 1,
  source: 'session',
};

/** Stats with all backends down. */
export const MOCK_STATS_ALL_DOWN: MemoryStatsResponse = {
  ...MOCK_STATS_RESPONSE,
  backends: {
    session: false,
    belief: false,
    agentic: false,
    adaptive: false,
    typed: false,
    mobimem: false,
    decay: false,
  },
};

/** Stats with all backends up. */
export const MOCK_STATS_ALL_UP: MemoryStatsResponse = {
  ...MOCK_STATS_RESPONSE,
  backends: {
    session: true,
    belief: true,
    agentic: true,
    adaptive: true,
    typed: true,
    mobimem: true,
    decay: true,
  },
};
