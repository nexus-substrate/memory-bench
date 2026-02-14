/**
 * Benchmark reporter
 *
 * Formats benchmark results into readable reports.
 */

import type { BenchmarkResult } from './types.js';

export type ReportFormat = 'markdown' | 'json' | 'text';

/** Generate a benchmark report. */
export function generateReport(
  result: BenchmarkResult,
  format: ReportFormat
): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }
  if (format === 'markdown') {
    return generateMarkdownReport(result);
  }
  return generateTextReport(result);
}

function generateMarkdownReport(result: BenchmarkResult): string {
  const lines: string[] = [];
  const s = result.summary;

  lines.push('# Memory Benchmark Report');
  lines.push('');
  lines.push('## Summary');
  lines.push(`- **Queries run:** ${String(s.totalQueries)}`);
  lines.push(`- **Total results:** ${String(s.totalResults)}`);
  lines.push(`- **Avg duration:** ${String(s.avgDurationMs)}ms`);
  lines.push(
    `- **Expectations:** ${String(s.expectationsMet)}/${String(s.totalQueries)} met`
  );
  lines.push(
    `- **Backends:** ${String(s.backendsAvailable)}/${String(s.backendsTotal)} available`
  );
  lines.push('');

  if (result.stats !== null) {
    lines.push('## Backend Status');
    const backends = result.stats.backends;
    for (const [name, available] of Object.entries(backends)) {
      const icon = available ? 'UP' : 'DOWN';
      lines.push(`- **${name}:** ${icon}`);
    }
    lines.push('');

    lines.push('## Session Stats');
    lines.push(
      `- Learnings: ${String(result.stats.session.learningsCount)}`
    );
    lines.push(`- Tasks: ${String(result.stats.session.tasksCount)}`);
    lines.push(`- Errors: ${String(result.stats.session.errorsCount)}`);
    lines.push('');

    if (result.stats.decay.totalRuns > 0) {
      lines.push('## Decay Stats');
      lines.push(
        `- Total runs: ${String(result.stats.decay.totalRuns)}`
      );
      lines.push(
        `- Beliefs pruned: ${String(result.stats.decay.totalBeliefsPruned)}`
      );
      lines.push(
        `- Last run: ${result.stats.decay.lastRunAt}`
      );
      lines.push('');
    }
  }

  if (result.queryResults.length > 0) {
    lines.push('## Query Results');
    lines.push('');
    lines.push('| Label | Query | Results | Duration | Met? |');
    lines.push('|-------|-------|---------|----------|------|');
    for (const q of result.queryResults) {
      const met = q.metExpectation ? 'YES' : 'NO';
      lines.push(
        `| ${q.label} | ${q.query} | ${String(q.resultCount)} | ${String(q.durationMs)}ms | ${met} |`
      );
    }
  }

  return lines.join('\n');
}

function generateTextReport(result: BenchmarkResult): string {
  const s = result.summary;
  const lines: string[] = [];
  lines.push(`Memory Benchmark: ${String(s.totalQueries)} queries`);
  lines.push(`Results: ${String(s.totalResults)} total`);
  lines.push(`Avg: ${String(s.avgDurationMs)}ms`);
  lines.push(
    `Expectations: ${String(s.expectationsMet)}/${String(s.totalQueries)} met`
  );
  lines.push(
    `Backends: ${String(s.backendsAvailable)}/${String(s.backendsTotal)}`
  );
  return lines.join('\n');
}
