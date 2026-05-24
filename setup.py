#!/usr/bin/env python
"""Interactive setup: login to DeepSeek, validate API key, save config."""
import os
import sys
import json
import getpass
import urllib.request
import urllib.error

# Force UTF-8 on Windows to avoid GBK encoding issues
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")
API_URL = "https://api.deepseek.com/user/balance"

RED = "\033[91m"
GREEN = "\033[92m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_config(api_key):
    config = {"api_key": api_key}
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    os.chmod(CONFIG_FILE, 0o600)


def test_api_key(api_key):
    """Validate the API key by calling the balance endpoint."""
    req = urllib.request.Request(API_URL)
    req.add_header("Accept", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return None
        body = e.read().decode("utf-8", errors="replace")
        print(f"\n{RED}[HTTP {e.code}]{RESET} {body}")
        return None
    except urllib.error.URLError as e:
        print(f"\n{RED}[NETWORK ERROR]{RESET} {e.reason}")
        return None


def main():
    print(f"{BOLD}DeepSeek API Balance — Setup{RESET}\n")

    existing = load_config()
    if existing.get("api_key"):
        masked = existing["api_key"][:8] + "****" + existing["api_key"][-4:]
        print(f"Existing API key found: {masked}")
        choice = input("Replace it? [y/N]: ").strip().lower()
        if choice != "y":
            print("Keeping existing key. Run again to change.")
            return

    print("Get your API key at: https://platform.deepseek.com/api_keys")
    print()
    api_key = getpass.getpass("Paste your DeepSeek API Key (sk-...): ").strip()

    if not api_key:
        print(f"{RED}[ERROR]{RESET} API key cannot be empty.")
        sys.exit(1)

    if not api_key.startswith("sk-"):
        print(f"{RED}[WARNING]{RESET} API key should start with 'sk-'. Continue anyway? [y/N]: ", end="")
        if input().strip().lower() != "y":
            sys.exit(1)

    print(f"\n{CYAN}Validating API key...{RESET}")
    result = test_api_key(api_key)

    if result is None:
        print(f"{RED}[FAILED]{RESET} Invalid API key or network error.")
        print("Check your key at https://platform.deepseek.com/api_keys")
        sys.exit(1)

    save_config(api_key)
    print(f"{GREEN}[OK]{RESET} API key verified and saved.")

    # Show current balance
    if result.get("is_available"):
        for info in result.get("balance_infos", []):
            print(f"\n{BOLD}Current Balance:{RESET}")
            print(f"  Total:     {GREEN}¥{info['total_balance']} {info['currency']}{RESET}")
            print(f"  Topped Up: ¥{info['topped_up_balance']} {info['currency']}")
            print(f"  Granted:   ¥{info['granted_balance']} {info['currency']}")
    else:
        print(f"\n{RED}[WARNING]{RESET} Account balance is not available.")


if __name__ == "__main__":
    main()
