#!/usr/bin/env node
"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

// ── Config ──────────────────────────────────────────────
const CONFIG_FILE = path.join(os.homedir(), ".deepseek-balance.json");
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const API_HOST = "api.deepseek.com";
const API_PATH = "/user/balance";

// ── Colors ──────────────────────────────────────────────
const C = { red: "\x1b[91m", green: "\x1b[92m", yellow: "\x1b[93m", cyan: "\x1b[96m", bold: "\x1b[1m", reset: "\x1b[0m" };

// ── Helpers ─────────────────────────────────────────────
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")); } catch { return null; }
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

function apiGet(apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.get({ host: API_HOST, path: API_PATH, headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` }, timeout: 10000 }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error(`Invalid response: ${body}`)); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
  });
}

function colorBalance(total) {
  if (total < 5) return C.red;
  if (total < 20) return C.yellow;
  return C.green;
}

// ── Commands ─────────────────────────────────────────────

async function cmdLogin() {
  console.log(`${C.bold}DeepSeek API Balance — Login${C.reset}\n`);
  console.log("Get your key at: https://platform.deepseek.com/api_keys\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  const key = await ask("Paste your DeepSeek API Key (sk-...): ");
  rl.close();

  const trimmed = key.trim();
  if (!trimmed) {
    console.error(`${C.red}[ERROR]${C.reset} API key cannot be empty.`);
    process.exit(1);
  }

  process.stdout.write(`${C.cyan}Validating...${C.reset} `);
  try {
    const data = await apiGet(trimmed);
    if (!data.is_available) {
      console.log(`\n${C.red}[FAILED]${C.reset} API key works but balance is not available.`);
      process.exit(1);
    }
    saveConfig({ api_key: trimmed });
    console.log(`${C.green}OK${C.reset}`);
    const info = data.balance_infos[0];
    console.log(`\n${C.bold}Current Balance:${C.reset}`);
    console.log(`  Total:     ${C.green}¥${info.total_balance} ${info.currency}${C.reset}`);
    console.log(`  Topped Up: ¥${info.topped_up_balance} ${info.currency}`);
    console.log(`  Granted:   ¥${info.granted_balance} ${info.currency}`);
  } catch (e) {
    console.log(`\n${C.red}[FAILED]${C.reset} ${e.message}`);
    process.exit(1);
  }
}

function cmdFull(data) {
  console.log(`${C.bold}DeepSeek API Balance${C.reset}`);
  for (const info of data.balance_infos) {
    const total = parseFloat(info.total_balance);
    const c = colorBalance(total);
    console.log(`  Total:     ${c}¥${info.total_balance} ${info.currency}${C.reset}`);
    console.log(`  Topped Up: ¥${info.topped_up_balance} ${info.currency}`);
    console.log(`  Granted:   ¥${info.granted_balance} ${info.currency}`);
  }
}

function cmdShort(data) {
  const info = data.balance_infos[0];
  const total = parseFloat(info.total_balance);
  const c = colorBalance(total);
  process.stdout.write(`DeepSeek ${c}¥${total.toFixed(2)}${C.reset}\n`);
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] || "status";

  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(`
${C.bold}deepseek-balance${C.reset} — Check DeepSeek API account balance

${C.bold}Usage:${C.reset}
  deepseek-balance           Show compact balance (for status line)
  deepseek-balance login     Set or change your API key
  deepseek-balance status    Compact one-line output
  deepseek-balance full      Detailed balance view

${C.bold}Examples:${C.reset}
  $ deepseek-balance
  DeepSeek ¥45.30

  $ deepseek-balance full
  DeepSeek API Balance
    Total:     ¥45.30 CNY
    Topped Up: ¥35.30 CNY
    Granted:   ¥10.00 CNY

${C.bold}Claude Code status line:${C.reset}
  Add to ~/.claude/settings.json:
  { "statusLine": { "type": "command", "command": "deepseek-balance" } }
`);
    return;
  }

  if (cmd === "login") {
    await cmdLogin();
    return;
  }

  const cfg = loadConfig();
  if (!cfg || !cfg.api_key) {
    console.error(`${C.red}Not logged in.${C.reset} Run: ${C.bold}deepseek-balance login${C.reset}`);
    process.exit(1);
  }

  // Try cache for short/status mode
  if (cmd === "status" || cmd === "short") {
    const cached = cfg.__cache;
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      cmdShort(cached.data);
      return;
    }
  }

  try {
    const data = await apiGet(cfg.api_key);
    if (!data.is_available) {
      process.stderr.write(`${C.red}Balance unavailable.${C.reset} Check https://platform.deepseek.com\n`);
      process.exit(1);
    }

    // Update cache
    cfg.__cache = { ts: Date.now(), data };
    saveConfig(cfg);

    if (cmd === "full") {
      cmdFull(data);
    } else {
      cmdShort(data);
    }
  } catch (e) {
    // On error, try stale cache
    const cached = cfg.__cache;
    if (cached) {
      cmdShort(cached.data);
    } else {
      process.stderr.write(`${C.red}[ERR]${C.reset} ${e.message}\n`);
      process.exit(1);
    }
  }
}

main().catch((e) => { process.stderr.write(`${C.red}[ERR]${C.reset} ${e.message}\n`); process.exit(1); });
