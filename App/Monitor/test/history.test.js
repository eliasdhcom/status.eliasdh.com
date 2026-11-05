/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { emptyHistory, loadHistory, saveHistory, applyResult, prune, dayKey, lastDays, uptimePercent } = require('../src/history');

const result = (status, checkedAt, id = 'site') => ({ id, status, checkedAt, responseTimeMs: 100, metrics: {} });

test('dayKey uses the Brussels calendar day', () => {
    assert.equal(dayKey(new Date('2026-11-05T23:30:00Z')), '2026-11-06');
    assert.equal(dayKey(new Date('2026-07-01T21:59:00Z')), '2026-07-01');
    assert.equal(dayKey(new Date('2026-07-01T22:00:00Z')), '2026-07-02');
});

test('lastDays returns consecutive days ending today, also across a DST change', () => {
    const days = lastDays(new Date('2026-03-30T10:00:00Z'), 5);
    assert.deepEqual(days, ['2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30']);
});

test('results are counted per day and status', () => {
    const history = emptyHistory();
    applyResult(history, result('operational', '2026-11-05T10:00:00Z'));
    applyResult(history, result('operational', '2026-11-05T10:05:00Z'));
    applyResult(history, result('degraded', '2026-11-05T10:10:00Z'));
    applyResult(history, result('outage', '2026-11-05T10:15:00Z'));
    assert.deepEqual(history.services.site.days['2026-11-05'], { up: 2, degraded: 1, down: 1 });
});

test('skipped results are ignored', () => {
    const history = emptyHistory();
    applyResult(history, { id: 'site', status: 'skipped' });
    assert.deepEqual(history.services, {});
});

test('an incident opens on the first failure and closes after the first good check', () => {
    const history = emptyHistory();
    applyResult(history, result('operational', '2026-11-05T10:00:00Z'));
    applyResult(history, result('outage', '2026-11-05T10:05:00Z'));
    applyResult(history, result('outage', '2026-11-05T10:10:00Z'));
    assert.equal(history.incidents.length, 1);
    assert.equal(history.incidents[0].resolvedAt, null);

    applyResult(history, result('operational', '2026-11-05T10:15:00Z'));
    assert.equal(history.incidents.length, 1);
    assert.deepEqual(history.incidents[0], { serviceId: 'site', status: 'outage', startedAt: '2026-11-05T10:05:00Z', resolvedAt: '2026-11-05T10:15:00Z' });
});

test('moving from degraded to outage closes one incident and opens another', () => {
    const history = emptyHistory();
    applyResult(history, result('degraded', '2026-11-05T10:00:00Z'));
    applyResult(history, result('outage', '2026-11-05T10:05:00Z'));
    assert.equal(history.incidents.length, 2);
    assert.equal(history.incidents[0].resolvedAt, '2026-11-05T10:05:00Z');
    assert.equal(history.incidents[1].status, 'outage');
});

test('incidents of different services are independent', () => {
    const history = emptyHistory();
    applyResult(history, result('outage', '2026-11-05T10:00:00Z', 'a'));
    applyResult(history, result('operational', '2026-11-05T10:05:00Z', 'b'));
    assert.equal(history.incidents.length, 1);
    assert.equal(history.incidents[0].resolvedAt, null);
});

test('uptime counts degraded as up, rounds down and is null without data', () => {
    const days = { '2026-11-04': { up: 997, degraded: 0, down: 3 }, '2026-11-05': { up: 0, degraded: 0, down: 0 } };
    assert.equal(uptimePercent(days, ['2026-11-04', '2026-11-05']), 99.7);
    assert.equal(uptimePercent({ d: { up: 1, degraded: 1, down: 0 } }, ['d']), 100);
    assert.equal(uptimePercent({ d: { up: 99999, degraded: 0, down: 1 } }, ['d']), 99.99);
    assert.equal(uptimePercent({}, ['2026-11-05']), null);
});

test('prune removes old days and old resolved incidents but keeps open ones', () => {
    const now = new Date('2026-11-05T10:00:00Z');
    const history = emptyHistory();
    history.services.site = { days: { '2025-01-01': { up: 1, degraded: 0, down: 0 }, '2026-11-05': { up: 1, degraded: 0, down: 0 } } };
    history.incidents = [
        { serviceId: 'site', status: 'outage', startedAt: '2026-01-01T00:00:00Z', resolvedAt: '2026-01-01T01:00:00Z' },
        { serviceId: 'site', status: 'outage', startedAt: '2026-01-01T00:00:00Z', resolvedAt: null },
        { serviceId: 'site', status: 'outage', startedAt: '2026-11-04T00:00:00Z', resolvedAt: '2026-11-04T01:00:00Z' }
    ];
    prune(history, now);
    assert.deepEqual(Object.keys(history.services.site.days), ['2026-11-05']);
    assert.equal(history.incidents.length, 2);
    assert.equal(history.updatedAt, now.toISOString());
});

test('history survives a save and load, and unknown files are refused', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'monitor-'));
    const file = path.join(dir, 'history.json');
    assert.deepEqual(loadHistory(file), emptyHistory());

    const history = emptyHistory();
    applyResult(history, result('outage', '2026-11-05T10:00:00Z'));
    saveHistory(file, history);
    assert.deepEqual(loadHistory(file), history);

    fs.writeFileSync(file, JSON.stringify({ version: 99 }));
    assert.throws(() => loadHistory(file), /Unsupported history file/);
    fs.writeFileSync(file, '{ broken');
    assert.throws(() => loadHistory(file));
    fs.rmSync(dir, { recursive: true, force: true });
});