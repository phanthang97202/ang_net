import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class CategoryShowcaseComponent implements OnInit, OnDestroy {
  private newsCacheService = inject(NewsCacheService);
  private showErrorService = inject(ShowErrorService);
  private langService = inject(LangService);
  private destroyRef = inject(DestroyRef);
  private hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private autoplayId?: ReturnType<typeof setInterval>;
  private isHovered = false;
  private isDragging = false;
  private isDestroyed = false;

  isLoading = true;
  categories: INewsCategoryPreview[] = [];

  private viewportRef?: ElementRef<HTMLDivElement>;

  @ViewChild('viewport')
  set viewport(value: ElementRef<HTMLDivElement> | undefined) {
    this.viewportRef = value;
    // The viewport is created by *ngIf after the category request finishes.
    queueMicrotask(() => {
      if (this.isDestroyed) return;
      this.syncScrollState();
      this.startAutoplay();
    });
  }

  canScrollPrev = false;
  canScrollNext = false;

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    if (!this.viewportRef) return;

    this.autoplayId = setInterval(() => {
      const el = this.viewportRef?.nativeElement;
      if (
        !el ||
        document.hidden ||
        this.isHovered ||
        this.isDragging ||
        this.hostRef.nativeElement.contains(document.activeElement) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      this.syncScrollState();
      if (this.canScrollNext) {
        this.scrollByPage(1);
      } else if (this.canScrollPrev) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 4000);
  }

  private stopAutoplay(): void {
    if (this.autoplayId !== undefined) {
      clearInterval(this.autoplayId);
      this.autoplayId = undefined;
    }
  }

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(event: PointerEvent): void {
    this.isHovered = event.pointerType === 'mouse';
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    this.isHovered = false;
    this.startAutoplay();
  }

  @HostListener('pointerdown')
  onPointerDown(): void {
    this.isDragging = true;
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  onPointerEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.startAutoplay();
  }

  @HostListener('focusout')
  onFocusOut(): void {
    this.startAutoplay();
  }

  // Không bật hotOnly: khối này giờ là dải điều hướng theo chủ đề ngay dưới
  // banner (thay app-topic-nav), nên phải có đủ mọi danh mục gốc đang có bài,
  // không chỉ vài mục được chọn làm "chủ đề hot" trong SysParameter. Cùng tham
  // số với topic-nav cũ nên dùng chung bản cache của NewsCacheService.
  private loadCategories(): void {
    this.newsCacheService
      .GetNewsCategoryPreview(CONSTANTS_APP.CATEGORY_PREVIEW_TAKE)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    el.scrollBy({
      left: step * distance,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    this.startAutoplay();
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
