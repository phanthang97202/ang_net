import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    fixture.detectChanges();
  }

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

  it('keeps the sidebar panel within the available viewport space', () => {
    const sidebar = fixture.nativeElement.querySelector(
      '.movie-episodes'
    ) as HTMLElement;
    const bounds = spyOn(sidebar, 'getBoundingClientRect');
    bounds.and.returnValue({
      top: window.innerHeight - 100,
      bottom: window.innerHeight - 36,
    } as DOMRect);
    movie.episodesOpen = true;
    movie.updateEpisodePanelLayout();
    expect(movie.episodePanelAbove).toBeTrue();
    expect(movie.episodePanelHeight).toBeLessThanOrEqual(
      window.innerHeight - 120
    );

    bounds.and.returnValue({ top: 96, bottom: 160 } as DOMRect);
    movie.updateEpisodePanelLayout();
    expect(movie.episodePanelAbove).toBeFalse();
    expect(movie.episodePanelHeight).toBeLessThanOrEqual(
      window.innerHeight - 112
    );
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
