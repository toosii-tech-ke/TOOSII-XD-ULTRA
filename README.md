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
