import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { IBaseResponse } from '../interfaces/common';
import {
  IMovieLibraryCatalog,
  IMovieLibraryDetail,
  IMovieLibraryPlayback,
} from '../interfaces/movie';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly apiUrl = `${environment.apiUrl}Movie`;

  constructor(private readonly http: HttpClient) {}

  library(keyword = '', page = 1) {
    return this.http.get<IBaseResponse<IMovieLibraryCatalog>>(
      `${this.apiUrl}/Library`,
      {
        params: new HttpParams().set('keyword', keyword).set('page', page),
      }
    );
  }

  wishlist(keyword = '', page = 1) {
    return this.http.get<IBaseResponse<IMovieLibraryCatalog>>(
      `${this.apiUrl}/Wishlist`,
      { params: new HttpParams().set('keyword', keyword).set('page', page) }
    );
  }

  saveWishlist(slug: string) {
    return this.http.put<IBaseResponse<boolean>>(
      `${this.apiUrl}/Wishlist/${encodeURIComponent(slug)}`, {}
    );
  }

  removeWishlist(slug: string) {
    return this.http.delete<IBaseResponse<boolean>>(
      `${this.apiUrl}/Wishlist/${encodeURIComponent(slug)}`
    );
  }

  libraryDetail(slug: string) {
    return this.http.get<IBaseResponse<IMovieLibraryDetail>>(
      `${this.apiUrl}/Library/${encodeURIComponent(slug)}`
    );
  }

  libraryPlayback(slug: string, server: number, episode: string) {
    return this.http.get<IBaseResponse<IMovieLibraryPlayback>>(
      `${this.apiUrl}/Library/${encodeURIComponent(slug)}/playback`,
      {
        params: new HttpParams().set('server', server).set('episode', episode),
      }
    );
  }
}
