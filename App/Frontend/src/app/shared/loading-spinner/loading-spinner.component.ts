/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.component.html',
    styleUrls: ['./loading-spinner.component.css'],
    imports: [NgIf, TranslatePipe],
    standalone: true
})

export class LoadingSpinnerComponent {
    @Input() messageKey: string = '';
    @Input() overlay: boolean = false;
}