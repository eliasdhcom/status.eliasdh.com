/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { DayBucket, DayLevel, ServiceReport, dayAvailability, dayLevel } from '../status.models';
import { formatDate, formatPercent } from '../format';

const WIDE_DAYS = 90;
const NARROW_DAYS = 45;
const NARROW_BREAKPOINT = 600;

@Component({
    selector: 'app-service-row',
    templateUrl: './service-row.component.html',
    styleUrls: ['./service-row.component.css'],
    imports: [TranslatePipe],
    standalone: true
})

export class ServiceRowComponent implements OnInit {
    @Input({ required: true }) service!: ServiceReport;

    private readonly translate = inject(TranslateService);
    private readonly language = inject(LanguageService);

    visibleDays = WIDE_DAYS;

    ngOnInit(): void {
        this.onResize();
    }

    @HostListener('window:resize')
    onResize(): void {
        this.visibleDays = window.innerWidth < NARROW_BREAKPOINT ? NARROW_DAYS : WIDE_DAYS;
    }

    get days(): DayBucket[] {
        return this.service.days.slice(-this.visibleDays);
    }

    get uptime(): string {
        return formatPercent(this.service.uptime.days90, this.language.current);
    }

    get uptimeLabel(): string {
        return this.translate.instant('STATUS.UPTIME_ARIA', { days: WIDE_DAYS, uptime: this.uptime });
    }

    get hasNodes(): boolean {
        return this.service.metrics?.nodesReady !== undefined && this.service.metrics?.nodesTotal !== undefined;
    }

    level(day: DayBucket): DayLevel {
        return dayLevel(day);
    }

    dayTitle(day: DayBucket): string {
        const date = formatDate(day.date, this.language.current);
        const availability = dayAvailability(day);
        const text = availability === null
            ? this.translate.instant('STATUS.DAY_NO_DATA')
            : this.translate.instant('STATUS.DAY_UPTIME', { uptime: formatPercent(availability, this.language.current) });
        return `${date}: ${text}`;
    }
}