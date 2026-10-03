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

  // Không bật hotOnly: khối này giờ là dải điều hướng theo chủ đề ngay dưới
  // banner (thay app-topic-nav), nên phải có đủ mọi danh mục gốc đang có bài,
  // không chỉ vài mục được chọn làm "chủ đề hot" trong SysParameter. Cùng tham
  // số với topic-nav cũ nên dùng chung bản cache của NewsCacheService.
  private loadCategories(): void {
    this.newsCacheService
      .GetNewsCategoryPreview(CONSTANTS_APP.CATEGORY_PREVIEW_TAKE)
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
   * Cuộn đúng một trang: N thẻ đang hiện ra hết, N thẻ kế tiếp vào trọn khung.
   *
   * Một trang = bề ngang vùng nội dung + một khe: N cột cộng N-1 khe lấp kín
   * vùng nội dung (xem grid-auto-columns trong SCSS), thêm khe cuối là tới mép
   * trái của thẻ đầu trang sau. Đọc padding và khe từ style thật thay vì gõ cứng
   * vì cả hai đổi theo breakpoint.
   */
  scrollByPage(step: 1 | -1): void {
    const el = this.viewportRef?.nativeElement;
    if (!el) return;

    const viewportStyle = getComputedStyle(el);
    const padding =
      parseFloat(viewportStyle.paddingLeft) +
      parseFloat(viewportStyle.paddingRight);

    const track = el.firstElementChild as HTMLElement | null;
    const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;

    const distance = el.clientWidth - padding + gap;
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
