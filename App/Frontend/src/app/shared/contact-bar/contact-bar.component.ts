/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, OnDestroy, HostListener, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { TranslatePipe } from "@ngx-translate/core";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { LANGUAGES, LANGUAGE_NAMES, Language } from '../../seo/site.config';

@Component({
    selector: 'app-contact-bar',
    templateUrl: './contact-bar.component.html',
    styleUrls: ['./contact-bar.component.css'],
    imports: [TranslatePipe, CommonModule],
    standalone: true
})

export class ContactBarComponent implements OnInit, OnDestroy {
    dropdownOpen: boolean = false;
    currentLanguage: Language = 'nl';
    visible: boolean = true;

    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly idleDelay = 2500;
    private lastMouseMoveHandled = 0;
    private readonly mouseMoveThrottle = 150;

    settingsConfig = {
        languages: LANGUAGES.map(code => ({ code, name: LANGUAGE_NAMES[code] }))
    };

    private readonly platformId = inject(PLATFORM_ID);

    constructor(private languageService: LanguageService, private elementRef: ElementRef) { }

    ngOnInit(): void {
        this.currentLanguage = this.languageService.current;
        this.resetIdleTimer();
    }

    ngOnDestroy(): void {
        if (this.idleTimer) clearTimeout(this.idleTimer);
    }

    private resetIdleTimer(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.visible = true;
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            if (!this.dropdownOpen) this.visible = false;
        }, this.idleDelay);
    }

    @HostListener('window:scroll')
    @HostListener('window:touchstart')
    @HostListener('window:pointerdown')
    @HostListener('focusin')
    onUserActivity(): void {
        this.resetIdleTimer();
    }

    @HostListener('window:mousemove')
    onMouseMove(): void {
        const now = Date.now();
        if (now - this.lastMouseMoveHandled < this.mouseMoveThrottle) return;
        this.lastMouseMoveHandled = now;
        this.resetIdleTimer();
    }

    changeLanguage(languageCode: Language) {
        this.dropdownOpen = false;
        this.languageService.switchTo(languageCode);
    }

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const clickTarget = event.target as HTMLElement;
        const isClickInsideDropdown = this.elementRef.nativeElement.contains(clickTarget);
        
        if (!isClickInsideDropdown && this.dropdownOpen) {
            this.dropdownOpen = false;
        }
    }
}