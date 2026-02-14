# memory-bench

Memory system benchmark for [nexus-agents](https://github.com/williamzujkowski/nexus-agents). E2E test for `memory_query` and `memory_stats` MCP tools.

## Quick start

```bash
pnpm install
pnpm test        # Run unit tests
pnpm typecheck   # TypeScript strict check
pnpm build       # Compile to dist/
```

## MCP tools covered

| Tool | Purpose |
|------|---------|
| `memory_query` | Query across all memory backends with unified results |
| `memory_stats` | Get memory system statistics dashboard |

## Live integration mode

```bash
NEXUS_LIVE=true npx tsx src/run-live.ts
```

## License

MIT
