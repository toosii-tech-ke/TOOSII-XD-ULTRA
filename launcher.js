'use strict';
// Toosii-XD-Ultra launcher — fetches the signed runtime bundle from the
// Toosii Tech distribution API, swaps it in, and starts the bot.
// The full source lives in the private repository; this launcher only
// downloads and runs it, so it stays tiny and dependency-free.
//
// Layout on the panel — the root stays clean:
//   launcher.js, package.json, .env   <- what the user sees and edits
//   runtime/                          <- the downloaded bot (index.js, commands/, lib/, ...)
//   session/, data/, logs/            <- user state, never touched by updates
//   runtime.json                      <- local version marker

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = __dirname;
const RUNTIME_DIR = path.join(ROOT, 'runtime');
const RUNTIME_MARKER = path.join(ROOT, 'runtime.json');
const API_BASE = process.env.DIST_API_BASE || 'https://toosiitechdevelopertools.zone.id';
// User state lives at the root, outside runtime/, so updates can never touch it.
const STATE_DIRS = ['node_modules', 'data', 'session', 'logs'];

function log(...a) { console.log('[launcher]', ...a); }

const LAUNCHER_VERSION = '2'; // bump when launcher.js itself changes
const LAUNCHER_TAG_FILE = path.join(ROOT, '.launcher-version');

// Self-update: the bundle ships a copy of the latest launcher.js. On boot,
// compare versions and replace this file in place — so launcher fixes reach
// panels without manual re-uploads. The replacement takes effect on the next
// process start (or the next in-process restart handoff).
async function selfUpdate() {
    try {
        const tag = fs.readFileSync(LAUNCHER_TAG_FILE, 'utf8').trim();
        if (tag === LAUNCHER_VERSION) return;
        const bundled = path.join(RUNTIME_DIR, 'launcher.js');
        if (!fs.existsSync(bundled)) return;
        const src = fs.readFileSync(bundled, 'utf8');
        if (src.includes(`LAUNCHER_VERSION = '${LAUNCHER_VERSION}'`)) {
            // Bundle already carries this version's launcher — nothing to do.
            fs.writeFileSync(LAUNCHER_TAG_FILE, LAUNCHER_VERSION);
            return;
        }
        fs.writeFileSync(__filename, src);
        fs.writeFileSync(LAUNCHER_TAG_FILE, LAUNCHER_VERSION);
        log('launcher updated from bundle — restarts will use the new logic');
    } catch (err) {
        log('launcher self-update skipped:', err.message);
    }
}

function readLocalVersion() {
    try { return JSON.parse(fs.readFileSync(RUNTIME_MARKER, 'utf8')).version || '0'; }
    catch { return '0'; }
}

async function fetchLatest() {
    // The bundle ships as a release asset on the public repo — a plain
    // HTTPS URL, no token, no API hop.
    const res = await fetch(
        'https://api.github.com/repos/toosii-tech-ke/TOOSII-XD-ULTRA/releases/latest',
        { headers: { 'User-Agent': 'toosii-xd-launcher' }, signal: AbortSignal.timeout(60000) }
    );
    if (!res.ok) throw new Error(`release check HTTP ${res.status}`);
    const rel = await res.json();
    const asset = (rel.assets || [])[0];
    if (!asset) throw new Error('no bundle published yet');
    return {
        version: rel.tag_name,
        url: asset.browser_download_url,
        sha256: (rel.body || '').match(/sha256:\s*([a-f0-9]{64})/i)?.[1] || null,
    };
}

async function download(url, dest) {
    const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`bundle download HTTP ${res.status}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function sha256(file) {
    return require('crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function install(bundleDir) {
    // Replace the runtime wholesale — user state is not inside runtime/, so
    // there is nothing to preserve here by definition.
    fs.rmSync(RUNTIME_DIR, { recursive: true, force: true });
    fs.renameSync(bundleDir, RUNTIME_DIR);

    // Remove the bundle's node_modules: the panel installs the real
    // dependencies at the root (from the launcher's package.json), and a
    // partial/bundled copy here would SHADOW it — Node resolves from the
    // nearest node_modules first, and the bundled one can hold broken
    // packages (seen live: p-queue ESM mismatch crashing Baileys on start).
    fs.rmSync(path.join(RUNTIME_DIR, 'node_modules'), { recursive: true, force: true });

    // First run: seed the runtime's .env from the user's root .env (the file
    // they edited) or the bundle's .env.example. Later runs never overwrite.
    const runtimeEnv = path.join(RUNTIME_DIR, '.env');
    if (!fs.existsSync(runtimeEnv)) {
        const userEnv = path.join(ROOT, '.env');
        const exampleEnv = path.join(RUNTIME_DIR, '.env.example');
        try {
            if (fs.existsSync(userEnv)) fs.copyFileSync(userEnv, runtimeEnv);
            else if (fs.existsSync(exampleEnv)) fs.copyFileSync(exampleEnv, runtimeEnv);
        } catch { /* read-only fs — bot falls back to defaults + pairing prompt */ }
    }

    // Native module repair for panels that skip install scripts.
    try { execSync('node scripts/postinstall.js', { cwd: RUNTIME_DIR, stdio: 'ignore', timeout: 300000 }); } catch {}
}

// The runtime's dependencies are declared in THIS launcher's package.json, so
// the panel's own "npm install" step (fast, cached, runs before startup)
// installs them at the root. The launcher only installs inside runtime/ as a
// last-resort fallback when the panel skipped its install step entirely.
function ensureDependencies() {
    // A stale bundled node_modules from an earlier install SHADOWS the root
    // install (Node resolves from the nearest node_modules first) and can hold
    // broken packages (seen live: p-queue ESM mismatch crashed Baileys).
    // Remove it on every start, not only on swap — "up to date" starts never
    // reach install().
    fs.rmSync(path.join(RUNTIME_DIR, 'node_modules'), { recursive: true, force: true });
    const probe = path.join(ROOT, 'node_modules', '@whiskeysockets', 'baileys', 'package.json');
    if (fs.existsSync(probe)) return;
    log('dependencies missing — installing (one-time, may take a few minutes)...');
    try {
        execSync('npm install --no-audit --no-fund --legacy-peer-deps --maxsockets 3', {
            cwd: ROOT, stdio: 'inherit', timeout: 900000
        });
        log('dependencies installed');
    } catch (err) {
        console.error('[launcher] dependency install failed:', err.message);
        console.error('[launcher] the bot will likely fail to start — check panel network/npm settings');
    }
}

function ensureStateDirs() {
    for (const dir of STATE_DIRS) {
        const p = path.join(ROOT, dir);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    }
}

async function main() {
    await selfUpdate();
    if (process.env.LAUNCHER_SKIP_UPDATE === 'true') return start();

    const local = readLocalVersion();
    let latest;
    try {
        latest = await fetchLatest();
    } catch (err) {
        log('update check failed:', err.message);
        if (fs.existsSync(path.join(RUNTIME_DIR, 'index.js'))) return start();
        throw err; // nothing to run at all
    }
    if (String(latest.version) === String(local) && fs.existsSync(path.join(RUNTIME_DIR, 'index.js'))) {
        log('up to date at', local);
        return start();
    }

    log(`updating: ${local} -> ${latest.version}`);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xd-launch-'));
    try {
        const zip = path.join(tmp, 'bundle.zip');
        await download(latest.url, zip);
        if (latest.sha256 && sha256(zip) !== latest.sha256) throw new Error('bundle checksum mismatch');
        execSync(`cd "${tmp}" && unzip -oq bundle.zip`, { stdio: 'ignore', timeout: 120000 });
        const inner = fs.readdirSync(tmp).find((f) => fs.statSync(path.join(tmp, f)).isDirectory());
        if (!inner) throw new Error('bundle layout unexpected');
        install(path.join(tmp, inner));
        fs.writeFileSync(RUNTIME_MARKER, JSON.stringify({ version: latest.version, at: new Date().toISOString() }));
        log('updated to', latest.version);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
    start();
}

function start() {
    if (!fs.existsSync(path.join(RUNTIME_DIR, 'index.js'))) {
        console.error('[launcher] No runtime found and the distribution API is unreachable. Set DIST_API_BASE/TOOSII_TECH_API_TOKEN correctly, then restart.');
        process.exit(1);
    }
    // State dirs are pointed at by the bot via SESSION_DIR-style env overrides
    // and by relative './session' paths resolved from the runtime's parent —
    // run with cwd at the root so './session', './data', './logs' land here.
    process.chdir(ROOT);
    // State dirs live at the root; node must resolve modules from there too.
    module.paths.unshift(path.join(ROOT, 'node_modules'));
    ensureDependencies();
    ensureStateDirs();
    require(path.join(RUNTIME_DIR, 'index.js'));
}

// The runtime bot runs IN this process (require'd above). On KataBump the
// container stops when the main process exits, and the panel's auto-restart
// aborts if the process dies shortly after starting — so a plain
// process.exit() from the bot's .restart left the server offline for good.
//
// Fix: the bot's .restart writes data/.restart-requested and calls
// process.exit — but BEFORE exiting it ends its WhatsApp connection. The
// launcher detects a CLEAN shutdown (no error) and re-runs the runtime
// in this same process, so the panel process never dies and never goes
// offline. A CRASH (uncaught error) still exits the launcher so the panel
// reports the failure honestly.
let restarting = false;
process.on('exit', (code) => {
    if (restarting) console.log('[launcher] restart handoff — respawning runtime...');
});

function requestRestart() {
    restarting = true;
    // Give logs a beat to flush, then re-run the whole runtime fresh in
    // this process. Module cache is wiped so the new runtime/ (e.g. right
    // after an update) is picked up cleanly.
    setTimeout(() => {
        try {
            for (const key of Object.keys(require.cache)) {
                if (key.startsWith(RUNTIME_DIR)) delete require.cache[key];
            }
            console.log('[launcher] restarting runtime...');
            require(path.join(RUNTIME_DIR, 'index.js'));
        } catch (err) {
            console.error('[launcher] runtime restart failed:', err.message);
            process.exit(1);
        }
    }, 3000);
}

// The runtime signals a restart request by setting this global before it
// exits (its .restart command does that instead of a bare process.exit).
global.__TOOSII_RESTART_HOOK__ = requestRestart;

main().catch((err) => {
    console.error('[launcher] Fatal:', err.message);
    process.exit(1);
});
