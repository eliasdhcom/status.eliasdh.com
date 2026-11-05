/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 03/06/2026
**/

import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { safeGetItem, safeSetItem } from './safe-storage';

@Injectable({
    providedIn: 'root'
})

export class ThemeService {
    private isDark: boolean = false;

    constructor(@Inject(DOCUMENT) private document: Document) { }

    initTheme(): void {
        const saved = typeof localStorage !== 'undefined' ? safeGetItem('theme') : null;
        const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        this.isDark = saved ? saved === 'dark' : prefersDark;
        this.applyTheme();
    }

    toggleTheme(): void {
        this.isDark = !this.isDark;
        safeSetItem('theme', this.isDark ? 'dark' : 'light');
        this.applyTheme();
    }

    get isDarkMode(): boolean {
        return this.isDark;
    }

    private applyTheme(): void {
        this.document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    }
}