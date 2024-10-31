import { Component, inject, OnInit } from '@angular/core';
import { delay } from 'rxjs';
import { NzListModule } from 'ng-zorro-antd/list';
import { ApiService } from '../../../services/api.service';
import { IDetailNews, INews } from '../../../interfaces/news';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SubString } from '../../../pipes/subString.pipe';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  RouterModule,
} from '@angular/router';
import { LoadingService } from '../../../services/loading-service.service';

@Component({
  selector: 'detail-news-page',
  standalone: true,
  imports: [NzListModule, NzIconModule, SubString, RouterModule],
  templateUrl: './detail-news.component.html',
  styleUrl: './detail-news.component.scss',
})
export class DetailNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  router = inject(ActivatedRoute);
  loadingService = inject(LoadingService);

  newsId = '';
  detailNews: string = '';
  ngOnInit() {
    this.router.paramMap.subscribe((value) => {
      this.newsId = value.get('newsId') || '';
    });
    this.loadData(this.newsId);
  }

  loadData(newsId: string): void {
    this.loadingService.setLoading(true);
    this.apiService
      .GetNewsByKey(newsId)
      .pipe()
      .subscribe({
        next: (res) => {
          this.detailNews = res.Data.ContentBody;
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
}
