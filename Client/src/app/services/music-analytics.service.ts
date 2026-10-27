import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

type MusicEventKind = 'search' | 'search_error' | 'click' | 'play' | 'play_error';
type MusicProvider = 'YouTube' | 'Audius';

@Injectable({ providedIn: 'root' })
export class MusicAnalyticsService {
  private readonly http = inject(HttpClient, { optional: true });

  record(kind: MusicEventKind, provider: MusicProvider, trackId = '', title = '', keyword = '', collectionId = ''): void {
    this.http?.post(`${environment.apiUrl}MusicAnalytics/Track`, {
      Kind: kind, Provider: provider, TrackId: trackId.slice(0, 200),
      Title: title.slice(0, 500), Keyword: keyword.trim().slice(0, 200), CollectionId: collectionId.slice(0, 36),
    }).subscribe({ error: () => {} });
  }
}
