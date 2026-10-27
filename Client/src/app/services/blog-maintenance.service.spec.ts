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
import {
  BlogMaintenanceService,
  isBlogPath,
  isTrollExcluded,
  parseTrollConfig,
  shiftReportOnlyRedirect,
} from './blog-maintenance.service';
import { AuthService } from './auth.service';

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
      http.expectOne(matches).flush({
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
  const parameter = (key: string) => (request: any) =>
    request.url.endsWith('SysParameter/Detail') &&
    request.params.get('key') === key;
  const flush = (key: string, value: string | null) =>
    http.expectOne(parameter(key)).flush({
      Success: true,
      Data: { FlagActive: true, ParameterValueVi: value },
    });
  it('redirects an already open blog and skips dashboard and maintenance polling', fakeAsync(() => {
    service.startMonitoring();
    tick(30000);
    // 3 chế độ được hỏi song song; bảo trì thắng
    flush('BLOG_MAINTENANCE', 'true');
    flush('TROLL_VIETNAM', '{"enabled":true}');
    flush('ONLY_SHIFT_REPORT', 'false');
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
  it('reads ONLY_SHIFT_REPORT from its own parameter', () => {
    let result: boolean | undefined;
    service.checkShiftReportOnly().subscribe(v => (result = v));
    http
      .expectOne(
        request =>
          request.url.endsWith('SysParameter/Detail') &&
          request.params.get('key') === 'ONLY_SHIFT_REPORT'
      )
      .flush({
        Success: true,
        Data: { FlagActive: true, ParameterValueVi: 'true' },
      });
    expect(result).toBeTrue();
  });
  it('parses TROLL_VIETNAM safely, with defaults and limits', () => {
    expect(parseTrollConfig(null)).toBeNull();
    expect(parseTrollConfig('not json')).toBeNull();
    expect(parseTrollConfig('{"enabled":false,"message":"x"}')).toBeNull();
    expect(parseTrollConfig('{"enabled":"true"}')).toBeNull();
    expect(parseTrollConfig('{"enabled":true}')).toEqual({
      message: 'Haha, mày là 1 tên hề!',
      countdown: 3,
      images: ['😂', '🖕', '🤡'],
      excludedUserIds: [],
    });
    const config = parseTrollConfig(
      JSON.stringify({
        enabled: true,
        message: '  Hề quá  ',
        countdown: 99,
        images: ['https://x/clown.png', '', 5, '🤡'],
        excludedUserIds: ['ABC-1', ' '],
      })
    )!;
    expect(config.message).toBe('Hề quá');
    expect(config.countdown).toBe(3);
    expect(config.images).toEqual(['https://x/clown.png', '🤡']);
    expect(isTrollExcluded(config, 'abc-1')).toBeTrue();
    expect(isTrollExcluded(config, 'other')).toBeFalse();
    expect(isTrollExcluded(config, null)).toBeFalse();
  });
  it('resolves maintenance > troll > shift report only, and spares excluded users', () => {
    const auth = TestBed.inject(AuthService);
    spyOn(auth, 'getAccountInfo').and.returnValue({ nameid: 'owner' } as any);
    const run = (troll: string, shiftOnly: string) => {
      let target: string | null | undefined;
      service
        .resolve('/news/a/b')
        .subscribe(result => (target = result.target));
      flush('BLOG_MAINTENANCE', 'false');
      flush('TROLL_VIETNAM', troll);
      flush('ONLY_SHIFT_REPORT', shiftOnly);
      return target;
    };
    expect(run('{"enabled":true}', 'true')).toBe('/haha');
    expect(run('{"enabled":true,"excludedUserIds":["OWNER"]}', 'true')).toBe(
      '/tools/shift-report'
    );
    expect(run('{"enabled":false}', 'false')).toBeNull();
  });
  it('decides where shift-report-only mode sends each visitor', () => {
    // Khách: mọi trang về báo cáo ca, trừ đăng nhập và chính báo cáo ca
    expect(shiftReportOnlyRedirect('/news/a/b', false, false)).toBe(
      '/tools/shift-report'
    );
    expect(
      shiftReportOnlyRedirect('/tools/shift-report?date=1', false, false)
    ).toBeNull();
    expect(shiftReportOnlyRedirect('/login?x=1', false, false)).toBeNull();
    expect(
      shiftReportOnlyRedirect('/forgot-password', false, false)
    ).toBeNull();
    // Có quyền: dùng báo cáo ca bình thường
    expect(shiftReportOnlyRedirect('/', true, true)).toBe(
      '/tools/shift-report'
    );
    expect(
      shiftReportOnlyRedirect('/tools/shift-report', true, true)
    ).toBeNull();
    // Đã đăng nhập nhưng thiếu quyền: về trang bảo trì thay vì lặp chuyển hướng
    expect(shiftReportOnlyRedirect('/tools/shift-report', true, false)).toBe(
      '/maintain'
    );
    expect(shiftReportOnlyRedirect('/login', true, false)).toBeNull();
  });
  it('exempts only dashboard paths and maintain, including query parameters', () => {
    for (const url of [
      '/dashboard',
      '/dashboard/users?tab=1',
      '/dashboard/login',
      '/maintain?x=1',
      '/haha',
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
