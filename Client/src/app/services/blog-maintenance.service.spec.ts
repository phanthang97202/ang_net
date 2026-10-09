import {
  fakeAsync,
  TestBed,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { BlogMaintenanceService, isBlogPath } from './blog-maintenance.service';

describe('Blog maintenance configuration', () => {
  let service: BlogMaintenanceService;
  let http: HttpTestingController;
  let router: { url: string; navigateByUrl: jasmine.Spy };
  beforeEach(() => {
    router = {
      url: '/',
      navigateByUrl: jasmine.createSpy().and.resolveTo(true),
    };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: router }],
    });
    service = TestBed.inject(BlogMaintenanceService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const matches = (request: any) =>
    request.url.endsWith('SysParameter/Detail') &&
    request.params.get('key') === 'BLOG_MAINTENANCE';
  it('uses fresh canonical configuration regardless of browser language', () => {
    for (const [value, enabled] of [
      ['false', false],
      [' true ', true],
      ['1', true],
      ['', false],
      [null, false],
    ] as const) {
      let result: boolean | undefined;
      service.check().subscribe(v => (result = v));
      http
        .expectOne(matches)
        .flush({
          Success: true,
          Data: {
            FlagActive: true,
            ParameterValueVi: value,
            ParameterValueEn: value,
          },
        });
      expect(result).toBe(enabled);
    }
  });
  it('keeps the blog available when configuration is inactive, missing or unavailable', () => {
    for (const response of [
      { Success: true, Data: { FlagActive: false, ParameterValueVi: 'true' } },
      { Success: false, Data: null },
    ]) {
      service.check().subscribe(v => expect(v).toBeFalse());
      http.expectOne(matches).flush(response);
    }
    service.check().subscribe(v => expect(v).toBeFalse());
    http
      .expectOne(matches)
      .flush('Unavailable', { status: 503, statusText: 'Unavailable' });
  });
  it('redirects an already open blog and skips dashboard and maintenance polling', fakeAsync(() => {
    service.startMonitoring();
    tick(30000);
    http
      .expectOne(matches)
      .flush({
        Success: true,
        Data: { FlagActive: true, ParameterValueVi: 'true' },
      });
    tick();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/maintain', {
      replaceUrl: true,
    });
    for (const url of ['/dashboard/sysparameter', '/maintain']) {
      router.url = url;
      tick(30000);
      http.expectNone(matches);
    }
    discardPeriodicTasks();
  }));
  it('exempts only dashboard paths and maintain, including query parameters', () => {
    for (const url of [
      '/dashboard',
      '/dashboard/users?tab=1',
      '/dashboard/login',
      '/maintain?x=1',
    ])
      expect(isBlogPath(url)).toBeFalse();
    for (const url of [
      '/',
      '/login',
      '/news/x/y',
      '/dashboard-other',
      '/tools/shift-report',
    ])
      expect(isBlogPath(url)).toBeTrue();
  });
});
