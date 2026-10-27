import { DOCUMENT } from '@angular/common';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  YouTubeMusicService,
  YOUTUBE_KEY_MISSING,
} from './youtube-music.service';

describe('YouTube music discovery', () => {
  let service: YouTubeMusicService;
  let http: HttpTestingController;
  let meta: HTMLMetaElement;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(YouTubeMusicService);
    http = TestBed.inject(HttpTestingController);
    meta = TestBed.inject(DOCUMENT).createElement('meta');
    meta.name = 'youtube-api-key';
    meta.content = 'public-test-key';
    TestBed.inject(DOCUMENT).head.appendChild(meta);
  });
  afterEach(() => {
    meta.remove();
    http.verify();
  });

  it('loads popular Vietnamese music, filters unplayable videos, and reuses the cache for a reshuffle', () => {
    const results: string[][] = [];
    service
      .discover(2)
      .subscribe(tracks => results.push(tracks.map(track => track.id)));
    const request = http.expectOne(
      req => req.url === 'https://www.googleapis.com/youtube/v3/videos'
    );
    expect(request.request.params.get('chart')).toBe('mostPopular');
    expect(request.request.params.get('videoCategoryId')).toBe('10');
    expect(request.request.params.get('regionCode')).toBe('VN');
    expect(request.request.params.get('part')).toBe(
      'snippet,status,contentDetails'
    );
    request.flush({
      items: [
        {
          id: 'a',
          snippet: {
            title: 'Song &amp; one',
            channelTitle: 'Artist',
            thumbnails: { medium: { url: 'image' } },
          },
          status: { embeddable: true, privacyStatus: 'public' },
        },
        {
          id: 'b',
          snippet: { title: 'Song two' },
          status: { embeddable: true, privacyStatus: 'public' },
        },
        {
          id: 'blocked',
          snippet: { title: 'Blocked' },
          status: { embeddable: false, privacyStatus: 'public' },
        },
        {
          id: 'restricted',
          snippet: { title: 'Restricted' },
          status: { embeddable: true, privacyStatus: 'public' },
          contentDetails: { regionRestriction: { blocked: ['VN'] } },
        },
        {
          id: 'not-allowed',
          snippet: { title: 'Other region' },
          status: { embeddable: true, privacyStatus: 'public' },
          contentDetails: { regionRestriction: { allowed: ['US'] } },
        },
        {
          id: 'private',
          snippet: { title: 'Private' },
          status: { embeddable: true, privacyStatus: 'private' },
        },
      ],
    });
    expect(results[0].slice().sort()).toEqual(['a', 'b']);
    let decoded = '';
    service.discover(2).subscribe(tracks => {
      decoded = tracks.find(track => track.id === 'a')!.title;
      results.push(tracks.map(track => track.id));
    });
    expect(decoded).toBe('Song & one');
    expect(results[1].slice().sort()).toEqual(['a', 'b']);
    http.expectNone(req => req.url.endsWith('/videos'));
  });

  it('retries the API after a failed discovery request', () => {
    service.discover().subscribe({ error: () => undefined });
    http
      .expectOne(req => req.url.endsWith('/videos'))
      .flush({}, { status: 503, statusText: 'Unavailable' });
    service.discover().subscribe();
    http.expectOne(req => req.url.endsWith('/videos')).flush({ items: [] });
  });

  it('reports a missing key without sending a request', () => {
    meta.remove();
    let message = '';
    service.discover().subscribe({
      error: error => {
        message = error.message;
      },
    });
    expect(message).toBe(YOUTUBE_KEY_MISSING);
    http.expectNone(req => req.url.endsWith('/videos'));
  });

  it('keeps the existing search endpoint and embeddable filter', () => {
    service
      .search('music', 20)
      .subscribe(tracks => expect(tracks[0].id).toBe('song'));
    const request = http.expectOne(req => req.url.endsWith('/search'));
    expect(request.request.params.get('videoEmbeddable')).toBe('true');
    expect(request.request.params.get('q')).toBe('music');
    request.flush({
      items: [{ id: { videoId: 'song' }, snippet: { title: 'Song' } }],
    });
  });
});
