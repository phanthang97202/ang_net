import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  ArrowLeftOutline,
  ArrowRightOutline,
  PlayCircleOutline,
  ClockCircleOutline,
  HeartOutline,
  UnorderedListOutline,
  CloseOutline,
} from '@ant-design/icons-angular/icons';
import { MovieComponent } from './movie.component';
import { MovieVideoComponent } from './movie-video.component';
import {
  IMovieLibraryDetail,
  IMovieLibraryEpisode,
} from '../../interfaces/movie';
import { environment } from '../../../environments/environment';

describe('Movie episode navigation', () => {
  let fixture: ComponentFixture<MovieComponent>;
  let movie: MovieComponent;
  let http: HttpTestingController;
  const episodes: IMovieLibraryEpisode[] = [
    { Slug: 'pilot', Name: 'Tập 1', HasSource: true },
    { Slug: 'pending', Name: 'Tập 2', HasSource: false },
    { Slug: 'special', Name: 'Tập đặc biệt', HasSource: true },
    { Slug: 'finale', Name: 'Tập cuối', HasSource: true },
  ];
  const playbackUrl = `${environment.apiUrl}Movie/Library/demo/playback`;
  const progressUrl = `${environment.apiUrl}Movie/Progress/demo`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MovieComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            ArrowLeftOutline,
            ArrowRightOutline,
            PlayCircleOutline,
            ClockCircleOutline,
            HeartOutline,
            UnorderedListOutline,
            CloseOutline,
          ],
        },
        { provide: NzMessageService, useValue: { error: jasmine.createSpy() } },
      ],
    });
    // No real video downloads: exercise the component and playback API contract.
    TestBed.overrideComponent(MovieVideoComponent, { set: { template: '' } });
    spyOn(MovieComponent.prototype, 'ngOnInit').and.stub();
    fixture = TestBed.createComponent(MovieComponent);
    movie = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    movie.slug = 'demo';
    movie.detail = {
      Slug: 'demo',
      Title: 'Demo',
      OriginalTitle: 'Demo',
      PosterUrl: '',
      BannerUrl: '',
      Year: 2026,
      EpisodeStatus: '',
      Quality: '',
      Language: '',
      IsWishlisted: false,
      Description: '',
      Genres: [],
      Servers: [{ Id: 7, Name: 'Vietsub', Episodes: [...episodes] }],
    } satisfies IMovieLibraryDetail;
    movie.server = movie.detail.Servers[0];
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    fixture.destroy();
  });

  function finishPlayback(episode: string, server = 7): void {
    const request = http.expectOne(req => req.url === playbackUrl);
    expect(request.request.params.get('episode')).toBe(episode);
    expect(request.request.params.get('server')).toBe(`${server}`);
    request.flush({
      Success: true,
      Data: {
        Title: episode,
        Url: 'https://example.com/test.m3u8',
        EmbedUrl: '',
      },
    });
    finishProgress(episode, server);
    fixture.detectChanges();
  }

  function finishProgress(episode: string, server = 7): void {
    const request = http.expectOne(progressUrl);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      ServerId: server,
      EpisodeSlug: episode,
    });
    request.flush({
      Success: true,
      Data: {
        ServerId: server,
        ServerName: movie.server?.Name || 'Vietsub',
        EpisodeSlug: episode,
        EpisodeName:
          movie.server?.Episodes.find(e => e.Slug === episode)?.Name || episode,
        UpdatedAt: new Date().toISOString(),
      },
    });
  }

  function pressFullscreenKey(
    options: KeyboardEventInit = {},
    target: EventTarget = document
  ): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key: 'f',
      bubbles: true,
      cancelable: true,
      ...options,
    });
    target.dispatchEvent(event);
    return event;
  }

  it('toggles only the video frame fullscreen with F and Shift+F', fakeAsync(() => {
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    const screen = fixture.nativeElement.querySelector(
      '.movie-player__screen'
    ) as HTMLElement;
    let fullscreen: Element | null = null;
    spyOnProperty(document, 'fullscreenElement', 'get').and.callFake(
      () => fullscreen
    );
    const enter = spyOn(screen, 'requestFullscreen').and.callFake(() => {
      fullscreen = screen;
      return Promise.resolve();
    });
    const exit = spyOn(document, 'exitFullscreen').and.callFake(() => {
      fullscreen = null;
      return Promise.resolve();
    });
    expect(pressFullscreenKey().defaultPrevented).toBeTrue();
    flushMicrotasks();
    expect(enter).toHaveBeenCalledTimes(1);
    expect(screen.getAttribute('aria-keyshortcuts')).toBe('f');
    expect(
      pressFullscreenKey({ key: 'F', shiftKey: true }).defaultPrevented
    ).toBeTrue();
    flushMicrotasks();
    expect(exit).toHaveBeenCalledTimes(1);
  }));

  it('ignores typing, browser shortcuts, key repeat and input composition', () => {
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    const screen = fixture.nativeElement.querySelector(
      '.movie-player__screen'
    ) as HTMLElement;
    const enter = spyOn(screen, 'requestFullscreen').and.resolveTo();
    for (const tag of ['input', 'textarea', 'select', 'div']) {
      const field = document.createElement(tag);
      if (tag === 'div') field.contentEditable = 'true';
      fixture.nativeElement.appendChild(field);
      expect(pressFullscreenKey({}, field).defaultPrevented).toBeFalse();
      field.remove();
    }
    for (const options of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { repeat: true },
      { isComposing: true },
      { key: 'x' },
    ]) {
      expect(pressFullscreenKey(options).defaultPrevented).toBeFalse();
    }
    expect(enter).not.toHaveBeenCalled();
  });

  it('leaves F alone when no movie is playing or a different element is fullscreen', () => {
    expect(pressFullscreenKey().defaultPrevented).toBeFalse();
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    spyOnProperty(document, 'fullscreenElement', 'get').and.returnValue(
      document.documentElement
    );
    const exit = spyOn(document, 'exitFullscreen').and.resolveTo();
    expect(pressFullscreenKey().defaultPrevented).toBeFalse();
    expect(exit).not.toHaveBeenCalled();
  });

  it('handles fullscreen API rejection and allows the next F attempt', fakeAsync(() => {
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    const screen = fixture.nativeElement.querySelector(
      '.movie-player__screen'
    ) as HTMLElement;
    const enter = spyOn(screen, 'requestFullscreen').and.rejectWith(
      new Error('Denied')
    );
    pressFullscreenKey();
    flushMicrotasks();
    expect(TestBed.inject(NzMessageService).error).toHaveBeenCalledTimes(1);
    enter.and.resolveTo();
    pressFullscreenKey();
    flushMicrotasks();
    expect(enter).toHaveBeenCalledTimes(2);
  }));

  function loadDetail(
    progress: any = null,
    servers = movie.detail!.Servers
  ): void {
    const data = {
      ...movie.detail!,
      WatchProgress: progress,
      Servers: servers,
    };
    movie.load();
    http
      .expectOne(`${environment.apiUrl}Movie/Library/demo`)
      .flush({ Success: true, Data: data });
    fixture.detectChanges();
  }

  it('automatically resumes the saved episode when reopening a movie', () => {
    loadDetail({
      ServerId: 7,
      ServerName: 'Vietsub',
      EpisodeSlug: 'special',
      EpisodeName: 'Tập đặc biệt',
    });
    expect(movie.selectedEpisode).toBe('special');
    finishPlayback('special');
    expect(movie.detail?.WatchProgress?.EpisodeSlug).toBe('special');
    expect(
      fixture.nativeElement.querySelector('.movie-detail__badges').textContent
    ).toContain('Tiến trình: Tập đặc biệt');
  });

  it('uses the saved server name if provider server positions have changed', () => {
    loadDetail(
      {
        ServerId: 7,
        ServerName: 'Vietsub',
        EpisodeSlug: 'special',
        EpisodeName: 'Tập đặc biệt',
      },
      [
        { Id: 7, Name: 'Thuyết minh', Episodes: [...episodes] },
        { Id: 9, Name: 'Vietsub', Episodes: [...episodes] },
      ]
    );
    expect(movie.server?.Id).toBe(9);
    finishPlayback('special', 9);
  });

  it('automatically opens the first playable episode when there is no saved progress', () => {
    loadDetail();
    expect(movie.selectedEpisode).toBe('pilot');
    expect(movie.loadingPlayback).toBeTrue();
    expect(fixture.nativeElement.querySelector('.movie-player')).not.toBeNull();
    finishPlayback('pilot');
    expect(movie.detail?.WatchProgress?.EpisodeSlug).toBe('pilot');
  });

  it('skips empty servers and unavailable episodes when starting a new movie', () => {
    loadDetail(null, [
      { Id: 7, Name: 'Vietsub', Episodes: [episodes[1]] },
      {
        Id: 9,
        Name: 'Thuyết minh',
        Episodes: [episodes[1], episodes[2], episodes[3]],
      },
    ]);
    expect(movie.server?.Id).toBe(9);
    expect(movie.selectedEpisode).toBe('special');
    finishPlayback('special', 9);
  });

  it('shows a clear player message instead of an empty area if no episode is playable', () => {
    loadDetail(null, []);
    expect(movie.playbackError).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.movie-player [role="alert"]')
        .textContent
    ).toContain('chưa có tập khả dụng');
    expect(movie.selectedEpisode).toBe('');
    http.expectNone(req => req.url === playbackUrl || req.url === progressUrl);
  });

  it('keeps the saved progress visible without looping if that episode has lost its source', () => {
    loadDetail({
      ServerId: 7,
      ServerName: 'Vietsub',
      EpisodeSlug: 'pending',
      EpisodeName: 'Tập 2',
    });
    expect(movie.selectedEpisode).toBe('');
    expect(movie.playbackError).toContain('Tập đã lưu');
    expect(
      fixture.nativeElement.querySelector('.movie-detail__badges').textContent
    ).toContain('Tiến trình: Tập 2');
    http.expectNone(req => req.url === playbackUrl || req.url === progressUrl);
  });

  it('queues progress writes in selection order while playback remains usable', () => {
    movie.playEpisode(episodes[0]);
    http
      .expectOne(req => req.url === playbackUrl)
      .flush({
        Success: true,
        Data: {
          Title: 'Tập 1',
          Url: 'https://example.com/test.m3u8',
          EmbedUrl: '',
        },
      });
    const firstSave = http.expectOne(progressUrl);
    movie.changeEpisode(1);
    http
      .expectOne(req => req.url === playbackUrl)
      .flush({
        Success: true,
        Data: {
          Title: 'Tập đặc biệt',
          Url: 'https://example.com/test.m3u8',
          EmbedUrl: '',
        },
      });
    expect(movie.selectedEpisode).toBe('special');
    http.expectNone(progressUrl);
    firstSave.flush({
      Success: true,
      Data: { EpisodeSlug: 'pilot', EpisodeName: 'Tập 1' },
    });
    finishProgress('special');
    expect(movie.detail?.WatchProgress?.EpisodeSlug).toBe('special');
  });

  it('does not interrupt the player when saving fails and allows a retry', () => {
    movie.playEpisode(episodes[0]);
    http
      .expectOne(req => req.url === playbackUrl)
      .flush({
        Success: true,
        Data: {
          Title: 'Tập 1',
          Url: 'https://example.com/test.m3u8',
          EmbedUrl: '',
        },
      });
    http
      .expectOne(progressUrl)
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(movie.playback?.Url).toBeTruthy();
    expect(movie.progressError).toBeTruthy();
    fixture.nativeElement.querySelector('.movie-progress-retry').click();
    finishProgress('pilot');
    expect(movie.progressError).toBe('');
  });

  it('never saves a failed or unusable playback source', () => {
    movie.playEpisode(episodes[0]);
    http
      .expectOne(req => req.url === playbackUrl)
      .flush({ Success: false, ErrorMessage: 'No source' });
    http.expectNone(progressUrl);
    movie.playEpisode(episodes[0]);
    http
      .expectOne(req => req.url === playbackUrl)
      .flush({
        Success: true,
        Data: { Title: 'Tập 1', Url: '', EmbedUrl: '' },
      });
    http.expectNone(progressUrl);
    expect(movie.playbackError).toBeTruthy();
    expect(movie.detail?.WatchProgress).toBeUndefined();
  });

  function buttons(): HTMLButtonElement[] {
    return [
      ...fixture.nativeElement.querySelectorAll(
        '.movie-player__episode-nav button'
      ),
    ];
  }

  it('opens the episode sidebar and supports closing with Escape or an outside click', () => {
    const toggle = fixture.nativeElement.querySelector(
      '.movie-episodes__toggle'
    ) as HTMLButtonElement;
    const panel = fixture.nativeElement.querySelector(
      '.movie-episodes__panel'
    ) as HTMLElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(getComputedStyle(panel).display).not.toBe('none');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(movie.episodesOpen).toBeFalse();
    if (window.matchMedia('(min-width: 761px)').matches) {
      expect(document.activeElement).toBe(toggle);
    }

    toggle.click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.movie-detail__hero').click();
    fixture.detectChanges();
    expect(movie.episodesOpen).toBeFalse();
  });

  it('places episode navigation at the end of the same toolbar as the player choices', () => {
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    movie.playback!.EmbedUrl = 'https://player.phimapi.com/player/?url=test';
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector(
      '.movie-player__actions'
    ) as HTMLElement;
    expect(
      Array.from(toolbar.querySelectorAll('button')).map(button =>
        button.textContent?.trim()
      )
    ).toEqual([
      'Trình phát mặc định',
      'Trình phát HLS',
      'Tập trước',
      'Tập sau',
    ]);
    expect(
      toolbar.lastElementChild?.classList.contains('movie-player__episode-nav')
    ).toBeTrue();
  });

  it('does not reserve a sidebar column inside the movie content', () => {
    expect(
      getComputedStyle(
        fixture.nativeElement.querySelector('.movie-watch-layout')
      ).display
    ).not.toBe('grid');
    const sidebar = fixture.nativeElement.querySelector(
      '.movie-episodes'
    ) as HTMLElement;
    if (window.matchMedia('(min-width: 761px)').matches) {
      expect(getComputedStyle(sidebar).position).toBe('fixed');
      expect(sidebar.getBoundingClientRect().left).toBe(0);
    } else {
      expect(getComputedStyle(sidebar).position).toBe('static');
    }
  });

  it('closes the sidebar after choosing an episode and keeps the mobile list in the same DOM', () => {
    fixture.nativeElement.querySelector('.movie-episodes__toggle').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.episode-item').click();
    finishPlayback('pilot');
    expect(movie.episodesOpen).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.episode-grid').length).toBe(
      1
    );
    expect(
      fixture.nativeElement.querySelector('.movie-player__heading span')
    ).toBeNull();
    expect(
      getComputedStyle(
        fixture.nativeElement.querySelector('.movie-player__heading')
      ).justifyContent
    ).toBe('center');
  });

  it('disables previous on the first episode, skips unavailable episodes and updates the active episode', () => {
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    expect(buttons().map(button => button.textContent?.trim())).toEqual([
      'Tập trước',
      'Tập sau',
    ]);
    expect(buttons()[0].disabled).toBeTrue();
    expect(buttons()[1].disabled).toBeFalse();

    buttons()[1].click();
    fixture.detectChanges();
    expect(movie.selectedEpisode).toBe('special');
    expect(buttons().every(button => button.disabled)).toBeTrue();
    // Repeated clicks while fetching a source must not queue more requests.
    movie.changeEpisode(1);
    finishPlayback('special');
    expect(buttons().every(button => !button.disabled)).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('.episode-item--active').textContent
    ).toContain('Tập đặc biệt');

    buttons()[0].click();
    finishPlayback('pilot');
    expect(movie.selectedEpisode).toBe('pilot');
  });

  it('disables next on the last episode and does not wrap to the beginning', () => {
    movie.playEpisode(episodes[3]);
    finishPlayback('finale');
    expect(buttons()[0].disabled).toBeFalse();
    expect(buttons()[1].disabled).toBeTrue();
    movie.changeEpisode(1);
    http.expectNone(req => req.url === playbackUrl);
    expect(movie.selectedEpisode).toBe('finale');
  });

  it('disables both buttons for a movie with only one playable episode', () => {
    movie.server!.Episodes = [episodes[1], episodes[0]];
    movie.playEpisode(episodes[0]);
    finishPlayback('pilot');
    expect(buttons().every(button => button.disabled)).toBeTrue();
    movie.changeEpisode(-1);
    movie.changeEpisode(1);
    http.expectNone(req => req.url === playbackUrl);
  });

  it('uses only the selected server and its episode order', () => {
    movie.server = {
      Id: 9,
      Name: 'Thuyết minh',
      Episodes: [episodes[3], episodes[0]],
    };
    movie.playEpisode(episodes[3]);
    finishPlayback('finale', 9);
    expect(buttons()[0].disabled).toBeTrue();
    expect(buttons()[1].disabled).toBeFalse();
    buttons()[1].click();
    finishPlayback('pilot', 9);
    expect(movie.selectedEpisode).toBe('pilot');
    expect(buttons()[1].disabled).toBeTrue();
  });

  it('does not navigate before selecting an episode or with an empty server', () => {
    expect(movie.previousEpisode).toBeNull();
    expect(movie.nextEpisode).toBeNull();
    movie.changeEpisode(1);
    movie.server = null;
    movie.changeEpisode(-1);
    http.expectNone(req => req.url === playbackUrl);
    expect(buttons().length).toBe(0);
  });

  it('allows changing episodes after a playback-source error', () => {
    movie.playEpisode(episodes[0]);
    http
      .expectOne(req => req.url === playbackUrl)
      .flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(movie.loadingPlayback).toBeFalse();
    expect(buttons()[1].disabled).toBeFalse();
    buttons()[1].click();
    finishPlayback('special');
    expect(movie.playbackError).toBe('');
  });
});
