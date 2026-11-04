#!/data/data/com.termux/files/usr/bin/bash
# Repair a broken Termux Node.js environment without using node or npm.
# Safe for TOOSII-XD-ULTRA: it never removes .env, session/, data/, or logs/.
set -Eeuo pipefail

info() { printf '\n[termux-repair] %s\n' "$*"; }
warn() { printf '\n[termux-repair] WARNING: %s\n' "$*" >&2; }
die() { printf '\n[termux-repair] ERROR: %s\n' "$*" >&2; exit 1; }

if [[ "${PREFIX:-}" != /data/data/com.termux/files/usr* ]] && [[ "${TERMUX_VERSION:-}" == "" ]]; then
  die 'This script must be run inside Termux.'
fi

if [[ "$(uname -m)" != aarch64 && "$(uname -m)" != armv7l && "$(uname -m)" != armv8l ]]; then
  warn "Unexpected architecture: $(uname -m). Continuing, but use the official Termux build for your device."
fi

export DEBIAN_FRONTEND=noninteractive
# These variables can make Android/Termux load incompatible libraries.
unset LD_LIBRARY_PATH LD_PRELOAD

command -v apt >/dev/null 2>&1 || die 'apt was not found. Install the official Termux app from F-Droid or GitHub, not the Play Store build.'

info 'Checking Termux package database.'
apt update

if command -v dpkg >/dev/null 2>&1; then
  info 'Finishing any interrupted package configuration.'
  dpkg --configure -a || true
fi

info 'Repairing incomplete dependencies.'
apt --fix-broken install -y

info 'Upgrading all Termux packages together.'
apt full-upgrade -y

info 'Reinstalling Node.js LTS and its C++ runtime.'
apt install --reinstall nodejs-lts libc++ -y

hash -r 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  die 'Node.js is still unavailable. Run termux-info and check that the Termux repository is reachable.'
fi

if ! node --version; then
  die 'Node.js is still unable to start. Check LD_LIBRARY_PATH/LD_PRELOAD and run termux-info.'
fi

if ! command -v npm >/dev/null 2>&1; then
  die 'npm is still unavailable. Reinstall nodejs-lts from the official Termux repository.'
fi

npm --version

info 'Node.js environment repaired successfully.'
printf '%s\n' 'Next steps:'
printf '%s\n' '  cd ~/TOOSII-XD-ULTRA'
printf '%s\n' '  npm run deploy'
printf '%s\n' 'Your .env, session/, data/, and logs/ were not removed.'
