/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 19/11/2026
**/

import { Language, mainSiteUrl } from '../../seo/site.config';

export type ServiceSlug = 'web' | 'mail' | 'domains' | 'webapps' | 'pwa' | 'mobile' | 'api';
export type ServiceGroup = 'presence' | 'build';

export interface ServiceDef {
    slug: ServiceSlug;
    key: string;
    group: ServiceGroup;
    icon: string[];
}

export const SERVICES: ServiceDef[] = [
    {
        slug: 'web',
        key: 'WEB',
        group: 'presence',
        icon: ['M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 17v4']
    },
    {
        slug: 'mail',
        key: 'MAIL',
        group: 'presence',
        icon: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'm22 7-10 6L2 7']
    },
    {
        slug: 'domains',
        key: 'DOMAINS',
        group: 'presence',
        icon: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M2 12h20', 'M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z']
    },
    {
        slug: 'webapps',
        key: 'WEBAPPS',
        group: 'build',
        icon: ['M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M3 9h18', 'M9 21V9']
    },
    {
        slug: 'pwa',
        key: 'PWA',
        group: 'build',
        icon: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14']
    },
    {
        slug: 'mobile',
        key: 'MOBILE',
        group: 'build',
        icon: ['M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M11 18h2']
    },
    {
        slug: 'api',
        key: 'API',
        group: 'build',
        icon: ['m8 6-6 6 6 6', 'm16 6 6 6-6 6', 'm14 4-4 16']
    }
];

export const SERVICE_GROUPS: { id: ServiceGroup; labelKey: string }[] = [
    { id: 'presence', labelKey: 'SERVICES.GROUP_PRESENCE' },
    { id: 'build', labelKey: 'SERVICES.GROUP_BUILD' }
];

export function servicePath(slug: ServiceSlug): string {
    return `/services/${slug}`;
}

export function serviceUrl(slug: ServiceSlug, lang: Language): string {
    return mainSiteUrl(servicePath(slug), lang);
}

export function serviceBySlug(slug: string | null | undefined): ServiceDef | undefined {
    return SERVICES.find(service => service.slug === slug);
}