#!/usr/bin/env node
"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

// ── Config ──────────────────────────────────────────────
const CONFIG_FILE = path.join(os.homedir(), ".deepseek-balance.json");
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

function getCacheTTL(cfg) {
  return (cfg && cfg.cache_minutes != null) ? cfg.cache_minutes * 60 * 1000 : 5 * 60 * 1000;
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
  if (!trimmed) { console.error(`${C.red}[ERROR]${C.reset} API key cannot be empty.`); process.exit(1); }

  process.stdout.write(`${C.cyan}Validating...${C.reset} `);
  try {
    const data = await apiGet(trimmed);
    if (!data.is_available) { console.log(`\n${C.red}[FAILED]${C.reset} Key works but balance unavailable.`); process.exit(1); }
    const cfg = loadConfig() || {};
    cfg.api_key = trimmed;
    cfg.__cache = { ts: Date.now(), data };
    saveConfig(cfg);
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

function cmdToken() {
  const key = process.argv[3];
  if (key) {
    // Set token directly (non-interactive)
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-")) { console.error(`${C.red}[WARN]${C.reset} Key should start with 'sk-', but accepted.`); }
    const cfg = loadConfig() || {};
    cfg.api_key = trimmed;
    delete cfg.__cache;
    saveConfig(cfg);
    console.log(`${C.green}Token saved.${C.reset}`);
  } else {
    // Show token status
    const cfg = loadConfig();
    if (!cfg || !cfg.api_key) {
      console.log(`${C.red}No token set.${C.reset} Use: ${C.bold}deepseek-balance token sk-xxx${C.reset}`);
    } else {
      const masked = cfg.api_key.slice(0, 8) + "****" + cfg.api_key.slice(-4);
      console.log(`Token: ${C.green}${masked}${C.reset}`);
    }
  }
}

function cmdCache() {
  const arg = process.argv[3];
  const cfg = loadConfig() || {};
  if (arg === "off") {
    cfg.cache_minutes = 0;
    saveConfig(cfg);
    console.log(`Cache: ${C.yellow}OFF${C.reset}`);
  } else if (arg && /^\d+$/.test(arg)) {
    const mins = parseInt(arg, 10);
    cfg.cache_minutes = mins;
    saveConfig(cfg);
    console.log(`Cache TTL: ${C.green}${mins} min${C.reset}`);
  } else {
    const ttl = cfg.cache_minutes != null ? cfg.cache_minutes : 5;
    console.log(`Cache TTL: ${ttl} min`);
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

// ── Help ─────────────────────────────────────────────────

function showHelp() {
  console.log(`
${C.bold}deepseek-balance${C.reset} — Check DeepSeek API account balance

${C.bold}Usage:${C.reset}
  ${C.cyan}deepseek-balance${C.reset}               Compact balance (for status line)
  ${C.cyan}deepseek-balance full${C.reset}            Detailed balance view
  ${C.cyan}deepseek-balance login${C.reset}           Interactive login
  ${C.cyan}deepseek-balance token${C.reset}           Show current token (masked)
  ${C.cyan}deepseek-balance token <sk-xxx>${C.reset}  Set token directly
  ${C.cyan}deepseek-balance cache${C.reset}           Show cache setting
  ${C.cyan}deepseek-balance cache <N>${C.reset}       Set cache TTL (minutes)
  ${C.cyan}deepseek-balance cache off${C.reset}       Disable cache

${C.bold}Examples:${C.reset}
  $ deepseek-balance
  DeepSeek ¥45.30

  $ deepseek-balance token sk-a1b2c3d4...
  Token saved.

  $ deepseek-balance cache 10
  Cache TTL: 10 min

${C.bold}Claude Code status line:${C.reset}
  { "statusLine": { "type": "command", "command": "deepseek-balance" } }
`);
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] || "status";

  if (cmd === "--help" || cmd === "-h" || cmd === "help") { showHelp(); return; }
  if (cmd === "token") { cmdToken(); return; }
  if (cmd === "login") { await cmdLogin(); return; }
  if (cmd === "cache") { cmdCache(); return; }

  // ── Balance queries below ──
  const cfg = loadConfig();
  if (!cfg || !cfg.api_key) {
    console.error(`${C.red}No token.${C.reset} Run: ${C.bold}deepseek-balance token sk-xxx${C.reset}`);
    process.exit(1);
  }

  const cacheTTL = getCacheTTL(cfg);

  // Try cache for default/status
  if (cmd === "status" || cmd === "short" || !cmd) {
    const cached = cfg.__cache;
    if (cacheTTL > 0 && cached && Date.now() - cached.ts < cacheTTL) {
      cmdShort(cached.data);
      return;
    }
  }

  try {
    const data = await apiGet(cfg.api_key);
    if (!data.is_available) {
      process.stderr.write(`${C.red}Balance unavailable.${C.reset} https://platform.deepseek.com\n`);
      process.exit(1);
    }
    cfg.__cache = { ts: Date.now(), data };
    saveConfig(cfg);

    if (cmd === "full") { cmdFull(data); }
    else { cmdShort(data); }
  } catch (e) {
    const cached = cfg.__cache;
    if (cached) { cmdShort(cached.data); }
    else { process.stderr.write(`${C.red}[ERR]${C.reset} ${e.message}\n`); process.exit(1); }
  }
}

main().catch((e) => { process.stderr.write(`${C.red}[ERR]${C.reset} ${e.message}\n`); process.exit(1); });
