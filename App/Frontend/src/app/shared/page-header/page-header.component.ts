/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from "@ngx-translate/core";
import { LocalizePipe } from '../../seo/localize.pipe';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.css'],
    imports: [NgTemplateOutlet, TranslatePipe, RouterLink, LocalizePipe],
    standalone: true
})

export class PageHeaderComponent {
    @Input() titleKey: string = '';
    @Input() backLabelKey: string = '';
    @Input() backRoute: string = '/';
    @Input() backHref: string = '';
}