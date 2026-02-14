#!/usr/bin/env tsx
/**
 * Run the memory benchmark against a live nexus-agents MCP server.
 *
 * Usage: NEXUS_LIVE=true npx tsx src/run-live.ts
 */

import { runBenchmark } from './benchmark.js';
import { isLiveMode } from './live-caller.js';
import type { ToolCaller } from './benchmark.js';

async function main(): Promise<void> {
  if (!isLiveMode()) {
    console.error('Set NEXUS_LIVE=true to run against a live MCP server.');
    process.exit(1);
  }

  let caller: ToolCaller;
  try {
    const bridgePath = './live-bridge.js';
    const mod: Record<string, unknown> = await import(bridgePath);
    const factory = mod['createMcpCaller'] as (() => Promise<ToolCaller>) | undefined;
    if (typeof factory !== 'function') throw new Error('live-bridge.ts must export createMcpCaller()');
    caller = await factory();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Failed to load live bridge: ${msg}`);
    process.exit(1);
  }

  console.log('Running memory benchmark against live MCP server...\n');
  const result = await runBenchmark(caller, {
    queries: [
      { label: 'orchestration', query: 'multi-agent orchestration', minResults: 0 },
      { label: 'routing', query: 'model routing strategy', minResults: 0 },
      { label: 'consensus', query: 'consensus voting', minResults: 0 },
    ],
    includeStats: true,
  });
  console.log(JSON.stringify(result, null, 2));
}

void main();
