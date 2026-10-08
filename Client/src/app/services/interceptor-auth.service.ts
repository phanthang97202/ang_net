import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { ShowErrorService } from './show-error.service';
import { AuthResponse } from '../interfaces';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;

  private refreshRequest$?: Observable<AuthResponse>;
  private readonly refreshHttp: HttpClient;

  constructor(
    httpBackend: HttpBackend,
    private injector: Injector,
    private showErrorService: ShowErrorService
  ) {
    // Không inject AuthService/Router tại constructor. AuthService phụ thuộc
    // HttpClient, còn Router dựng AppTitleStrategy -> TranslateService ->
    // HttpClient; inject một trong hai ở đây sẽ tạo vòng DI qua
    // HTTP_INTERCEPTORS ngay lúc ứng dụng bootstrap.
    //
    // Client dùng HttpBackend đi thẳng tới backend, rất quan trọng cho request
    // refresh token: nó không chạy lại chính interceptor này.
    this.refreshHttp = new HttpClient(httpBackend);
  }

  // luôn luôn phải return ra observable
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const curToken = localStorage.getItem(this.tokenKey) ?? '';
    let clonedRequest = req;

    const listIgnore = [
      'account/login',
      'account/register',
      'account/refreshtoken',
      // ----
      // news/search và news/detail ĐÃ TỪNG nằm ở đây, nhưng bỏ qua interceptor
      // đồng nghĩa không bao giờ gắn token - server luôn thấy request ẩn danh nên
      // admin không xem được bài chưa xuất bản. Cả 2 endpoint đều [AllowAnonymous]
      // nên khách vãng lai vẫn gọi bình thường (header chỉ gắn khi đã đăng nhập).
      //
      // news/like và news/point CŨNG từng nằm ở đây với cùng hậu quả, mà còn nặng
      // hơn: cả hai đều lấy UserId từ token để biết ai like / ai chấm điểm, không
      // gắn token là server trả UserNotFound nên không bao giờ lưu được.
      // ----
      'hashtagnews/gettophashtag',
      'cloudinary.com',
      'posthog.com',
    ];

    // Các endpoint public / tự xử lý auth riêng: đi thẳng, không gắn token
    if (listIgnore.some(x => req.url.includes(x))) {
      return next.handle(req);
    }

    // check khi access token còn hạn thì dùng tiếp như bình thường
    if (curToken && this.isTokenValid(curToken)) {
      clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${curToken}`),
      });
    }

    // return next
    return next.handle(clonedRequest).pipe(
      catchError((err: HttpErrorResponse) => {
        // đợi xảy ra lỗi Unauthorized => chạy hàm refresh token
        if (err.status === 401) {
          return this.handleRefreshToken(clonedRequest, next);
        }
        // return this.handleCatchExpiredToken(err);
        return throwError(() => err);
      })
    );
  }

  private handleRefreshToken(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const userid = this.getUserId(req);
    const refreshToken = localStorage.getItem(this.refreshTokenKey) ?? '';

    if (!refreshToken || !userid) {
      return this.handleCatchExpiredToken({
        message: !refreshToken
          ? 'RefreshTokenIsMissing'
          : 'UserIdIsMissingFromToken',
      });
    }

    // Share both success and failure with every waiting request; revoked
    // sessions must not leave requests waiting forever for a new token.
    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.refreshHttp
        .post<AuthResponse>(`${environment.apiUrl}account/refreshtoken`, {
          UserId: userid,
          RefreshToken: refreshToken,
        })
        .pipe(
          tap(response => {
            if (
              !response?.Success ||
              !response.Data?.AccessToken ||
              !response.Data?.RefreshToken
            )
              throw {
                ErrorMessage:
                  response?.ErrorMessage ||
                  'Phiên đăng nhập đã bị thu hồi hoặc tài khoản bị khóa.',
              };
            localStorage.setItem(this.tokenKey, response.Data.AccessToken);
            localStorage.setItem(
              this.refreshTokenKey,
              response.Data.RefreshToken
            );
          }),
          catchError(err => this.handleCatchExpiredToken(err)),
          finalize(() => (this.refreshRequest$ = undefined)),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.refreshRequest$.pipe(
      switchMap(response =>
        next.handle(
          req.clone({
            headers: req.headers.set(
              'Authorization',
              `Bearer ${response.Data.AccessToken}`
            ),
          })
        )
      )
    );
  }

  // bắt lỗi
  private handleCatchExpiredToken(err: unknown) {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    // Router được lấy trễ, sau khi bootstrap đã hoàn tất. Inject Router trong
    // constructor của interceptor sẽ tạo vòng Router -> TitleStrategy ->
    // TranslateService -> HttpClient -> HTTP_INTERCEPTORS -> Router.
    this.injector.get(Router).navigate(['/login']);
    const message = this.getErrorMessage(err);
    this.showErrorService.setShowError({
      title: message,
      message: JSON.stringify(err, null, 2),
    });
    return throwError(() => {
      return {
        ErrorMessage: message,
      };
    });
  }

  private isTokenValid(token: string): boolean {
    try {
      const { exp } = jwtDecode<{ exp?: number }>(token);
      return typeof exp === 'number' && Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }

  private getUserId(req: HttpRequest<unknown>): string {
    const authorization = req.headers.get('Authorization') ?? '';
    const requestToken = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    const token = requestToken || localStorage.getItem(this.tokenKey) || '';
    if (!token) return '';

    try {
      return jwtDecode<{ nameid?: string }>(token).nameid ?? '';
    } catch {
      return '';
    }
  }

  private getErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return '';

    const error = err as { message?: unknown; ErrorMessage?: unknown };
    const message = error.message ?? error.ErrorMessage;
    return typeof message === 'string' ? message : '';
  }
}
