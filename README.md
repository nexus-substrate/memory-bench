# memory-bench

Memory system benchmark for [nexus-agents](https://github.com/nexus-substrate/nexus-agents). E2E test for `memory_query` and `memory_stats` MCP tools.

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

## License

MIT
