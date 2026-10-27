import { TestBed } from '@angular/core/testing';
import {
  IMusicLibraryTrack,
  IMusicTrack,
  IYouTubeMusicTrack,
} from '../../interfaces';
import { AudiusMusicService } from '../../services/audius-music.service';
import { MusicLibraryService } from '../../services/music-library.service';
import { YouTubeMusicService } from '../../services/youtube-music.service';
import {
  YouTubeIframeApi,
  YouTubePlayerApiService,
} from '../../services/youtube-player-api.service';
import { MusicQueuePlayerComponent } from './music-queue-player.component';
import { YouTubeMusicComponent } from './youtube-music.component';
import { MusicComponent } from './music.component';

describe('Shuffle integration with players', () => {
  beforeEach(() => {
    spyOn(Math, 'random').and.returnValue(0);
    TestBed.configureTestingModule({
      imports: [
        MusicQueuePlayerComponent,
        YouTubeMusicComponent,
        MusicComponent,
      ],
      providers: [
        { provide: MusicLibraryService, useValue: {} },
        { provide: YouTubeMusicService, useValue: {} },
        { provide: YouTubePlayerApiService, useValue: {} },
        { provide: AudiusMusicService, useValue: {} },
      ],
    });
    TestBed.overrideComponent(MusicQueuePlayerComponent, {
      set: { template: '' },
    });
    TestBed.overrideComponent(YouTubeMusicComponent, { set: { template: '' } });
    TestBed.overrideComponent(MusicComponent, { set: { template: '' } });
  });

  it('skips unavailable collection tracks and goes back through the played history', () => {
    const component = TestBed.createComponent(
      MusicQueuePlayerComponent
    ).componentInstance;
    component.tracks = ['a', 'b', 'c'].map(
      (id, index) =>
        ({
          TrackId: id,
          Provider: 'YouTube',
          ExternalId: id,
          Title: id,
          Artist: '',
          ThumbnailUrl: '',
          DurationSeconds: null,
          ExternalUrl: '',
          AddedDTime: null,
          Availability: index === 1 ? 'Unavailable' : 'Available',
        }) as IMusicLibraryTrack
    );
    component.index = 0;
    component.shuffle = true;
    component.indexChange.subscribe(index => (component.index = index));
    component.next();
    expect(component.current?.TrackId).toBe('c');
    component.previous();
    expect(component.current?.TrackId).toBe('a');
  });

  it('starts a random search result and advances randomly when YouTube finishes', () => {
    const component = TestBed.createComponent(
      YouTubeMusicComponent
    ).componentInstance;
    component.tracks = ['a', 'b', 'c'].map(
      id =>
        ({
          id,
          title: id,
          artist: '',
          thumbnailUrl: '',
          watchUrl: '',
        }) as IYouTubeMusicTrack
    );
    spyOn(component, 'play').and.callFake(track => {
      component.currentTrack = track;
    });
    component.shuffleResults();
    expect(component.shuffle).toBeTrue();
    expect(component.currentTrack?.id).toBe('a');
    const callbacks = component as unknown as {
      onPlayerStateChange(api: YouTubeIframeApi, state: number): void;
    };
    callbacks.onPlayerStateChange(
      { PlayerState: { ENDED: 0, PLAYING: 1 } } as YouTubeIframeApi,
      0
    );
    expect(component.currentTrack?.id).toBe('b');
    component.previousTrack();
    expect(component.currentTrack?.id).toBe('a');
    component.shuffleResults();
    expect(component.shuffle).toBeFalse();
  });

  it('advances and returns through random Audius search results', () => {
    const component = TestBed.createComponent(MusicComponent).componentInstance;
    component.tracks = ['a', 'b', 'c'].map(
      id =>
        ({
          id,
          title: id,
          artist: '',
          artworkUrl: '',
          durationSeconds: 0,
          genre: '',
          streamUrl: `https://example.test/${id}`,
          permalinkUrl: '',
        }) as IMusicTrack
    );
    component.currentTrack = component.tracks[0];
    const audio = {
      src: '',
      load: jasmine.createSpy('load'),
      play: () => Promise.resolve(),
    };
    (component as unknown as { audioRef: unknown }).audioRef = {
      nativeElement: audio,
    };
    component.toggleShuffle();
    component.nextTrack();
    expect(component.currentTrack?.id).toBe('b');
    component.onEnded();
    expect(component.currentTrack?.id).toBe('c');
    component.previousTrack();
    expect(component.currentTrack?.id).toBe('b');
  });
});
