/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { LocalizePipe } from '../seo/localize.pipe';
import { LanguageService } from '../services/language.service';
import { mainSiteUrl } from '../seo/site.config';

@Component({
    selector: 'app-notfound',
    templateUrl: './notfound.component.html',
    imports: [SharedModule, RouterLink, TranslatePipe, LocalizePipe],
    standalone: true
})

export class NotFoundComponent {
    private language = inject(LanguageService);

    mainSiteHome(): string {
        return mainSiteUrl('/', this.language.current);
    }
}