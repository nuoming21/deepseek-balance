# DeepSeek Balance

Claude Code skill — displays DeepSeek API account balance in real-time at the terminal bottom via the status line.

## Features

- **Real-time status line** — balance appears at the terminal bottom, auto-refreshes every few minutes
- **Interactive login** — `setup.py` prompts for API key, validates, saves locally
- **Color-coded** — green (>= ¥20), yellow (>= ¥5), red (< ¥5)
- **5-minute cache** — avoids rate limiting on the free balance endpoint

## Install

```bash
git clone git@github.com:nuoming21/deepseek-balance.git
cd deepseek-balance

# Login with your DeepSeek API key
python setup.py

# Install as Claude Code skill
npx skills add . -g -y
```

Then restart Claude Code — the balance appears at the bottom automatically.

## Usage

| Action | Command |
|--------|---------|
| Login / change key | `python setup.py` |
| Full balance detail | `python check_balance.py --full` |
| Compact (status line) | `python check_balance.py --short` |
| In Claude Code | `/deepseek-balance` |

## Status Line

Configured automatically in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "python /path/to/check_balance.py --short 2>/dev/null || echo 'DeepSeek: N/A'"
  }
}
```

## How It Works

- `setup.py` — Saves validated API key to `config.json` (gitignored)
- `check_balance.py` — Calls `GET https://api.deepseek.com/user/balance` (free, no tokens consumed)
- Cache TTL: 5 minutes, stored in `.balance_cache.json`

## Requirements

- Python 3 (stdlib only, no pip dependencies)
- DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com/api_keys)
