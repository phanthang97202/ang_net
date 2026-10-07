import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  IAnimeDetailResponse,
  IAnimeDeleteResponse,
  IAnimeAdminCatalogResponse,
  IAnimeAdminEpisodeResponse,
  IAnimePlaybackResponse,
  IAnimeSearchResponse,
  IAnimeSourceResponse,
  IAnimeSourceSave,
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

  adminCatalog(keyword = '') {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<IAnimeAdminCatalogResponse>(
      `${this.apiUrl}/Admin/Catalog`,
      { params }
    );
  }

  importAnime(aniListId: number) {
    return this.http.post<IAnimeDetailResponse>(
      `${this.apiUrl}/Admin/Import/${aniListId}`,
      {}
    );
  }

  adminEpisodes(aniListId: number) {
    return this.http.get<IAnimeAdminEpisodeResponse>(
      `${this.apiUrl}/Admin/${aniListId}/Episodes`
    );
  }

  saveSource(request: IAnimeSourceSave) {
    return this.http.post<IAnimeSourceResponse>(
      `${this.apiUrl}/Admin/Source`,
      request
    );
  }

  toggleSource(sourceId: string, flagActive: boolean) {
    const params = new HttpParams().set('flagActive', flagActive);
    return this.http.patch<IAnimeSourceResponse>(
      `${this.apiUrl}/Admin/Source/${encodeURIComponent(sourceId)}/Toggle`,
      {},
      { params }
    );
  }

  deleteSource(sourceId: string) {
    return this.http.delete<IAnimeDeleteResponse>(
      `${this.apiUrl}/Admin/Source/${encodeURIComponent(sourceId)}`
    );
  }
}
