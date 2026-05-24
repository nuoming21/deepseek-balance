#!/usr/bin/env python
"""Query DeepSeek API balance. Supports --short for status line, --full for detail."""
import os
import sys
import json
import time
import urllib.request
import urllib.error

# Force UTF-8 on Windows to avoid GBK encoding issues
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "config.json")
CACHE_FILE = os.path.join(SCRIPT_DIR, ".balance_cache.json")
CACHE_TTL = 300  # 5 minutes

API_URL = "https://api.deepseek.com/user/balance"

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def load_api_key():
    if not os.path.exists(CONFIG_FILE):
        print(f"{RED}Not logged in.{RESET} Run: python setup.py", file=sys.stderr)
        sys.exit(1)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        config = json.load(f)
    key = config.get("api_key", "")
    if not key:
        print(f"{RED}No API key found.{RESET} Run: python setup.py", file=sys.stderr)
        sys.exit(1)
    return key


def read_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
        if time.time() - cache.get("ts", 0) < CACHE_TTL:
            return cache.get("data")
    return None


def write_cache(data):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump({"ts": time.time(), "data": data}, f)


def query_balance(api_key):
    req = urllib.request.Request(API_URL)
    req.add_header("Accept", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}


def format_short(data):
    """Compact one-line output for status line."""
    if "error" in data:
        return f"DeepSeek: {data['error'][:20]}"
    if not data.get("is_available"):
        return "DeepSeek: N/A"
    info = data["balance_infos"][0]
    total = float(info["total_balance"])
    if total < 5:
        color = RED
    elif total < 20:
        color = YELLOW
    else:
        color = GREEN
    return f"DeepSeek {color}¥{total:.2f}{RESET}"


def format_full(data):
    """Detailed multi-line output."""
    if "error" in data:
        return f"{RED}[ERROR]{RESET} {data['error']}"
    if not data.get("is_available"):
        return f"{RED}[UNAVAILABLE]{RESET} Account balance not available."

    lines = [f"{BOLD}DeepSeek API Balance{RESET}"]
    for info in data.get("balance_infos", []):
        total = float(info["total_balance"])
        if total < 5:
            color = RED
        elif total < 20:
            color = YELLOW
        else:
            color = GREEN
        lines.append(f"  Total:     {color}¥{total:.2f} {info['currency']}{RESET}")
        lines.append(f"  Topped Up: ¥{info['topped_up_balance']} {info['currency']}")
        lines.append(f"  Granted:   ¥{info['granted_balance']} {info['currency']}")
    return "\n".join(lines)


def main():
    mode = "--short"
    if len(sys.argv) > 1 and sys.argv[1] == "--full":
        mode = "--full"

    # Try cache first for short mode
    if mode == "--short":
        cached = read_cache()
        if cached:
            print(format_short(cached))
            return

    api_key = load_api_key()
    data = query_balance(api_key)

    if mode == "--short":
        write_cache(data)
        print(format_short(data))
    else:
        # Full mode: always refresh
        write_cache(data)
        print(format_full(data))


if __name__ == "__main__":
    main()
