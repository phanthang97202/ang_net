import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LangService, NewsCacheService } from '../../services';
import { INewsCategory } from '../../interfaces';

interface ICrumb {
  id: string;
  name: string;
}

/**
 * Breadcrumb của trang chi tiết bài viết: Trang chủ › danh mục cha › … ›
 * danh mục của bài › tiêu đề bài.
 *
 * Bài viết chỉ biết danh mục trực tiếp của nó, nên các cấp cha được dựng lại
 * từ danh sách danh mục đang bật (NewsCacheService đã cache, sidebar "Chuyên
 * mục" cũng dùng chung bản đó nên thường không tốn thêm request nào).
 */
@Component({
  selector: 'app-news-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './news-breadcrumb.component.html',
  styleUrls: ['./news-breadcrumb.component.scss'],
})
export class NewsBreadcrumbComponent implements OnInit, OnChanges {
  private newsCacheService = inject(NewsCacheService);
  private langService = inject(LangService);
  private destroyRef = inject(DestroyRef);

  @Input() categoryId = '';
  /** Tên danh mục đi kèm bài viết - dùng khi chưa tải được cây danh mục. */
  @Input() categoryName = '';
  @Input() title = '';

  crumbs: ICrumb[] = [];

  private categories: INewsCategory[] = [];
  private lang: 'vi' | 'en' = 'vi';

  ngOnInit(): void {
    this.langService.$langSubjectObservable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => {
        this.lang = lang === 'en' ? 'en' : 'vi';
        this.buildCrumbs();
      });

    this.newsCacheService
      .GetAllActiveNewsCategory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.categories = res?.DataList || [];
          this.buildCrumbs();
        },
        // Lỗi thì giữ breadcrumb rút gọn (chỉ danh mục của bài), không bật
        // popup: đây là phần điều hướng phụ, hỏng nó không đáng chặn người đọc.
        error: () => this.buildCrumbs(),
      });
  }

  ngOnChanges(): void {
    this.buildCrumbs();
  }

  trackById(_: number, crumb: ICrumb): string {
    return crumb.id;
  }

  /**
   * Đi ngược từ danh mục của bài lên tới gốc. Chặn vòng lặp cha-con (dữ liệu
   * lệch) bằng tập đã thăm, nếu không trang sẽ treo ở vòng while.
   */
  private buildCrumbs(): void {
    if (!this.categoryId) {
      this.crumbs = [];
      return;
    }

    const byId = new Map(this.categories.map(c => [c.NewsCategoryId, c]));
    const chain: ICrumb[] = [];
    const visited = new Set<string>();

    let current = byId.get(this.categoryId);
    while (current && !visited.has(current.NewsCategoryId)) {
      visited.add(current.NewsCategoryId);
      chain.unshift({ id: current.NewsCategoryId, name: this.nameOf(current) });
      current = current.NewsCategoryParentId
        ? byId.get(current.NewsCategoryParentId)
        : undefined;
    }

    // Chưa có cây (đang tải/lỗi) hoặc danh mục đã tắt: vẫn hiện danh mục của
    // bài bằng tên đi kèm bài viết.
    this.crumbs = chain.length
      ? chain
      : [{ id: this.categoryId, name: this.categoryName || this.categoryId }];
  }

  private nameOf(category: INewsCategory): string {
    return this.lang === 'en' && category.NewsCategoryNameEn
      ? category.NewsCategoryNameEn
      : category.NewsCategoryName;
  }
}
