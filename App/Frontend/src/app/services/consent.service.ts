/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/11/2026
**/

import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CONSENT_KEY, safeGetItem, safeRemoveItem, safeSetItem } from './safe-storage';

export type ConsentStatus = 'accepted' | 'declined' | null;

const OPTIONAL_KEYS = ['language', 'theme'];

@Injectable({ providedIn: 'root' })
export class ConsentService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly externalForSession = signal(false);

    readonly status = signal<ConsentStatus>(this.read());
    readonly reopened = signal(false);
    readonly externalAllowed = computed(() => this.status() === 'accepted' || this.externalForSession());

    get accepted(): boolean {
        return this.status() === 'accepted';
    }

    accept(): void {
        safeSetItem(CONSENT_KEY, 'accepted');
        this.status.set('accepted');
        this.reopened.set(false);
    }

    decline(): void {
        safeSetItem(CONSENT_KEY, 'declined');
        OPTIONAL_KEYS.forEach(safeRemoveItem);
        this.status.set('declined');
        this.externalForSession.set(false);
        this.reopened.set(false);
    }

    reopen(): void {
        this.reopened.set(true);
    }

    allowExternalForSession(): void {
        this.externalForSession.set(true);
    }

    private read(): ConsentStatus {
        if (!this.isBrowser) return null;
        const value = safeGetItem(CONSENT_KEY);
        return value === 'accepted' || value === 'declined' ? value : null;
    }
}
