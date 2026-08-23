import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { LangService } from './lang-service.service';
import { IResponseSysParameterCreate } from '../interfaces';

// Mã tham số hệ thống dùng ở web client
export const SYS_PARAM_CODE = {
  HOME_BANNERS: 'HOME_BANNERS',
  HOME_INTRO: 'HOME_INTRO',
  SOCIAL_LINKS: 'SOCIAL_LINKS',
  HOME_FEATURED_IMAGES: 'HOME_FEATURED_IMAGES',
  WARNING_BANNER: 'WARNING_BANNER',
  HOME_MUSIC: 'HOME_MUSIC',
} as const;

@Injectable({
  providedIn: 'root',
})
export class SysParameterConfigService {
  private api = inject(ApiService);
  private langService = inject(LangService);

  // Cache theo mã: gọi Detail 1 lần, các nơi cùng dùng (vd SOCIAL_LINKS ở
  // sidebar + footer) share chung 1 request.
  private cache = new Map<string, Observable<IResponseSysParameterCreate | null>>();

  // Giá trị text thuần (theo ngôn ngữ hiện tại), null nếu chưa cấu hình.
  getText(code: string): Observable<string | null> {
    return this.getRaw(code);
  }

  // Giá trị JSON đã parse, null nếu chưa cấu hình / lỗi parse -> component tự
  // dùng giá trị mặc định.
  getJson<T>(code: string): Observable<T | null> {
    return this.getRaw(code).pipe(
      map(raw => {
        if (!raw) {
          return null;
        }
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      })
    );
  }

  // Giá trị ở cột DefaultValueVi/En. Dùng cho tham số cần trỏ tới một phần tử
  // nằm trong chính JSON của nó - vd HOME_MUSIC: id của bài hát mặc định.
  getDefaultText(code: string): Observable<string | null> {
    return this.getResponse(code).pipe(
      map(res => {
        const data = res?.Data;
        if (!res?.Success || !data) {
          return null;
        }
        const lang = this.langService.getLang();
        const raw =
          lang === 'en'
            ? data.DefaultValueEn || data.DefaultValueVi
            : data.DefaultValueVi || data.DefaultValueEn;

        return raw || null;
      })
    );
  }

  private getRaw(code: string): Observable<string | null> {
    return this.getResponse(code).pipe(map(res => this.readValue(res)));
  }

  private getResponse(
    code: string
  ): Observable<IResponseSysParameterCreate | null> {
    if (!this.cache.has(code)) {
      const request$ = this.api.SysParameterDetail(code).pipe(
        catchError(() => of(null)),
        shareReplay(1)
      );
      this.cache.set(code, request$);
    }

    return this.cache.get(code)!;
  }

  private readValue(res: IResponseSysParameterCreate | null): string | null {
    const data = res?.Data;
    if (!res?.Success || !data) {
      return null;
    }

    const lang = this.langService.getLang();
    const raw =
      lang === 'en'
        ? data.ParameterValueEn || data.ParameterValueVi
        : data.ParameterValueVi || data.ParameterValueEn;

    return raw || null;
  }
}
