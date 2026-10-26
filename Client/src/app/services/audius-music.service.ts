import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { IMusicTrack } from '../interfaces';

interface AudiusArtwork {
  '150x150'?: string;
  '480x480'?: string;
  '1000x1000'?: string;
}

interface AudiusUser {
  name?: string;
  handle?: string;
}

interface AudiusTrack {
  id?: string;
  title?: string;
  duration?: number;
  genre?: string;
  artwork?: AudiusArtwork | null;
  permalink?: string;
  user?: AudiusUser | null;
}

interface AudiusResponse {
  data?: AudiusTrack[];
}

@Injectable({ providedIn: 'root' })
export class AudiusMusicService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.audius.co/v1';
  private trendingRequest?: Observable<IMusicTrack[]>;

  getTrending(limit = 20, refresh = false): Observable<IMusicTrack[]> {
    if (refresh) this.trendingRequest = undefined;

    if (!this.trendingRequest) {
      const params = new HttpParams().set('limit', limit);
      this.trendingRequest = this.http
        .get<AudiusResponse>(`${this.apiUrl}/tracks/trending`, { params })
        .pipe(
          map(response =>
            (response.data ?? [])
              .filter(track => Boolean(track.id && track.title))
              .map(track => this.toMusicTrack(track))
          ),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }

    return this.trendingRequest;
  }

  private toMusicTrack(track: AudiusTrack): IMusicTrack {
    const id = track.id ?? '';
    const permalink = track.permalink ?? '';

    return {
      id,
      title: track.title?.trim() ?? '',
      artist:
        track.user?.name?.trim() || track.user?.handle?.trim() || 'Audius',
      artworkUrl:
        track.artwork?.['480x480'] ??
        track.artwork?.['1000x1000'] ??
        track.artwork?.['150x150'] ??
        '',
      durationSeconds: Math.max(0, track.duration ?? 0),
      genre: track.genre?.trim() ?? '',
      streamUrl: `${this.apiUrl}/tracks/${encodeURIComponent(id)}/stream`,
      permalinkUrl: permalink.startsWith('http')
        ? permalink
        : `https://audius.co${permalink.startsWith('/') ? '' : '/'}${permalink}`,
    };
  }
}
