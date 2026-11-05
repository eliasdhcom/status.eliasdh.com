/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

const { emptyHistory, lastDays } = require('./history');
const { STATUS } = require('./probe');

const CHECKS_PER_DAY = 288;

function random(seed) {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

function buildDemoHistory(config, now = new Date()) {
    const history = emptyHistory();
    const days = lastDays(now, 90);
    const rand = random(42);

    config.services.forEach((service, serviceIndex) => {
        const buckets = {};
        days.forEach((day, dayIndex) => {
            const isToday = dayIndex === days.length - 1;
            let down = 0;
            let degraded = 0;
            if (!isToday && dayIndex === 20 + serviceIndex * 9) down = 36;
            if (!isToday && dayIndex === 55 + serviceIndex * 4) degraded = 18;
            if (rand() < 0.04) degraded += 1;
            const total = isToday ? Math.floor(CHECKS_PER_DAY / 3) : CHECKS_PER_DAY;
            buckets[day] = { up: total - down - degraded, degraded, down };
        });
        history.services[service.id] = { days: buckets };
    });

    const first = config.services[0];
    const hoursAgo = hours => new Date(now.getTime() - hours * 3600 * 1000).toISOString();
    history.incidents.push(
        { serviceId: first.id, status: STATUS.OUTAGE, startedAt: hoursAgo(24 * 20 + 6), resolvedAt: hoursAgo(24 * 20 + 3) },
        { serviceId: first.id, status: STATUS.DEGRADED, startedAt: hoursAgo(26), resolvedAt: hoursAgo(25) }
    );
    return history;
}

function buildDemoResults(config, now = new Date()) {
    return config.services.map((service, index) => ({
        id: service.id,
        status: STATUS.OPERATIONAL,
        responseTimeMs: 140 + index * 63,
        checkedAt: now.toISOString(),
        metrics: service.metrics ? { nodesReady: 3, nodesTotal: 3 } : {}
    }));
}

module.exports = { buildDemoHistory, buildDemoResults };