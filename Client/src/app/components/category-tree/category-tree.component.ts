import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CONSTANTS_APP } from '../../helpers';
import { INewsCategory, INewsCategoryPreview } from '../../interfaces';
import {
  LangService,
  NewsCacheService,
  ShowErrorService,
} from '../../services';
import { ScrollRevealDirective } from '../../directives';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    NzIconModule,
    ScrollRevealDirective,
  ],
  templateUrl: './category-tree.component.html',
  styleUrl: './category-tree.component.scss',
})
export class CategoryTreeComponent implements OnInit {
  @Input() currentCategoryId = '';

  private newsCacheService = inject(NewsCacheService);
  private showErrorService = inject(ShowErrorService);
  private langService = inject(LangService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  categories: INewsCategoryPreview[] = [];
  routeCategoryId = '';
  isLoading = true;
  isCollapsed = false;

  get activeCategoryId(): string {
    return this.currentCategoryId || this.routeCategoryId;
  }

  ngOnInit(): void {
    // Trên mobile sidebar nằm sau danh sách bài, nên thu gọn mặc định để không tạo
    // một đoạn điều hướng quá dài trước các khối nội dung phụ khác.
    this.isCollapsed =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches;

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.routeCategoryId = params.get('categoryId') || '';
      });

    this.loadCategories();
  }

  toggleTree(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  isActive(categoryId: string): boolean {
    return this.activeCategoryId === categoryId;
  }

  hasActiveChild(category: INewsCategoryPreview): boolean {
    return category.Children.some(child => this.isActive(child.NewsCategoryId));
  }

  getCategoryName(category: {
    NewsCategoryName: string;
    NewsCategoryNameEn: string;
  }): string {
    return this.langService.getLang() === 'en' && category.NewsCategoryNameEn
      ? category.NewsCategoryNameEn
      : category.NewsCategoryName;
  }

  getChildCount(category: INewsCategory): number | null {
    return typeof category.TotalCount === 'number' ? category.TotalCount : null;
  }

  trackByCategoryId(
    _: number,
    category: INewsCategoryPreview | INewsCategory
  ): string {
    return category.NewsCategoryId;
  }

  private loadCategories(): void {
    this.newsCacheService
      .GetNewsCategoryPreview(CONSTANTS_APP.CATEGORY_PREVIEW_TAKE)
      .subscribe({
        next: res => {
          this.categories = res.DataList || [];
          this.isLoading = false;
        },
        error: err => {
          this.categories = [];
          this.isLoading = false;
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
      });
  }
}
