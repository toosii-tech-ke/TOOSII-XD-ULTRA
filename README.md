<div align="center">

<img src="media/bot-logo.jpg" width="180" alt="TOOSII-XD-ULTRA logo"/>

# TOOSII-XD-ULTRA

**A multi-platform, self-hosted WhatsApp automation bot powered by Baileys.**

Railway · Render · Heroku · VPS · Docker · Hosting Panels · Termux

[![Deploy](https://img.shields.io/badge/Deploy-Railway%20%7C%20Render%20%7C%20Heroku-2EA043)](#-cloud-deployment)
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%2020%2B-339933?logo=node.js&logoColor=white)](#-requirements)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Multi--Device-25D366?logo=whatsapp&logoColor=white)](#-what-you-get)
[![Website](https://img.shields.io/badge/Website-toosiitech.org-8B5CF6)](https://www.toosiitech.org/)

</div>

---

## ✨ What you get

TOOSII-XD-ULTRA is a self-updating WhatsApp bot launcher with 500+ commands across AI, media downloads, stickers, groups, moderation, games, utilities, and automation.

- Self-updating runtime from the Toosii Tech distribution service
- Multi-device WhatsApp support through Baileys
- AI, TikTok/Instagram/Facebook/YouTube media tools, stickers, and group management
- Works on cloud workers, VPS/Docker, shared panels, Linux, and Android Termux
- `.env`, session, and data files are preserved by the launcher where storage is available

## ✅ Requirements

- Node.js 20 or newer
- A WhatsApp account for pairing
- `OWNER_NUMBER` with country code and digits only, for example `254712345678`
- Git, if deploying from source

## 🚀 Cloud deployment

For Railway, Render, and Heroku, deploy this repository as a **worker/background service**, not a serverless function.

### Common environment variables

Add these in the platform dashboard. Never commit `.env`, session strings, or API keys.

```text
OWNER_NUMBER=254712345678
SESSION_ID=TOOSII-XD:your-session-string
PREFIX=.
```

`SESSION_ID` is recommended on ephemeral cloud filesystems. Generate one with the [Toosii Session Generator](https://toosiitechdevelopertools.zone.id/session). If you use persistent storage, the bot can also pair from the service logs.

| Platform | Service type | Build command | Start command |
|---|---|---|---|
| [Railway](https://railway.app/) | Worker service | Automatic | `npm start` |
| [Render](https://render.com/) | Background Worker | `npm run deploy` | `npm start` |
| [Heroku](https://www.heroku.com/) | Worker dyno | Automatic | `npm start` |

### Railway

Create a project from GitHub, select `toosii-tech-ke/TOOSII-XD-ULTRA`, add the environment variables, and deploy the `main` branch. Use a Railway Volume for persistent files, or use `SESSION_ID` for ephemeral deployments.

### Render

Create **New → Background Worker**, connect the repository, set the build and start commands from the table, add the environment variables, and monitor the worker logs for pairing and connection status.

### Heroku

Connect the repository under **Deploy → GitHub**, add the Config Vars, and run the app as a worker with `npm start`. Heroku’s filesystem is ephemeral, so use a generated `SESSION_ID` rather than relying on local session files.

## 📱 Termux

Paste this command in Termux:

```bash
pkg update -y && pkg install -y git curl unzip && if [ -d "$HOME/TOOSII-XD-ULTRA/.git" ]; then cd "$HOME/TOOSII-XD-ULTRA" && git pull --ff-only; else git clone --depth=1 https://github.com/toosii-tech-ke/TOOSII-XD-ULTRA.git "$HOME/TOOSII-XD-ULTRA" && cd "$HOME/TOOSII-XD-ULTRA"; fi && bash scripts/repair-termux-node.sh && bash scripts/setup-termux.sh
```

The wizard configures `OWNER_NUMBER`, optional `SESSION_ID`, and the bot prefix. Start again later with:

```bash
cd ~/TOOSII-XD-ULTRA && npm start
```

For automatic restart after crashes:

```bash
cd ~/TOOSII-XD-ULTRA && bash scripts/termux-health-monitor.sh
```

## ⚙️ Developer reaction scopes

The owner-only `.reactdev` automation can react to configured developer messages:

```text
.reactdev global on       # DMs and groups
.reactdev dms on          # Private chats only
.reactdev groups on       # Groups only
.reactdev off             # Disable
.reactdev emoji 🔥        # Change emoji
.reactdev                 # Show status
```

`.reactdev on` remains a shortcut for global mode. Ordinary users are not auto-reacted to by this feature.

## 🔐 Pairing and recovery

Leave `SESSION_ID` empty to pair from the service console, or generate a session in the [Session Generator](https://toosiitechdevelopertools.zone.id/session). Keep session strings private.

If the owner number is wrong, edit `OWNER_NUMBER` in `.env` and restart. Do not delete the session unless WhatsApp authentication has actually expired or been revoked.

For detailed repair scripts and recovery commands, see the repository’s `scripts/` directory and the latest [GitHub issues](https://github.com/toosii-tech-ke/TOOSII-XD-ULTRA/issues).

## 💬 Commands

Run `.menu` in WhatsApp to view the complete live catalog.

Highlights include `.play`, `.ytv`, `.ai`, `.sticker`, `.ban`, `.warn`, `.poll`, media downloads, group tools, moderation, games, and utility commands.

## ⭐ Support

- Website: [toosiitech.org](https://www.toosiitech.org/)
- Session Generator: [toosiitechdevelopertools.zone.id/session](https://toosiitechdevelopertools.zone.id/session)
- Issues: [GitHub Issues](https://github.com/toosii-tech-ke/TOOSII-XD-ULTRA/issues)

If TOOSII-XD-ULTRA helps you, star the repository and share it with other deployers.
