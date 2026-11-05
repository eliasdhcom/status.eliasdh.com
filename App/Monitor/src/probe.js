/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const tls = require('node:tls');

const MAX_BODY_CHARS = 2_000_000;
const PLACEHOLDER = /\$\{([A-Z0-9_]+)\}/g;

const STATUS = Object.freeze({
    OPERATIONAL: 'operational',
    DEGRADED: 'degraded',
    OUTAGE: 'outage',
    SKIPPED: 'skipped'
});

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function resolveHeaders(headers = {}, env = process.env) {
    const resolved = {};
    const missing = [];
    for (const [name, template] of Object.entries(headers)) {
        resolved[name] = String(template).replace(PLACEHOLDER, (_, variable) => {
            const value = env[variable];
            if (!value) missing.push(variable);
            return value ?? '';
        });
    }
    return { headers: resolved, missing: [...new Set(missing)] };
}

function getPath(object, path) {
    return path.split('.').reduce((value, key) => (value !== null && typeof value === 'object' ? value[key] : undefined), object);
}

function extractMetrics(json, metrics = {}) {
    const result = {};
    for (const [name, path] of Object.entries(metrics)) {
        const value = getPath(json, path);
        if (typeof value === 'number' && Number.isFinite(value)) result[name] = value;
        else if (typeof value === 'boolean') result[name] = value;
    }
    return result;
}

const GREETING_BYTES = 512;

function readGreeting(target, timeoutMs, connect) {
    return new Promise((resolve, reject) => {
        const socket = connect({ host: target.host, port: target.port, servername: target.host });
        const finish = (settle, value) => {
            clearTimeout(timer);
            socket.destroy();
            settle(value);
        };
        const timer = setTimeout(() => finish(reject, Object.assign(new Error('timeout'), { name: 'TimeoutError' })), timeoutMs);
        socket.once('data', data => finish(resolve, data.toString('utf8', 0, GREETING_BYTES)));
        socket.once('error', error => finish(reject, error));
        socket.once('close', () => finish(reject, new Error('connection closed')));
    });
}

async function attemptTls(service, ctx) {
    const started = ctx.clock();
    const results = await Promise.allSettled(service.targets.map(async target => {
        const greeting = await readGreeting(target, service.timeoutMs, ctx.tlsConnect);
        if (target.expectGreeting && !greeting.startsWith(target.expectGreeting)) throw new Error('unexpected greeting');
    }));
    const responseTimeMs = Math.round(ctx.clock() - started);

    const failures = results.map((result, index) => ({ result, index })).filter(({ result }) => result.status === 'rejected');
    if (failures.length > 0) {
        const { result, index } = failures[0];
        const reason = result.reason?.name === 'TimeoutError' ? 'timeout' : (result.reason?.code ?? result.reason?.message ?? 'connection failed');
        return { outcome: 'fail', reason: `target ${index + 1}: ${reason}`, responseTimeMs: null };
    }
    return { outcome: 'ok', responseTimeMs, metrics: {} };
}

async function attempt(service, headers, ctx) {
    if (service.type === 'tls') return attemptTls(service, ctx);

    const started = ctx.clock();
    try {
        const response = await ctx.fetch(service.url, {
            method: service.method,
            headers: { 'User-Agent': 'EliasDH-Status-Monitor/1.0 (+https://status.eliasdh.com)', ...headers },
            redirect: 'follow',
            signal: AbortSignal.timeout(service.timeoutMs)
        });
        const text = (await response.text()).slice(0, MAX_BODY_CHARS);
        const responseTimeMs = Math.round(ctx.clock() - started);

        if (!service.expectStatus.includes(response.status)) {
            return { outcome: 'fail', reason: `HTTP ${response.status}`, responseTimeMs };
        }
        if (service.expectBody && !text.includes(service.expectBody)) {
            return { outcome: 'fail', reason: 'unexpected body', responseTimeMs };
        }

        let json = null;
        if (service.jsonChecks?.length || service.metrics) {
            try {
                json = JSON.parse(text);
            } catch {
                return { outcome: 'fail', reason: 'invalid JSON', responseTimeMs };
            }
        }

        const metrics = extractMetrics(json, service.metrics);
        const failedCheck = (service.jsonChecks ?? []).find(check => getPath(json, check.path) !== check.equals);
        if (failedCheck) return { outcome: 'degraded', reason: `check "${failedCheck.path}" failed`, responseTimeMs, metrics };

        return { outcome: 'ok', responseTimeMs, metrics };
    } catch (error) {
        const reason = error?.name === 'TimeoutError' ? 'timeout' : (error?.cause?.code ?? error?.name ?? 'request failed');
        return { outcome: 'fail', reason, responseTimeMs: null };
    }
}

async function probe(service, options = {}) {
    const ctx = {
        fetch: options.fetch ?? globalThis.fetch,
        tlsConnect: options.tlsConnect ?? (connectOptions => tls.connect(connectOptions)),
        clock: options.clock ?? (() => performance.now()),
        sleep: options.sleep ?? defaultSleep,
        now: options.now ?? (() => new Date()),
        env: options.env ?? process.env
    };

    const { headers, missing } = resolveHeaders(service.headers, ctx.env);
    if (missing.length > 0) {
        return { id: service.id, status: STATUS.SKIPPED, reason: `missing environment variable ${missing.join(', ')}` };
    }

    let result;
    for (let tries = 0; tries <= service.retries; tries++) {
        result = await attempt(service, headers, ctx);
        if (result.outcome !== 'fail') break;
        if (tries < service.retries) await ctx.sleep(service.retryDelayMs);
    }

    let status = STATUS.OUTAGE;
    if (result.outcome === 'degraded') status = STATUS.DEGRADED;
    if (result.outcome === 'ok') status = result.responseTimeMs > service.degradedMs ? STATUS.DEGRADED : STATUS.OPERATIONAL;

    return {
        id: service.id,
        status,
        responseTimeMs: result.responseTimeMs,
        checkedAt: ctx.now().toISOString(),
        metrics: result.metrics ?? {},
        reason: result.reason ?? (status === STATUS.DEGRADED ? 'slow response' : undefined)
    };
}

async function probeAll(services, options = {}) {
    const own = services.filter(service => service.sameAs === undefined);
    const results = new Map((await Promise.all(own.map(service => probe(service, options)))).map(result => [result.id, result]));

    return services.map(service => {
        if (service.sameAs === undefined) return results.get(service.id);
        return { ...results.get(service.sameAs), id: service.id };
    });
}

module.exports = { probe, probeAll, resolveHeaders, getPath, STATUS };