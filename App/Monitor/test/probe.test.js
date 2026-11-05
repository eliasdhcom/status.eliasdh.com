/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeConfig } = require('../src/config');
const { probe, resolveHeaders } = require('../src/probe');

const config = normalizeConfig({
    groups: [{ id: 'websites', name: 'Websites' }],
    services: [{ id: 'site', name: 'Site', group: 'websites', url: 'https://example.com', retryDelayMs: 0 }]
});
const [site] = config.services;
const now = () => new Date('2026-11-05T10:00:00.000Z');
const base = { sleep: async () => {}, now, env: {} };

function response(status, body = '') {
    return { status, text: async () => body };
}

function sequence(...steps) {
    const calls = [];
    const fetch = async (url, init) => {
        calls.push({ url, init });
        const step = steps[Math.min(calls.length - 1, steps.length - 1)];
        if (step instanceof Error) throw step;
        return step;
    };
    return { fetch, calls };
}

test('a fast 200 response is operational', async () => {
    const { fetch } = sequence(response(200, 'ok'));
    const result = await probe(site, { ...base, fetch });
    assert.equal(result.status, 'operational');
    assert.equal(result.checkedAt, '2026-11-05T10:00:00.000Z');
});

test('a slow response is degraded', async () => {
    let tick = 0;
    const { fetch } = sequence(response(200, 'ok'));
    const result = await probe(site, { ...base, fetch, clock: () => (tick += 4000) });
    assert.equal(result.status, 'degraded');
    assert.equal(result.reason, 'slow response');
});

test('a failing request is retried before it counts as an outage', async () => {
    const { fetch, calls } = sequence(response(503), response(503), response(200, 'ok'));
    const result = await probe(site, { ...base, fetch });
    assert.equal(result.status, 'operational');
    assert.equal(calls.length, 3);
});

test('an outage is reported after all retries failed', async () => {
    const { fetch, calls } = sequence(response(500));
    const result = await probe(site, { ...base, fetch });
    assert.equal(result.status, 'outage');
    assert.equal(result.reason, 'HTTP 500');
    assert.equal(result.responseTimeMs !== undefined, true);
    assert.equal(calls.length, site.retries + 1);
});

test('network errors are an outage', async () => {
    const { fetch } = sequence(new Error('socket hang up'));
    const result = await probe(site, { ...base, fetch });
    assert.equal(result.status, 'outage');
    assert.equal(result.responseTimeMs, null);
});

test('expectBody must be present in the response', async () => {
    const service = { ...site, expectBody: 'EliasDH', retries: 0 };
    assert.equal((await probe(service, { ...base, fetch: sequence(response(200, '<title>EliasDH</title>')).fetch })).status, 'operational');
    assert.equal((await probe(service, { ...base, fetch: sequence(response(200, '<title>Parked</title>')).fetch })).status, 'outage');
});

test('failing JSON checks make the service degraded and metrics are extracted', async () => {
    const service = {
        ...site,
        retries: 0,
        jsonChecks: [{ path: 'data.healthy', equals: true }],
        metrics: { nodesReady: 'data.nodesReady', nodesTotal: 'data.nodesTotal', ignored: 'data.text' }
    };
    const body = JSON.stringify({ data: { healthy: false, nodesReady: 2, nodesTotal: 3, text: 'x' } });
    const result = await probe(service, { ...base, fetch: sequence(response(200, body)).fetch });
    assert.equal(result.status, 'degraded');
    assert.deepEqual(result.metrics, { nodesReady: 2, nodesTotal: 3 });
});

test('invalid JSON is an outage when JSON is required', async () => {
    const service = { ...site, retries: 0, jsonChecks: [{ path: 'success', equals: true }] };
    const result = await probe(service, { ...base, fetch: sequence(response(200, '<html>')).fetch });
    assert.equal(result.status, 'outage');
});

test('header placeholders are filled from the environment and never leak into the result', async () => {
    const service = { ...site, headers: { 'X-API-Key': '${ELIASDH_API_KEY}' } };
    const { fetch, calls } = sequence(response(200, 'ok'));
    const result = await probe(service, { ...base, fetch, env: { ELIASDH_API_KEY: 'secret-value' } });
    assert.equal(calls[0].init.headers['X-API-Key'], 'secret-value');
    assert.equal(JSON.stringify(result).includes('secret-value'), false);
});

test('a service with a missing secret is skipped without any request', async () => {
    const service = { ...site, headers: { 'X-API-Key': '${ELIASDH_API_KEY}' } };
    const { fetch, calls } = sequence(response(200, 'ok'));
    const result = await probe(service, { ...base, fetch });
    assert.equal(result.status, 'skipped');
    assert.equal(calls.length, 0);
});

test('resolveHeaders reports each missing variable once', () => {
    const { missing } = resolveHeaders({ A: '${TOKEN}', B: '${TOKEN}-x' }, {});
    assert.deepEqual(missing, ['TOKEN']);
});

const { EventEmitter } = require('node:events');
const { probeAll } = require('../src/probe');

function fakeTls(behaviours) {
    const opened = [];
    const tlsConnect = options => {
        opened.push(options);
        const socket = new EventEmitter();
        socket.destroy = () => setImmediate(() => socket.emit('close'));
        const behaviour = behaviours[options.port];
        setImmediate(() => {
            if (behaviour instanceof Error) socket.emit('error', behaviour);
            else if (behaviour !== undefined) socket.emit('data', Buffer.from(behaviour));
        });
        return socket;
    };
    return { tlsConnect, opened };
}

const mail = normalizeConfig({
    groups: [{ id: 'services', name: 'Services' }],
    services: [{
        id: 'mail', name: 'Mail', group: 'services', type: 'tls', retryDelayMs: 0, retries: 0, timeoutMs: 50,
        targets: [{ host: 'imap.example', port: 993, expectGreeting: '* OK' }, { host: 'smtp.example', port: 465, expectGreeting: '220' }]
    }]
}).services[0];

test('a tls service is operational when every target sends the expected greeting', async () => {
    const { tlsConnect, opened } = fakeTls({ 993: '* OK IMAP ready', 465: '220 smtp ready' });
    const result = await probe(mail, { ...base, tlsConnect });
    assert.equal(result.status, 'operational');
    assert.equal(opened.length, 2);
    assert.equal(opened[0].servername, 'imap.example');
});

test('a tls service is an outage when one target has the wrong greeting, is refused or stays silent', async () => {
    for (const behaviours of [
        { 993: '* OK', 465: '554 go away' },
        { 993: '* OK', 465: Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }) },
        { 993: '* OK' }
    ]) {
        const result = await probe(mail, { ...base, tlsConnect: fakeTls(behaviours).tlsConnect });
        assert.equal(result.status, 'outage');
        assert.match(result.reason, /^target 2: /);
    }
});

test('derived services copy the result of the service they follow', async () => {
    const derived = normalizeConfig({
        groups: [{ id: 'g', name: 'G' }],
        services: [
            { id: 'app', name: 'App', group: 'g', url: 'https://app.example', retries: 0 },
            { id: 'web', name: 'Web', group: 'g', sameAs: 'app' }
        ]
    }).services;
    const { fetch, calls } = sequence(response(500));
    const results = await probeAll(derived, { ...base, fetch });
    assert.equal(calls.length, 1);
    assert.deepEqual(results.map(result => [result.id, result.status]), [['app', 'outage'], ['web', 'outage']]);
});