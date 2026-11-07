/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { safeGetItem, safeSetPreference } from './safe-storage';
import { DEFAULT_LANGUAGE, Language, isLanguage, localizePath, splitLanguage } from '../seo/site.config';

const PREFERENCE_KEY = 'language';

@Injectable({
    providedIn: 'root'
})

export class LanguageService {
    private readonly translate = inject(TranslateService);
    private readonly router = inject(Router);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private currentLanguage: Language = DEFAULT_LANGUAGE;

    get current(): Language {
        return this.currentLanguage;
    }

    use(lang: Language): Observable<Language> {
        this.currentLanguage = lang;
        return this.translate.use(lang).pipe(map(() => lang));
    }

    localize(path: string): string {
        return localizePath(path, this.currentLanguage);
    }

    switchTo(lang: Language): void {
        if (this.isBrowser) safeSetPreference(PREFERENCE_KEY, lang);
        if (lang === this.currentLanguage) return;
        const { path } = splitLanguage(this.router.url);
        this.router.navigateByUrl(localizePath(path, lang));
    }

    redirectToPreferredLanguage(): void {
        if (!this.isBrowser || this.currentLanguage !== DEFAULT_LANGUAGE) return;
        const preferred = safeGetItem(PREFERENCE_KEY);
        if (!isLanguage(preferred) || preferred === DEFAULT_LANGUAGE) return;
        const { path } = splitLanguage(this.router.url);
        this.router.navigateByUrl(localizePath(path, preferred), { replaceUrl: true });
    }
}