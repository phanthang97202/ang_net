import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { Type } from '@angular/core';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  FullscreenOutline,
  LeftOutline,
  RightOutline,
  ArrowLeftOutline,
  EyeOutline,
  EyeInvisibleOutline,
  UserOutline,
  LockOutline,
  ArrowRightOutline,
} from '@ant-design/icons-angular/icons';
import {
  ApiService,
  AuthService,
  LangService,
  SysParameterConfigService,
  VisitTrackingService,
} from '../../services';
import { DiscoveryBannerComponent } from '../discovery-banner/discovery-banner.component';
import { MusicPlayerComponent } from '../music-player/music-player.component';
import { HomeSidebarComponent } from '../home-sidebar/home-sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { LoginComponent } from '../../pages/login/login.component';
import { DEFAULT_LOGIN_IMAGE } from '../../pages/login/login-appearance.service';

describe('Public system-parameter loading', () => {
  let http: HttpTestingController;
  let fixtures: ComponentFixture<unknown>[];
  let language: BehaviorSubject<string>;

  beforeEach(() => {
    fixtures = [];
    language = new BehaviorSubject('vi');
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        DiscoveryBannerComponent,
        MusicPlayerComponent,
        HomeSidebarComponent,
        FooterComponent,
      ],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            FullscreenOutline,
            LeftOutline,
            RightOutline,
            ArrowLeftOutline,
            EyeOutline,
            EyeInvisibleOutline,
            UserOutline,
            LockOutline,
            ArrowRightOutline,
          ],
        },
        {
          provide: LangService,
          useValue: {
            getLang: () => language.value,
            $langSubjectObservable: language.asObservable(),
          },
        },
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => false, hasPermission: () => false },
        },
        {
          provide: VisitTrackingService,
          useValue: {
            stats$: of({ OnlineCount: 1, MonthCount: 2, TotalCount: 3 }),
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(ApiService), 'GetTopHashTag').and.returnValue(
      of({ DataList: [] } as any)
    );
    spyOn(LoginComponent.prototype, 'ngAfterViewInit').and.stub();
  });

  afterEach(() => {
    for (const fixture of fixtures) fixture.destroy();
    http.verify();
  });

  function render<T>(type: Type<T>): ComponentFixture<T> {
    const fixture = TestBed.createComponent(type);
    fixtures.push(fixture);
    fixture.detectChanges();
    return fixture;
  }

  function parameter(code: string) {
    return http.expectOne(req =>
      req.url.endsWith(`SysParameter/Detail?key=${code}`)
    );
  }

  function resolve(
    code: string,
    value: unknown,
    english?: unknown,
    defaultId = ''
  ): void {
    parameter(code).flush({
      Success: true,
      Data: {
        FlagActive: true,
        ParameterValueVi: JSON.stringify(value),
        ParameterValueEn: JSON.stringify(english ?? value),
        DefaultValueVi: defaultId,
      },
    });
  }

  it('renders skeletons without fallback backgrounds, text, album art or audio while configuration is pending', () => {
    const hero = render(DiscoveryBannerComponent);
    const el: HTMLElement = hero.nativeElement;
    expect(el.querySelector('.hero')?.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelectorAll('app-config-skeleton').length).toBe(2);
    expect(el.querySelector('.hero-bg')).toBeNull();
    expect(el.querySelector('h1')).toBeNull();
    expect(el.querySelector('audio')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
    resolve('HOME_BANNERS', [
      {
        title: 'Configured hero',
        description: 'Configured description',
        image: '/configured-hero.jpg',
      },
    ]);
    hero.detectChanges();
    expect(el.querySelector('h1')?.textContent).toBe('Configured hero');
    expect(
      (el.querySelector('.hero-bg') as HTMLElement).style.backgroundImage
    ).toContain('configured-hero.jpg');
    // Music resolves independently rather than delaying the banner or using a default track.
    expect(el.querySelector('audio')).toBeNull();
    resolve(
      'HOME_MUSIC',
      [
        {
          id: 'configured',
          title: 'Configured track',
          artist: 'Artist',
          albumArt: '/configured-art.jpg',
          audioSrc: '/configured.mp3',
        },
      ],
      undefined,
      'configured'
    );
    hero.detectChanges();
    expect(el.querySelector('audio')?.getAttribute('src')).toBe(
      '/configured.mp3'
    );
    expect(el.querySelector('img')?.getAttribute('src')).toBe(
      '/configured-art.jpg'
    );
    expect(el.querySelector('app-config-skeleton')).toBeNull();
  });

  it('uses fallback only after a missing or failed parameter resolves and does not get stuck', () => {
    const hero = render(DiscoveryBannerComponent);
    parameter('HOME_BANNERS').flush('Unavailable', {
      status: 503,
      statusText: 'Unavailable',
    });
    parameter('HOME_MUSIC').flush({ Success: false, Data: null });
    hero.detectChanges();
    expect(hero.componentInstance.configLoading).toBeFalse();
    expect(hero.nativeElement.querySelector('app-config-skeleton')).toBeNull();
    expect(
      hero.nativeElement.querySelector('.hero-bg').style.backgroundImage
    ).toContain('bg_banner.avif');
    expect(
      hero.nativeElement.querySelector('audio').getAttribute('src')
    ).toContain('moi_duyen_vang.mp3');
  });

  it('loads sidebar sections independently without showing fallback portraits or featured images', () => {
    const sidebar = render(HomeSidebarComponent);
    const el: HTMLElement = sidebar.nativeElement;
    expect(el.querySelector('.about-avatar')).toBeNull();
    expect(el.querySelector('.about-name')).toBeNull();
    expect(el.querySelector('.featured-post-bg')).toBeNull();
    expect(el.querySelector('app-social-links')).toBeNull();
    expect(el.querySelectorAll('app-config-skeleton').length).toBe(3);
    resolve('HOME_INTRO', {
      name: 'Configured author',
      avatar: '/configured-avatar.jpg',
    });
    sidebar.detectChanges();
    expect(el.querySelector('.about-name')?.textContent).toBe(
      'Configured author'
    );
    expect(el.querySelector('.about-avatar')?.getAttribute('src')).toBe(
      '/configured-avatar.jpg'
    );
    expect(el.querySelector('.featured-post-bg')).toBeNull();
    resolve('HOME_FEATURED_IMAGES', [
      { image: '/configured-featured.jpg', caption: 'Photo' },
    ]);
    resolve('SOCIAL_LINKS', [
      { icon: 'github', link: 'https://github.com/example' },
    ]);
    sidebar.detectChanges();
    expect(el.querySelector('app-config-skeleton')).toBeNull();
    expect(el.querySelector('.featured-post-zoom')).not.toBeNull();
  });

  it('does not flash default footer content, reserves the map, and shares the social request with sidebar', () => {
    const sidebar = render(HomeSidebarComponent);
    const footer = render(FooterComponent);
    const el: HTMLElement = footer.nativeElement;
    expect(el.querySelector('.footer-logo')).toBeNull();
    expect(el.querySelector('.footer-tagline')).toBeNull();
    expect(el.querySelector('.footer-copyright')?.textContent?.trim()).toBe('');
    expect(el.querySelector('.footer-map-placeholder')).not.toBeNull();
    expect(el.querySelector('iframe')).toBeNull();
    // expectOne also asserts a single network request across both consumers.
    resolve('SOCIAL_LINKS', [
      { icon: 'github', link: 'https://github.com/example' },
    ]);
    resolve('HOME_INTRO', null);
    resolve('HOME_FEATURED_IMAGES', null);
    resolve('FOOTER_CONTENT', {
      brandName: 'Custom',
      brandAccent: 'Blog',
      tagline: 'Configured tagline',
      copyright: '© {year} Custom',
    });
    parameter('FOOTER_MAP_EMBED').flush({
      Success: true,
      Data: { ParameterValueVi: 'https://www.google.com/maps/embed?pb=test' },
    });
    sidebar.detectChanges();
    footer.detectChanges();
    expect(el.querySelector('.footer-tagline')?.textContent).toBe(
      'Configured tagline'
    );
    expect(el.querySelector('iframe')?.getAttribute('src')).toContain(
      'google.com/maps/embed'
    );
    expect(el.querySelector('.footer-copyright')?.textContent).toContain(
      `© ${new Date().getFullYear()} Custom`
    );
    expect(el.querySelector('app-config-skeleton')).toBeNull();
  });

  it('ends loading for malformed JSON and an invalid or missing optional map', () => {
    const footer = render(FooterComponent);
    parameter('FOOTER_CONTENT').flush({
      Success: true,
      Data: { ParameterValueVi: '{broken' },
    });
    resolve('SOCIAL_LINKS', null);
    parameter('FOOTER_MAP_EMBED').flush({
      Success: true,
      Data: { ParameterValueVi: 'https://example.com/not-a-map' },
    });
    footer.detectChanges();
    expect(
      footer.nativeElement.querySelector('app-config-skeleton')
    ).toBeNull();
    expect(footer.nativeElement.querySelector('.footer-map-col')).toBeNull();
    expect(
      footer.nativeElement.querySelector('.footer-logo').textContent
    ).toContain('PhanThang');
  });

  it('switches configured language directly without restoring a loading skeleton or default content', () => {
    const hero = render(DiscoveryBannerComponent);
    resolve(
      'HOME_BANNERS',
      [{ title: 'Vietnamese', image: '/vi.jpg' }],
      [{ title: 'English', image: '/en.jpg' }]
    );
    resolve('HOME_MUSIC', [
      { id: 'one', title: 'One', audioSrc: '/one.mp3' },
      { id: 'two', title: 'Two', audioSrc: '/two.mp3' },
    ]);
    hero.detectChanges();
    language.next('en');
    hero.detectChanges();
    expect(hero.nativeElement.querySelector('h1').textContent).toBe('English');
    expect(hero.nativeElement.querySelector('app-config-skeleton')).toBeNull();
    http.expectNone(req => req.url.includes('SysParameter'));
  });

  it('keeps a selected song on language changes and does not recreate its audio element', () => {
    const music = render(MusicPlayerComponent);
    resolve('HOME_MUSIC', [
      { id: 'one', title: 'One', audioSrc: '/one.mp3' },
      { id: 'two', title: 'Two', audioSrc: '/two.mp3' },
    ]);
    music.detectChanges();
    music.componentInstance.nextTrack();
    music.detectChanges();
    const audio = music.nativeElement.querySelector('audio');
    language.next('en');
    music.detectChanges();
    expect(music.componentInstance.currentSong?.id).toBe('two');
    expect(music.nativeElement.querySelector('audio')).toBe(audio);
  });

  it('times out a stalled configuration request so consumers can leave skeleton mode', fakeAsync(() => {
    let value: unknown = 'pending';
    const subscription = TestBed.inject(SysParameterConfigService)
      .getJson('TEST_STALLED')
      .subscribe(result => (value = result));
    const request = parameter('TEST_STALLED');
    tick(14999);
    expect(value).toBe('pending');
    tick(1);
    expect(value).toBeNull();
    expect(request.cancelled).toBeTrue();
    subscription.unsubscribe();
  }));

  it('keeps the login form usable and does not request the default hero while its config is pending', () => {
    const login = render(LoginComponent);
    const el: HTMLElement = login.nativeElement;
    expect(el.querySelector('.login__hero-image')).toBeNull();
    expect(el.querySelector('.login__hero-tagline')).toBeNull();
    expect(el.querySelector('app-config-skeleton')).not.toBeNull();
    expect(
      el.querySelector('input[formcontrolname="userName"]')
    ).not.toBeNull();
    resolve('LOGIN_APPEARANCE', {
      image: '/configured-login.jpg',
      description: 'Configured welcome',
    });
    login.detectChanges();
    const image = el.querySelector('.login__hero-image') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('/configured-login.jpg');
    // Keep the skeleton until the configured image itself has loaded.
    expect(el.querySelector('app-config-skeleton')).not.toBeNull();
    image.dispatchEvent(new Event('load'));
    login.detectChanges();
    expect(el.querySelector('app-config-skeleton')).toBeNull();
    expect(el.querySelector('.login__hero-tagline')?.textContent?.trim()).toBe(
      'Configured welcome'
    );
  });

  it('falls back on an actual login image error without an infinite retry loop', () => {
    const login = render(LoginComponent);
    resolve('LOGIN_APPEARANCE', { image: '/broken-login.jpg' });
    login.detectChanges();
    const image = login.nativeElement.querySelector(
      '.login__hero-image'
    ) as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    login.detectChanges();
    expect(image.getAttribute('src')).toBe(DEFAULT_LOGIN_IMAGE);
    image.dispatchEvent(new Event('error'));
    login.detectChanges();
    expect(login.componentInstance.heroImageLoaded).toBeTrue();
    expect(login.nativeElement.querySelector('app-config-skeleton')).toBeNull();
  });
});
