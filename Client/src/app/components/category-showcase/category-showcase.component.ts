import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LangService,
  NewsCacheService,
  ShowErrorService,
} from '../../services';
import { INewsCategoryPreview } from '../../interfaces';
import { ScrollRevealDirective } from '../../directives';
import {
  CONSTANTS_APP,
  getTopicColor as topicColor,
  getTopicIconPath as topicIconPath,
} from '../../helpers';

@Component({
  selector: 'app-category-showcase',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ScrollRevealDirective],
  templateUrl: './category-showcase.component.html',
  styleUrls: ['./category-showcase.component.scss'],
})
export class CategoryShowcaseComponent implements OnInit, AfterViewInit {
  private newsCacheService = inject(NewsCacheService);
  private showErrorService = inject(ShowErrorService);
  private langService = inject(LangService);

  isLoading = true;
  categories: INewsCategoryPreview[] = [];

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLDivElement>;

  canScrollPrev = false;
  canScrollNext = false;

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.syncScrollState();
  }

  // API đã lọc danh mục theo SysParameter và giữ đúng thứ tự ID admin cấu hình;
  // ở đây không sắp xếp lại để giao diện phản ánh chính xác cấu hình đó.
  private loadCategories(): void {
    this.newsCacheService
      .GetNewsCategoryPreview(CONSTANTS_APP.CATEGORY_PREVIEW_TAKE, true)
      .subscribe({
        next: res => {
          this.categories = res.DataList || [];
          this.isLoading = false;
          // Viewport chỉ tồn tại sau khi *ngIf mở ra, nên đo ở vòng sau.
          queueMicrotask(() => this.syncScrollState());
        },
        error: err => {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
          this.isLoading = false;
          throw new Error(err);
        },
      });
  }

  /**
   * Cuộn đi gần trọn một khung nhìn. Chừa lại 48px để thẻ ở mép vẫn còn thấy
   * một phần sau khi cuộn - người đọc biết mình đang ở giữa một dải dài.
   */
  scrollByPage(step: 1 | -1): void {
    const el = this.viewportRef?.nativeElement;
    if (!el) return;

    const distance = Math.max(el.clientWidth - 48, 160);
    el.scrollBy({ left: step * distance, behavior: 'smooth' });
  }

  /**
   * Bật/tắt hai nút theo vị trí cuộn thật, kể cả khi người dùng tự vuốt.
   *
   * Trừ hao 1px: scrollLeft là số thực, ở mép phải nó thường thiếu một phần
   * pixel so với scrollWidth - clientWidth nên so sánh thẳng thì nút "sau" không
   * bao giờ tắt.
   */
  syncScrollState(): void {
    const el = this.viewportRef?.nativeElement;
    if (!el) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      return;
    }

    this.canScrollPrev = el.scrollLeft > 1;
    this.canScrollNext = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  }

  // Đổi kích thước cửa sổ làm dải đang tràn thành vừa khít (hoặc ngược lại).
  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncScrollState();
  }

  trackById(_: number, category: INewsCategoryPreview): string {
    return category.NewsCategoryId;
  }

  getCategoryName(category: {
    NewsCategoryName: string;
    NewsCategoryNameEn: string;
  }): string {
    return this.langService.getLang() === 'en' && category.NewsCategoryNameEn
      ? category.NewsCategoryNameEn
      : category.NewsCategoryName;
  }

  // Cùng helper với thanh chọn chủ đề: một danh mục phải ra đúng một icon/màu ở
  // cả hai khối, nếu không người đọc sẽ không nhận ra đó là cùng một chủ đề.
  getTopicIconPath(name: string, index: number): string {
    return topicIconPath(name, index);
  }

  getTopicColor(index: number): string {
    return topicColor(index);
  }
}
