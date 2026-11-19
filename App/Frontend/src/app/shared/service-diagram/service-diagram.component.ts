/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 19/11/2026
**/

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ServiceSlug } from './service-catalog';

interface MailRow {
    initial: string;
    name: string;
    color: string;
    width: number;
    time: string;
}

interface DomainRow {
    tld: string;
    free: boolean;
}

@Component({
    selector: 'app-service-diagram',
    templateUrl: './service-diagram.component.html',
    styleUrls: ['./service-diagram.component.css'],
    imports: [TranslatePipe],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ServiceDiagramComponent {
    private readonly translate = inject(TranslateService);

    readonly kind = input.required<ServiceSlug>();
    readonly bare = input<boolean>(false);

    readonly mailRows: MailRow[] = [
        { initial: 'S', name: 'Sarah', color: '#e8833a', width: 118, time: '09:41' },
        { initial: 'B', name: 'Bram', color: '#4f94f0', width: 92, time: '09:12' },
        { initial: 'L', name: 'Lotte', color: '#2fa36b', width: 132, time: '08:55' },
        { initial: 'K', name: 'Kim', color: '#9b6ad6', width: 80, time: '08:30' }
    ];

    readonly domainRows: DomainRow[] = [
        { tld: '.be', free: true },
        { tld: '.com', free: true },
        { tld: '.eu', free: false },
        { tld: '.shop', free: true }
    ];

    readonly chartBars = [58, 74, 66, 92, 80, 112];

    readonly dnsRows = [
        { type: 'A', value: '203.0.113.10' },
        { type: 'MX', value: '10 mail' },
        { type: 'TXT', value: 'v=spf1 …' },
        { type: 'CNAME', value: 'www' }
    ];

    domain(): string {
        const value = this.translate.instant('SERVICES.DIAGRAM.DOMAIN');
        return value && value !== 'SERVICES.DIAGRAM.DOMAIN' ? value : 'jouwbedrijf';
    }

    domainWidth(): number {
        return Math.round(this.domain().length * 7.3);
    }

    readonly label = computed(() => `SERVICES.${this.kind().toUpperCase()}.NAME`);
}
