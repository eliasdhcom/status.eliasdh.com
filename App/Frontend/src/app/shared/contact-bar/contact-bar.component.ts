/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, OnDestroy, HostListener, ElementRef, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { TranslatePipe } from "@ngx-translate/core";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { LANGUAGES, LANGUAGE_NAMES, Language } from '../../seo/site.config';
import { SERVICES, SERVICE_GROUPS, ServiceDef, ServiceGroup, ServiceSlug, serviceUrl } from '../service-diagram/service-catalog';
import { ServiceDiagramComponent } from '../service-diagram/service-diagram.component';

@Component({
    selector: 'app-contact-bar',
    templateUrl: './contact-bar.component.html',
    styleUrls: ['./contact-bar.component.css'],
    imports: [TranslatePipe, CommonModule, ServiceDiagramComponent],
    standalone: true
})

export class ContactBarComponent implements OnInit, OnDestroy {
    dropdownOpen: boolean = false;
    servicesOpen: boolean = false;
    activeService: ServiceSlug = 'web';
    readonly serviceGroups = SERVICE_GROUPS;
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

    @ViewChild('servicesButton') private servicesButton?: ElementRef<HTMLButtonElement>;

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
            if (!this.dropdownOpen && !this.servicesOpen) this.visible = false;
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
        if (this.dropdownOpen) this.servicesOpen = false;
    }

    servicesIn(group: ServiceGroup): ServiceDef[] {
        return SERVICES.filter(service => service.group === group);
    }

    serviceUrl(slug: ServiceSlug): string {
        return serviceUrl(slug, this.currentLanguage);
    }

    toggleServices(event: Event): void {
        event.stopPropagation();
        if (this.servicesOpen) {
            this.servicesOpen = false;
            return;
        }
        this.activeService = 'web';
        this.dropdownOpen = false;
        this.servicesOpen = true;
    }

    closeServices(restoreFocus: boolean = false): void {
        this.servicesOpen = false;
        if (restoreFocus) this.servicesButton?.nativeElement.focus();
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.servicesOpen) this.closeServices(true);
        this.dropdownOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        const clickTarget = event.target as HTMLElement;
        const isClickInsideDropdown = this.elementRef.nativeElement.contains(clickTarget);
        
        if (!isClickInsideDropdown) {
            this.dropdownOpen = false;
            this.servicesOpen = false;
        }
    }
}