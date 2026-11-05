/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadConfig, normalizeConfig } = require('../src/config');
const { emptyHistory, applyResult } = require('../src/history');
const { buildReport, overallStatus, BAR_DAYS } = require('../src/report');

const config = normalizeConfig({
    groups: [{ id: 'websites', name: 'Websites' }, { id: 'unused', name: 'Unused' }],
    services: [
        { id: 'a', name: 'A', group: 'websites', url: 'https://a.example' },
        { id: 'b', name: 'B', group: 'websites', url: 'https://b.example', metrics: { nodesReady: 'x' } }
    ]
});
const now = new Date('2026-11-05T10:00:00Z');
const ok = (id, extra = {}) => ({ id, status: 'operational', responseTimeMs: 120, checkedAt: now.toISOString(), metrics: {}, ...extra });

test('the shipped services.json is valid', () => {
    const shipped = loadConfig(path.join(__dirname, '..', 'services.json'));
    assert.ok(shipped.services.length > 0);
});

test('overall status is the worst service status', () => {
    assert.equal(overallStatus([{ status: 'operational' }]), 'operational');
    assert.equal(overallStatus([{ status: 'operational' }, { status: 'degraded' }]), 'degraded');
    assert.equal(overallStatus([{ status: 'degraded' }, { status: 'outage' }]), 'outage');
    assert.equal(overallStatus([]), 'operational');
});

test('the report lists every service with a full 90 day bar and rounded uptime', () => {
    const history = emptyHistory();
    const results = [ok('a'), ok('b', { metrics: { nodesReady: 3 } })];
    results.forEach(result => applyResult(history, result));

    const report = buildReport(config, history, results, now);
    assert.equal(report.version, 1);
    assert.equal(report.generatedAt, now.toISOString());
    assert.equal(report.overall, 'operational');
    assert.equal(report.services.length, 2);
    assert.equal(report.services[0].days.length, BAR_DAYS);
    assert.equal(report.services[0].days.at(-1).date, '2026-11-05');
    assert.deepEqual(report.services[0].days.at(-1), { date: '2026-11-05', up: 1, degraded: 0, down: 0 });
    assert.deepEqual(report.services[0].days[0], { date: '2026-08-08', up: 0, degraded: 0, down: 0 });
    assert.equal(report.services[0].uptime.days90, 100);
    assert.deepEqual(report.services[1].metrics, { nodesReady: 3 });
    assert.equal('metrics' in report.services[0], false);
});

test('unused groups and skipped services are left out', () => {
    const results = [ok('a'), { id: 'b', status: 'skipped' }];
    const report = buildReport(config, emptyHistory(), results, now);
    assert.deepEqual(report.services.map(service => service.id), ['a']);
    assert.deepEqual(report.groups.map(group => group.id), ['websites']);
});

test('incidents older than 30 days are dropped and the newest come first', () => {
    const history = emptyHistory();
    history.incidents = [
        { serviceId: 'a', status: 'outage', startedAt: '2026-09-01T10:00:00Z', resolvedAt: '2026-09-01T11:00:00Z' },
        { serviceId: 'a', status: 'outage', startedAt: '2026-10-20T10:00:00Z', resolvedAt: '2026-10-20T11:00:00Z' },
        { serviceId: 'b', status: 'degraded', startedAt: '2026-11-01T10:00:00Z', resolvedAt: null },
        { serviceId: 'gone', status: 'outage', startedAt: '2026-11-02T10:00:00Z', resolvedAt: null }
    ];
    const report = buildReport(config, history, [ok('a'), ok('b')], now);
    assert.deepEqual(report.incidents.map(incident => incident.startedAt), ['2026-11-01T10:00:00Z', '2026-10-20T10:00:00Z']);
});

test('the report never contains request details', () => {
    const report = buildReport(config, emptyHistory(), [ok('a', { reason: 'HTTP 500' }), ok('b')], now);
    const serialized = JSON.stringify(report);
    assert.equal(serialized.includes('https://'), false);
    assert.equal(serialized.includes('HTTP 500'), false);
});

test('configuration errors are rejected', () => {
    const group = [{ id: 'g' }];
    assert.throws(() => normalizeConfig({ groups: group, services: [{ id: 'A', name: 'x', group: 'g', url: 'https://x.example' }] }), /lowercase/);
    assert.throws(() => normalizeConfig({ groups: group, services: [{ id: 'a', name: 'x', group: 'nope', url: 'https://x.example' }] }), /unknown group/);
    assert.throws(() => normalizeConfig({ groups: group, services: [{ id: 'a', name: 'x', group: 'g', url: 'http://x.example' }] }), /https/);
    assert.throws(() => normalizeConfig({
        groups: group,
        services: [{ id: 'a', name: 'x', group: 'g', url: 'https://x.example' }, { id: 'a', name: 'y', group: 'g', url: 'https://y.example' }]
    }), /duplicate/);
});

test('derived services must follow an existing service that is not derived itself', () => {
    const base = { groups: [{ id: 'g' }], services: [{ id: 'a', name: 'A', group: 'g', url: 'https://a.example' }] };
    assert.doesNotThrow(() => normalizeConfig({ ...base, services: [...base.services, { id: 'b', name: 'B', group: 'g', sameAs: 'a' }] }));
    assert.throws(() => normalizeConfig({ ...base, services: [...base.services, { id: 'b', name: 'B', group: 'g', sameAs: 'x' }] }), /unknown service/);
    assert.throws(() => normalizeConfig({
        ...base,
        services: [...base.services, { id: 'b', name: 'B', group: 'g', sameAs: 'a' }, { id: 'c', name: 'C', group: 'g', sameAs: 'b' }]
    }), /derived itself/);
});

test('tls services need valid targets', () => {
    const tls = targets => normalizeConfig({ groups: [{ id: 'g' }], services: [{ id: 'm', name: 'M', group: 'g', type: 'tls', targets }] });
    assert.doesNotThrow(() => tls([{ host: 'imap.example', port: 993 }]));
    assert.throws(() => tls([]), /at least one target/);
    assert.throws(() => tls([{ host: 'imap.example', port: 0 }]), /invalid port/);
});