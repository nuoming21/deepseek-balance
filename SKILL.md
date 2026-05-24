---
name: deepseek-balance
description: This skill should be used when the user asks to "check DeepSeek balance", "查余额", or mentions "DeepSeek余额". Runs the deepseek-balance CLI directly.
version: 4.0.0
user-invocable: true
disable-model-invocation: true
---

# DeepSeek API Balance

Run the CLI. Do not make raw HTTP calls.

- Check balance: `deepseek-balance full`
- Set token: `deepseek-balance token <sk-xxx>`
- Set interval: `deepseek-balance interval <minutes>`
- Cache control: `deepseek-balance cache <N|off>`
- Help: `deepseek-balance --help`

## Status Line

```json
{ "statusLine": { "type": "command", "command": "deepseek-balance" } }
```
