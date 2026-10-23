import { Injectable, inject } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import {
  BehaviorSubject,
  filter,
  from,
  retry,
  switchMap,
  throwError,
  timeout,
  timer,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { IVisitStats } from '../interfaces/visit-stats';

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
  HasGap?: boolean;
}
export interface AnalyticsTop {
  ContentId: string;
  Title: string;
  Path: string;
  Views: number;
  Sessions: number;
  UnknownSessions?: number;
}
export interface AnalyticsReport {
  DataQuality?: Partial<
    Record<
      AnalyticsMetric,
      {
        Current: 'complete' | 'partial' | 'unavailable';
        Previous: 'complete' | 'partial' | 'unavailable';
        CanCompare: boolean;
        Reason: string;
      }
    >
  >;
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
  Coverage?: Partial<Record<AnalyticsMetric, string | null>>;
}
export interface MovieViewLog {
  EventId: string;
  OccurredAt: string;
  UserId: string | null;
  UserName: string;
  ActorName: string;
  MovieSlug: string;
  MovieTitle: string;
  EpisodeSlug: string | null;
  EpisodeName: string | null;
  ServerId: number | null;
  ServerName: string | null;
}
export const publicAnalyticsPath = (path: string): boolean =>
  path.length <= 500 &&
  /^\/(?:|news(?:\/[a-zA-Z0-9_\-%]+\/[a-zA-Z0-9_\-%]+)?|phim(?:\/[a-zA-Z0-9_-]+)?|reels|note|tools(?:\/[a-zA-Z0-9_-]+)?|game\/[a-zA-Z0-9_/-]+|archive\/[a-zA-Z0-9_-]+)$/.test(
    path
  );
const isId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);

@Injectable({ providedIn: 'root' })
export class AnalyticsIdentityService {
  private router = inject(Router);
  private navigationNumber = -1;
  private navigationId = crypto.randomUUID();
  private sessionId = '';
  private visitorId: string = crypto.randomUUID();
  private memoryAt = 0;
  private readyPromise?: Promise<void>;

  ready(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    const establish = async () => {
      try {
        const saved = localStorage.getItem('blogAnalyticsVisitor');
        if (isId(saved)) this.visitorId = saved;
        else localStorage.setItem('blogAnalyticsVisitor', this.visitorId);
      } catch {
        /* The in-memory identity remains usable when storage is blocked. */
      }
    };
    // Serialise the very first visitor-ID creation across tabs where Web Locks is available.
    this.readyPromise = navigator.locks
      ? navigator.locks.request('blog-analytics-identity', establish)
      : establish();
    return this.readyPromise;
  }

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
    let id = this.sessionId;
    let at = this.memoryAt;
    try {
      const saved = JSON.parse(
        localStorage.getItem('blogAnalyticsSessionV2') || 'null'
      );
      if (saved && isId(saved.id) && Number.isFinite(saved.at)) {
        id = saved.id;
        at = saved.at;
      }
    } catch {
      /* optional browser storage */
    }
    if (!id || now - at >= 30 * 60_000) {
      if (!touch) return null;
      id = crypto.randomUUID();
      this.navigationId = crypto.randomUUID();
    }
    this.sessionId = id;
    this.memoryAt = touch ? now : at;
    if (touch) {
      try {
        localStorage.setItem(
          'blogAnalyticsSessionV2',
          JSON.stringify({ id, at: now })
        );
      } catch {
        /* optional */
      }
    }
    return {
      SessionId: id,
      NavigationId: this.navigationId,
      VisitorId: this.visitorId,
      Path: path,
    };
  }
}

// Capture context before authentication retries so a retried request retains the
// navigation which caused it, even if the user has since moved to another page.
export const analyticsInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    !request.url.startsWith(environment.apiUrl) ||
    !/\/(?:news\/detail|reel\/view|(?:Movie|Anime)\/Library\/[^/]+\/playback)(?:[?]|$)/i.test(
      request.url
    )
  )
    return next(request);
  const identity = inject(AnalyticsIdentityService);
  return from(identity.ready()).pipe(
    switchMap(() => {
      const context = identity.context(true);
      return next(
        context
          ? request.clone({
              setHeaders: {
                'X-Blog-Session': context.SessionId,
                'X-Blog-Navigation': context.NavigationId,
                'X-Blog-Visitor': context.VisitorId,
                'X-Blog-Page': context.Path,
              },
            })
          : request.clone({ setHeaders: { 'X-Blog-Scope': 'excluded' } })
      );
    })
  );
};

@Injectable({ providedIn: 'root' })
export class WebAnalyticsTrackingService {
  private identity = inject(AnalyticsIdentityService);
  private router = inject(Router);
  private http = new HttpClient(inject(HttpBackend));
  private started = false;
  private pendingActivity = false;
  readonly stats$ = new BehaviorSubject<IVisitStats>({
    OnlineCount: 0,
    MonthCount: 0,
    TotalCount: 0,
    Loaded: false,
  });
  init(): void {
    if (this.started) return;
    this.started = true;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => void this.send(true));
    timer(30_000, 30_000).subscribe(() => {
      if (document.visibilityState === 'visible') void this.send(false);
    });
    let touchedAt = 0;
    const touch = () => {
      if (
        document.visibilityState !== 'visible' ||
        Date.now() - touchedAt < 10_000
      )
        return;
      touchedAt = Date.now();
      void this.identity.ready().then(() => {
        const before = this.identity.context();
        const after = this.identity.context(true);
        if (!after) return;
        this.pendingActivity = true;
        if (!before || before.SessionId !== after.SessionId)
          void this.send(true);
      });
    };
    for (const event of ['pointerdown', 'keydown', 'scroll'])
      window.addEventListener(event, touch, { passive: true });
    document.addEventListener('visibilitychange', touch);
  }

  private async send(pageView: boolean): Promise<void> {
    await this.identity.ready();
    const context = this.identity.context(pageView);
    if (
      !context &&
      /^(\/dashboard|\/login|\/shared-note\/)/.test(this.router.url)
    )
      return;
    const active = pageView || this.pendingActivity;
    this.pendingActivity = false;
    // Capture this payload once. Network retries keep the same navigation/event ID.
    const call = context
      ? this.http.post<{ Success: boolean; Data: IVisitStats }>(
          environment.apiUrl + 'Analytics/Track',
          { ...context, PageView: pageView, Active: active }
        )
      : this.http.get<{ Success: boolean; Data: IVisitStats }>(
          environment.apiUrl + 'Analytics/Stats'
        );
    call
      .pipe(
        timeout(8000),
        retry({
          count: 2,
          delay: (error: HttpErrorResponse, attempt) =>
            error.status &&
            error.status < 500 &&
            error.status !== 408 &&
            error.status !== 429
              ? throwError(() => error)
              : timer(attempt * 300),
        })
      )
      .subscribe({
        next: response => {
          if (response?.Success && response.Data)
            this.stats$.next({ ...response.Data, Loaded: true });
        },
        error: () => {
          this.pendingActivity ||= active;
        },
      });
  }
}
