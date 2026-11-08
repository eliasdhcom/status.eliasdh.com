import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CONSENT_KEY, safeGetItem, safeRemoveItem, safeSetItem } from './safe-storage';

export type ConsentStatus = 'accepted' | 'declined' | null;

const OPTIONAL_KEYS = ['language', 'theme'];

const TRACKER_URL = 'https://app.eliasdh.com/api/v1/stats/t.js';

@Injectable({ providedIn: 'root' })
export class ConsentService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly externalForSession = signal(false);

    readonly status = signal<ConsentStatus>(this.read());
    readonly reopened = signal(false);
    readonly externalAllowed = computed(() => this.status() === 'accepted' || this.externalForSession());

    constructor() {
        this.syncTracker();
    }

    get accepted(): boolean {
        return this.status() === 'accepted';
    }

    accept(): void {
        safeSetItem(CONSENT_KEY, 'accepted');
        this.status.set('accepted');
        this.reopened.set(false);
        this.syncTracker();
    }

    decline(): void {
        safeSetItem(CONSENT_KEY, 'declined');
        OPTIONAL_KEYS.forEach(safeRemoveItem);
        this.status.set('declined');
        this.externalForSession.set(false);
        this.reopened.set(false);
        this.syncTracker();
    }

    reopen(): void {
        this.reopened.set(true);
    }

    allowExternalForSession(): void {
        this.externalForSession.set(true);
    }

    private syncTracker(): void {
        if (!this.isBrowser) return;
        const tracker = (window as any).__eliasdhStats;
        if (this.status() !== 'accepted') {
            tracker?.stop();
            return;
        }
        if (tracker) {
            tracker.start();
            return;
        }
        if (document.querySelector('script[data-eliasdh-stats]')) return;
        const script = document.createElement('script');
        script.src = TRACKER_URL;
        script.async = true;
        script.setAttribute('data-eliasdh-stats', '');
        document.head.appendChild(script);
    }

    private read(): ConsentStatus {
        if (!this.isBrowser) return null;
        const value = safeGetItem(CONSENT_KEY);
        return value === 'accepted' || value === 'declined' ? value : null;
    }
}
