---
name: deepseek-balance
description: This skill should be used when the user asks to "check DeepSeek balance", "query DeepSeek API credits", "查余额", or mentions "DeepSeek余额". Provides real-time balance display at the terminal bottom via statusLine. Requires the deepseek-balance CLI (npm install -g nuoming21/deepseek-balance).
version: 3.1.0
user-invocable: true
disable-model-invocation: true
---

# DeepSeek API Balance

When invoked, run the CLI directly. Do NOT call Python scripts or make raw HTTP requests.

## Commands

| User intent | Run this |
|-------------|----------|
| Check balance (compact) | `deepseek-balance` |
| Check balance (full) | `deepseek-balance full` |
| Set token | `deepseek-balance token <sk-xxx>` |
| Show token status | `deepseek-balance token` |
| Interactive login | `deepseek-balance login` |
| Set cache TTL | `deepseek-balance cache <minutes>` |
| Disable cache | `deepseek-balance cache off` |
| Show cache setting | `deepseek-balance cache` |
| Set check interval | `deepseek-balance interval <minutes>` |
| Show interval | `deepseek-balance interval` |
| Stop periodic check | `deepseek-balance interval off` |
| Help | `deepseek-balance --help` |

## Status Line

~/.claude/settings.json:
```json
{ "statusLine": { "type": "command", "command": "deepseek-balance" } }
```
