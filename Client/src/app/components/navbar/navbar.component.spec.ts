import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NEVER, Observable, Subject, of, throwError } from 'rxjs';
import {
  ApiService,
  AuthService,
  LangService,
  NoteRealtimeService,
} from '../../services';
import { NavbarComponent } from './navbar.component';
import { BlogNotificationService } from '../../services/blog-notification.service';
import { signal } from '@angular/core';
import { CalendarNotificationService } from '../../services/calendar-notification.service';

function provideNotifications(): void {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: BlogNotificationService,
        useValue: {
          attach: () => undefined,
          detach: () => undefined,
          syncAccount: () => undefined,
          show: () => undefined,
          unread: signal(0),
          activeMenu: signal(null),
        },
      },
      {
        provide: CalendarNotificationService,
        useValue: { attach: () => undefined, detach: () => undefined, syncAccount: () => undefined, refresh: () => undefined, events: signal([]), error: signal(false) },
      },
    ],
  });
}
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  HomeOutline,
  CustomerServiceOutline,
  CalendarOutline,
  LineChartOutline,
  ToolOutline,
  CalculatorOutline,
  FileTextOutline,
  DollarOutline,
  PlayCircleOutline,
  TrophyOutline,
  AppstoreOutline,
  SearchOutline,
  CloseOutline,
  ArrowRightOutline,
  UserOutline,
  LogoutOutline,
  RightOutline,
} from '@ant-design/icons-angular/icons';

describe('NavbarComponent search keyboard flow', () => {
  beforeEach(provideNotifications);
  it('focuses the search field, closes with Escape and restores focus to the trigger', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            HomeOutline,
            CustomerServiceOutline,
            CalendarOutline,
            ToolOutline,
            CalculatorOutline,
            FileTextOutline,
            DollarOutline,
            PlayCircleOutline,
            TrophyOutline,
            AppstoreOutline,
            SearchOutline,
            CloseOutline,
            ArrowRightOutline,
          ],
        },
        { provide: ApiService, useValue: {} },
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: LangService, useValue: {} },
        { provide: NoteRealtimeService, useValue: { unreadCount$: of(0) } },
      ],
    });
    spyOn(NavbarComponent.prototype, 'ngOnInit').and.stub();
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const trigger = [
      ...fixture.nativeElement.querySelectorAll(
        '[aria-controls="navbar-search"]'
      ),
    ].find(
      (button: HTMLButtonElement) => button.getBoundingClientRect().width > 0
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector(
      '.search-popup-input'
    ) as HTMLInputElement;
    tick();
    expect(document.activeElement).toBe(field);
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#navbar-search')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(
      fixture.nativeElement.querySelector('#navbar-mobile-menu')
    ).toBeNull();
    fixture.destroy();
  }));
});

describe('Navbar account greeting', () => {
  beforeEach(provideNotifications);
  it('greets the currently signed-in user in the account popup', fakeAsync(() => {
    let name = 'Phan Thăng';
    TestBed.configureTestingModule({
      imports: [
        NavbarComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            HomeOutline,
            CustomerServiceOutline,
            CalendarOutline,
            ToolOutline,
            CalculatorOutline,
            FileTextOutline,
            DollarOutline,
            PlayCircleOutline,
            TrophyOutline,
            AppstoreOutline,
            SearchOutline,
            CloseOutline,
            ArrowRightOutline,
            UserOutline,
            LogoutOutline,
            RightOutline,
          ],
        },
        { provide: ApiService, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            hasPermission: () => false,
            hasAnyPermissionAtAll: () => false,
            getAccountInfo: () => ({ name, shortname: 'P', email: '' }),
          },
        },
        { provide: LangService, useValue: {} },
        { provide: NoteRealtimeService, useValue: { unreadCount$: of(0) } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('vi', {
      T_ACCOUNT_GREETING: 'Xin chào, {{name}}',
    });
    translate.use('vi');
    spyOn(NavbarComponent.prototype, 'ngOnInit').and.stub();
    const f = TestBed.createComponent(NavbarComponent);
    f.detectChanges();
    f.componentInstance.isAccountMenuOpen = true;
    f.detectChanges();
    tick(500);
    f.detectChanges();
    expect(
      document.querySelector('.account-menu__name')?.textContent?.trim()
    ).toBe('Xin chào, Phan Thăng');
    name = 'Tên mới';
    f.detectChanges();
    expect(
      document.querySelector('.account-menu__name')?.textContent?.trim()
    ).toBe('Xin chào, Tên mới');
    f.componentInstance.closeAccountMenu();
    f.detectChanges();
    tick(500);
    f.destroy();
  }));
});

describe('Navbar menu loading', () => {
  beforeEach(provideNotifications);
  const setup = (menu$: Observable<unknown>) => {
    TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            HomeOutline,
            CustomerServiceOutline,
            CalendarOutline,
            ToolOutline,
            CalculatorOutline,
            PlayCircleOutline,
            TrophyOutline,
            AppstoreOutline,
          ],
        },
        { provide: ApiService, useValue: { SysMenuGetActive: () => menu$ } },
        {
          provide: LangService,
          useValue: { getLang: () => 'vi', $langSubjectObservable: of('vi') },
        },
        { provide: NoteRealtimeService, useValue: { unreadCount$: of(0) } },
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => false, hasPermission: () => false },
        },
      ],
    });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.componentInstance.isMobileMenuOpen = true;
    fixture.detectChanges();
    return fixture;
  };
  const count = (fixture: { nativeElement: HTMLElement }, selector: string) =>
    fixture.nativeElement.querySelectorAll(selector).length;

  it('shows skeletons instead of the fallback menu until the API menu arrives', () => {
    const menu$ = new Subject<unknown>();
    const fixture = setup(menu$);
    expect(count(fixture, 'app-config-skeleton')).toBe(2);
    expect(count(fixture, 'a[href="/reels"]')).toBe(0);
    menu$.next({
      Success: true,
      DataList: [
        {
          TitleVi: 'Tính phí',
          Path: '/tools/calculating-hotel-fee',
          Icon: 'calculator',
          Children: [],
        },
      ],
    });
    fixture.detectChanges();
    expect(count(fixture, 'app-config-skeleton')).toBe(0);
    expect(count(fixture, 'a[href="/tools/calculating-hotel-fee"]')).toBe(2);
    expect(count(fixture, 'a[href="/reels"]')).toBe(0);
    fixture.destroy();
  });

  it('falls back to the built-in menu when the API fails', () => {
    const fixture = setup(throwError(() => new Error('down')));
    expect(count(fixture, 'app-config-skeleton')).toBe(0);
    expect(count(fixture, 'a[href="/reels"]')).toBe(2);
    fixture.destroy();
  });

  it('stops waiting for a hung menu API after 15 seconds', fakeAsync(() => {
    const fixture = setup(NEVER);
    tick(14999);
    fixture.detectChanges();
    expect(count(fixture, 'app-config-skeleton')).toBe(2);
    tick(1);
    fixture.detectChanges();
    expect(count(fixture, 'app-config-skeleton')).toBe(0);
    expect(count(fixture, 'a[href="/reels"]')).toBe(2);
    fixture.destroy();
  }));
});

describe('Navbar report permissions', () => {
  beforeEach(provideNotifications);
  for (const fromApi of [false, true]) {
    it(`filters ${fromApi ? 'API' : 'fallback'} report menus on desktop and mobile as the session changes`, () => {
      let loggedIn = false;
      let admin = false;
      const permissions = new Set<string>();
      const reportMenu = {
        TitleVi: 'Báo cáo',
        TitleEn: 'Reports',
        Path: '',
        Icon: 'tool',
        Children: [
          {
            TitleVi: 'Ca trực',
            Path: '/tools/shift-report',
            Icon: 'file-text',
            Children: [],
          },
          {
            TitleVi: 'Thống kê thuê phòng',
            Path: '/tools/rental-statistics',
            Icon: 'line-chart',
            Children: [],
          },
          {
            TitleVi: 'Doanh thu',
            Path: '/tools/revenue-report',
            Icon: 'dollar',
            Children: [],
          },
        ],
      };
      TestBed.configureTestingModule({
        imports: [NavbarComponent, TranslateModule.forRoot()],
        providers: [
          provideRouter([]),
          {
            provide: NZ_ICONS,
            useValue: [
              HomeOutline,
              CustomerServiceOutline,
              CalendarOutline,
              LineChartOutline,
              ToolOutline,
              CalculatorOutline,
              FileTextOutline,
              DollarOutline,
              PlayCircleOutline,
              TrophyOutline,
              AppstoreOutline,
            ],
          },
          {
            provide: ApiService,
            useValue: {
              SysMenuGetActive: () =>
                of({ Success: fromApi, DataList: [reportMenu] }),
            },
          },
          {
            provide: LangService,
            useValue: { getLang: () => 'vi', $langSubjectObservable: of('vi') },
          },
          { provide: NoteRealtimeService, useValue: { unreadCount$: of(0) } },
          {
            provide: AuthService,
            useValue: {
              isLoggedIn: () => loggedIn,
              hasPermission: (code: string) => admin || permissions.has(code),
              getAccountInfo: () => ({
                avatar: '',
                shortname: 'T',
                name: 'Test',
              }),
              hasAnyPermissionAtAll: () => admin || permissions.size > 0,
            },
          },
        ],
      });
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.componentInstance.isMobileMenuOpen = true;
      const links = (path: string) =>
        fixture.nativeElement.querySelectorAll(`a[href="${path}"]`).length;
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(0);
      expect(links('/tools/revenue-report')).toBe(0);
      expect(links('/tools/rental-statistics')).toBe(0);
      if (fromApi)
        expect(fixture.nativeElement.querySelector('.nav-dropdown')).toBeNull();

      loggedIn = true;
      permissions.add('shiftreport.view');
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(2);
      expect(links('/tools/revenue-report')).toBe(0);
      expect(links('/tools/rental-statistics')).toBe(0);
      permissions.clear();
      permissions.add('rentalstatistics.view');
      fixture.detectChanges();
      expect(links('/tools/rental-statistics')).toBe(2);
      expect(links('/tools/shift-report')).toBe(0);
      permissions.clear();
      permissions.add('revenuereport.view');
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(0);
      expect(links('/tools/revenue-report')).toBe(2);
      expect(links('/tools/rental-statistics')).toBe(0);
      admin = true;
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(2);
      expect(links('/tools/revenue-report')).toBe(2);
      expect(links('/tools/rental-statistics')).toBe(2);
      loggedIn = false;
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(0);
      expect(links('/tools/revenue-report')).toBe(0);
      expect(links('/tools/rental-statistics')).toBe(0);
      fixture.destroy();
    });
  }
});
