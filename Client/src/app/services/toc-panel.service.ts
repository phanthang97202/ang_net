import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Trạng thái mở/đóng của panel mục lục.
 *
 * Nút bấm nằm ở thanh công cụ bên trái bài viết (app-article-rail), còn panel do
 * app-news-toc-list vẽ - hai component nằm ở hai nhánh khác nhau của cây, không
 * có quan hệ cha con nên không truyền được bằng @Input/@Output.
 */
@Injectable({ providedIn: 'root' })
export class TocPanelService {
  readonly isOpen$ = new BehaviorSubject<boolean>(false);

  // Bài không có heading nào thì không có mục lục - thanh công cụ dựa vào đây để
  // ẩn hẳn nút thay vì hiện một nút bấm không ra gì.
  readonly hasItems$ = new BehaviorSubject<boolean>(false);

  toggle(): void {
    this.isOpen$.next(!this.isOpen$.value);
  }

  close(): void {
    this.isOpen$.next(false);
  }

  setHasItems(hasItems: boolean): void {
    this.hasItems$.next(hasItems);
  }
}
