import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// ── Model ──────────────────────────────────────────────
export interface NewPost {
  id: number | string;
  slug: string;
  title: string;
  category: string;
  thumbnail?: string;
  date: string;
  readTime: number;
  excerpt: string;
  _placeholderColor?: string; // tự gen client-side
}

const PLACEHOLDER_COLORS = [
  '#4a7c6f', // xanh rêu
  '#7a6b8a', // tím
  '#7a7a4a', // vàng olive
  '#4a6b7a', // xanh xám
  '#7a4a5a', // đỏ nâu
  '#5a6a7a', // xám xanh
];

@Component({
  selector: 'app-new-news',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './new-news.component.html',
  styleUrls: ['./new-news.component.scss'],
})
export class NewNewsComponent implements OnInit {
  private http = inject(HttpClient);

  isLoading = true;
  posts: NewPost[] = [];

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading = true;

    // ── Gọi API thật ──────────────────────────────────────
    // this.http.get<NewPost[]>('/api/posts/latest')
    //   .pipe(finalize(() => (this.isLoading = false)))
    //   .subscribe({
    //     next: (data) => (this.posts = this.assignPlaceholders(data)),
    //     error: (err) => console.error('Failed to load latest posts', err),
    //   });

    // ── Mock data (xóa khi dùng API thật) ─────────────────
    setTimeout(() => {
      this.posts = this.assignPlaceholders([
        {
          id: 1,
          slug: 'trekking-ta-nang-phan-dung',
          title: 'Trekking Tà Năng — Phan Dũng: cung đường đẹp nhất Việt Nam',
          category: 'Du lịch',
          thumbnail: '',
          date: '20 tháng 9, 2024',
          readTime: 8,
          excerpt:
            'Hành trình 3 ngày 2 đêm xuyên qua những thảo nguyên xanh mướt và đồi cỏ tranh vàng óng...',
        },
        {
          id: 2,
          slug: 'review-tui-ngu-naturehike',
          title: 'Review túi ngủ Naturehike dưới 1 triệu — có đáng mua không?',
          category: 'Review',
          thumbnail: '',
          date: '18 tháng 9, 2024',
          readTime: 5,
          excerpt:
            'Sau 3 chuyến cắm trại với cái giá rét Tây Bắc, đây là những gì mình thực sự nghĩ...',
        },
        {
          id: 3,
          slug: 'sang-thu-hai-ly-do-khong-so',
          title: 'Sáng thứ hai và lý do mình không còn sợ tuần mới nữa',
          category: 'Life Slice',
          thumbnail: '',
          date: '15 tháng 9, 2024',
          readTime: 6,
          excerpt:
            'Không phải bí kíp năng suất, chỉ là một vài thói quen nhỏ thay đổi cách mình nhìn ngày mới...',
        },
      ]);
      this.isLoading = false;
    }, 600);
  }

  trackById(_: number, post: NewPost): number | string {
    return post.id;
  }

  private assignPlaceholders(posts: NewPost[]): NewPost[] {
    return posts.map((post, i) => ({
      ...post,
      _placeholderColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
    }));
  }
}
