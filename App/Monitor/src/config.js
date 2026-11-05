/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const fs = require('node:fs');

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const BUILT_IN_DEFAULTS = {
    type: 'http',
    method: 'GET',
    expectStatus: [200],
    timeoutMs: 10000,
    degradedMs: 3000,
    retries: 2,
    retryDelayMs: 5000
};

function fail(message) {
    throw new Error(`Invalid monitor configuration: ${message}`);
}

function validateService(service, groupIds, seen) {
    if (!service || typeof service !== 'object') fail('every service must be an object');
    if (!ID_PATTERN.test(service.id ?? '')) fail(`service id "${service.id}" must be lowercase letters, digits and dashes`);
    if (seen.has(service.id)) fail(`duplicate service id "${service.id}"`);
    seen.add(service.id);
    if (typeof service.name !== 'string' || !service.name.trim()) fail(`service "${service.id}" needs a name`);
    if (!groupIds.has(service.group)) fail(`service "${service.id}" uses unknown group "${service.group}"`);

    if (service.sameAs !== undefined) return;

    for (const key of ['timeoutMs', 'degradedMs', 'retries', 'retryDelayMs']) {
        if (!Number.isInteger(service[key]) || service[key] < 0) fail(`service "${service.id}" ${key} must be a non-negative integer`);
    }

    if (service.type === 'tls') {
        if (!Array.isArray(service.targets) || service.targets.length === 0) fail(`service "${service.id}" needs at least one target`);
        for (const target of service.targets) {
            if (typeof target.host !== 'string' || !target.host.trim()) fail(`service "${service.id}" has a target without host`);
            if (!Number.isInteger(target.port) || target.port < 1 || target.port > 65535) fail(`service "${service.id}" has a target with an invalid port`);
        }
        return;
    }
    if (service.type !== 'http') fail(`service "${service.id}" has unknown type "${service.type}"`);

    let url;
    try {
        url = new URL(service.url);
    } catch {
        fail(`service "${service.id}" has an invalid url`);
    }
    if (url.protocol !== 'https:') fail(`service "${service.id}" must use https`);

    if (!Array.isArray(service.expectStatus) || !service.expectStatus.every(Number.isInteger)) {
        fail(`service "${service.id}" expectStatus must be a list of status codes`);
    }
}

function validateDerived(services) {
    const byId = new Map(services.map(service => [service.id, service]));
    for (const service of services.filter(item => item.sameAs !== undefined)) {
        const source = byId.get(service.sameAs);
        if (!source) fail(`service "${service.id}" copies unknown service "${service.sameAs}"`);
        if (source.sameAs !== undefined) fail(`service "${service.id}" cannot copy "${source.id}", which is derived itself`);
    }
}

function normalizeConfig(raw) {
    if (!raw || typeof raw !== 'object') fail('the file must contain an object');
    if (!Array.isArray(raw.groups) || raw.groups.length === 0) fail('at least one group is required');
    if (!Array.isArray(raw.services) || raw.services.length === 0) fail('at least one service is required');

    const groupIds = new Set();
    for (const group of raw.groups) {
        if (!ID_PATTERN.test(group?.id ?? '')) fail(`group id "${group?.id}" must be lowercase letters, digits and dashes`);
        if (groupIds.has(group.id)) fail(`duplicate group id "${group.id}"`);
        groupIds.add(group.id);
    }

    const defaults = { ...BUILT_IN_DEFAULTS, ...(raw.defaults ?? {}) };
    const seen = new Set();
    const services = raw.services.map(service => {
        const merged = { ...defaults, ...service };
        validateService(merged, groupIds, seen);
        return merged;
    });
    validateDerived(services);

    return {
        intervalMinutes: Number.isInteger(raw.intervalMinutes) && raw.intervalMinutes > 0 ? raw.intervalMinutes : 5,
        groups: raw.groups.map(({ id, name }) => ({ id, name: name ?? id })),
        services
    };
}

function loadConfig(filePath) {
    return normalizeConfig(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

module.exports = { loadConfig, normalizeConfig, BUILT_IN_DEFAULTS };