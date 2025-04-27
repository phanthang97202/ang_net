import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShowErrorService } from '../../../services/show-error.service';
import { ApiService } from '../../../services/api.service';
import { LoadingService } from '../../../services/loading-service.service';
import { IDetailNews } from '../../../interfaces/news';
import { IHashTagNews } from '../../../interfaces/hash-tag-news';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NewsItemSmComponennt } from '../../../components/news-items-sm/news-item-sm.component';
import { HashTagComponennt } from '../../../components/hash-tag/hash-tag.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aside-news',
  standalone: true,
  imports: [
    NzAvatarModule,
    CommonModule,
    NewsItemSmComponennt,
    HashTagComponennt,
  ],
  templateUrl: './aside-news.component.html',
  styleUrl: './aside-news.component.scss',
})
export class AsideNewsComponent {
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
    this.apiService
      .GetTopHashTag()
      .pipe()
      .subscribe({
        next: (res) => {
          this.lstTopHashTag = res.DataList;
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
