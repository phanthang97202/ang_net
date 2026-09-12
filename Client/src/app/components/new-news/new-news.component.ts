import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { PaginationComponent } from '../pagination/pagination.component';
import {
  LoadingService,
  NewsCacheService,
  ShowErrorService,
} from '../../services';
import { IDetailNews } from '../../interfaces';
import { CONSTANTS_APP } from '../../helpers';
import { ScrollRevealDirective } from '../../directives';
import { TranslateModule } from '@ngx-translate/core';

export interface INewsWithPlaceholder extends IDetailNews {
  _placeholderColor?: string;
}

const PLACEHOLDER_COLORS = [
  '#5b4fe9', // indigo
  '#e95f9c', // hồng
  '#3fb2a6', // xanh ngọc
  '#f2994a', // cam
  '#7a6b8a', // tím
  '#4a90d9', // xanh dương
];

@Component({
  selector: 'app-new-news',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PaginationComponent,
    ScrollRevealDirective,
    TranslateModule,
  ],
  templateUrl: './new-news.component.html',
  styleUrls: ['./new-news.component.scss'],
})
export class NewNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  newsCacheService = inject(NewsCacheService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  activedRouter = inject(ActivatedRoute);

  isLoading = true;
  posts: INewsWithPlaceholder[] = [];
  currentPage = 0;
  pageSize = CONSTANTS_APP.PAGE_SIZE;
  itemCount = 0;
  categoryId = '';
  keyword = '';
  hashTag = '';

  // Rỗng = mặc định của API (bài mới nhất trước), giữ URL trang chủ sạch.
  sort = '';
  readonly sortTabs = [
    { value: '', labelKey: 'T_SORTNEWEST' },
    { value: 'views', labelKey: 'T_SORTMOSTREAD' },
    { value: 'likes', labelKey: 'T_SORTMOSTLIKED' },
  ];

  // URL chỉ có slug danh mục (vd "holiday"), tên hiển thị ("Ngày lễ") lấy từ
  // chính kết quả trả về nên không phải gọi thêm API danh mục. Không có bài nào
  // khớp thì đành hiện slug.
  get filterLabelKey(): string | null {
    if (this.keyword) return 'T_SEARCHRESULTTITLE';
    if (this.hashTag) return 'T_HASHTAGTITLE';
    if (this.categoryId) return 'T_CATEGORYTITLE';
    return null;
  }

  get filterValue(): string {
    if (this.keyword) return this.keyword;
    if (this.hashTag) return this.hashTag;
    return this.posts[0]?.CategoryNewsName || this.categoryId;
  }

  // Trang chủ không có mấy tham số lọc này nên chạy như cũ (lấy tất cả bài);
  // trang /news thì có, và component tự đọc từ URL luôn giống pageIndex thay vì
  // bắt trang cha truyền xuống.
  ngOnInit(): void {
    this.activedRouter.queryParams.subscribe(p => {
      this.categoryId = p['categoryId'] || '';
      this.keyword = p['keyword'] || '';
      this.hashTag = p['hashTag'] || '';
      this.sort = p['sort'] || '';
      this.loadPosts(p['pageIndex'] || 0);
    });
  }

  loadPosts(pageIndex: number): void {
    this.isLoading = true;
    this.newsCacheService
      .SearchNews(
        pageIndex,
        this.pageSize,
        this.keyword,
        '',
        this.categoryId,
        true,
        this.hashTag,
        this.sort
      )
      .pipe()
      .subscribe({
        next: res => {
          const { DataList, PageIndex, ItemCount } = res.objResult;
          this.posts = this.assignPlaceholders(DataList);
          this.currentPage = PageIndex;
          this.itemCount = ItemCount;
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

  // Ở lại đúng route đang đứng (/ hay /news) và giữ nguyên các tham số lọc,
  // chỉ đổi mỗi pageIndex.
  handlePageIndexChange(pageIndex: number): void {
    this.router.navigate([], {
      relativeTo: this.activedRouter,
      queryParams: { pageIndex },
      queryParamsHandling: 'merge',
    });
  }

  // Đổi cách sắp xếp phải về trang 1: giữ nguyên pageIndex cũ thì rất dễ rơi
  // vào trang trống (mỗi kiểu sắp xếp có số trang như nhau nhưng nội dung khác
  // hẳn, người đọc đang ở trang 4 bấm "Đọc nhiều" sẽ không hiểu mình đang xem gì).
  // sort rỗng truyền null để Angular xoá hẳn tham số khỏi URL thay vì để "?sort=".
  changeSort(value: string): void {
    if (value === this.sort) return;

    this.router.navigate([], {
      relativeTo: this.activedRouter,
      queryParams: { sort: value || null, pageIndex: 0 },
      queryParamsHandling: 'merge',
    });
  }

  // 1200 -> "1.2k". Số lượt xem thô làm dòng meta của card dài ra và dễ xuống dòng.
  formatCount(value: number): string {
    if (!value) return '0';
    if (value < 1000) return `${value}`;

    const thousands = value / 1000;
    const rounded =
      thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, '') : Math.round(thousands);
    return `${rounded}k`;
  }

  trackById(_: number, post: IDetailNews): string {
    return post.NewsId;
  }

  private assignPlaceholders(
    posts: IDetailNews[]
  ): INewsWithPlaceholder[] {
    return posts.map((post, i) => ({
      ...post,
      _placeholderColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
    }));
  }
}
