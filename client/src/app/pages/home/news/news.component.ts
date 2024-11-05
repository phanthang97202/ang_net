import { Component, inject, Input, OnInit } from '@angular/core';
import { delay } from 'rxjs';
import { NzListModule } from 'ng-zorro-antd/list';
import { ApiService } from '../../../services/api.service';
import { IDetailNews, INews } from '../../../interfaces/news';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SubString } from '../../../pipes/subString.pipe';
import { RouterModule } from '@angular/router';
import { LoadingService } from '../../../services/loading-service.service';
import { NewsItemComponennt } from '../../../components/news-item/news-item.component';
import { IHashTagNews } from '../../../interfaces/hash-tag-news';

@Component({
  selector: 'news-page',
  standalone: true,
  imports: [
    NewsItemComponennt,
    NzListModule,
    NzIconModule,
    SubString,
    RouterModule,
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);

  lstNews: IDetailNews[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.loadingService.setLoading(true);
    this.apiService
      .SearchNews(0, 100, '', '', '')
      .pipe()
      .subscribe({
        next: (res) => {
          this.lstNews = res.objResult.DataList;
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
