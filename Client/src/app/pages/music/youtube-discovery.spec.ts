import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { IYouTubeMusicTrack } from '../../interfaces';
import { MusicLibraryService } from '../../services/music-library.service';
import { YouTubeMusicService } from '../../services/youtube-music.service';
import { YouTubePlayerApiService } from '../../services/youtube-player-api.service';
import { YouTubeMusicComponent } from './youtube-music.component';

describe('YouTube discovery and search', () => {
  let service: jasmine.SpyObj<YouTubeMusicService>;
  let library: jasmine.SpyObj<MusicLibraryService>;
  let discovery: Subject<IYouTubeMusicTrack[]>;
  let search: Subject<IYouTubeMusicTrack[]>;
  const track = (id: string): IYouTubeMusicTrack => ({
    id,
    title: id,
    artist: '',
    thumbnailUrl: '',
    watchUrl: '',
  });

  beforeEach(() => {
    discovery = new Subject();
    search = new Subject();
    service = jasmine.createSpyObj('YouTubeMusicService', [
      'discover',
      'search',
    ]);
    service.discover.and.returnValue(discovery);
    service.search.and.returnValue(search);
    library = jasmine.createSpyObj('MusicLibraryService', ['refreshSaveState']);
    TestBed.configureTestingModule({
      imports: [YouTubeMusicComponent],
      providers: [
        { provide: YouTubeMusicService, useValue: service },
        { provide: MusicLibraryService, useValue: library },
        { provide: YouTubePlayerApiService, useValue: {} },
      ],
    });
    TestBed.overrideComponent(YouTubeMusicComponent, { set: { template: '' } });
  });

  it('loads recommendations on entry without autoplay and supports refreshing them', () => {
    const fixture = TestBed.createComponent(YouTubeMusicComponent);
    fixture.detectChanges();
    expect(service.discover).toHaveBeenCalledWith(20);
    expect(fixture.componentInstance.searching).toBeTrue();
    discovery.next([track('suggestion')]);
    expect(fixture.componentInstance.tracks[0].id).toBe('suggestion');
    expect(fixture.componentInstance.currentTrack).toBeNull();
    expect(library.refreshSaveState).toHaveBeenCalled();
    fixture.componentInstance.discover();
    expect(service.discover).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('cancels in-flight recommendations when searching and restores discovery after clearing', () => {
    const fixture = TestBed.createComponent(YouTubeMusicComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.query = 'new music';
    component.submit(new Event('submit'));
    expect(service.search).toHaveBeenCalledWith('new music', 20);
    discovery.next([track('stale')]);
    search.next([track('search-result')]);
    expect(component.tracks.map(item => item.id)).toEqual(['search-result']);
    expect(component.listMode).toBe('search');
    component.clearSearch();
    discovery.next([track('new-suggestion')]);
    expect(component.listMode).toBe('discover');
    expect(component.tracks.map(item => item.id)).toEqual(['new-suggestion']);
    fixture.destroy();
  });

  it('shows an actionable error and retries discovery after failure', () => {
    const fixture = TestBed.createComponent(YouTubeMusicComponent);
    fixture.detectChanges();
    discovery.error(new Error('offline'));
    expect(fixture.componentInstance.error).toBe(
      'T_MUSIC_YOUTUBE_DISCOVER_ERROR'
    );
    const retry = new Subject<IYouTubeMusicTrack[]>();
    service.discover.and.returnValue(retry);
    fixture.componentInstance.discover();
    retry.next([track('retry')]);
    expect(fixture.componentInstance.error).toBe('');
    expect(fixture.componentInstance.tracks[0].id).toBe('retry');
    fixture.destroy();
  });
});
