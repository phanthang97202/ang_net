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
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

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

    if (token && this.authService.isLoggedIn()) {
      clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
    } else {
      const { nameid: userid } = this.authService.getAccountInfo();
      const refreshToken = localStorage.getItem(this.refreshTokenKey) ?? '';

      this.authService
        .refreshToken({
          UserId: userid,
          RefreshToken: refreshToken,
        })
        .subscribe(response => {
          const token = response.Data.AccessToken;
          const refreshToken = response.Data.RefreshToken;

          console.log(' ~ token:', token);

          localStorage.setItem(this.tokenKey, token);
          localStorage.setItem(this.refreshTokenKey, refreshToken);

          clonedRequest = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
          });
        });
    }

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // if (error.status === 401) {
        //   this.authService.logout();
        //   this.router.navigate(['/login']);
        // }
        return throwError(() => error);
      })
    );
  }
}
