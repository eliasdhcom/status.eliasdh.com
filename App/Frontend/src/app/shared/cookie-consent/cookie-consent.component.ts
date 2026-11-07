import { Component, PLATFORM_ID, computed, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ConsentService } from '../../services/consent.service';
import { LanguageService } from '../../services/language.service';
import { mainSiteUrl } from '../../seo/site.config';

@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './cookie-consent.component.html',
    styleUrls: ['./cookie-consent.component.css']
})

export class CookieConsentComponent {
    private readonly consent = inject(ConsentService);
    private readonly language = inject(LanguageService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    readonly visible = computed(() =>
        this.isBrowser && (this.consent.reopened() || this.consent.status() === null));

    mainSite(path: string): string {
        return mainSiteUrl(path, this.language.current);
    }

    accept(): void {
        this.consent.accept();
    }

    decline(): void {
        this.consent.decline();
    }
}
