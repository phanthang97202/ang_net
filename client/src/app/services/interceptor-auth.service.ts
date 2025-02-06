import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { ShowErrorService } from './show-error.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private showErrorService: ShowErrorService
  ) {}

  // luôn luôn phải return ra observable
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const curToken = this.authService.getToken();
    let clonedRequest = req;
    console.log('🚀 ~ AuthInterceptor ~ req:', req);

    const listIgnore = [
      'account/login',
      'account/register',
      'account/refreshtoken',
      'cloudinary.com',
      'posthog.com',
    ];

    // Don't attach Authorization header for Cloudinary requests
    if (listIgnore.some(x => req.url.includes(x))) {
      return next.handle(req);
    }

    // check khi access token còn hạn thì dùng tiếp như bình thường
    if (curToken && this.authService.isLoggedIn()) {
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
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const { nameid: userid } = this.authService.getAccountInfo();
    const refreshToken = localStorage.getItem(this.refreshTokenKey) ?? '';

    if (!refreshToken) {
      this.handleCatchExpiredToken({
        message: 'RefreshTokenIsMissing',
      });
    }

    // nếu đang refresh token thì return next
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(t => t !== null),
        take(1),
        switchMap(t => {
          const clonedRequest = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${t}`),
          });
          return next.handle(clonedRequest);
        })
      );
    } else {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService
        .refreshToken({
          UserId: userid,
          RefreshToken: refreshToken,
        })
        .pipe(
          switchMap(response => {
            if (!response?.Success) {
              this.handleCatchExpiredToken({
                ErrorMessage: response.ErrorMessage,
              });
            }

            const newAccessToken = response.Data.AccessToken;
            const newRefreshToken = response.Data.RefreshToken;

            this.isRefreshing = false;
            this.refreshTokenSubject.next(newAccessToken);

            // Save the new tokens
            localStorage.setItem(this.tokenKey, newAccessToken);
            localStorage.setItem(this.refreshTokenKey, newRefreshToken);

            // Retry the failed request with the new access token
            const clonedRequest = req.clone({
              headers: req.headers.set(
                'Authorization',
                `Bearer ${newAccessToken}`
              ),
            });

            return next.handle(clonedRequest);
          }),
          catchError(err => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null);
            return this.handleCatchExpiredToken(err);
          })
        );
    }
  }

  // bắt lỗi
  private handleCatchExpiredToken(err: HttpErrorResponse | any) {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showErrorService.setShowError({
      title: err.message ?? err.ErrorMessage ?? '',
      message: JSON.stringify(err, null, 2),
    });
    return throwError(() => {
      return {
        ErrorMessage: err.message ?? err.ErrorMessage ?? '',
      };
    });
  }
}
