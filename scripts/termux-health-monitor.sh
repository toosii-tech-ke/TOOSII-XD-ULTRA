#!/data/data/com.termux/files/usr/bin/bash
# Keep TOOSII-XD-ULTRA running on Termux after unexpected crashes.
# Stop cleanly with Ctrl+C. This script never deletes bot state.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
MONITOR_LOG="$LOG_DIR/termux-health-monitor.log"
LOCK_DIR="$ROOT/.termux-health-monitor.lock"
MIN_BACKOFF="${TERMUX_MONITOR_MIN_BACKOFF:-5}"
MAX_BACKOFF="${TERMUX_MONITOR_MAX_BACKOFF:-60}"
STABLE_SECONDS="${TERMUX_MONITOR_STABLE_SECONDS:-300}"
REPAIR_ON_NODE_FAILURE="${TERMUX_MONITOR_REPAIR_NODE:-true}"
STOPPING=0
CHILD_PID=""

mkdir -p "$LOG_DIR"

log() {
  local line="[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*"
  printf '%s\n' "$line" | tee -a "$MONITOR_LOG"
}

cleanup() {
  STOPPING=1
  if [[ -n "$CHILD_PID" ]] && kill -0 "$CHILD_PID" 2>/dev/null; then
    log "Stopping bot process $CHILD_PID"
    kill -TERM "$CHILD_PID" 2>/dev/null || true
    wait "$CHILD_PID" 2>/dev/null || true
  fi
  rm -rf "$LOCK_DIR"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ "${PREFIX:-}" != /data/data/com.termux/files/usr* ]] && [[ "${TERMUX_VERSION:-}" == "" ]]; then
  log "ERROR: run this script inside Termux."
  exit 1
fi

if [[ -e "$LOCK_DIR/pid" ]]; then
  old_pid="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    log "Another health monitor is already running with PID $old_pid."
    exit 1
  fi
  rm -rf "$LOCK_DIR"
fi
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "ERROR: could not acquire the monitor lock."
  exit 1
fi
printf '%s\n' "$$" > "$LOCK_DIR/pid"

cd "$ROOT"
unset LD_LIBRARY_PATH LD_PRELOAD
log "Termux health monitor started for $ROOT"
log "Crash restart backoff: ${MIN_BACKOFF}s to ${MAX_BACKOFF}s; stable reset: ${STABLE_SECONDS}s"

backoff="$MIN_BACKOFF"
while (( STOPPING == 0 )); do
  if ! command -v node >/dev/null 2>&1 || ! node --version >/dev/null 2>&1; then
    log "Node.js cannot start."
    if [[ "$REPAIR_ON_NODE_FAILURE" == "true" && -x "$ROOT/scripts/repair-termux-node.sh" ]]; then
      log "Running the Termux Node.js repair script."
      bash "$ROOT/scripts/repair-termux-node.sh" >> "$MONITOR_LOG" 2>&1 || log "Node.js repair failed; retrying after backoff."
    fi
    sleep "$backoff"
    if (( backoff < MAX_BACKOFF )); then
      backoff=$((backoff * 2))
    fi
    continue
  fi

  started_at="$(date +%s)"
  run_log="$LOG_DIR/bot-$(date '+%Y%m%d-%H%M%S').log"
  log "Starting bot; output is also saved to $run_log"
  exit_code=0
  npm start >> "$run_log" 2>&1 &
  CHILD_PID=$!
  wait "$CHILD_PID" || exit_code=$?
  exit_code="${exit_code:-0}"
  CHILD_PID=""
  stopped_at="$(date +%s)"
  runtime=$((stopped_at - started_at))

  if (( STOPPING != 0 )); then
    break
  fi

  log "Bot stopped with exit code $exit_code after ${runtime}s. Restarting in ${backoff}s."
  if (( runtime >= STABLE_SECONDS )); then
    backoff="$MIN_BACKOFF"
    log "The previous run was stable; restart backoff reset to ${backoff}s."
  fi
  sleep "$backoff"
  if (( backoff < MAX_BACKOFF )); then
    backoff=$((backoff * 2))
  fi
done

log "Termux health monitor stopped."
