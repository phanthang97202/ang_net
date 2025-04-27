import { Component, inject, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { ApiService } from '../../../services/api.service';
import { IDetailNews, INews } from '../../../interfaces/news';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LoadingService } from '../../../services/loading-service.service';
import { NewsItemComponennt } from '../../../components/news-item/news-item.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { CONSTANTS_APP } from '../../../helpers/constants';

@Component({
  selector: 'news-page',
  standalone: true,
  imports: [
    NewsItemComponennt,
    NzListModule,
    NzIconModule,
    RouterModule,
    PaginationComponent,
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  activedRouter = inject(ActivatedRoute);

  lstNews: IDetailNews[] = [];
  currentPage: number = 0;
  pageSize: number = CONSTANTS_APP.PAGE_SIZE;
  itemCount: number = 0;

  ngOnInit() {
    this.activedRouter.queryParams.subscribe((p) => {
      const pageIndex = p['pageIndex'] || 0;
      this.loadData({
        pageIndex: pageIndex,
        pageSize: this.pageSize,
      });
    });
  }

  loadData(searchCondition: any): void {
    const { pageIndex, pageSize } = searchCondition;
    this.loadingService.setLoading(true);
    this.apiService
      .SearchNews(pageIndex, pageSize, '', '', '')
      .pipe()
      .subscribe({
        next: (res) => {
          const { DataList, PageIndex, ItemCount } = res.objResult;

          this.lstNews = DataList;
          this.currentPage = PageIndex;
          this.itemCount = ItemCount;

          this.loadingService.setLoading(false);
        },
        error: (err) => {
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

  handlePageIndexChange(pageIndex: number) {
    const queryParams = {
      pageIndex: pageIndex,
    };
    this.router.navigate(['news/'], { queryParams });
  }
}
