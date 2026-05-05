import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService, LoadingService, ShowErrorService } from '../../services';
import { IDetailNews } from '../../interfaces';

// ── Data Model ─────────────────────────────────────────────────────────────
export interface FeaturedPost {
  id: number | string;
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  thumbnail?: string; // URL ảnh, nếu null sẽ dùng màu placeholder
  date?: string; // Chỉ dùng ở main post
  readTime: number;
  _placeholderColor?: string; // tự gen, không cần từ API
}

// Màu placeholder fallback khi chưa có ảnh (giữ đúng mood của design)
const PLACEHOLDER_COLORS = [
  '#7a6b8a', // tím
  '#4a6b7a', // xanh xám
  '#7a4a5a', // đỏ nâu
  '#5a7a5a', // xanh lá
  '#8a7a5a', // nâu vàng
];

@Component({
  selector: 'app-featured-news',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './featured-news.component.html',
  styleUrls: ['./featured-news.component.scss'],
})
export class FeaturedNewsComponent implements OnInit {
  private http = inject(HttpClient);
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  featuredPosts: IDetailNews[] = [];

  // Bài chính (trái, chiếm 2 row)
  get mainPost(): IDetailNews | null {
    return this.featuredPosts[0] ?? null;
  }

  // 4 bài phụ (2×2 bên phải)
  get subPosts(): IDetailNews[] {
    return this.featuredPosts.slice(1, 5);
  }

  ngOnInit(): void {
    this.loadFeaturedPosts();
  }

  loadFeaturedPosts(): void {
    // ── Gọi API thật ─────────────────────────────────────
    // Thay URL bên dưới bằng endpoint thực của bạn
    // this.http.get<FeaturedPost[]>('/api/posts/featured')
    //   .pipe(finalize(() => this.isLoading = false))
    //   .subscribe({
    //     next: (posts) => this.featuredPosts = this.assignPlaceholders(posts),
    //     error: (err) => console.error('Failed to load featured posts', err),
    //   });

    this.loadingService.setLoading(true);
    this.apiService
      .SearchNews(0, 10, '', '', '')
      .pipe()
      .subscribe({
        next: res => {
          const _rData = this.assignPlaceholders(res.objResult.DataList);
          console.log(
            '🚀 ~ FeaturedNewsComponent ~ loadFeaturedPosts ~ _rData:',
            _rData
          );
          this.featuredPosts = _rData;

          this.loadingService.setLoading(false);
        },
        error: err => {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
          this.loadingService.setLoading(false);
          throw new Error(err);
        },
      });
  }

  trackById(_: number, post: IDetailNews): number | string {
    return post.NewsId;
  }

  // Gán màu placeholder cho các bài chưa có thumbnail
  private assignPlaceholders(posts: IDetailNews[]): IDetailNews[] {
    return posts.map((post, i) => ({
      ...post,
      _placeholderColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
    }));
  }
}
