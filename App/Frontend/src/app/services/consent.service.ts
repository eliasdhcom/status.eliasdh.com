/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 13/11/2026
**/

import { Injectable, NgZone, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { CONSENT_KEY, safeGetItem, safeRemoveItem, safeSetItem } from './safe-storage';
import { CONSENT_CONFIG } from './consent.config';

export type ConsentStatus = 'accepted' | 'declined' | null;

/** What this website stores after consent; the shared banner builds its text from this. */
export type ConsentStoredItem = 'language' | 'theme' | 'display' | 'cart' | 'builder';

export interface ConsentBannerOptions {
    lang?: string;
    settingsButton?: boolean;
    enabled?: boolean;
}

export interface ConsentConfig extends ConsentBannerOptions {
    /** Shown in the banner text, so it must match what the site really stores. */
    store: ConsentStoredItem[];
    /** localStorage keys that are removed when the visitor declines. */
    optionalKeys: string[];
    /** The site shows a Google Maps embed (only after consent, see ConsentEmbedComponent). */
    maps?: boolean;
    /** Load the EliasDH visit counter after consent: true for the default URL, or the script URL. */
    stats?: boolean | string;
    /** Where the shared banner is loaded from; defaults to eliasdh.com. */
    scriptUrl?: string;
}

interface SharedConsent {
    init(options: object): void;
    status(): ConsentStatus;
    accept(): void;
    decline(): void;
    set(status: 'accepted' | 'declined'): void;
    open(): void;
    subscribe(listener: (status: ConsentStatus) => void): () => void;
}

/** The cookie banner is the same for every EliasDH website and is served by eliasdh.com. */
export const CONSENT_SCRIPT_URL = 'https://eliasdh.com/assets/consent/consent.js';

@Injectable({ providedIn: 'root' })
export class ConsentService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly zone = inject(NgZone);
    private readonly externalForSession = signal(false);
    private readonly options: ConsentBannerOptions = {};
    private shared: SharedConsent | null = null;
    private silent = false;

    readonly status = signal<ConsentStatus>(this.read());
    readonly externalAllowed = computed(() => this.status() === 'accepted' || this.externalForSession());
    readonly changes$ = new Subject<void>();

    constructor() {
        if (this.isBrowser) this.load();
    }

    get accepted(): boolean {
        return this.status() === 'accepted';
    }

    accept(): void {
        if (this.shared) this.shared.accept();
        else this.choose('accepted');
    }

    decline(): void {
        if (this.shared) this.shared.decline();
        else this.choose('declined');
    }

    reopen(): void {
        this.shared?.open();
    }

    allowExternalForSession(): void {
        this.externalForSession.set(true);
    }

    /** Takes over a choice made elsewhere (for example on another kiosk screen) without asking again. */
    applyShared(value: string | null): void {
        if ((value !== 'accepted' && value !== 'declined') || this.status() === value) return;
        this.silent = true;
        try {
            if (this.shared) this.shared.set(value);
            else this.choose(value);
        } finally {
            this.silent = false;
        }
    }

    /** Runtime banner options, such as the current language. */
    configure(options: ConsentBannerOptions): void {
        Object.assign(this.options, options);
        this.shared?.init(options);
    }

    private load(): void {
        const w = window as unknown as { EliasDHConsent?: SharedConsent };
        if (w.EliasDHConsent) {
            this.attach(w.EliasDHConsent);
            return;
        }
        window.addEventListener('eliasdh-consent-ready', () => this.attach(w.EliasDHConsent), { once: true });
        if (document.querySelector('script[data-eliasdh-consent]')) return;
        const script = document.createElement('script');
        script.src = CONSENT_CONFIG.scriptUrl ?? CONSENT_SCRIPT_URL;
        script.async = true;
        script.setAttribute('data-eliasdh-consent', '');
        document.head.appendChild(script);
    }

    private attach(shared: SharedConsent | undefined): void {
        if (!shared || this.shared) return;
        this.shared = shared;
        shared.subscribe(status => this.zone.run(() => this.update(status)));
        const { scriptUrl, ...banner } = CONSENT_CONFIG;
        shared.init({ ...banner, ...this.options });
        this.update(shared.status());
    }

    private choose(status: 'accepted' | 'declined'): void {
        safeSetItem(CONSENT_KEY, status);
        if (status === 'declined') CONSENT_CONFIG.optionalKeys.forEach(safeRemoveItem);
        this.update(status);
    }

    private update(status: ConsentStatus): void {
        if (status === this.status()) return;
        this.status.set(status);
        if (status !== 'accepted') this.externalForSession.set(false);
        if (!this.silent) this.changes$.next();
    }

    private read(): ConsentStatus {
        if (!this.isBrowser) return null;
        const value = safeGetItem(CONSENT_KEY);
        return value === 'accepted' || value === 'declined' ? value : null;
    }
}
