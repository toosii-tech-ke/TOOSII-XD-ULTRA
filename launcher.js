'use strict';
// Toosii-XD-Ultra launcher — fetches the signed runtime bundle from the
// Toosii Tech distribution API, swaps it in, and starts the bot.
// The full source lives in the private repository; this launcher only
// downloads and runs it, so it stays tiny and dependency-free.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = __dirname;
const API_BASE = process.env.DIST_API_BASE || 'https://toosiitechdevelopertools.zone.id';
const PRESERVE = new Set(['node_modules', 'data', 'session', '.env', 'logs', 'runtime', 'runtime.json']);

function log(...a) { console.log('[launcher]', ...a); }

function readLocalVersion() {
    try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'runtime.json'), 'utf8')).version || '0'; }
    catch { return '0'; }
}

async function fetchLatest() {
    const res = await fetch(`${API_BASE}/api/v1/bot/latest`, {
        headers: { 'x-api-key': process.env.TOOSII_TECH_API_TOKEN || '' },
        signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`distribution API HTTP ${res.status}`);
    return res.json(); // { version, url, sha256 }
}

async function download(url, dest) {
    const res = await fetch(url, { signal: AbortSignal.timeout(300000) });
    if (!res.ok) throw new Error(`bundle download HTTP ${res.status}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function sha256(file) {
    return require('crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function swap(bundleDir) {
    // Runtime state survives every update: session, data, env, logs, deps.
    for (const entry of fs.readdirSync(bundleDir)) {
        if (PRESERVE.has(entry)) continue;
        const dest = path.join(ROOT, entry);
        fs.rmSync(dest, { recursive: true, force: true });
        fs.renameSync(path.join(bundleDir, entry), dest);
    }
    for (const entry of fs.readdirSync(bundleDir)) {
        if (!PRESERVE.has(entry)) continue;
        const dest = path.join(ROOT, entry);
        if (fs.existsSync(dest)) continue; // first run only
        fs.cpSync(path.join(bundleDir, entry), dest, { recursive: true });
    }
    // Native module repair for panels that skip install scripts.
    try { execSync('node scripts/postinstall.js', { cwd: ROOT, stdio: 'ignore', timeout: 300000 }); } catch {}
}

async function main() {
    if (process.env.LAUNCHER_SKIP_UPDATE === 'true') return start();

    const local = readLocalVersion();
    let latest;
    try {
        latest = await fetchLatest();
    } catch (err) {
        log('update check failed:', err.message);
        if (fs.existsSync(path.join(ROOT, 'index.js'))) return start();
        throw err; // nothing to run at all
    }
    if (String(latest.version) === String(local) && fs.existsSync(path.join(ROOT, 'index.js'))) {
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
        swap(path.join(tmp, inner));
        fs.writeFileSync(path.join(ROOT, 'runtime.json'), JSON.stringify({ version: latest.version, at: new Date().toISOString() }));
        log('updated to', latest.version);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
    start();
}

function start() {
    if (!fs.existsSync(path.join(ROOT, 'index.js'))) {
        console.error('[launcher] No runtime found and the distribution API is unreachable. Set DIST_API_BASE/TOOSII_TECH_API_TOKEN correctly, then restart.');
        process.exit(1);
    }
    require(path.join(ROOT, 'index.js'));
}

main().catch((err) => {
    console.error('[launcher] Fatal:', err.message);
    process.exit(1);
});
