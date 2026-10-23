import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import {
  AnalyticsIdentityService,
  publicAnalyticsPath,
  analyticsInterceptor,
} from './web-analytics.service';

describe('Web analytics navigation identity', () => {
  let router: {
    url: string;
    getCurrentNavigation: () => null;
    lastSuccessfulNavigation: { id: number };
  };
  beforeEach(() => {
    localStorage.removeItem('blogAnalyticsSessionV2');
    localStorage.removeItem('blogAnalyticsVisitor');
    router = {
      url: '/news/topic/article',
      getCurrentNavigation: () => null,
      lastSuccessfulNavigation: { id: 1 },
    };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });
  });
  afterEach(() => {
    localStorage.removeItem('blogAnalyticsSessionV2');
    localStorage.removeItem('blogAnalyticsVisitor');
  });

  it('attaches navigation context only to our content API, never external providers or admin calls', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([analyticsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const pending = TestBed.inject(HttpTestingController);
    await TestBed.inject(AnalyticsIdentityService).ready();
    http.get(`${environment.apiUrl}news/detail?newsId=article`).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const article = pending.expectOne(
      `${environment.apiUrl}news/detail?newsId=article`
    );
    expect(article.request.headers.get('X-Blog-Page')).toBe(
      '/news/topic/article'
    );
    expect(article.request.headers.get('X-Blog-Session')).toMatch(
      /^[a-f0-9-]{36}$/i
    );
    article.flush({});
    http.get('https://external.example/player').subscribe();
    const external = pending.expectOne('https://external.example/player');
    expect(external.request.headers.has('X-Blog-Session')).toBeFalse();
    external.flush({});
    router.url = '/dashboard/blog';
    http.get(`${environment.apiUrl}news/detail?newsId=article`).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const admin = pending.expectOne(
      `${environment.apiUrl}news/detail?newsId=article`
    );
    expect(admin.request.headers.has('X-Blog-Session')).toBeFalse();
    admin.flush({});
    pending.verify();
  });

  it('preserves context across repeated calls and rotates navigation separately from the visit', () => {
    const service = TestBed.inject(AnalyticsIdentityService);
    const initial = service.context(true)!;
    expect(service.context(true)).toEqual(initial);
    router.lastSuccessfulNavigation.id = 2;
    const next = service.context(true)!;
    expect(next.SessionId).toBe(initial.SessionId);
    expect(next.NavigationId).not.toBe(initial.NavigationId);
  });

  it('does not let passive heartbeat start a visit after 30 minutes of inactivity', () => {
    let now = 1_000_000;
    spyOn(Date, 'now').and.callFake(() => now);
    const service = TestBed.inject(AnalyticsIdentityService);
    const initial = service.context(true)!;
    now += 30 * 60_000;
    expect(service.context()).toBeNull();
    expect(service.context(true)!.SessionId).not.toBe(initial.SessionId);
  });

  it('strips query strings and never tracks admin, login or shared note capabilities', () => {
    const service = TestBed.inject(AnalyticsIdentityService);
    router.url = '/news/topic/article?token=secret#comment';
    expect(service.context(true)!.Path).toBe('/news/topic/article');
    for (const path of [
      '/dashboard/analytics',
      '/login',
      '/shared-note/secret/edit',
    ]) {
      router.url = path;
      expect(service.context(true)).toBeNull();
      expect(publicAnalyticsPath(path)).toBeFalse();
    }
  });

  it('continues safely when local storage is blocked', () => {
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    spyOn(localStorage, 'setItem').and.throwError('blocked');
    const service = TestBed.inject(AnalyticsIdentityService);
    const initial = service.context(true)!;
    expect(service.context(true)!.SessionId).toBe(initial.SessionId);
  });

  it('shares a visitor and current session between independent tabs', async () => {
    const first = TestBed.inject(AnalyticsIdentityService);
    await first.ready();
    const initial = first.context(true)!;
    const second = TestBed.runInInjectionContext(
      () => new AnalyticsIdentityService()
    );
    await second.ready();
    const otherTab = second.context(true)!;
    expect(otherTab.VisitorId).toBe(initial.VisitorId);
    expect(otherTab.SessionId).toBe(initial.SessionId);
    expect(otherTab.NavigationId).not.toBe(initial.NavigationId);
  });
});
