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

This is the **deployment launcher** for TOOSII-XD-ULTRA. Instead of downloading the full bot source, you deploy this lightweight launcher — it does the rest:

- 📡 **Fetches the latest runtime** from the Toosii Tech distribution API on every start
- 🔄 **Self-updating** — new bot versions arrive automatically, no manual redeploys
- 🔐 **Keeps your data safe** — session, `.env`, data and logs survive every update untouched
- ⚡ **One command to run** — `node index.js` (or `node launcher.js` — both work)

> 💡 The launcher pairs with the [Session Generator](https://toosiitechdevelopertools.zone.id/session) — pair your WhatsApp account in the browser and paste the `TOOSII-XD:...` string into `.env`.

---

## 🚀 Deploy

### 📱 Termux — one copy-paste setup

Open **Termux** from the official [F-Droid](https://f-droid.org/packages/com.termux/) build, paste the complete command below, and enter the WhatsApp owner number when prompted. Use the international format with digits only — for example `254712345678` — and do not include `+` or spaces.

```bash
pkg update -y && pkg install -y git nodejs-lts unzip && if [ -d "$HOME/TOOSII-XD-ULTRA/.git" ]; then cd "$HOME/TOOSII-XD-ULTRA" && git pull --ff-only; else git clone --depth=1 https://github.com/toosii-tech-ke/TOOSII-XD-ULTRA.git "$HOME/TOOSII-XD-ULTRA" && cd "$HOME/TOOSII-XD-ULTRA"; fi && OWNER_NUMBER=""; while [ -z "$OWNER_NUMBER" ]; do printf 'WhatsApp owner number (country code + number, digits only): '; read -r OWNER_NUMBER; OWNER_NUMBER="$(printf '%s' "$OWNER_NUMBER" | tr -cd '0-9')"; done; sed -i "s/^OWNER_NUMBER=.*/OWNER_NUMBER=$OWNER_NUMBER/" .env && npm run deploy
```

This command safely updates an existing checkout, installs the Termux prerequisites, writes `OWNER_NUMBER` into the local `.env`, installs the bot dependencies, downloads the latest signed runtime bundle, and starts the launcher. Your `session/`, `data/`, and `logs/` folders remain in the project directory between updates.

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
<summary><strong>2 — No QR code or pairing code appears</strong></summary>

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

</details>

**Still stuck?** Share the relevant lines from `logs/auth-start.log` or `logs/auth-recovery.log`, but remove `SESSION_ID`, phone numbers, cookies, and private tokens before sharing.

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

**484 commands across 15 categories** — downloads, AI, group moderation, stickers, games, economy, guards and more.

Run `.menu` inside WhatsApp to see the full, always-current list.

| Category | Highlights |
|---|---|
| ⬇️ Downloads | `.play`, `.ytv`, TikTok, Instagram, MediaFire |
| 🤖 AI | `.ai`, `.gpt`, `.gemini`, `.deepseek` |
| 🛡️ Guards | Anti-link, anti-spam, anti-badword, anti-delete |
| 👑 Groups | `.ban`, `.warn`, `.hidetag`, `.poll`, welcome/goodbye |
| 🎨 Media | Sticker packs, logo maker, audio FX |
| 🎮 Fun | Wordle, blackjack, slots, wallets & leaderboards |

---

<div align="center">

### ⭐ Support the project

If TOOSII-XD-ULTRA helps you, **star this repo** — it genuinely helps others find it.

**🌐 [toosiitech.org](https://www.toosiitech.org/)** · Session generator: [toosiitechdevelopertools.zone.id/session](https://toosiitechdevelopertools.zone.id/session)

</div>
