/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { safeSetItem } from '../../services/safe-storage';

@Component({
    selector: 'app-contextmenu',
    templateUrl: './contextmenu.component.html',
    styleUrls: ['./contextmenu.component.css'],
    imports: [TranslatePipe, CommonModule],
    standalone: true
})
export class ContextMenuComponent implements OnInit {
    selectedText: string = '';
    contextMenuVisible: boolean = false;
    position = { top: '0px', left: '0px' };

    constructor(private elementRef: ElementRef) {}

    ngOnInit(): void {}

    @HostListener('document:contextmenu', ['$event'])
    onRightClick(event: MouseEvent): void {
        if (window.innerWidth < 768) return;

        event.preventDefault();
        this.selectedText = window.getSelection()?.toString() || '';

        this.position = {
            top: `${event.clientY + window.scrollY}px`,
            left: `${event.clientX + window.scrollX}px`
        };

        this.contextMenuVisible = true;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) this.contextMenuVisible = false;
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
        safeSetItem('theme', newTheme);
        this.contextMenuVisible = false;
    }
}