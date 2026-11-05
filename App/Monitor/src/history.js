/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const fs = require('node:fs');
const { STATUS } = require('./probe');

const HISTORY_VERSION = 1;
const TIME_ZONE = 'Europe/Brussels';
const KEEP_DAYS = 120;
const INCIDENT_RETENTION_DAYS = 90;
const MAX_INCIDENTS = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

function emptyHistory() {
    return { version: HISTORY_VERSION, updatedAt: null, services: {}, incidents: [] };
}

function loadHistory(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return emptyHistory();
    const history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (history?.version !== HISTORY_VERSION || typeof history.services !== 'object' || !Array.isArray(history.incidents)) {
        throw new Error(`Unsupported history file "${filePath}"; refusing to overwrite it.`);
    }
    return history;
}

function saveHistory(filePath, history) {
    fs.writeFileSync(filePath, `${JSON.stringify(history)}\n`);
}

function dayKey(date) {
    return dayFormatter.format(date);
}

function lastDays(now, count) {
    const [year, month, day] = dayKey(now).split('-').map(Number);
    const today = Date.UTC(year, month - 1, day);
    return Array.from({ length: count }, (_, index) => new Date(today - (count - 1 - index) * DAY_MS).toISOString().slice(0, 10));
}

function applyResult(history, result) {
    if (result.status === STATUS.SKIPPED) return;

    const service = (history.services[result.id] ??= { days: {} });
    const bucket = (service.days[dayKey(new Date(result.checkedAt))] ??= { up: 0, degraded: 0, down: 0 });
    if (result.status === STATUS.OPERATIONAL) bucket.up++;
    else if (result.status === STATUS.DEGRADED) bucket.degraded++;
    else bucket.down++;

    const open = history.incidents.find(incident => incident.serviceId === result.id && !incident.resolvedAt);
    if (result.status === STATUS.OPERATIONAL) {
        if (open) open.resolvedAt = result.checkedAt;
        return;
    }
    if (open && open.status === result.status) return;
    if (open) open.resolvedAt = result.checkedAt;
    history.incidents.push({ serviceId: result.id, status: result.status, startedAt: result.checkedAt, resolvedAt: null });
}

function prune(history, now) {
    const oldestDay = lastDays(now, KEEP_DAYS)[0];
    for (const service of Object.values(history.services)) {
        for (const day of Object.keys(service.days)) {
            if (day < oldestDay) delete service.days[day];
        }
    }

    const cutoff = now.getTime() - INCIDENT_RETENTION_DAYS * DAY_MS;
    history.incidents = history.incidents
        .filter(incident => !incident.resolvedAt || new Date(incident.resolvedAt).getTime() >= cutoff)
        .slice(-MAX_INCIDENTS);
    history.updatedAt = now.toISOString();
}

function uptimePercent(days, keys) {
    let up = 0;
    let total = 0;
    for (const key of keys) {
        const bucket = days[key];
        if (!bucket) continue;
        up += bucket.up + bucket.degraded;
        total += bucket.up + bucket.degraded + bucket.down;
    }
    if (total === 0) return null;
    return Math.floor((up / total) * 10000) / 100;
}

module.exports = { emptyHistory, loadHistory, saveHistory, applyResult, prune, dayKey, lastDays, uptimePercent, TIME_ZONE, HISTORY_VERSION };