# deepseek-balance

Check your DeepSeek API account balance from the terminal. Also integrates as a Claude Code skill for real-time status line display.

```bash
$ deepseek-balance
DeepSeek ¥45.30
```

## Install

```bash
npm install -g nuoming21/deepseek-balance
deepseek-balance login
```

Or from Gitee:

```bash
npm install -g nuonuof/deepseek-balance
```

Zero dependencies — uses only Node.js built-ins.

## Usage

```bash
deepseek-balance           # Compact output (for status line)
deepseek-balance full      # Detailed balance table
deepseek-balance login     # Set or change API key
deepseek-balance --help    # Help
```

## Claude Code Integration

After installing globally, add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "deepseek-balance 2>/dev/null || echo 'DeepSeek: N/A'"
  }
}
```

Restart Claude Code and the balance appears at the terminal bottom, auto-refreshing every few minutes.

You can also type `/deepseek-balance` inside Claude Code if the skill is installed:

```bash
npx skills add nuoming21/deepseek-balance -g -y
```

## How It Works

- `deepseek-balance login` — Validates API key and saves to `~/.deepseek-balance.json`
- `deepseek-balance` — Calls `GET https://api.deepseek.com/user/balance` (free endpoint)
- 5-minute cache to avoid rate limiting
- Color-coded: green ≥¥20, yellow ≥¥5, red <¥5

## API

```js
const db = require("deepseek-balance");
console.log(db.status()); // "DeepSeek ¥45.30"
console.log(db.full());   // detailed table
```

## Requirements

- Node.js >= 16
- DeepSeek API key from [platform.deepseek.com](https://platform.deepseek.com/api_keys)
