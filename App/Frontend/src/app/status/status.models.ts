/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

export type ServiceStatus = 'operational' | 'degraded' | 'outage';
export type DayLevel = 'ok' | 'degraded' | 'down' | 'none';

export interface DayBucket {
    date: string;
    up: number;
    degraded: number;
    down: number;
}

export interface ServiceMetrics {
    nodesReady?: number;
    nodesTotal?: number;
}

export interface ServiceReport {
    id: string;
    name: string;
    group: string;
    status: ServiceStatus;
    responseTimeMs: number | null;
    checkedAt: string;
    uptime: { days30: number | null; days90: number | null };
    days: DayBucket[];
    metrics?: ServiceMetrics;
}

export interface IncidentReport {
    serviceId: string;
    status: Exclude<ServiceStatus, 'operational'>;
    startedAt: string;
    resolvedAt: string | null;
}

export interface GroupReport {
    id: string;
    name: string;
}

export interface StatusReport {
    version: number;
    generatedAt: string | null;
    intervalMinutes: number;
    overall: ServiceStatus;
    groups: GroupReport[];
    services: ServiceReport[];
    incidents: IncidentReport[];
}

export function dayLevel(day: DayBucket): DayLevel {
    const total = day.up + day.degraded + day.down;
    if (total === 0) return 'none';
    if (day.down / total >= 0.01) return 'down';
    if (day.down > 0 || day.degraded / total >= 0.02) return 'degraded';
    return 'ok';
}

export function dayAvailability(day: DayBucket): number | null {
    const total = day.up + day.degraded + day.down;
    if (total === 0) return null;
    return Math.floor(((day.up + day.degraded) / total) * 10000) / 100;
}