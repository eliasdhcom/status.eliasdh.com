/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';
import { SeoService } from './seo/seo.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})

export class AppComponent {
    private router = inject(Router);
    private themeService = inject(ThemeService);
    private languageService = inject(LanguageService);
    private seoService = inject(SeoService);

    constructor() {
        this.themeService.initTheme();
        this.seoService.init();
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            take(1)
        ).subscribe(() => this.languageService.redirectToPreferredLanguage());
    }
}