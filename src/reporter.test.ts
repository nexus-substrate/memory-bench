/**
 * Reporter tests
 */

import { describe, it, expect } from 'vitest';
import { generateReport } from './reporter.js';
import type { BenchmarkResult } from './types.js';
import { MOCK_STATS_RESPONSE } from './fixtures/mock-responses.js';

const MOCK_RESULT: BenchmarkResult = {
  stats: MOCK_STATS_RESPONSE,
  queryResults: [
    {
      label: 'Routing',
      query: 'routing optimization',
      resultCount: 3,
      durationMs: 12,
      metExpectation: true,
    },
    {
      label: 'Empty',
      query: 'nonexistent',
      resultCount: 0,
      durationMs: 5,
      metExpectation: false,
    },
  ],
  summary: {
    totalQueries: 2,
    totalResults: 3,
    avgDurationMs: 9,
    expectationsMet: 1,
    expectationsFailed: 1,
    backendsAvailable: 4,
    backendsTotal: 7,
  },
};

describe('generateReport', () => {
  describe('markdown format', () => {
    it('includes summary header', () => {
      const md = generateReport(MOCK_RESULT, 'markdown');
      expect(md).toContain('# Memory Benchmark Report');
      expect(md).toContain('Queries run:** 2');
    });

    it('includes backend status', () => {
      const md = generateReport(MOCK_RESULT, 'markdown');
      expect(md).toContain('## Backend Status');
      expect(md).toContain('session:** UP');
      expect(md).toContain('agentic:** DOWN');
    });

    it('includes session stats', () => {
      const md = generateReport(MOCK_RESULT, 'markdown');
      expect(md).toContain('Learnings: 37');
    });

    it('includes decay stats', () => {
      const md = generateReport(MOCK_RESULT, 'markdown');
      expect(md).toContain('## Decay Stats');
      expect(md).toContain('Total runs: 10');
    });

    it('includes query results table', () => {
      const md = generateReport(MOCK_RESULT, 'markdown');
      expect(md).toContain('| Routing |');
      expect(md).toContain('| YES |');
      expect(md).toContain('| NO |');
    });
  });

  describe('json format', () => {
    it('returns valid JSON', () => {
      const json = generateReport(MOCK_RESULT, 'json');
      const parsed: unknown = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    it('preserves full structure', () => {
      const json = generateReport(MOCK_RESULT, 'json');
      const parsed = JSON.parse(json) as BenchmarkResult;
      expect(parsed.summary.totalQueries).toBe(2);
      expect(parsed.queryResults).toHaveLength(2);
    });
  });

  describe('text format', () => {
    it('returns concise summary', () => {
      const text = generateReport(MOCK_RESULT, 'text');
      expect(text).toContain('2 queries');
      expect(text).toContain('Backends: 4/7');
    });
  });

  describe('edge cases', () => {
    it('handles null stats', () => {
      const resultNoStats: BenchmarkResult = {
        ...MOCK_RESULT,
        stats: null,
      };
      const md = generateReport(resultNoStats, 'markdown');
      expect(md).not.toContain('## Backend Status');
      expect(md).toContain('# Memory Benchmark Report');
    });

    it('handles empty query results', () => {
      const resultEmpty: BenchmarkResult = {
        ...MOCK_RESULT,
        queryResults: [],
        summary: { ...MOCK_RESULT.summary, totalQueries: 0 },
      };
      const md = generateReport(resultEmpty, 'markdown');
      expect(md).not.toContain('## Query Results');
    });
  });
});
