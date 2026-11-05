/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { LOCALES, Language } from '../seo/site.config';

export function formatDate(iso: string, lang: Language): string {
    return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatDateTime(iso: string, lang: Language): string {
    return new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatPercent(value: number | null, lang: Language): string {
    if (value === null) return '—';
    return `${new Intl.NumberFormat(LOCALES[lang], { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)}%`;
}

export function formatDuration(startedAt: string, resolvedAt: string | null, now: Date, lang: Language): string {
    const end = resolvedAt ? new Date(resolvedAt) : now;
    const minutes = Math.max(1, Math.round((end.getTime() - new Date(startedAt).getTime()) / 60000));
    const unit = (value: number, name: 'day' | 'hour' | 'minute') =>
        new Intl.NumberFormat(LOCALES[lang], { style: 'unit', unit: name, unitDisplay: 'short' }).format(value);

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const rest = minutes % 60;
    if (days > 0) return [unit(days, 'day'), hours > 0 ? unit(hours, 'hour') : ''].filter(Boolean).join(' ');
    if (hours > 0) return [unit(hours, 'hour'), rest > 0 ? unit(rest, 'minute') : ''].filter(Boolean).join(' ');
    return unit(minutes, 'minute');
}