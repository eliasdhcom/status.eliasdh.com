/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const { lastDays, uptimePercent } = require('./history');
const { STATUS } = require('./probe');

const REPORT_VERSION = 1;
const BAR_DAYS = 90;
const INCIDENT_DAYS = 30;
const MAX_REPORT_INCIDENTS = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

function overallStatus(services) {
    if (services.some(service => service.status === STATUS.OUTAGE)) return STATUS.OUTAGE;
    if (services.some(service => service.status === STATUS.DEGRADED)) return STATUS.DEGRADED;
    return STATUS.OPERATIONAL;
}

function buildReport(config, history, results, now = new Date()) {
    const resultById = new Map(results.map(result => [result.id, result]));
    const barDays = lastDays(now, BAR_DAYS);

    const services = config.services
        .filter(service => {
            const result = resultById.get(service.id);
            return result && result.status !== STATUS.SKIPPED;
        })
        .map(service => {
            const result = resultById.get(service.id);
            const days = history.services[service.id]?.days ?? {};
            const entry = {
                id: service.id,
                name: service.name,
                group: service.group,
                status: result.status,
                responseTimeMs: result.responseTimeMs ?? null,
                checkedAt: result.checkedAt,
                uptime: {
                    days30: uptimePercent(days, barDays.slice(-30)),
                    days90: uptimePercent(days, barDays)
                },
                days: barDays.map(date => ({ date, ...(days[date] ?? { up: 0, degraded: 0, down: 0 }) }))
            };
            if (Object.keys(result.metrics ?? {}).length > 0) entry.metrics = result.metrics;
            return entry;
        });

    const includedIds = new Set(services.map(service => service.id));
    const cutoff = now.getTime() - INCIDENT_DAYS * DAY_MS;
    const incidents = history.incidents
        .filter(incident => includedIds.has(incident.serviceId))
        .filter(incident => !incident.resolvedAt || new Date(incident.resolvedAt).getTime() >= cutoff)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, MAX_REPORT_INCIDENTS);

    return {
        version: REPORT_VERSION,
        generatedAt: now.toISOString(),
        intervalMinutes: config.intervalMinutes,
        overall: overallStatus(services),
        groups: config.groups.filter(group => services.some(service => service.group === group.id)),
        services,
        incidents
    };
}

module.exports = { buildReport, overallStatus, REPORT_VERSION, BAR_DAYS };