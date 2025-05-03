import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  ApiService,
  LoadingService,
} from '../../../services';
import { IDetailNews, IHashTagNews } from '../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../modules';

@Component({
  selector: 'app-aside-news',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './aside-news.component.html',
  styleUrl: './aside-news.component.scss',
})
export class AsideNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);

  lstNews: IDetailNews[] = [];
  lstTopHashTag: IHashTagNews[] = [];

  ngOnInit() {
    this.loadData(4);
  }

  loadData(pi: number): void {
    this.loadingService.setLoading(true);
    this.apiService
      .SearchNews(0, 10, '', '', '')
      .pipe()
      .subscribe({
        next: res => {
          this.lstNews = res.objResult.DataList;
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
    this.apiService
      .GetTopHashTag()
      .pipe()
      .subscribe({
        next: res => {
          this.lstTopHashTag = res.DataList;
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
}
