# Vibes

[![CI](https://github.com/binora/vibes/actions/workflows/ci.yml/badge.svg)](https://github.com/binora/vibes/actions/workflows/ci.yml)

A lightweight social presence layer for AI coding agents. See who else is coding right now.

## Install

### Claude Code Plugin (recommended)
```bash
claude plugin install github:binora/vibes
```

### Or via npm
```bash
claude mcp add vibes-mcp -- npx vibes-mcp@latest
```

## Usage

```
/vibes                    # See recent vibes
/vibes "shipping at 2am"  # Drop a vibe
```

## What You'll See

```
💭 12 others vibing

"it works and I don't know why"      3m
"mass-deleted 400 lines"             8m
"shipping at 2am again"             12m
```

## Features

- Anonymous - no accounts, no profiles
- Ephemeral - drops auto-delete after 24h
- Agent-scoped - Claude Code users see Claude Code vibes
- Minimal - ~180 tokens per call

## How It Works

1. Your MCP server sends a heartbeat every 60s
2. HyperLogLog counts unique active users
3. Drops are stored in Redis, scoped by agent
4. Everything auto-expires - no data hoarding

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `VIBES_HEARTBEAT_SECONDS` | 60 | Heartbeat interval (min: 60) |
| `VIBES_API_URL` | https://vibes-api.fly.dev | API endpoint |

## Rate Limits

- 5 drops per hour
- 140 characters max per drop

## License

MIT
