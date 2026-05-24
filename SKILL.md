---
name: deepseek-balance
description: This skill should be used when the user asks to "check DeepSeek balance", "query DeepSeek API credits", "查余额", or mentions "DeepSeek余额". Provides real-time balance display at the terminal bottom via statusLine. Requires the deepseek-balance CLI (npm install -g deepseek-balance).
version: 3.0.0
allowed-tools: Bash(deepseek-balance:*) Read
user-invocable: true
---

# DeepSeek API Balance

Real-time DeepSeek balance in the Claude Code terminal status line. Powered by the `deepseek-balance` npm CLI.

## Prerequisites

```bash
npm install -g deepseek-balance
deepseek-balance login
```

Get a key at https://platform.deepseek.com/api_keys.

## Quick Reference

| Action | Command |
|--------|---------|
| Login | `deepseek-balance login` |
| Compact (status line) | `deepseek-balance` |
| Full detail | `deepseek-balance full` |
| Help | `deepseek-balance --help` |

## Workflow

### First-Time Setup

Run login to save the API key to `~/.deepseek-balance.json`:

```bash
deepseek-balance login
```

### Check Balance

```bash
deepseek-balance         # => DeepSeek ¥45.30
deepseek-balance full    # => detailed table
```

### Status Line (Terminal Bottom)

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "deepseek-balance 2>/dev/null || echo 'DeepSeek: N/A'"
  }
}
```

### Re-login

```bash
deepseek-balance login
```

## How It Works

- Zero-dependency Node.js CLI — `https.get` + stdlib
- Config: `~/.deepseek-balance.json` (permission 600)
- Cache: stored in config, 5-minute TTL
- API: `GET https://api.deepseek.com/user/balance` (free)

## Error Handling

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Not logged in" | No config | `deepseek-balance login` |
| HTTP 401 | Invalid key | `deepseek-balance login` |
| Network error | No internet | Stale cache used if available |
| "N/A" | Account issue | Check platform.deepseek.com |
