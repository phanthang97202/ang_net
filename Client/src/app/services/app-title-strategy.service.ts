import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import { LangService } from './lang-service.service';

export const SITE_TITLE = 'Phan Thang Blog';

// Gắn tên thương hiệu nhất quán cho <title> ở mọi trang (tab trình duyệt +
// tiêu đề hiển thị trong kết quả tìm kiếm), thay vì mỗi route tự set title
// trần trụi (vd "Home", "News", "Login"...) không có tên site.
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly destroyRef = inject(DestroyRef);
  private routeTitleKey?: string;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
    langService: LangService
  ) {
    super();

    // TitleStrategy chỉ được Router gọi khi điều hướng. Nghe thêm sự kiện đổi
    // ngôn ngữ để tab hiện tại đổi title ngay mà không cần tải lại trang.
    langService.$langSubjectObservable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyTitle());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.routeTitleKey = this.buildTitle(snapshot);
    this.applyTitle();
  }

  private applyTitle(): void {
    const titleKey = this.routeTitleKey;
    if (!titleKey) {
      this.title.setTitle(SITE_TITLE);
      return;
    }

    this.translate
      .get(titleKey)
      .pipe(take(1))
      .subscribe(routeTitle => {
        // Bỏ kết quả cũ nếu người dùng điều hướng trong lúc file dịch đang tải.
        if (this.routeTitleKey === titleKey) {
          this.title.setTitle(`${routeTitle} - ${SITE_TITLE}`);
        }
      });
  }
}
