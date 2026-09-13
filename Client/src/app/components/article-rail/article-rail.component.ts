import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TocPanelService } from '../../services';

// Cuộn quá một màn hình mới hiện nút lên đầu trang.
const BACK_TO_TOP_OFFSET_PX = 600;

// Thời gian giữ trạng thái "đã sao chép" trước khi nút trở lại bình thường.
const COPIED_FEEDBACK_MS = 2000;

// Id đặt trên <app-news-comments> ở trang chi tiết bài viết.
const COMMENTS_ANCHOR_ID = 'news-comments';

@Component({
  selector: 'app-article-rail',
  standalone: true,
  imports: [CommonModule, TranslateModule, NzIconModule],
  templateUrl: './article-rail.component.html',
  styleUrls: ['./article-rail.component.scss'],
})
export class ArticleRailComponent implements OnInit {
  @Input() commentCount = 0;
  @Input() likeCount = 0;
  @Input() isLiked = false;

  // Rail chỉ là thanh điều khiển, việc gọi API để trang chi tiết lo - nó mới
  // là nơi giữ detailNews.
  @Output() likeToggle = new EventEmitter<void>();

  tocPanel = inject(TocPanelService);
  private destroyRef = inject(DestroyRef);
  private zone = inject(NgZone);

  showBackToTop = false;
  isCopied = false;

  private copiedTimer?: ReturnType<typeof setTimeout>;

  // Đăng ký listener ngoài Angular zone: zone.js vá addEventListener nên để
  // nguyên trong zone là mỗi pixel cuộn kéo theo một lượt change detection cho
  // cả trang, chỉ để lật một biến boolean. Chỉ quay lại zone đúng lúc giá trị
  // thực sự đổi (2 lần cho cả bài viết).
  ngOnInit(): void {
    const onScroll = () => {
      const next = window.scrollY > BACK_TO_TOP_OFFSET_PX;
      if (next === this.showBackToTop) return;

      this.zone.run(() => {
        this.showBackToTop = next;
      });
    };

    this.showBackToTop = window.scrollY > BACK_TO_TOP_OFFSET_PX;

    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', onScroll, { passive: true });
    });

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(this.copiedTimer);
    });
  }

  scrollToComments(): void {
    const element = document.getElementById(COMMENTS_ANCHOR_ID);
    if (!element) return;

    // Trừ đi chiều cao navbar dính ở đỉnh, nếu không tiêu đề "Bình luận" bị
    // navbar che mất - cùng cách app-news-toc-list đang cuộn tới heading.
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 80,
      behavior: 'smooth',
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // navigator.clipboard chỉ tồn tại trên HTTPS (hoặc localhost) - trên HTTP thì
  // thuộc tính này là undefined chứ không phải gọi vào rồi lỗi, nên phải kiểm
  // tra trước thay vì bọc try/catch.
  copyLink(): void {
    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(window.location.href).then(() => {
      this.isCopied = true;
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        this.isCopied = false;
      }, COPIED_FEEDBACK_MS);
    });
  }
}
