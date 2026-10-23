import { Injectable, inject } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpInterceptorFn,
} from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter, timer } from 'rxjs';
import { environment } from '../../environments/environment';

export type AnalyticsMetric =
  | 'Sessions'
  | 'Pages'
  | 'Articles'
  | 'Movies'
  | 'Reels';
export interface AnalyticsCounts {
  Sessions: number;
  Pages: number;
  Articles: number;
  Movies: number;
  Reels: number;
}
export interface AnalyticsPoint extends AnalyticsCounts {
  Bucket: string;
}
export interface AnalyticsTop {
  ContentId: string;
  Title: string;
  Path: string;
  Views: number;
  Sessions: number;
}
export interface AnalyticsReport {
  From: string;
  To: string;
  PreviousFrom: string;
  PreviousTo: string;
  CollectionStartedAt: string | null;
  GeneratedAt: string;
  Online: number;
  PreviousPeriodComplete: boolean;
  Current: AnalyticsCounts;
  Previous: AnalyticsCounts;
  Points: AnalyticsPoint[];
  PreviousPoints: AnalyticsPoint[];
  TopArticles: AnalyticsTop[];
  TopMovies: AnalyticsTop[];
}

export const publicAnalyticsPath = (path: string): boolean =>
  path.length <= 500 &&
  /^\/(?:|news(?:\/[a-zA-Z0-9_\-%]+\/[a-zA-Z0-9_\-%]+)?|phim(?:\/[a-zA-Z0-9_-]+)?|reels|note|tools(?:\/[a-zA-Z0-9_-]+)?|game\/[a-zA-Z0-9_/-]+|archive\/[a-zA-Z0-9_-]+)$/.test(
    path
  );

@Injectable({ providedIn: 'root' })
export class AnalyticsIdentityService {
  private router = inject(Router);
  private navigationNumber = -1;
  private navigationId = crypto.randomUUID();
  private sessionId = '';
  private lastActivity = 0;

  context(touch = false) {
    const pending = this.router.getCurrentNavigation();
    const path = (
      pending?.finalUrl?.toString() ||
      pending?.extractedUrl.toString() ||
      this.router.url
    ).split(/[?#]/)[0];
    if (!publicAnalyticsPath(path)) return null;
    const navigation =
      pending?.id ?? this.router.lastSuccessfulNavigation?.id ?? 0;
    if (navigation !== this.navigationNumber) {
      this.navigationNumber = navigation;
      this.navigationId = crypto.randomUUID();
    }
    const now = Date.now();
    if (!this.sessionId) {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem('blogAnalyticsSession') || 'null'
        );
        if (
          saved &&
          /^[a-f0-9-]{36}$/i.test(saved.id) &&
          Number.isFinite(saved.at)
        ) {
          this.sessionId = saved.id;
          this.lastActivity = saved.at;
        }
      } catch {
        /* Storage may be unavailable; the in-memory session still works. */
      }
    }
    if (!this.sessionId || now - this.lastActivity >= 30 * 60_000) {
      // A passive heartbeat never starts a new visit after inactivity.
      if (!touch) return null;
      this.sessionId = crypto.randomUUID();
    }
    if (touch) {
      this.lastActivity = now;
      try {
        sessionStorage.setItem(
          'blogAnalyticsSession',
          JSON.stringify({ id: this.sessionId, at: now })
        );
      } catch {
        /* optional */
      }
    }
    return {
      SessionId: this.sessionId,
      NavigationId: this.navigationId,
      Path: path,
    };
  }
}

// Only attach context to our own content endpoints. Never send it to media providers.
export const analyticsInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    !request.url.startsWith(environment.apiUrl) ||
    !/\/(?:news\/detail|reel\/view|(?:Movie|Anime)\/Library\/[^/]+\/playback)(?:[?]|$)/i.test(
      request.url
    )
  )
    return next(request);
  const context = inject(AnalyticsIdentityService).context(true);
  return next(
    context
      ? request.clone({
          setHeaders: {
            'X-Blog-Session': context.SessionId,
            'X-Blog-Navigation': context.NavigationId,
            'X-Blog-Page': context.Path,
          },
        })
      : request
  );
};

@Injectable({ providedIn: 'root' })
export class WebAnalyticsTrackingService {
  private identity = inject(AnalyticsIdentityService);
  private router = inject(Router);
  // Tracking failures must not trigger the application's global error popup.
  private http = new HttpClient(inject(HttpBackend));
  private started = false;

  init(): void {
    if (this.started) return;
    this.started = true;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.send(true));
    timer(30_000, 30_000).subscribe(() => {
      if (document.visibilityState === 'visible') this.send(false);
    });
    let touchedAt = 0;
    const touch = () => {
      if (Date.now() - touchedAt < 10_000) return;
      touchedAt = Date.now();
      const before = this.identity.context();
      const after = this.identity.context(true);
      if (after && (!before || before.SessionId !== after.SessionId))
        this.send(true);
    };
    for (const event of ['pointerdown', 'keydown', 'scroll'])
      window.addEventListener(event, touch, { passive: true });
  }

  private send(pageView: boolean): void {
    const context = this.identity.context(pageView);
    if (!context) return;
    this.http
      .post(`${environment.apiUrl}Analytics/Track`, {
        ...context,
        PageView: pageView,
      })
      .subscribe({ error: () => undefined });
  }
}
