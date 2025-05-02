import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  IRequestProvinceCreate,
  IResponseProvinceCreate,
  IResponseProvinceSearch,
  ISearchProvinceRequest,
  IHashTagNewsResponse,
  INewsCategoryResponse,
  ICreateNews,
  IDetailNewsResponse,
  INewsResponse,
} from '../interfaces';
import { Observable } from 'rxjs';

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

  MstProvinceCreate(
    request: IRequestProvinceCreate
  ): Observable<IResponseProvinceCreate> {
    // api/MstProvince/Create
    return this.http.post<IResponseProvinceCreate>(
      `${this.apiUrl}MstProvince/Create`,
      {
        ...request,
      }
    );
  }

  MstProvinceUpdate(
    request: IRequestProvinceCreate
  ): Observable<IResponseProvinceCreate> {
    return this.http.patch<IResponseProvinceCreate>(
      `${this.apiUrl}MstProvince/Update`,
      {
        ...request,
      }
    );
  }

  MstProvinceImportExcel(file: File): Observable<IResponseProvinceCreate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<IResponseProvinceCreate>(
      `${this.apiUrl}MstProvince/ImportExcel`,
      formData
      // {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // }
    );
  }

  MstProvinceExportExcel() {
    return this.http.get(`${this.apiUrl}MstProvince/ExportExcel`, {
      responseType: 'blob',
    });
  }

  MstProvinceExportTemplate() {
    return this.http.get(`${this.apiUrl}MstProvince/ExportTemplate`, {
      responseType: 'blob',
    });
  }

  MstProvinceDelete(key: string): Observable<IResponseProvinceCreate> {
    return this.http.delete<IResponseProvinceCreate>(
      `${this.apiUrl}MstProvince/Delete?ProvinceCode=${key}`
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
