import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsCacheService, ShowErrorService } from '../../services';
import { IDetailNews } from '../../interfaces';
import { ScrollRevealDirective } from '../../directives';
import { TranslateModule } from '@ngx-translate/core';
import { INewsWithPlaceholder } from '../new-news/new-news.component';

// Màu placeholder fallback khi chưa có ảnh (giữ đúng mood của design)
const PLACEHOLDER_COLORS = [
  '#7a6b8a', // tím
  '#4a6b7a', // xanh xám
  '#7a4a5a', // đỏ nâu
  '#5a7a5a', // xanh lá
  '#8a7a5a', // nâu vàng
];

// Đúng bằng số ô của lưới: 1 ô chính + 4 ô phụ.
const FEATURED_COUNT = 5;

@Component({
  selector: 'app-featured-news',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollRevealDirective, TranslateModule],
  templateUrl: './featured-news.component.html',
  styleUrls: ['./featured-news.component.scss'],
})
export class FeaturedNewsComponent implements OnInit {
  private newsCacheService = inject(NewsCacheService);
  private showErrorService = inject(ShowErrorService);

  isLoading = true;
  featuredPosts: INewsWithPlaceholder[] = [];

  // Bài chính (trái, chiếm 2 row)
  get mainPost(): INewsWithPlaceholder | null {
    return this.featuredPosts[0] ?? null;
  }

  // 4 bài phụ (2×2 bên phải)
  get subPosts(): INewsWithPlaceholder[] {
    return this.featuredPosts.slice(1, FEATURED_COUNT);
  }

  ngOnInit(): void {
    this.loadFeaturedPosts();
  }

  // "Nổi bật" = được đọc nhiều nhất: đó là tín hiệu duy nhất có thật trong dữ
  // liệu (ViewCount được tăng mỗi lần mở bài), và nhờ khác thứ tự với danh sách
  // bên dưới nên người mới vào thấy được hai lát cắt khác nhau của blog.
  //
  // Dùng NewsCacheService chứ không gọi thẳng ApiService: đây là màn hình công
  // khai, quay lại trang chủ từ một bài viết sẽ lấy lại từ cache thay vì nháy
  // skeleton lần nữa. Cũng không đụng LoadingService - spinner toàn trang sẽ
  // che cả trang chủ, trong khi các khối khác đều tự hiện skeleton tại chỗ.
  private loadFeaturedPosts(): void {
    this.newsCacheService
      .SearchNews(0, FEATURED_COUNT, '', '', '', true, '', 'views')
      .subscribe({
        next: res => {
          this.featuredPosts = this.assignPlaceholders(res.objResult.DataList);
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

  trackById(_: number, post: IDetailNews): string {
    return post.NewsId;
  }

  // Gán màu placeholder cho các bài chưa có thumbnail
  private assignPlaceholders(posts: IDetailNews[]): INewsWithPlaceholder[] {
    return posts.map((post, i) => ({
      ...post,
      _placeholderColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
    }));
  }
}
