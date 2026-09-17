import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LangService, NewsCacheService } from '../../services';
import { IDetailNews } from '../../interfaces';
import { ScrollRevealDirective } from '../../directives';

// Lấy dư rồi mới lọc bài đang đọc: nếu lấy đúng 3 mà một trong số đó chính là
// bài này thì chỉ còn 2 ô, lưới bị hụt.
const FETCH_COUNT = 6;
const SHOW_COUNT = 3;

@Component({
  selector: 'app-related-posts',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ScrollRevealDirective],
  templateUrl: './related-posts.component.html',
  styleUrl: './related-posts.component.scss',
})
export class RelatedPostsComponent implements OnInit, OnChanges {
  @Input({ required: true }) categoryId = '';
  @Input({ required: true }) excludeNewsId = '';

  private newsCache = inject(NewsCacheService);
  private destroyRef = inject(DestroyRef);
  private langService = inject(LangService);

  posts: IDetailNews[] = [];
  private initialized = false;

  ngOnInit(): void {
    this.initialized = true;
    this.load();
  }

  // Chuyển từ bài này sang bài khác cùng route thì component không dựng lại,
  // chỉ input đổi - giống cách aside-news đang xử lý.
  ngOnChanges(): void {
    if (this.initialized) {
      this.load();
    }
  }

  getCategoryName(post: IDetailNews): string {
    return this.langService.getLang() === 'en' && post.CategoryNewsNameEn
      ? post.CategoryNewsNameEn
      : post.CategoryNewsName;
  }

  private load(): void {
    if (!this.categoryId) return;

    this.newsCache
      .SearchNews(0, FETCH_COUNT, '', '', this.categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.posts = (res.objResult?.DataList || [])
            .filter(item => item.NewsId !== this.excludeNewsId)
            .slice(0, SHOW_COUNT);
        },
        // Đây là khối phụ ở cuối bài, hỏng thì ẩn đi chứ không bung lỗi toàn
        // trang che mất bài viết người ta đang đọc.
        error: () => {
          this.posts = [];
        },
      });
  }
}
