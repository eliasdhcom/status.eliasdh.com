/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 13/11/2026
**/

import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ConsentService } from '../../services/consent.service';

/**
 * Mounts the shared EliasDH cookie banner (served by eliasdh.com, see ConsentService)
 * and keeps its language in sync with the site.
 */
@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    template: ''
})

export class CookieConsentComponent {
    constructor() {
        const consent = inject(ConsentService);
        const translate = inject(TranslateService);
        if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

        const current = translate.getCurrentLang() || translate.getFallbackLang();
        if (current) consent.configure({ lang: current });
        translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(event => consent.configure({ lang: event.lang }));
    }
}
