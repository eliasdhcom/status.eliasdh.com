/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 05/11/2026
**/

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { StatusReport } from '../status/status.models';

export const REFRESH_INTERVAL_MS = 60_000;

export interface StatusUpdate {
    report: StatusReport | null;
    failed: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class StatusService {
    private http = inject(HttpClient);

    load(): Observable<StatusReport> {
        return this.http.get<StatusReport>(`data/status.json?t=${Math.floor(Date.now() / REFRESH_INTERVAL_MS)}`);
    }

    watch(): Observable<StatusUpdate> {
        return timer(0, REFRESH_INTERVAL_MS).pipe(
            switchMap(() => this.load().pipe(
                map((report): StatusUpdate => ({ report, failed: false })),
                catchError(() => of<StatusUpdate>({ report: null, failed: true }))
            ))
        );
    }
}