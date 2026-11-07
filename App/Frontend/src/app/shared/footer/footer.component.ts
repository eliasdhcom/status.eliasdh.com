/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizePipe } from '../../seo/localize.pipe';
import { LanguageService } from '../../services/language.service';
import { mainSiteUrl } from '../../seo/site.config';
import { ConsentService } from '../../services/consent.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    imports: [TranslatePipe, RouterLink, LocalizePipe],
    standalone: true
})

export class FooterComponent implements OnInit {
    private readonly language = inject(LanguageService);
    private readonly consent = inject(ConsentService);
    currentYear: number = new Date().getFullYear();

    ngOnInit(): void {
        this.currentYear = new Date().getFullYear();
    }

    openCookieSettings(): void {
        this.consent.reopen();
    }

    mainSite(path: string): string {
        return mainSiteUrl(path, this.language.current);
    }
}