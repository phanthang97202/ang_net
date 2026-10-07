import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  IAnimeDetailResponse,
  IAnimePlaybackResponse,
  IAnimeSearchResponse,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class AnimeService {
  private readonly apiUrl = `${environment.apiUrl}Anime`;

  constructor(private readonly http: HttpClient) {}

  search(keyword: string, page = 1, pageSize = 18) {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<IAnimeSearchResponse>(`${this.apiUrl}/Search`, {
      params,
    });
  }

  detail(aniListId: number) {
    return this.http.get<IAnimeDetailResponse>(
      `${this.apiUrl}/${aniListId}`
    );
  }

  playback(aniListId: number, episodeNumber: number) {
    return this.http.get<IAnimePlaybackResponse>(
      `${this.apiUrl}/${aniListId}/episodes/${episodeNumber}/playback`
    );
  }
}
