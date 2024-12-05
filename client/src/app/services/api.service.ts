import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  IProvince,
  IResponseProvinceSearch,
  ISearchProvinceRequest,
} from '../interfaces/province';
import { Observable } from 'rxjs';
import {
  ICreateNews,
  IDetailNewsResponse,
  INewsResponse,
} from '../interfaces/news';
import {
  IHashTagNews,
  IHashTagNewsResponse,
} from '../interfaces/hash-tag-news';
import { INewsCategoryResponse } from '../interfaces/news-category';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // MstProvince
  MstProvinceSearch(
    request: ISearchProvinceRequest
  ): Observable<IResponseProvinceSearch> {
    // api/MstProvince/Search?pageIndex=0&pageSize=100&keyword
    return this.http.get<IResponseProvinceSearch>(
      `${this.apiUrl}MstProvince/Search?pageIndex=${request.pageIndex}&pageSize=${request.pageSize}&keyword=${request.keyword}`
    );
  }

  // News

  SearchNews(
    pageIndex: number,
    pageSize: number,
    keyword: string,
    userId: string,
    categoryId: string
  ): Observable<INewsResponse> {
    return this.http.get<INewsResponse>(
      `${this.apiUrl}news/search?pageIndex=${pageIndex}&pageSize=${pageSize}&keyword=${keyword}&userid=${userId}&categoryid=${categoryId}`
    );
  }

  GetNewsByKey(newsId: string): Observable<IDetailNewsResponse> {
    // api/News/Detail?key=
    return this.http.get<IDetailNewsResponse>(
      `${this.apiUrl}news/detail?newsid=${newsId}`
    );
  }

  CreateNews(obj: ICreateNews): Observable<IDetailNewsResponse> {
    return this.http.post<IDetailNewsResponse>(`${this.apiUrl}news/create`, {
      Thumbnail: obj.Thumbnail,
      CategoryNewsId: obj.CategoryNewsId,
      ShortTitle: obj.ShortTitle,
      ShortDescription: obj.ShortDescription,
      ContentBody: obj.ContentBody,
      FlagActive: obj.FlagActive,
      LstHashTagNews: obj.LstHashTagNews,
      LstRefFileNews: obj.LstRefFileNews,
    });
  }

  // HashTagNews
  GetTopHashTag(): Observable<IHashTagNewsResponse> {
    return this.http.get<IHashTagNewsResponse>(
      `${this.apiUrl}hashtagnews/gettophashtag`
    );
  }

  // NewsCategory
  GetAllActiveNewsCategory(): Observable<INewsCategoryResponse> {
    return this.http.get<INewsCategoryResponse>(
      `${this.apiUrl}newscategory/getallactive`
    );
  }
}
