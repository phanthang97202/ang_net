import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap, throwError } from 'rxjs';
import { IYouTubeMusicTrack } from '../interfaces';

interface YouTubeThumbnail {
  url?: string;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      default?: YouTubeThumbnail;
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

interface YouTubePopularItem {
  id?: string;
  snippet?: YouTubeSearchItem['snippet'];
  status?: { embeddable?: boolean; privacyStatus?: string };
  contentDetails?: {
    regionRestriction?: { allowed?: string[]; blocked?: string[] };
  };
}

interface YouTubePopularResponse {
  items?: YouTubePopularItem[];
}

export const YOUTUBE_KEY_MISSING = 'YOUTUBE_API_KEY_MISSING';

@Injectable({ providedIn: 'root' })
export class YouTubeMusicService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly apiUrl = 'https://www.googleapis.com/youtube/v3';
  private discoveryCache?: {
    key: string;
    expiresAt: number;
    request: Observable<IYouTubeMusicTrack[]>;
  };

  /** Randomize a cached sample of popular music videos, not the whole YouTube catalog. */
  discover(limit = 20): Observable<IYouTubeMusicTrack[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) return throwError(() => new Error(YOUTUBE_KEY_MISSING));

    let cached = this.discoveryCache;
    if (!cached || cached.key !== apiKey || cached.expiresAt <= Date.now()) {
      const params = new HttpParams()
        .set('part', 'snippet,status,contentDetails')
        .set('chart', 'mostPopular')
        .set('videoCategoryId', '10')
        .set('regionCode', 'VN')
        .set('maxResults', 50)
        .set('key', apiKey);
      const entry = {
        key: apiKey,
        expiresAt: Date.now() + 30 * 60 * 1000,
        request: null as unknown as Observable<IYouTubeMusicTrack[]>,
      };
      entry.request = this.http
        .get<YouTubePopularResponse>(`${this.apiUrl}/videos`, { params })
        .pipe(
          map(response =>
            (response.items ?? [])
              .filter(item => {
                const restriction = item.contentDetails?.regionRestriction;
                return (
                  !!item.id &&
                  !!item.snippet?.title &&
                  item.status?.embeddable === true &&
                  item.status.privacyStatus === 'public' &&
                  (!restriction?.allowed ||
                    restriction.allowed.includes('VN')) &&
                  !restriction?.blocked?.includes('VN')
                );
              })
              .map(item =>
                this.toTrack({
                  id: { videoId: item.id },
                  snippet: item.snippet,
                })
              )
          ),
          tap({
            error: () => {
              if (this.discoveryCache === entry)
                this.discoveryCache = undefined;
            },
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      this.discoveryCache = cached = entry;
    }

    return cached.request.pipe(
      map(tracks => {
        const shuffled = [...tracks];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, Math.min(Math.max(limit, 1), 50));
      })
    );
  }

  search(query: string, limit = 20): Observable<IYouTubeMusicTrack[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return throwError(() => new Error(YOUTUBE_KEY_MISSING));
    }

    const params = new HttpParams()
      .set('part', 'snippet')
      .set('type', 'video')
      .set('videoCategoryId', '10')
      .set('videoEmbeddable', 'true')
      .set('videoSyndicated', 'true')
      .set('safeSearch', 'moderate')
      .set('maxResults', Math.min(Math.max(limit, 1), 25))
      .set('q', query.trim())
      .set('key', apiKey);

    return this.http
      .get<YouTubeSearchResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(response =>
          (response.items ?? [])
            .filter(item => Boolean(item.id?.videoId && item.snippet?.title))
            .map(item => this.toTrack(item))
        )
      );
  }

  private getApiKey(): string {
    return (
      this.document.querySelector<HTMLMetaElement>(
        'meta[name="youtube-api-key"]'
      )?.content ?? ''
    ).trim();
  }

  private toTrack(item: YouTubeSearchItem): IYouTubeMusicTrack {
    const id = item.id?.videoId ?? '';
    const snippet = item.snippet;
    return {
      id,
      title: this.decodeHtml(snippet?.title ?? ''),
      artist: this.decodeHtml(snippet?.channelTitle ?? 'YouTube'),
      thumbnailUrl:
        snippet?.thumbnails?.high?.url ??
        snippet?.thumbnails?.medium?.url ??
        snippet?.thumbnails?.default?.url ??
        '',
      watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    };
  }

  private decodeHtml(value: string): string {
    const textarea = this.document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }
}
