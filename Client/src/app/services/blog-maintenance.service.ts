import { DestroyRef, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  Observable,
  of,
  timer,
  timeout,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { IResponseSysParameterCreate } from '../interfaces';

export const BLOG_MAINTENANCE_CODE = 'BLOG_MAINTENANCE';

export function isBlogPath(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  return (
    path !== '/maintain' &&
    path !== '/dashboard' &&
    !path.startsWith('/dashboard/')
  );
}

@Injectable({ providedIn: 'root' })
export class BlogMaintenanceService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private monitoring = false;

  check(): Observable<boolean> {
    // Read fresh configuration, independently of the content/language cache.
    return this.http
      .get<IResponseSysParameterCreate>(
        `${environment.apiUrl}SysParameter/Detail`,
        {
          params: { key: BLOG_MAINTENANCE_CODE },
        }
      )
      .pipe(
        timeout(5000),
        map(response => {
          const data = response.Data;
          if (!response.Success || !data?.FlagActive) return false;
          const value = (data.ParameterValueVi || data.ParameterValueEn || '')
            .trim()
            .toLowerCase();
          return value === 'true' || value === '1';
        }),
        catchError(() => of(false))
      );
  }

  startMonitoring(): void {
    if (this.monitoring) return;
    this.monitoring = true;
    timer(30000, 30000)
      .pipe(
        filter(
          () =>
            isBlogPath(this.router.url) &&
            document.visibilityState === 'visible'
        ),
        exhaustMap(() => this.check()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(enabled => {
        if (enabled && isBlogPath(this.router.url)) {
          void this.router.navigateByUrl('/maintain', { replaceUrl: true });
        }
      });
  }
}
