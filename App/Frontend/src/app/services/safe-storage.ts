/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 10/09/2026
**/

export function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeSetItem(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {}
}

export function safeRemoveItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {}
}

export const CONSENT_KEY = 'cookieConsent';

export function consentGiven(): boolean {
    return safeGetItem(CONSENT_KEY) === 'accepted';
}

export function safeSetPreference(key: string, value: string): void {
    if (consentGiven()) safeSetItem(key, value);
}
