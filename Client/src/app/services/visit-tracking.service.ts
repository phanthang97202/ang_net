import { Injectable, inject } from '@angular/core';
import { WebAnalyticsTrackingService } from './web-analytics.service';

// Public facade retained for footer consumers. Tracking has one owner and one timer.
@Injectable({ providedIn: 'root' })
export class VisitTrackingService {
  private readonly analytics = inject(WebAnalyticsTrackingService);
  readonly stats$ = this.analytics.stats$;
  init(): void {
    this.analytics.init();
  }
}
