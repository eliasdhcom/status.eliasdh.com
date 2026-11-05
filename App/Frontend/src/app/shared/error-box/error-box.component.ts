/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/02/2026
**/

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'app-error-box',
    templateUrl: './error-box.component.html',
    styleUrls: ['./error-box.component.css'],
    imports: [NgIf, TranslatePipe],
    standalone: true
})

export class ErrorBoxComponent {
    @Input() errorMessage: string = '';
    @Input() retryButtonKey: string = '';
    @Input() overlay: boolean = false;
    @Output() retry = new EventEmitter<void>();

    onRetry(): void {
        this.retry.emit();
    }
}