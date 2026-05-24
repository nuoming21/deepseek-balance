---
description: Check DeepSeek API account balance
argument-hint: [full|token|cache|interval|login]
allowed-tools: Bash(deepseek-balance:*)
---

Current DeepSeek balance:

!`deepseek-balance full 2>&1`

If "not logged in", tell user to run: deepseek-balance token sk-xxx
