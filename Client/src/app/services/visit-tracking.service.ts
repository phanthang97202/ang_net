import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, of, switchMap, timer } from 'rxjs';
import { ApiService } from './api.service';
import { IVisitStats } from '../interfaces';

const VISITOR_ID_KEY = 'visitorSessionId';
const VISIT_REGISTERED_KEY = 'visitRegistered';
const HEARTBEAT_INTERVAL_MS = 30000;

@Injectable({
  providedIn: 'root',
})
export class VisitTrackingService {
  private api = inject(ApiService);

  private started = false;
  private visitorId = '';

  stats$ = new BehaviorSubject<IVisitStats>({
    OnlineCount: 0,
    MonthCount: 0,
    TotalCount: 0,
  });

  init(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.visitorId = this.getOrCreateVisitorId();
    const isNewVisit = !this.readStorage(VISIT_REGISTERED_KEY);
    this.writeStorage(VISIT_REGISTERED_KEY, '1');

    timer(0, HEARTBEAT_INTERVAL_MS)
      .pipe(
        switchMap(tick =>
          this.api
            .Ping(this.visitorId, tick === 0 ? isNewVisit : false)
            .pipe(catchError(() => of(null)))
        )
      )
      .subscribe(response => {
        if (response?.Success && response.Data) {
          this.stats$.next(response.Data);
        }
      });
  }

  private getOrCreateVisitorId(): string {
    const existing = this.readStorage(VISITOR_ID_KEY);
    if (existing) {
      return existing;
    }
    const generated = this.generateId();
    this.writeStorage(VISITOR_ID_KEY, generated);
    return generated;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private readStorage(key: string): string {
    try {
      return sessionStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore (e.g. Safari private mode) - falls back to counting this
      // reload as a new visit, which is an acceptable trade-off here
    }
  }
}
