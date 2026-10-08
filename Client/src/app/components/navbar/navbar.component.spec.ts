import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  ApiService,
  AuthService,
  LangService,
  NoteRealtimeService,
} from '../../services';
import { NavbarComponent } from './navbar.component';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  HomeOutline,
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
} from '@ant-design/icons-angular/icons';

describe('NavbarComponent search keyboard flow', () => {
  it('focuses the search field, closes with Escape and restores focus to the trigger', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [NavbarComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            HomeOutline,
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

describe('Navbar report permissions', () => {
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
      if (fromApi)
        expect(fixture.nativeElement.querySelector('.nav-dropdown')).toBeNull();

      loggedIn = true;
      permissions.add('shiftreport.view');
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(2);
      expect(links('/tools/revenue-report')).toBe(0);
      permissions.clear();
      permissions.add('revenuereport.view');
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(0);
      expect(links('/tools/revenue-report')).toBe(2);
      admin = true;
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(2);
      expect(links('/tools/revenue-report')).toBe(2);
      loggedIn = false;
      fixture.detectChanges();
      expect(links('/tools/shift-report')).toBe(0);
      expect(links('/tools/revenue-report')).toBe(0);
      fixture.destroy();
    });
  }
});
