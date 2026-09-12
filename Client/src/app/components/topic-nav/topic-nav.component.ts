import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LoadingService,
  NewsCacheService,
  ShowErrorService,
} from '../../services';
import { ScrollRevealDirective } from '../../directives';
import {
  CONSTANTS_APP,
  getTopicColor as topicColor,
  getTopicIconPath as topicIconPath,
} from '../../helpers';

// ── Model ──────────────────────────────────────────────
export interface Topic {
  id: string;
  name: string;
}

@Component({
  selector: 'app-topic-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  templateUrl: './topic-nav.component.html',
  styleUrls: ['./topic-nav.component.scss'],
})
export class TopicNavComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  newsCacheService = inject(NewsCacheService);
  loadingService = inject(LoadingService);
  topics: Topic[] = [];
  isLoading = false;

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLDivElement>;

  // Số item/trang tuỳ kích thước màn hình - mỗi trang luôn nằm gọn 1 hàng
  // ngang, không wrap. Khớp breakpoint 640/767px đang dùng chung trong dự án.
  itemsPerPage = this.computeItemsPerPage();
  currentPage = 0;

  ngOnInit(): void {
    this.loadTopics();
  }

  // Tính sẵn thay vì dùng getter: getter trả về mảng MỚI mỗi lần change
  // detection gọi tới, khiến *ngFor coi như toàn bộ item bị thay và dựng lại
  // hết DOM mỗi vòng CD. Card bị tạo lại liên tục nên IntersectionObserver của
  // appScrollReveal vừa gắn đã bị huỷ, không kịp bắn -> card kẹt opacity:0.
  pages: Topic[][] = [];

  private rebuildPages(): void {
    const size = this.itemsPerPage;
    const result: Topic[][] = [];
    for (let i = 0; i < this.topics.length; i += size) {
      result.push(this.topics.slice(i, i + size));
    }
    this.pages = result;
  }

  trackByPageIndex(index: number): number {
    return index;
  }

  private computeItemsPerPage(): number {
    if (typeof window === 'undefined') return 7;
    const w = window.innerWidth;
    if (w <= 640) return 2;
    if (w <= 767) return 4;
    return 7;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    const next = this.computeItemsPerPage();
    if (next === this.itemsPerPage) return;
    // Đổi số item/trang làm số trang thay đổi theo - vị trí cuộn cũ (tính theo
    // trang cũ) không còn ý nghĩa, nên nhảy thẳng về trang đầu.
    this.itemsPerPage = next;
    this.rebuildPages();
    this.currentPage = 0;
    queueMicrotask(() => {
      this.viewportRef?.nativeElement.scrollTo({ left: 0, behavior: 'auto' });
    });
  }

  goToPage(index: number): void {
    if (index < 0 || index >= this.pages.length) return;
    this.currentPage = index;
    const el = this.viewportRef?.nativeElement;
    if (el) {
      el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    }
  }

  // Đồng bộ currentPage khi người dùng tự vuốt/cuộn viewport (mobile) thay vì
  // chỉ qua 2 nút - để trạng thái disabled của nút prev/next luôn đúng.
  onViewportScroll(): void {
    const el = this.viewportRef?.nativeElement;
    if (!el || el.clientWidth === 0) return;
    this.currentPage = Math.round(el.scrollLeft / el.clientWidth);
  }

  // Dùng chung nguồn dữ liệu với khối "Khám phá theo chủ đề" thay vì
  // GetAllActiveNewsCategory: endpoint này đã bỏ sẵn danh mục chưa có bài nào.
  // Trước đây thanh chủ đề liệt kê đủ mọi danh mục, bấm vào mục rỗng là rơi
  // thẳng vào trang danh sách trắng trơn. Hai khối cùng khoá cache nên vẫn chỉ
  // một request.
  loadTopics(): void {
    this.isLoading = true;
    this.newsCacheService
      .GetNewsCategoryPreview(CONSTANTS_APP.CATEGORY_PREVIEW_TAKE)
      .subscribe({
        next: res => {
          this.topics = (res.DataList || []).map(category => ({
            id: category.NewsCategoryId,
            name: category.NewsCategoryName,
          }));
          this.rebuildPages();
          this.currentPage = 0;
          this.isLoading = false;
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

  trackById(_: number, topic: Topic): string {
    return topic.id;
  }

  // Uỷ quyền sang helper dùng chung để khối "Khám phá theo chủ đề" ra đúng cùng
  // icon/màu cho cùng một danh mục.
  getTopicIconPath(name: string, index: number): string {
    return topicIconPath(name, index);
  }

  getTopicColor(index: number): string {
    return topicColor(index);
  }
}
