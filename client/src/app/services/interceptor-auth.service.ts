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
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;
  private _accessToken: string = '';
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  // luôn luôn phải return ra observable
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const curToken = this.authService.getToken();
    let clonedRequest = req;

    const listIgnore = [
      'account/login',
      'account/register',
      'account/refreshtoken',
      'cloudinary.com',
    ];

    if (listIgnore.some(x => req.url.includes(x))) {
      // Don't attach Authorization header for Cloudinary requests
      return next.handle(req);
    }

    if (curToken && this.authService.isLoggedIn()) {
      clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${curToken}`),
      });
    }  

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // đợi xảy ra lỗi Unauthorized => chạy hàm refresh token
        if (error.status === 401) {
         return this.handleRefreshToken(clonedRequest, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handleRefreshToken(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> { 
    const { nameid: userid } = this.authService.getAccountInfo();
    const refreshToken = localStorage.getItem(this.refreshTokenKey) ?? '';

    if (!refreshToken) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return throwError(() => new Error('No refresh token found'));
    }

   return this.authService
      .refreshToken({
        UserId: userid,
        RefreshToken: refreshToken,
      })
      .pipe(
        switchMap(response => {
          const newAccessToken = response.Data.AccessToken;
          const newRefreshToken = response.Data.RefreshToken;

          // Save the new tokens
          localStorage.setItem(this.tokenKey, newAccessToken);
          localStorage.setItem(this.refreshTokenKey, newRefreshToken);

          // Retry the failed request with the new access token
          const clonedRequest = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`),
          });

          return next.handle(clonedRequest);
        }),
        catchError((err) => {
          this.authService.logout();
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      )
  }
}
