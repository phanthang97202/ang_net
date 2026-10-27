import { TestBed } from '@angular/core/testing';
import { MusicAnalyticsService } from '../../services/music-analytics.service';
import { MusicLibraryService } from '../../services/music-library.service';
import { YouTubeMusicService } from '../../services/youtube-music.service';
import { YouTubePlayerApiService, YouTubeIframeApi } from '../../services/youtube-player-api.service';
import { YouTubeMusicComponent } from './youtube-music.component';

describe('Music analytics events', () => {
  it('distinguishes a direct click from a confirmed playback and does not count resume twice', () => {
    const metrics = jasmine.createSpyObj('MusicAnalyticsService', ['record']);
    TestBed.configureTestingModule({ imports: [YouTubeMusicComponent], providers: [
      { provide: MusicAnalyticsService, useValue: metrics },
      { provide: MusicLibraryService, useValue: {} },
      { provide: YouTubeMusicService, useValue: {} },
      { provide: YouTubePlayerApiService, useValue: {} },
    ] });
    TestBed.overrideComponent(YouTubeMusicComponent, { set: { template: '' } });
    const component = TestBed.createComponent(YouTubeMusicComponent).componentInstance;
    const track = { id: 'abc', title: 'Song', artist: '', thumbnailUrl: '', watchUrl: '' };
    spyOn(component, 'play').and.callFake(value => { component.currentTrack = value; });
    component.selectTrack(track);
    expect(metrics.record).toHaveBeenCalledOnceWith('click', 'YouTube', 'abc', 'Song');
    const player = component as unknown as { onPlayerStateChange(api: YouTubeIframeApi, state: number): void };
    const api = { PlayerState: { PLAYING: 1, ENDED: 0 } } as YouTubeIframeApi;
    player.onPlayerStateChange(api, 1);
    player.onPlayerStateChange(api, 1);
    expect(metrics.record).toHaveBeenCalledTimes(2);
    expect(metrics.record).toHaveBeenCalledWith('play', 'YouTube', 'abc', 'Song');
  });
});
