#!/usr/bin/env python
"""Intercept /deepseek-* commands. Block AI, show CLI output directly."""
import sys, json, subprocess, os

COMMANDS = {
    "/deepseek-balance": ["deepseek-balance", "full"],
    "/deepseek-token":   ["deepseek-balance", "token"],
    "/deepseek-interval": ["deepseek-balance", "interval"],
}

def main():
    try:
        data = json.load(sys.stdin)
        prompt = data.get("user_prompt", "").strip()
    except:
        sys.exit(0)

    if not prompt.startswith("/deepseek-"):
        sys.exit(0)

    # Parse command and args: "/deepseek-token sk-xxx" → cmd=/deepseek-token, args=["sk-xxx"]
    parts = prompt.split(maxsplit=1)
    cmd = parts[0]
    extra_arg = parts[1] if len(parts) > 1 else None

    if cmd not in COMMANDS:
        sys.exit(0)

    cli_args = list(COMMANDS[cmd])
    if extra_arg:
        cli_args.append(extra_arg)

    try:
        result = subprocess.run(cli_args, capture_output=True, text=True, timeout=10)
        output = (result.stdout + result.stderr).strip()
        if output:
            print(output, file=sys.stderr)
        sys.exit(2)  # Block AI
    except subprocess.TimeoutExpired:
        print("DeepSeek: request timed out", file=sys.stderr)
        sys.exit(2)
    except FileNotFoundError:
        print("deepseek-balance CLI not found. npm install -g nuoming21/deepseek-balance", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
