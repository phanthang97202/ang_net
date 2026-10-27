import { DestroyRef, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  exhaustMap,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  timer,
  timeout,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { IResponseSysParameterCreate } from '../interfaces';
import { AuthService } from './auth.service';

export const BLOG_MAINTENANCE_CODE = 'BLOG_MAINTENANCE';
export const ONLY_SHIFT_REPORT_CODE = 'ONLY_SHIFT_REPORT';
export const TROLL_VIETNAM_CODE = 'TROLL_VIETNAM';
export const SHIFT_REPORT_PATH = '/tools/shift-report';
export const TROLL_PATH = '/haha';
const SHIFT_REPORT_PERMISSION = 'shiftreport.view';

/** Cấu hình trò chơi khăm, đọc từ JSON của tham số TROLL_VIETNAM. */
export interface TrollConfig {
  message: string;
  countdown: number;
  /** Mỗi phần tử là link ảnh (PNG nền trong suốt) hoặc một emoji */
  images: string[];
  excludedUserIds: string[];
}

export const DEFAULT_TROLL_MESSAGE = 'Haha, mày là 1 tên hề!';
export const DEFAULT_TROLL_IMAGES = ['😂', '🖕', '🤡'];

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * JSON tắt (enabled khác true), sai cú pháp hoặc không phải object đều trả null =
 * web chạy bình thường: cấu hình gõ nhầm không bao giờ làm kẹt cả trang.
 */
export function parseTrollConfig(raw: string | null): TrollConfig | null {
  if (!raw) return null;
  let value: Record<string, unknown>;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || value['enabled'] !== true)
    return null;

  const list = (input: unknown, max: number): string[] =>
    Array.isArray(input)
      ? input
          .filter(isText)
          .map(item => item.trim())
          .slice(0, max)
      : [];
  const countdown = Number(value['countdown']);
  const images = list(value['images'], 12);
  return {
    message: isText(value['message'])
      ? value['message'].trim().slice(0, 200)
      : DEFAULT_TROLL_MESSAGE,
    countdown:
      Number.isInteger(countdown) && countdown >= 1 && countdown <= 10
        ? countdown
        : 3,
    images: images.length ? images : DEFAULT_TROLL_IMAGES,
    excludedUserIds: list(value['excludedUserIds'], 200),
  };
}

/** Người được loại trừ khỏi trò troll (so userId, không phân biệt hoa thường). */
export function isTrollExcluded(
  config: TrollConfig,
  userId: string | null | undefined
): boolean {
  const id = (userId ?? '').trim().toLowerCase();
  return !!id && config.excludedUserIds.some(item => item.toLowerCase() === id);
}

export interface BlogModeResult {
  /** Nơi phải chuyển tới, null = được ở lại trang đang mở */
  target: string | null;
  /** Cấu hình troll khi người xem này đang bị troll */
  troll: TrollConfig | null;
}

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
    path !== TROLL_PATH &&
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

  /**
   * Cấu hình troll nếu người xem hiện tại đang bị troll, null nếu tắt / được loại trừ.
   * userId đọc thẳng từ token (kể cả token đã hết hạn) để chủ web không bị troll
   * chỉ vì phiên chưa kịp làm mới.
   */
  checkTroll(): Observable<TrollConfig | null> {
    return this.readValue(TROLL_VIETNAM_CODE).pipe(
      map(raw => {
        const config = parseTrollConfig(raw);
        return config &&
          !isTrollExcluded(config, this.auth.getAccountInfo().nameid)
          ? config
          : null;
      })
    );
  }

  /**
   * Hỏi cả 3 chế độ song song (không nối tiếp, để mỗi lần chuyển trang chỉ chờ
   * một lượt) rồi áp thứ tự ưu tiên: Bảo trì > Troll > Chỉ báo cáo ca.
   */
  resolve(url: string): Observable<BlogModeResult> {
    return forkJoin({
      maintenance: this.check(),
      troll: this.checkTroll(),
      shiftOnly: this.checkShiftReportOnly(),
    }).pipe(
      map(({ maintenance, troll, shiftOnly }) => {
        if (maintenance) return { target: '/maintain', troll: null };
        if (troll) return { target: TROLL_PATH, troll };
        return {
          target: shiftOnly ? this.shiftReportOnlyRedirect(url) : null,
          troll: null,
        };
      })
    );
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
    return this.readValue(code).pipe(
      map(value => {
        const flag = (value ?? '').trim().toLowerCase();
        return flag === 'true' || flag === '1';
      })
    );
  }

  /** Giá trị gốc của tham số (tiếng Việt là chuẩn, rỗng mới lấy tiếng Anh); lỗi / tắt = null. */
  private readValue(code: string): Observable<string | null> {
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
          if (!response.Success || !data?.FlagActive) return null;
          return data.ParameterValueVi || data.ParameterValueEn || null;
        }),
        catchError(() => of(null))
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
        exhaustMap(() => this.resolve(this.router.url)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ target }) => {
        if (target && isBlogPath(this.router.url)) {
          void this.router.navigateByUrl(target, { replaceUrl: true });
        }
      });
  }
}
