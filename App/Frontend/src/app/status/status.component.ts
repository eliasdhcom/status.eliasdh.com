/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusService } from '../services/status.service';
import { LanguageService } from '../services/language.service';
import { SharedModule } from '../shared/shared.module';
import { ServiceRowComponent } from './service-row/service-row.component';
import { GroupReport, IncidentReport, ServiceReport, StatusReport } from './status.models';
import { formatDateTime, formatDuration } from './format';
import { mainSiteUrl } from '../seo/site.config';

const STALE_AFTER_INTERVALS = 4;

@Component({
    selector: 'app-status',
    standalone: true,
    imports: [DatePipe, SharedModule, TranslatePipe, ServiceRowComponent],
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.css']
})

export class StatusComponent implements OnInit, OnDestroy {
    private statusService = inject(StatusService);
    private language = inject(LanguageService);
    private destroy$ = new Subject<void>();

    report: StatusReport | null = null;
    loading = true;
    error = false;
    now = new Date();

    get mainSiteHome(): string {
        return mainSiteUrl('/', this.language.current);
    }

    get hasData(): boolean {
        return !!this.report?.generatedAt && this.report.services.length > 0;
    }

    get operationalCount(): number {
        return this.report?.services.filter(service => service.status === 'operational').length ?? 0;
    }

    get minutesSinceUpdate(): number {
        if (!this.report?.generatedAt) return 0;
        return Math.max(0, Math.round((this.now.getTime() - new Date(this.report.generatedAt).getTime()) / 60000));
    }

    get stale(): boolean {
        return !!this.report?.generatedAt && this.minutesSinceUpdate > this.report.intervalMinutes * STALE_AFTER_INTERVALS;
    }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.statusService.watch()
            .pipe(takeUntil(this.destroy$))
            .subscribe(update => {
                this.now = new Date();
                this.loading = false;
                if (update.report) this.report = update.report;
                this.error = update.failed;
            });
    }

    retry(): void {
        this.destroy$.next();
        this.loading = true;
        this.error = false;
        this.load();
    }

    servicesOf(group: GroupReport): ServiceReport[] {
        return this.report?.services.filter(service => service.group === group.id) ?? [];
    }

    serviceName(incident: IncidentReport): string {
        return this.report?.services.find(service => service.id === incident.serviceId)?.name ?? incident.serviceId;
    }

    when(iso: string): string {
        return formatDateTime(iso, this.language.current);
    }

    duration(incident: IncidentReport): string {
        return formatDuration(incident.startedAt, incident.resolvedAt, this.now, this.language.current);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}