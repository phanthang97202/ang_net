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
  IAuditTrailResponse,
  IBaseResponse,
  IVisitStats,
  ISearchSysParameterRequest,
  IRequestSysParameterCreate,
  IResponseSysParameterCreate,
  IResponseSysParameterSearch,
  IReelFeedResponse,
  IReelLikeResponse,
  IReelCreateRequest,
  IReelCreateResponse,
  IReelViewResponse,
  IReelCommentsResponse,
  IReelCommentCreateRequest,
  IReelCommentCreateResponse,
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

  // SysParameter (tham số hệ thống)
  SysParameterSearch(
    request: ISearchSysParameterRequest
  ): Observable<IResponseSysParameterSearch> {
    // api/SysParameter/Search?pageIndex=0&pageSize=100&keyword=&category=
    return this.http.get<IResponseSysParameterSearch>(
      `${this.apiUrl}SysParameter/Search?pageIndex=${request.pageIndex}&pageSize=${request.pageSize}&keyword=${encodeURIComponent(
        request.keyword
      )}&category=${encodeURIComponent(request.category)}`
    );
  }

  SysParameterCreate(
    request: IRequestSysParameterCreate
  ): Observable<IResponseSysParameterCreate> {
    return this.http.post<IResponseSysParameterCreate>(
      `${this.apiUrl}SysParameter/Create`,
      { ...request }
    );
  }

  SysParameterUpdate(
    request: IRequestSysParameterCreate
  ): Observable<IResponseSysParameterCreate> {
    return this.http.patch<IResponseSysParameterCreate>(
      `${this.apiUrl}SysParameter/Update`,
      { ...request }
    );
  }

  SysParameterDelete(key: string): Observable<IResponseSysParameterCreate> {
    return this.http.delete<IResponseSysParameterCreate>(
      `${this.apiUrl}SysParameter/Delete?ParameterCode=${encodeURIComponent(key)}`
    );
  }

  // AllowAnonymous: web client public đọc 1 tham số theo mã
  SysParameterDetail(key: string): Observable<IResponseSysParameterCreate> {
    return this.http.get<IResponseSysParameterCreate>(
      `${this.apiUrl}SysParameter/Detail?key=${encodeURIComponent(key)}`
    );
  }

  // News
  SearchNews(
    pageIndex: number,
    pageSize: number,
    keyword: string,
    userId: string,
    categoryId: string,
    onlyPublished = true
  ): Observable<INewsResponse> {
    return this.http.get<INewsResponse>(
      `${this.apiUrl}news/search?pageIndex=${pageIndex}&pageSize=${pageSize}&keyword=${keyword}&userid=${userId}&categoryid=${categoryId}&onlyPublished=${onlyPublished}`
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

  UpdateNews(
    newsId: string,
    obj: ICreateNews
  ): Observable<IDetailNewsResponse> {
    const data = {
      NewsId: newsId,
      Thumbnail: obj.Thumbnail,
      CategoryNewsId: obj.CategoryNewsId,
      ShortTitle: obj.ShortTitle,
      ShortDescription: obj.ShortDescription,
      ContentBody: obj.ContentBody,
      FlagActive: obj.FlagActive,
      LstHashTagNews: obj.LstHashTagNews,
      LstRefFileNews: obj.LstRefFileNews,
    };
    console.log('====data', data);
    return this.http.post<IDetailNewsResponse>(`${this.apiUrl}news/update`, {
      NewsId: newsId,
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

  // VisitStats
  Ping(
    visitorId: string,
    isNewVisit: boolean
  ): Observable<IBaseResponse<IVisitStats>> {
    return this.http.post<IBaseResponse<IVisitStats>>(
      `${this.apiUrl}visitstats/ping?visitorId=${visitorId}&isNewVisit=${isNewVisit}`,
      {}
    );
  }

  // AuditTrail
  GetAllActiveAuditTrail(): Observable<IAuditTrailResponse> {
    return this.http.get<IAuditTrailResponse>(
      `${this.apiUrl}audittrail/getallactive`
    );
  }

  // Reel
  ReelFeed(
    pageSize: number,
    cursor: string | null
  ): Observable<IReelFeedResponse> {
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    return this.http.get<IReelFeedResponse>(
      `${this.apiUrl}reel/feed?pageSize=${pageSize}${cursorParam}`
    );
  }

  ReelLike(reelId: string): Observable<IReelLikeResponse> {
    return this.http.post<IReelLikeResponse>(
      `${this.apiUrl}reel/like?reelId=${encodeURIComponent(reelId)}`,
      {}
    );
  }

  ReelCreate(request: IReelCreateRequest): Observable<IReelCreateResponse> {
    return this.http.post<IReelCreateResponse>(
      `${this.apiUrl}reel/create`,
      request
    );
  }

  ReelView(reelId: string): Observable<IReelViewResponse> {
    return this.http.post<IReelViewResponse>(
      `${this.apiUrl}reel/view?reelId=${encodeURIComponent(reelId)}`,
      {}
    );
  }

  ReelComments(
    reelId: string,
    pageSize: number,
    cursor: string | null
  ): Observable<IReelCommentsResponse> {
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    return this.http.get<IReelCommentsResponse>(
      `${this.apiUrl}reel/comments?reelId=${encodeURIComponent(reelId)}&pageSize=${pageSize}${cursorParam}`
    );
  }

  ReelReplies(
    commentId: string,
    pageSize: number,
    cursor: string | null
  ): Observable<IReelCommentsResponse> {
    const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    return this.http.get<IReelCommentsResponse>(
      `${this.apiUrl}reel/replies?commentId=${encodeURIComponent(commentId)}&pageSize=${pageSize}${cursorParam}`
    );
  }

  ReelAddComment(
    request: IReelCommentCreateRequest
  ): Observable<IReelCommentCreateResponse> {
    return this.http.post<IReelCommentCreateResponse>(
      `${this.apiUrl}reel/comment`,
      request
    );
  }
}
