---
name: deepseek-balance
description: This skill should be used when the user asks to "check DeepSeek balance", "query DeepSeek API credits", "查余额", or mentions "DeepSeek余额". Provides real-time balance display at the terminal bottom via statusLine, with interactive login via setup.py.
version: 2.0.0
allowed-tools: Bash(python:*,curl:*) Read
user-invocable: true
---

# DeepSeek API Balance — Real-Time Terminal Display

Displays DeepSeek API balance in real-time at the Claude Code terminal bottom via the status line.

## Quick Reference

| Action | Command |
|--------|---------|
| Login/Setup | `python ${CLAUDE_SKILL_DIR}/setup.py` |
| Check balance (full) | `python ${CLAUDE_SKILL_DIR}/check_balance.py --full` |
| Check balance (compact) | `python ${CLAUDE_SKILL_DIR}/check_balance.py --short` |

## Files

- **`setup.py`** — Interactive login. Prompts for API key, validates against DeepSeek API, saves to `config.json`.
- **`check_balance.py`** — Queries balance. `--short` = one-line for status bar, `--full` = detailed output. Cached for 5 minutes.
- **`config.json`** — Created by setup, stores API key (auto-added to `.gitignore`).

## Workflow

### First-Time Setup

When the user hasn't logged in yet, run `setup.py` interactively:

```bash
python ${CLAUDE_SKILL_DIR}/setup.py
```

This prompts for the API key (get it from https://platform.deepseek.com/api_keys), validates it, and saves to `config.json`.

### Check Balance

For a detailed view, run with `--full`:

```bash
python ${CLAUDE_SKILL_DIR}/check_balance.py --full
```

### Status Line (Real-Time Bottom Display)

The status line is configured in `~/.claude/settings.json` to call `check_balance.py --short` periodically. Caches results for 5 minutes to avoid rate limiting.

```json
{
  "statusLine": {
    "type": "command",
    "command": "python ${CLAUDE_SKILL_DIR}/check_balance.py --short 2>/dev/null || echo 'DeepSeek: N/A'"
  }
}
```

Compact output format: `DeepSeek ¥XX.XX` (color-coded: green ≥20, yellow ≥5, red <5)

### Re-login

To change API key, run `setup.py` again — it detects the existing key and offers to replace it.

## API Details

- **Endpoint**: `GET https://api.deepseek.com/user/balance`
- **Auth**: `Authorization: Bearer <api_key>`
- **Cost**: Free (no tokens consumed)
- **Cache TTL**: 5 minutes (for status line efficiency)

## Error Handling

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Not logged in" | No config.json | Run `setup.py` |
| HTTP 401 | Invalid/expired key | Run `setup.py` to re-login |
| "N/A" | Account unavailable | Check platform.deepseek.com |
| Network error | No internet | Retry later |
