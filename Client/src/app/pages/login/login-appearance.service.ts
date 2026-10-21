import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import {
  SYS_PARAM_CODE,
  SysParameterConfigService,
} from '../../services/sys-parameter-config.service';

export const DEFAULT_LOGIN_IMAGE = '/assets/images/bg_banner.avif';

export interface LoginAppearance {
  image: string;
  // null dùng bản dịch mặc định; chuỗi rỗng chủ động ẩn mô tả.
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class LoginAppearanceService {
  private readonly config = inject(SysParameterConfigService);

  load() {
    return this.config
      .getJson<unknown>(SYS_PARAM_CODE.LOGIN_APPEARANCE, { activeOnly: true })
      .pipe(map(data => this.normalize(data)));
  }

  private normalize(data: unknown): LoginAppearance {
    const result: LoginAppearance = {
      image: DEFAULT_LOGIN_IMAGE,
      description: null,
    };
    if (!data || typeof data !== 'object' || Array.isArray(data)) return result;

    const value = data as Record<string, unknown>;
    if (typeof value['description'] === 'string') {
      result.description = value['description'].trim();
    }
    if (typeof value['image'] === 'string') {
      const image = value['image'].trim();
      // Đường dẫn cùng website hoặc URL HTTP(S), không nhận CSS hay HTML.
      if (/^\/(?!\/)/.test(image)) {
        result.image = image;
      } else {
        try {
          const url = new URL(image);
          if (url.protocol === 'https:' || url.protocol === 'http:') {
            result.image = url.href;
          }
        } catch {
          // Giữ ảnh mặc định khi giá trị URL không hợp lệ.
        }
      }
    }
    return result;
  }
}
