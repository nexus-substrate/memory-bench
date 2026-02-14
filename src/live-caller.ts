/**
 * Live MCP tool caller — bridges ToolCaller interface to a real nexus-agents MCP server.
 */

import type { ToolCaller } from './benchmark.js';

export function createLiveCaller(
  callFn: (tool: string, args: Record<string, unknown>) => Promise<unknown>,
): ToolCaller {
  return { call: callFn };
}

export function isLiveMode(): boolean {
  return process.env['NEXUS_LIVE'] === 'true';
}
