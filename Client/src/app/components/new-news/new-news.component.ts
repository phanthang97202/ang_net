import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { PaginationComponent } from '../pagination/pagination.component';
import { ApiService, LoadingService, ShowErrorService } from '../../services';
import { IDetailNews } from '../../interfaces';
import { CONSTANTS_APP } from '../../helpers';

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
  imports: [CommonModule, RouterLink, PaginationComponent],
  templateUrl: './new-news.component.html',
  styleUrls: ['./new-news.component.scss'],
})
export class NewNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  activedRouter = inject(ActivatedRoute);

  isLoading = true;
  posts: INewsWithPlaceholder[] = [];
  currentPage = 0;
  pageSize = CONSTANTS_APP.PAGE_SIZE;
  itemCount = 0;

  ngOnInit(): void {
    this.activedRouter.queryParams.subscribe(p => {
      const pageIndex = p['pageIndex'] || 0;
      this.loadPosts(pageIndex);
    });
  }

  loadPosts(pageIndex: number): void {
    this.isLoading = true;
    this.apiService
      .SearchNews(pageIndex, this.pageSize, '', '', '')
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

  handlePageIndexChange(pageIndex: number): void {
    this.router.navigate(['/'], { queryParams: { pageIndex } });
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
