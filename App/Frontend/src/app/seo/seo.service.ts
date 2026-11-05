/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../services/language.service';
import { LANGUAGES, LOCALES, Language, alternateUrls, DEFAULT_LANGUAGE, splitLanguage } from './site.config';

const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

@Injectable({ providedIn: 'root' })
export class SeoService {
    private readonly router = inject(Router);
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);
    private readonly translate = inject(TranslateService);
    private readonly language = inject(LanguageService);
    private readonly document = inject(DOCUMENT);

    init(): void {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.applyRoute());
    }

    private applyRoute(): void {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;

        const lang = this.language.current;
        const bare = splitLanguage(this.router.url).path.split(/[?#]/)[0] || '/';
        const alternates = alternateUrls(bare);
        const indexable = !route.data['robots'];
        const title = route.data['title'] ?? 'EliasDH Status';
        const description = this.translate.instant(`SEO.${route.data['seo'] ?? 'STATUS'}.DESCRIPTION`);
        const canonical = alternates[lang];

        this.document.documentElement.setAttribute('lang', lang);
        this.title.setTitle(title);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ name: 'robots', content: route.data['robots'] ?? DEFAULT_ROBOTS });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:url', content: canonical });
        this.meta.updateTag({ property: 'og:locale', content: this.ogLocale(lang) });
        this.meta.getTags('property="og:locale:alternate"').forEach(tag => this.meta.removeTagElement(tag));
        this.meta.addTags(LANGUAGES.filter(l => l !== lang).map(l => ({ property: 'og:locale:alternate', content: this.ogLocale(l) })));
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        this.setCanonical(canonical);
        this.setAlternates(indexable ? alternates : null);
    }

    private ogLocale(lang: Language): string {
        return LOCALES[lang].replace('-', '_');
    }

    private setCanonical(url: string): void {
        let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    private setAlternates(alternates: Record<Language, string> | null): void {
        this.document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
        if (!alternates) return;
        const entries: [string, string][] = [...LANGUAGES.map(l => [l, alternates[l]] as [string, string]), ['x-default', alternates[DEFAULT_LANGUAGE]]];
        for (const [hreflang, href] of entries) {
            const link = this.document.createElement('link');
            link.setAttribute('rel', 'alternate');
            link.setAttribute('hreflang', hreflang);
            link.setAttribute('href', href);
            this.document.head.appendChild(link);
        }
    }
}