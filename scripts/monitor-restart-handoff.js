#!/usr/bin/env node
'use strict';

/**
 * Monitor launcher logs for restart-handoff regressions.
 *
 * Usage:
 *   node scripts/monitor-restart-handoff.js --log /path/to/panel.log
 *
 * Optional environment variables:
 *   RESTART_ALERT_WEBHOOK=https://example.invalid/hook
 *   RESTART_HANDOFF_WINDOW_MS=5000
 *   RESTART_ALERT_COOLDOWN_MS=60000
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function arg(name, fallback = null) {
    const index = args.indexOf(name);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const logPath = path.resolve(arg('--log', process.env.RESTART_LOG || 'logs/bot.log'));
const windowMs = Math.max(1000, Number(process.env.RESTART_HANDOFF_WINDOW_MS || 5000));
const cooldownMs = Math.max(0, Number(process.env.RESTART_ALERT_COOLDOWN_MS || 60000));
const webhook = process.env.RESTART_ALERT_WEBHOOK || '';

let offset = 0;
let carry = '';
let restartEvents = [];
let lastAlertAt = new Map();
let stopped = false;

function writeLine(level, message, details = {}) {
    const record = {
        time: new Date().toISOString(),
        level,
        monitor: 'restart-handoff',
        message,
        ...details,
    };
    const text = JSON.stringify(record);
    (level === 'ALERT' ? process.stderr : process.stdout).write(text + '\n');
    if (level === 'ALERT') sendWebhook(record).catch(() => {});
}

async function sendWebhook(record) {
    if (!webhook) return;
    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(record),
            signal: AbortSignal.timeout(10000),
        });
    } catch (err) {
        process.stderr.write(JSON.stringify({
            time: new Date().toISOString(),
            level: 'WARN',
            monitor: 'restart-handoff',
            message: 'alert webhook delivery failed',
            error: String(err?.message || err),
        }) + '\n');
    }
}

function alert(kind, message, details = {}) {
    const now = Date.now();
    const last = lastAlertAt.get(kind) || 0;
    if (now - last < cooldownMs) return;
    lastAlertAt.set(kind, now);
    writeLine('ALERT', message, { kind, log: logPath, ...details });
}

function prune(now) {
    restartEvents = restartEvents.filter((event) => now - event.time <= windowMs);
}

function inspect(line) {
    const now = Date.now();
    const lower = line.toLowerCase();

    if (/eaddrinuse|address already in use|address in use/.test(lower)) {
        alert('port-binding-conflict', 'port binding conflict detected', { line });
    }
    if (lower.includes('runtime restart failed')) {
        alert('runtime-restart-failed', 'runtime restart failed', { line });
    }
    if (lower.includes('runtime cleanup warning')) {
        alert('cleanup-warning', 'runtime cleanup warning detected', { line });
    }

    if (lower.includes('restart already in progress')) {
        writeLine('INFO', 'duplicate restart was coalesced', { line });
    }

    if (lower.includes('restarting runtime')) {
        prune(now);
        restartEvents.push({ time: now, line });
        if (restartEvents.length > 1) {
            alert('overlapping-runtime-restarts', 'multiple runtime reloads observed inside one handoff window', {
                count: restartEvents.length,
                windowMs,
                events: restartEvents.map((event) => event.line),
            });
        }
    }
}

function readNewBytes() {
    if (stopped || !fs.existsSync(logPath)) return;
    const stat = fs.statSync(logPath);
    // Log rotation or truncation: start from the beginning of the new file.
    if (stat.size < offset) offset = 0;
    if (stat.size === offset) return;
    const fd = fs.openSync(logPath, 'r');
    try {
        const length = stat.size - offset;
        const buffer = Buffer.alloc(length);
        fs.readSync(fd, buffer, 0, length, offset);
        offset = stat.size;
        carry += buffer.toString('utf8');
    } finally {
        fs.closeSync(fd);
    }
    const lines = carry.split(/\r?\n/);
    carry = lines.pop() || '';
    for (const line of lines) if (line.trim()) inspect(line);
}

function stop(signal) {
    if (stopped) return;
    stopped = true;
    writeLine('INFO', `monitor stopped (${signal})`);
    process.exit(0);
}

if (!fs.existsSync(logPath)) {
    writeLine('WARN', 'log file does not exist yet; waiting for it', { log: logPath });
} else {
    offset = fs.statSync(logPath).size;
}

writeLine('INFO', 'restart handoff monitor started', {
    log: logPath,
    windowMs,
    cooldownMs,
    webhookConfigured: Boolean(webhook),
});
const timer = setInterval(readNewBytes, 1000);
readNewBytes();
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
