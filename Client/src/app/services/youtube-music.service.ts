import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
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

export const YOUTUBE_KEY_MISSING = 'YOUTUBE_API_KEY_MISSING';

@Injectable({ providedIn: 'root' })
export class YouTubeMusicService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly apiUrl = 'https://www.googleapis.com/youtube/v3/search';

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
      .get<YouTubeSearchResponse>(this.apiUrl, { params })
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
