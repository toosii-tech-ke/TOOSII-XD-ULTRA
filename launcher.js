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

    // Lift the bot's node_modules to the root on first install so deps
    // survive updates (the bundle's own copy is removed with the old runtime).
    const bundledModules = path.join(RUNTIME_DIR, 'node_modules');
    const rootModules = path.join(ROOT, 'node_modules');
    if (fs.existsSync(bundledModules) && !fs.existsSync(rootModules)) {
        try { fs.renameSync(bundledModules, rootModules); } catch { /* keep bundled copy */ }
    }

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

function ensureStateDirs() {
    for (const dir of STATE_DIRS) {
        const p = path.join(ROOT, dir);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    }
}

async function main() {
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
    ensureStateDirs();
    require(path.join(RUNTIME_DIR, 'index.js'));
}

main().catch((err) => {
    console.error('[launcher] Fatal:', err.message);
    process.exit(1);
});
