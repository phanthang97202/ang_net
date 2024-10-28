import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  IProvince,
  IResponseProvinceSearch,
  ISearchProvinceRequest,
} from '../interfaces/province';
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
  ): Observable<IResponseProvinceSearch<IProvince>> {
    // api/MstProvince/Search?pageIndex=0&pageSize=100&keyword
    return this.http.get<IResponseProvinceSearch<IProvince>>(
      `${this.apiUrl}MstProvince/Search?pageIndex=${request.pageIndex}&pageSize=${request.pageSize}&keyword=${request.keyword}`
    );
  }

  // News
  GetNewsByKey(key: string): Observable<any> {
    // api/News/Detail?key=
    return this.http.get<IResponseProvinceSearch<IProvince>>(
      `${this.apiUrl}News/Detail?key=${key}`
    );
  }
}
