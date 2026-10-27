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
  switchMap,
  timer,
  timeout,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { IResponseSysParameterCreate } from '../interfaces';
import { AuthService } from './auth.service';

export const BLOG_MAINTENANCE_CODE = 'BLOG_MAINTENANCE';
export const ONLY_SHIFT_REPORT_CODE = 'ONLY_SHIFT_REPORT';
export const SHIFT_REPORT_PATH = '/tools/shift-report';
const SHIFT_REPORT_PERMISSION = 'shiftreport.view';

/**
 * Chế độ ONLY_SHIFT_REPORT: blog chỉ còn báo cáo ca trực. Ngoài báo cáo ca chỉ
 * mở trang đăng nhập / quên mật khẩu (báo cáo ca bắt đăng nhập). /dashboard/* và
 * /maintain không đi qua guard blog nên không cần liệt kê ở đây.
 */
export function isShiftReportOnlyAllowed(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  return (
    path === SHIFT_REPORT_PATH ||
    path.startsWith(`${SHIFT_REPORT_PATH}/`) ||
    path === '/login' ||
    path === '/forgot-password'
  );
}

/**
 * Nơi phải chuyển tới khi đang ở chế độ ONLY_SHIFT_REPORT, hoặc null nếu được ở lại.
 * Người đã đăng nhập mà không có quyền báo cáo ca thì về /maintain: đưa họ về báo
 * cáo ca sẽ bị guard quyền đẩy ra '/', rồi '/' lại đẩy về báo cáo ca - lặp vô hạn.
 */
export function shiftReportOnlyRedirect(
  url: string,
  loggedIn: boolean,
  canUseShiftReport: boolean
): string | null {
  const path = url.split(/[?#]/)[0];
  if (path === '/login' || path === '/forgot-password') return null;
  if (loggedIn && !canUseShiftReport) return '/maintain';
  return isShiftReportOnlyAllowed(url) ? null : SHIFT_REPORT_PATH;
}

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
  private auth = inject(AuthService);
  private monitoring = false;

  check(): Observable<boolean> {
    return this.readFlag(BLOG_MAINTENANCE_CODE);
  }

  /** Tham số ONLY_SHIFT_REPORT; lỗi / tắt / thiếu đều coi như blog chạy bình thường. */
  checkShiftReportOnly(): Observable<boolean> {
    return this.readFlag(ONLY_SHIFT_REPORT_CODE);
  }

  /** Đích chuyển hướng của chế độ ONLY_SHIFT_REPORT cho người dùng hiện tại. */
  shiftReportOnlyRedirect(url: string): string | null {
    const loggedIn = this.auth.isLoggedIn();
    return shiftReportOnlyRedirect(
      url,
      loggedIn,
      loggedIn && this.auth.hasPermission(SHIFT_REPORT_PERMISSION)
    );
  }

  private readFlag(code: string): Observable<boolean> {
    // Read fresh configuration, independently of the content/language cache.
    return this.http
      .get<IResponseSysParameterCreate>(
        `${environment.apiUrl}SysParameter/Detail`,
        {
          params: { key: code },
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
        // Bảo trì ưu tiên hơn; chỉ hỏi ONLY_SHIFT_REPORT khi blog không bảo trì
        exhaustMap(() =>
          this.check().pipe(
            switchMap(maintenance =>
              maintenance
                ? of('/maintain')
                : this.checkShiftReportOnly().pipe(
                    map(only =>
                      only
                        ? this.shiftReportOnlyRedirect(this.router.url)
                        : null
                    )
                  )
            )
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(target => {
        if (target && isBlogPath(this.router.url)) {
          void this.router.navigateByUrl(target, { replaceUrl: true });
        }
      });
  }
}
