import { signal } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, of, throwError } from 'rxjs';
import { AuthService, MusicLibraryService } from '../../services';
import {
  IMusicLibraryTrack,
  IMusicLibraryTrackResponse,
} from '../../interfaces';
import { MusicLibraryComponent } from './music-library.component';

describe('Shuffling music collections', () => {
  let library: jasmine.SpyObj<MusicLibraryService>;
  let message: jasmine.SpyObj<NzMessageService>;
  const track = (id: number, available = true): IMusicLibraryTrack => ({
    TrackId: `track-${id}`,
    Provider: 'YouTube',
    ExternalId: `youtube-${id}`,
    Title: `Track ${id}`,
    Artist: 'Artist',
    ThumbnailUrl: '',
    DurationSeconds: null,
    ExternalUrl: '',
    Availability: available ? 'Available' : 'Unavailable',
    AddedDTime: null,
  });
  const page = (data: IMusicLibraryTrack[], total: number) =>
    ({
      Success: true,
      objResult: { DataList: data, ItemCount: total },
    }) as IMusicLibraryTrackResponse;

  beforeEach(() => {
    library = jasmine.createSpyObj(
      'MusicLibraryService',
      ['saved', 'collectionTracks', 'refreshSaveState'],
      { changes: signal(0) }
    );
    message = jasmine.createSpyObj('NzMessageService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: MusicLibraryService, useValue: library },
        { provide: NzMessageService, useValue: message },
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => false, hasPermission: () => false },
        },
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
  });

  function create(): MusicLibraryComponent {
    return TestBed.runInInjectionContext(() => new MusicLibraryComponent());
  }

  it('loads every page before randomly starting a track, including later pages', fakeAsync(() => {
    const component = create();
    component.tracks = Array.from({ length: 100 }, (_, index) => track(index));
    component.itemCount = 102;
    library.saved.and.returnValue(
      of(page([track(100, false), track(101)], 102))
    );
    spyOn(Math, 'random').and.returnValue(0.9999);
    component.shuffleCurrentList();
    expect(component.shuffleLoading).toBeTrue();
    flushMicrotasks();
    expect(library.saved).toHaveBeenCalledOnceWith(1, 100);
    expect(component.queue.length).toBe(102);
    expect(component.tracks.length).toBe(102);
    expect(component.queue[component.queueIndex].TrackId).toBe('track-101');
    expect(component.shuffle).toBeTrue();
    expect(component.shuffleLoading).toBeFalse();
  }));

  it('enables shuffle for the playing queue without interrupting the current track', fakeAsync(() => {
    const component = create();
    component.tracks = Array.from({ length: 100 }, (_, index) => track(index));
    component.itemCount = 101;
    component.play(3);
    library.saved.and.returnValue(of(page([track(100)], 101)));
    component.setQueueShuffle(true);
    flushMicrotasks();
    expect(component.queue.length).toBe(101);
    expect(component.queue[component.queueIndex].TrackId).toBe('track-3');
    expect(component.shuffle).toBeTrue();
    component.setQueueShuffle(false);
    expect(component.shuffle).toBeFalse();
  }));

  it('uses the shared collection endpoint and ignores stale results after switching collections', fakeAsync(() => {
    const component = create();
    component.sharedCollectionId = 'public-collection';
    component.tracks = [track(0)];
    component.itemCount = 2;
    const pending = new Subject<IMusicLibraryTrackResponse>();
    library.collectionTracks.and.returnValue(pending);
    component.shuffleCurrentList();
    expect(library.collectionTracks).toHaveBeenCalledWith(
      'public-collection',
      1,
      100
    );
    component.sharedCollectionId = 'another-collection';
    pending.next(page([track(1)], 2));
    flushMicrotasks();
    expect(component.queue.length).toBe(0);
    expect(component.shuffle).toBeFalse();
    expect(component.shuffleLoading).toBeFalse();
  }));

  it('leaves the current queue untouched when loading another page fails', fakeAsync(() => {
    const component = create();
    component.tracks = [track(0)];
    component.itemCount = 2;
    component.play(0);
    library.saved.and.returnValue(throwError(() => new Error('offline')));
    component.setQueueShuffle(true);
    flushMicrotasks();
    expect(component.queue.map(item => item.TrackId)).toEqual(['track-0']);
    expect(component.shuffle).toBeFalse();
    expect(component.shuffleLoading).toBeFalse();
    expect(message.error).toHaveBeenCalledWith('T_MUSIC_LIBRARY_LOAD_ERROR');
  }));
});
