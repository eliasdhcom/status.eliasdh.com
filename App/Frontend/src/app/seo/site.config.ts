/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

export const SITE_URL = 'https://status.eliasdh.com';
export const MAIN_SITE_URL = 'https://eliasdh.com';

export const LANGUAGES = ['nl', 'fr', 'en', 'de', 'es'] as const;
export type Language = typeof LANGUAGES[number];

export const DEFAULT_LANGUAGE: Language = 'nl';
export const PREFIXED_LANGUAGES: Language[] = LANGUAGES.filter(l => l !== DEFAULT_LANGUAGE);

export const LANGUAGE_NAMES: Record<Language, string> = {
    nl: 'Nederlands',
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
    es: 'Español'
};

export const LOCALES: Record<Language, string> = {
    nl: 'nl-BE',
    fr: 'fr-BE',
    en: 'en-GB',
    de: 'de-DE',
    es: 'es-ES'
};

export function isLanguage(value: string | null | undefined): value is Language {
    return !!value && (LANGUAGES as readonly string[]).includes(value);
}

export function splitLanguage(url: string): { lang: Language; path: string } {
    const match = /^\/([a-z]{2})(?=\/|\?|#|$)(.*)$/.exec(url);
    if (match && isLanguage(match[1]) && match[1] !== DEFAULT_LANGUAGE) {
        const rest = match[2];
        return { lang: match[1], path: rest.startsWith('/') ? rest : `/${rest}` };
    }
    return { lang: DEFAULT_LANGUAGE, path: url || '/' };
}

export function localizePath(path: string, lang: Language): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (lang === DEFAULT_LANGUAGE) return normalized;
    return normalized === '/' ? `/${lang}` : `/${lang}${normalized.replace(/^\/(?=[?#])/, '')}`;
}

export function absoluteUrl(path: string): string {
    return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function alternateUrls(path: string): Record<Language, string> {
    const bare = path.split(/[?#]/)[0] || '/';
    return Object.fromEntries(
        LANGUAGES.map(l => [l, absoluteUrl(localizePath(bare, l))])
    ) as Record<Language, string>;
}

export function mainSiteUrl(path: string, lang: Language): string {
    const localized = localizePath(path, lang);
    return localized === '/' ? `${MAIN_SITE_URL}/` : `${MAIN_SITE_URL}${localized}`;
}