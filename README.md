<div align="center">

<img src="media/bot-logo.jpg" width="220" alt="TOOSII-XD-ULTRA logo"/>

# ᴛᴏᴏsɪɪ-xᴅ-ᴜʟᴛʀᴀ

**The official launcher for the TOOSII-XD-ULTRA WhatsApp bot — one command, always up to date.**

`WhatsApp Bot` · `Baileys` · `Node.js 20+` · `Multi-Device` · `Self-Hosted`

[![Deploy](https://img.shields.io/badge/Deploy-Heroku-430098?logo=heroku&logoColor=white)](#-deploy)
[![Deploy](https://img.shields.io/badge/Panel-Koyeb%20%7C%20Railway%20%7C%20Render%20%7C%20KataBump-2EA043)](#-deploy)
[![Platform](https://img.shields.io/badge/Runtime-Docker%20%7C%20VPS%20%7C%20Termux-2496ED)](#-deploy)
[![Website](https://img.shields.io/badge/🌐_Website-toosiitech.org-8B5CF6)](https://www.toosiitech.org/)

</div>

---

## ✨ What is this repo?

This is the **production deployment launcher** for TOOSII-XD-ULTRA, a self-hosted, multi-device WhatsApp automation platform. Instead of downloading the full private bot source, you deploy this lightweight launcher — it securely retrieves and runs the latest published runtime for you:

- 📡 **Fetches the latest runtime** from the Toosii Tech distribution API on every start
- 🔄 **Self-updating** — new bot versions arrive automatically, no manual redeploys
- 🔐 **Keeps your data safe** — session, `.env`, data and logs survive every update untouched
- ⚡ **One command to run** — `node index.js` (or `node launcher.js` — both work)
- 🧩 **Professional automation** — configurable developer reactions, status tools, moderation, media, AI, and group utilities

> 💡 The launcher pairs with the [Session Generator](https://toosiitechdevelopertools.zone.id/session) — pair your WhatsApp account in the browser and paste the `TOOSII-XD:...` string into `.env`.

---

## 🚀 Deploy

### 📱 Termux — easiest copy-paste setup

Open **Termux** from the official [F-Droid](https://f-droid.org/packages/com.termux/) build and paste this **one command**. It installs the tools, downloads the public launcher, repairs the Termux Node.js linker problem if necessary, and opens the setup wizard:

```bash
pkg update -y && pkg install -y git curl unzip && if [ -d "$HOME/TOOSII-XD-ULTRA/.git" ]; then cd "$HOME/TOOSII-XD-ULTRA" && git pull --ff-only; else git clone --depth=1 https://github.com/toosii-tech-ke/TOOSII-XD-ULTRA.git "$HOME/TOOSII-XD-ULTRA" && cd "$HOME/TOOSII-XD-ULTRA"; fi && bash scripts/repair-termux-node.sh && bash scripts/setup-termux.sh
```

When the wizard asks for the owner number, enter the country code and number with digits only. Example: `254712345678`. Do not type `+`, spaces, or brackets. When it asks for `SESSION_ID`, press **Enter** to use phone-number pairing, or paste a session string without showing it to anyone.

The wizard can start the bot with automatic crash recovery. If you choose not to start it immediately, run:

```bash
cd ~/TOOSII-XD-ULTRA && bash scripts/termux-health-monitor.sh
```

Your `.env`, `session/`, `data/`, and `logs/` remain in the public launcher folder. The launcher downloads the current obfuscated runtime bundle published from the private source repository.

**First pairing:** leave `SESSION_ID=` empty in `.env`. When the launcher prints a pairing code, open **WhatsApp → Linked devices → Link with phone number** on the owner phone and enter the code. Alternatively, generate a session at the [Toosii Session Generator](https://toosiitechdevelopertools.zone.id/session) and paste it into `.env` as `SESSION_ID=TOOSII-XD:...` before running the command.

**Keep Termux alive:** Android may stop background processes. Run `termux-wake-lock` before starting it, disable battery optimization for Termux in Android settings, and keep the Termux notification active.

**If you already configured the bot:** run `cd ~/TOOSII-XD-ULTRA && npm start` to start it again without changing your `.env`.

### 🔧 Forgot `OWNER_NUMBER` or need to change it?

No reinstall is needed. Stop the running bot with **Ctrl+C**, then paste this recovery command in Termux. It creates the setting if it is missing, replaces it if it is wrong, and starts the bot again:

```bash
cd ~/TOOSII-XD-ULTRA && OWNER_NUMBER=""; while [ -z "$OWNER_NUMBER" ]; do printf 'Correct WhatsApp owner number (country code + number, digits only): '; read -r OWNER_NUMBER; OWNER_NUMBER="$(printf '%s' "$OWNER_NUMBER" | tr -cd '0-9')"; done; if grep -q '^OWNER_NUMBER=' .env; then sed -i "s/^OWNER_NUMBER=.*/OWNER_NUMBER=$OWNER_NUMBER/" .env; else printf '\nOWNER_NUMBER=%s\n' "$OWNER_NUMBER" >> .env; fi; printf 'Saved owner number: '; grep '^OWNER_NUMBER=' .env; npm start
```

The number must use international digits only, such as `254712345678` — no `+`, spaces, or brackets. This does **not** delete `SESSION_ID`, `session/`, `data/`, or `logs/`, so an existing WhatsApp session normally remains connected. If the bot asks for pairing again, use the displayed code from **WhatsApp → Linked devices → Link with phone number**.

For manual editing instead, run `nano ~/TOOSII-XD-ULTRA/.env`, change the line to `OWNER_NUMBER=254712345678`, save with **Ctrl+O**, press **Enter**, exit with **Ctrl+X**, and start with `cd ~/TOOSII-XD-ULTRA && npm start`.

### 🧭 Interactive authentication troubleshooting

Use this guide when the bot reports a session error, starts without showing a QR/pairing code, disconnects immediately, or refuses a new authentication attempt. First stop the bot with **Ctrl+C** and run:

```bash
cd ~/TOOSII-XD-ULTRA
printf '%s\n' 'Configured values (SESSION_ID is intentionally hidden):'
grep -E '^(OWNER_NUMBER|SESSION_ID)=' .env | sed 's/^SESSION_ID=.*/SESSION_ID=<configured-or-empty>/'
printf '%s\n' '' 'Choose the problem:' '  1) Invalid or expired SESSION_ID' '  2) No QR or pairing code appears' '  3) QR/pairing code appeared but authentication failed' '  4) Bot connects, then disconnects' '  5) Release, unzip, or network error' 'Choice [1-5]:'
read -r AUTH_PROBLEM
```

Choose the matching path below.

<details>
<summary><strong>1 — Invalid, expired, or rejected SESSION_ID</strong></summary>

Do not paste the session string into a public issue or chat. Back up the current configuration, clear only the session value and local authentication state, then start a fresh pairing:

```bash
cp .env ".env.backup.$(date +%Y%m%d-%H%M%S)"
if grep -q '^SESSION_ID=' .env; then sed -i 's/^SESSION_ID=.*/SESSION_ID=/' .env; else printf '\nSESSION_ID=\n' >> .env; fi
rm -rf session
mkdir -p logs
npm start 2>&1 | tee logs/auth-recovery.log
```

When the new pairing code appears, link the owner phone through **WhatsApp → Linked devices → Link with phone number**. This keeps `OWNER_NUMBER`, `data/`, and `logs/` intact.

</details>

<details>
<summary><strong>2 — No QR or pairing code appears</strong></summary>

This launcher is primarily configured for WhatsApp **phone-number pairing**, so the normal output may be a pairing code rather than a QR image. Check the prerequisites and start the launcher in the foreground so the message cannot be missed:

```bash
node --version
command -v unzip
grep '^OWNER_NUMBER=' .env
mkdir -p logs
npm start 2>&1 | tee logs/auth-start.log
```

If `OWNER_NUMBER` is empty or still contains `2547XXXXXXXX`, use the [owner-number recovery command](#-forgot-owner_number-or-need-to-change-it) first. If the terminal is being suspended by Android, run `termux-wake-lock`, disable Termux battery optimization, and start again.

</details>

<details>
<summary><strong>3 — QR/pairing code appears but authentication fails</strong></summary>

Generate a fresh code instead of reusing an old one. Codes expire quickly. Keep the owner phone online, open **WhatsApp → Linked devices → Link with phone number**, enter the newest code exactly once, and do not close Termux while WhatsApp is processing it. If it fails twice, run the clean reset under **1** and generate one new code.

</details>

<details>
<summary><strong>4 — Bot connects, then disconnects or says logged out</strong></summary>

First restart without deleting `session/`. If it still logs out, the local authentication state may be revoked or corrupted; use the clean reset under **1**. Do not delete `data/` or `.env`, because they are not required for a normal authentication reset.

```bash
mkdir -p logs
npm start 2>&1 | tee logs/restart.log
```

</details>

<details>
<summary><strong>5 — Release, unzip, or network error</strong></summary>

Confirm Termux can reach GitHub and that the required tools are installed:

```bash
pkg install -y git nodejs-lts unzip
curl -I --max-time 20 https://api.github.com/repos/toosii-tech-ke/TOOSII-XD-ULTRA/releases/latest
npm run deploy
```

The launcher downloads the latest runtime release and verifies its SHA-256 checksum. If GitHub is temporarily unavailable, retry later. Do not download a random ZIP from an unofficial mirror.

On shared panels, the launcher intentionally installs npm packages with lifecycle scripts disabled. This prevents an old nested native package such as `wa-sticker-formatter`'s `sharp` from trying to compile with an incompatible panel Node version. The launcher then performs a best-effort native-module check; a failed optional image module must not prevent the WhatsApp bot from starting.

</details>

**Still stuck?** Share the relevant lines from `logs/auth-start.log` or `logs/auth-recovery.log`, but remove `SESSION_ID`, phone numbers, cookies, and private tokens before sharing.

### 🩺 Termux Node.js linker repair

If Termux shows an error such as:

```text
CANNOT LINK EXECUTABLE "node": cannot locate symbol ...
```

Node.js is broken before the bot can even start. This is usually caused by a partial Termux upgrade or incompatible library environment. It is **not** a `SESSION_ID` error. Stop the bot and run the repair script below. It uses Bash and `apt`, so it works even when `node` and `npm` cannot run:

```bash
cd ~/TOOSII-XD-ULTRA && bash scripts/repair-termux-node.sh
```

The script unsets incompatible `LD_LIBRARY_PATH` and `LD_PRELOAD` values, finishes interrupted package configuration, repairs dependencies, upgrades Termux packages together, reinstalls `nodejs-lts` and `libc++`, and verifies `node --version` and `npm --version`. It never removes `.env`, `SESSION_ID`, `OWNER_NUMBER`, `session/`, `data/`, or `logs/`.

If the repository is not available locally, download and run the repair script directly from the public repository:

```bash
curl -fsSL https://raw.githubusercontent.com/toosii-tech-ke/TOOSII-XD-ULTRA/main/scripts/repair-termux-node.sh | bash
```

After the repair succeeds, return to the bot directory and deploy:

```bash
cd ~/TOOSII-XD-ULTRA
npm run deploy
```

#### Manual linker repair commands

If you prefer to run the commands manually, use this sequence in Termux:

```bash
cd ~/TOOSII-XD-ULTRA
unset LD_LIBRARY_PATH
unset LD_PRELOAD
apt update
dpkg --configure -a || true
apt --fix-broken install -y
apt full-upgrade -y
apt install --reinstall nodejs-lts libc++ -y
hash -r
node --version
npm --version
npm run deploy
```

If `node` still cannot start, collect diagnostics without sharing secrets:

```bash
termux-info
printf 'LD_LIBRARY_PATH=%s\n' "$LD_LIBRARY_PATH"
printf 'LD_PRELOAD=%s\n' "$LD_PRELOAD"
```

Do not delete the bot directory or reinstall Termux until the repair path has been tried. If a full Termux reinstall becomes necessary, back up `.env`, `session/`, `data/`, and `logs/` first.

### 🧰 One-click Termux setup wizard

Use the interactive wizard to configure the owner number, optional `SESSION_ID`, bot name, and command prefix without editing `.env` manually:

```bash
cd ~/TOOSII-XD-ULTRA
bash scripts/setup-termux.sh
```

The wizard backs up the current `.env`, validates the owner number, hides the session input while you paste it, preserves existing values when you press Enter, creates the required state directories, and can start the bot through the health monitor when setup is complete. It does not print or expose the session ID.

If you do not have the repository yet, clone it first:

```bash
git clone --depth=1 https://github.com/toosii-tech-ke/TOOSII-XD-ULTRA.git ~/TOOSII-XD-ULTRA
cd ~/TOOSII-XD-ULTRA
bash scripts/setup-termux.sh
```

### ♻️ Termux health monitor and automatic restart

Start the bot under the monitor after configuration:

```bash
cd ~/TOOSII-XD-ULTRA
bash scripts/termux-health-monitor.sh
```

The monitor restarts the bot when the launcher exits unexpectedly, waits progressively longer after repeated crashes, resets the delay after a stable run, records each bot run under `logs/bot-YYYYMMDD-HHMMSS.log`, and writes monitor events to `logs/termux-health-monitor.log`. It allows only one monitor instance at a time and forwards **Ctrl+C** so the bot can be stopped intentionally.

If Node.js itself is broken, the monitor automatically attempts `scripts/repair-termux-node.sh` before retrying. Disable that behavior for manual repair with:

```bash
TERMUX_MONITOR_REPAIR_NODE=false bash scripts/termux-health-monitor.sh
```

Optional tuning variables are `TERMUX_MONITOR_MIN_BACKOFF` (default `5` seconds), `TERMUX_MONITOR_MAX_BACKOFF` (default `60` seconds), and `TERMUX_MONITOR_STABLE_SECONDS` (default `300` seconds). The monitor never deletes `.env`, `session/`, `data/`, or `logs/`.

1. **Upload** this repo as a ZIP to your hosting panel (KataBump, Render, Koyeb, Railway, Heroku, a VPS, or Termux)
2. **Edit the included `.env`** — fill in `OWNER_NUMBER` (+ `SESSION_ID`, or leave empty to pair via console code)
3. **Install & start:**
   ```bash
   npm run deploy
   ```
4. **Pair** — enter the pairing code shown in the console on your phone via **WhatsApp → Linked devices → Link with phone number**

**Panel start command:** `node index.js` (or `npm start`). If your panel auto-detects the entry file, either `index.js` or `launcher.js` works — they're the same bot.

The bot starts and stays current from here on — the launcher handles the rest.

---

## 💬 Commands

**500+ commands across 15 categories** — downloads, AI, group moderation, stickers, games, economy, guards and more.

Run `.menu` inside WhatsApp to see the full, always-current list.

| Category | Highlights |
|---|---|
| ⬇️ Downloads | `.play`, `.ytv`, TikTok, Instagram, MediaFire |
| 🤖 AI | `.ai`, `.gpt`, `.gemini`, `.deepseek` |
| 🛡️ Guards | Anti-link, anti-spam, anti-badword, anti-delete |
| 👑 Groups | `.ban`, `.warn`, `.hidetag`, `.poll`, welcome/goodbye |
| 🎨 Media | Sticker packs, logo maker, audio FX |
| 🎮 Fun | Wordle, blackjack, slots, wallets & leaderboards |

### ⚙️ Developer reaction scopes

The owner-only `.reactdev` automation can react to trusted developer messages with a configurable emoji. Choose whether it runs in every chat, private DMs only, or groups only:

```text
.reactdev global on       # Enable in DMs and groups
.reactdev global off      # Disable global mode
.reactdev dms on          # Enable in private chats only
.reactdev dms off
.reactdev groups on       # Enable in groups only
.reactdev groups off
.reactdev emoji 🔥         # Change the reaction emoji
.reactdev                 # Show the current state and scope
```

For compatibility, `.reactdev on` still enables global mode and `.reactdev off` disables the automation. Only configured developer contacts can trigger these reactions; ordinary users are never auto-reacted to by this feature.

---

<div align="center">

### ⭐ Support the project

If TOOSII-XD-ULTRA helps you, **star this repo** — it genuinely helps others find it.

**🌐 [toosiitech.org](https://toosiitech.org/)** · Session generator: [toosiitechdevelopertools.zone.id/session](https://toosiitechdevelopertools.zone.id/session)

</div>
