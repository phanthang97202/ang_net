import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_TITLE = 'Phan Thang Blog';

// Gắn tên thương hiệu nhất quán cho <title> ở mọi trang (tab trình duyệt +
// tiêu đề hiển thị trong kết quả tìm kiếm), thay vì mỗi route tự set title
// trần trụi (vd "Home", "News", "Login"...) không có tên site.
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      routeTitle ? `${routeTitle} - ${SITE_TITLE}` : SITE_TITLE
    );
  }
}
