#!/data/data/com.termux/files/usr/bin/bash
# Interactive first-run configuration wizard for TOOSII-XD-ULTRA.
# This script uses Bash only and can run before Node.js is installed or repaired.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

info() { printf '\n[setup] %s\n' "$*"; }
warn() { printf '\n[setup] WARNING: %s\n' "$*" >&2; }
die() { printf '\n[setup] ERROR: %s\n' "$*" >&2; exit 1; }

if [[ "${PREFIX:-}" != /data/data/com.termux/files/usr* ]] && [[ "${TERMUX_VERSION:-}" == "" ]]; then
  die 'Run this wizard inside Termux.'
fi

cd "$ROOT"
mkdir -p "$ROOT/logs" "$ROOT/data" "$ROOT/session"

if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<'EOF'
# TOOSII-XD-ULTRA configuration
OWNER_NUMBER=
SESSION_ID=
BOT_NAME=TOOSII-XD-ULTRA
PREFIX=.
EOF
else
  cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d-%H%M%S)"
fi

get_value() {
  local key="$1"
  awk -v prefix="$key=" 'index($0, prefix) == 1 { sub(/^[^=]*=/, ""); print; exit }' "$ENV_FILE" 2>/dev/null || true
}

set_value() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp "$ENV_FILE.XXXXXX")"
  awk -v prefix="$key=" -v replacement="$key=$value" '
    index($0, prefix) == 1 { print replacement; found=1; next }
    { print }
    END { if (!found) print replacement }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
}

current_owner="$(get_value OWNER_NUMBER)"
[[ "$current_owner" == 2547XXXXXXXX ]] && current_owner=""
current_owner="$(printf '%s' "$current_owner" | tr -cd '0-9')"
while :; do
  prompt="WhatsApp owner number"
  [[ -n "$current_owner" ]] && prompt="$prompt [$current_owner]"
  printf '%s: ' "$prompt"
  read -r owner_input
  owner_input="$(printf '%s' "$owner_input" | tr -cd '0-9')"
  owner_input="${owner_input:-$current_owner}"
  if [[ "$owner_input" =~ ^[0-9]{7,15}$ ]]; then
    OWNER_NUMBER="$owner_input"
    break
  fi
  warn 'Enter 7–15 digits in international format, for example 254712345678. Do not use +, spaces, or brackets.'
done

current_session="$(get_value SESSION_ID)"
printf 'Session ID [press Enter to keep the current value or leave empty for phone pairing]: '
read -r -s session_input
printf '\n'
SESSION_ID="${session_input:-$current_session}"

current_name="$(get_value BOT_NAME)"
current_name="${current_name:-TOOSII-XD-ULTRA}"
printf 'Bot name [%s]: ' "$current_name"
read -r bot_name
BOT_NAME="${bot_name:-$current_name}"
BOT_NAME="${BOT_NAME//$'\n'/}"

current_prefix="$(get_value PREFIX)"
current_prefix="${current_prefix:-.}"
printf 'Command prefix [%s]: ' "$current_prefix"
read -r prefix
PREFIX="${prefix:-$current_prefix}"
[[ "${#PREFIX}" -eq 1 ]] || { warn 'Prefix must be one character; using .'; PREFIX='.'; }

set_value OWNER_NUMBER "$OWNER_NUMBER"
set_value SESSION_ID "$SESSION_ID"
set_value BOT_NAME "$BOT_NAME"
set_value PREFIX "$PREFIX"

printf '\n[setup] Configuration saved to %s\n' "$ENV_FILE"
printf '%s\n' "  OWNER_NUMBER=$OWNER_NUMBER" "  SESSION_ID=<hidden>" "  BOT_NAME=$BOT_NAME" "  PREFIX=$PREFIX"

if ! command -v node >/dev/null 2>&1 || ! node --version >/dev/null 2>&1; then
  warn 'Node.js is not ready in this Termux environment.'
  if [[ -x "$ROOT/scripts/repair-termux-node.sh" ]]; then
    printf 'Run the Node.js repair now? [Y/n]: '
    read -r repair_answer
    if [[ ! "$repair_answer" =~ ^[Nn]$ ]]; then
      bash "$ROOT/scripts/repair-termux-node.sh"
    else
      printf '%s\n' 'Run later: bash scripts/repair-termux-node.sh'
    fi
  fi
fi

if command -v npm >/dev/null 2>&1 && npm --version >/dev/null 2>&1; then
  printf 'Start the bot with the health monitor now? [Y/n]: '
  read -r start_answer
  if [[ ! "$start_answer" =~ ^[Nn]$ ]]; then
    exec bash "$ROOT/scripts/termux-health-monitor.sh"
  fi
fi

printf '\nNext steps:\n'
printf '%s\n' '  npm run deploy'
printf '%s\n' '  bash scripts/termux-health-monitor.sh'
printf '%s\n' 'Your existing session/, data/, logs/, and other .env values were preserved.'
