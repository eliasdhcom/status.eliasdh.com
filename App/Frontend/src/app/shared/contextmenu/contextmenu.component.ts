/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, HostListener, ElementRef, afterNextRender } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { safeSetPreference } from '../../services/safe-storage';

const MENU_WIDTH = 230;
const MENU_HEIGHT = 150;
const EDGE = 8;

@Component({
    selector: 'app-contextmenu',
    templateUrl: './contextmenu.component.html',
    styleUrls: ['./contextmenu.component.css'],
    imports: [TranslatePipe, CommonModule],
    standalone: true
})
export class ContextMenuComponent {
    selectedText: string = '';
    contextMenuVisible: boolean = false;
    position = { top: '0px', left: '0px' };

    constructor(private elementRef: ElementRef) {
        afterNextRender(() => document.body.appendChild(this.elementRef.nativeElement));
    }

    @HostListener('document:contextmenu', ['$event'])
    onRightClick(event: MouseEvent): void {
        if (window.innerWidth < 768) return;

        event.preventDefault();
        this.selectedText = window.getSelection()?.toString() || '';

        const left = Math.max(EDGE, Math.min(event.clientX, window.innerWidth - MENU_WIDTH - EDGE));
        const top = Math.max(EDGE, Math.min(event.clientY, window.innerHeight - MENU_HEIGHT - EDGE));
        this.position = { top: `${top}px`, left: `${left}px` };

        this.contextMenuVisible = true;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) this.contextMenuVisible = false;
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.contextMenuVisible = false;
    }

    copyLinkAddress(): void {
        navigator.clipboard.writeText(window.location.href);
        this.contextMenuVisible = false;
    }

    copySelectedText(): void {
        navigator.clipboard.writeText(this.selectedText);
        this.contextMenuVisible = false;
    }

    toggleTheme(): void {
        const htmlElement = document.documentElement;
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', newTheme);
        safeSetPreference('theme', newTheme);
        this.contextMenuVisible = false;
    }
}