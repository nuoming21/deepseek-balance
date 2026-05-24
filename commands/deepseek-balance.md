---
description: Check DeepSeek API balance, set token, or configure interval/cache
argument-hint: [token <key>|interval <N|off>|full|cache <N|off>]
allowed-tools: Bash(deepseek-balance:*)
---

!`if [ -z "${ARGUMENTS:-}" ]; then deepseek-balance full 2>&1; else deepseek-balance $ARGUMENTS 2>&1; fi`

If output says "No token" or "not logged in", tell user: deepseek-balance token sk-your-key-here
