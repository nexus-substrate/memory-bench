/**
 * Zod schema validation tests
 */

import { describe, it, expect } from 'vitest';
import {
  MemoryQueryInputSchema,
  MemoryQueryResultSchema,
  MemoryStatsResponseSchema,
  BackendsSchema,
  SessionStatsSchema,
  DecayStatsSchema,
} from './types.js';
import { MOCK_STATS_RESPONSE } from './fixtures/mock-responses.js';

describe('MemoryQueryInputSchema', () => {
  it('accepts valid input', () => {
    const result = MemoryQueryInputSchema.safeParse({
      query: 'routing patterns',
      source: 'all',
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty query', () => {
    const result = MemoryQueryInputSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  it('rejects query over 500 chars', () => {
    const result = MemoryQueryInputSchema.safeParse({
      query: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source', () => {
    const result = MemoryQueryInputSchema.safeParse({
      query: 'test',
      source: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects limit over 50', () => {
    const result = MemoryQueryInputSchema.safeParse({
      query: 'test',
      limit: 51,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid sources', () => {
    for (const source of ['session', 'belief', 'agentic', 'typed', 'all']) {
      const result = MemoryQueryInputSchema.safeParse({
        query: 'test',
        source,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('MemoryQueryResultSchema', () => {
  it('validates complete result', () => {
    const result = MemoryQueryResultSchema.safeParse({
      query: 'test',
      results: [],
      count: 0,
      source: 'all',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = MemoryQueryResultSchema.safeParse({ query: 'test' });
    expect(result.success).toBe(false);
  });
});

describe('BackendsSchema', () => {
  it('validates all boolean fields', () => {
    const result = BackendsSchema.safeParse(MOCK_STATS_RESPONSE.backends);
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean values', () => {
    const result = BackendsSchema.safeParse({
      ...MOCK_STATS_RESPONSE.backends,
      session: 'yes',
    });
    expect(result.success).toBe(false);
  });
});

describe('SessionStatsSchema', () => {
  it('validates session stats', () => {
    const result = SessionStatsSchema.safeParse(MOCK_STATS_RESPONSE.session);
    expect(result.success).toBe(true);
  });
});

describe('DecayStatsSchema', () => {
  it('validates decay stats', () => {
    const result = DecayStatsSchema.safeParse(MOCK_STATS_RESPONSE.decay);
    expect(result.success).toBe(true);
  });

  it('rejects missing totalRuns', () => {
    const partial = { ...MOCK_STATS_RESPONSE.decay };
    delete (partial as Record<string, unknown>)['totalRuns'];
    const result = DecayStatsSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });
});

describe('MemoryStatsResponseSchema', () => {
  it('validates full stats response', () => {
    const result = MemoryStatsResponseSchema.safeParse(MOCK_STATS_RESPONSE);
    expect(result.success).toBe(true);
  });

  it('rejects incomplete response', () => {
    const result = MemoryStatsResponseSchema.safeParse({
      backends: MOCK_STATS_RESPONSE.backends,
    });
    expect(result.success).toBe(false);
  });
});
