# deepseek-balance

Check DeepSeek API account balance from the terminal. Zero dependencies, pure Node.js.

```bash
$ deepseek-balance
DeepSeek ¥45.30
```

## Install

```bash
npm install -g nuoming21/deepseek-balance
```

Gitee mirror:

```bash
npm install -g nuonuof/deepseek-balance
```

## Quick Start

```bash
# 1. Set your API key
deepseek-balance token sk-your-key-here

# 2. Check balance
deepseek-balance

# 3. Set auto-check every 30 minutes
deepseek-balance interval 30
```

## Command Reference

### Token

```bash
deepseek-balance token               # Show current key (masked)
deepseek-balance token sk-xxx        # Set key directly
deepseek-balance login               # Interactive prompt
```

### Balance

```bash
deepseek-balance                     # Compact: DeepSeek ¥45.30
deepseek-balance full                # Detailed table
```

### Cache

```bash
deepseek-balance cache               # Show current TTL
deepseek-balance cache 10            # Cache for 10 minutes
deepseek-balance cache off           # Disable cache (always fresh)
```

### Interval (periodic check)

```bash
deepseek-balance interval            # Show current setting
deepseek-balance interval 30         # Auto-check every 30 minutes
deepseek-balance interval off        # Stop periodic checks
```

On Windows this creates a scheduled task via `schtasks`. On Linux/Mac it adds a `crontab` entry.

### Help

```bash
deepseek-balance --help
```

## Claude Code Integration

### Status Line (terminal bottom, zero AI)

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "deepseek-balance 2>/dev/null || echo 'DeepSeek: N/A'"
  }
}
```

Restart Claude Code — balance appears at the bottom, auto-refreshing. No AI involved.

### Slash Command (`/deepseek-balance`)

Create `~/.claude/commands/deepseek-balance.md`:

```markdown
---
description: Check DeepSeek API account balance
argument-hint: [full|token|cache|interval|login]
allowed-tools: Bash(deepseek-balance:*)
---

Current DeepSeek balance:

!`deepseek-balance full 2>&1`

If "not logged in", tell user to run: deepseek-balance token sk-xxx
```

The `!`...`` runs BEFORE the AI — balance is pre-fetched and injected into the prompt. Much faster than a skill, minimal AI processing.

## Programmatic API

```js
const db = require("deepseek-balance");
console.log(db.status());   // "DeepSeek ¥45.30"
console.log(db.full());     // detailed table
```

## Config

- API key stored in `~/.deepseek-balance.json` (permission 600)
- Cache stored inside the same file
- Never committed: the file is not in the project directory

## Requirements

- Node.js >= 16
- DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com/api_keys)
- The balance endpoint `GET /user/balance` is free (no token cost)

## Color Codes

| Color | Range |
|-------|-------|
| Green | >= ¥20 |
| Yellow | >= ¥5 |
| Red | < ¥5 |
