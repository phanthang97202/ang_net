import { Component, inject, OnInit } from '@angular/core';
import {
  ApiService,
  ShowErrorService,
  LoadingService,
} from '../../../services';
import { IDetailNews } from '../../../interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { CONSTANTS_APP } from '../../../helpers';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../modules';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  activedRouter = inject(ActivatedRoute);

  lstNews: IDetailNews[] = [];
  currentPage = 0;
  pageSize = CONSTANTS_APP.PAGE_SIZE;
  itemCount = 0;

  ngOnInit() {
    this.activedRouter.queryParams.subscribe(p => {
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
        next: res => {
          const { DataList, PageIndex, ItemCount } = res.objResult;

          this.lstNews = DataList;
          this.currentPage = PageIndex;
          this.itemCount = ItemCount;

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

  handlePageIndexChange(pageIndex: number) {
    const queryParams = {
      pageIndex: pageIndex,
    };
    this.router.navigate(['news/'], { queryParams });
  }
}
