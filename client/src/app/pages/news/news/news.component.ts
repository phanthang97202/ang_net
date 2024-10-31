import { Component, inject, OnInit } from '@angular/core';
import { delay } from 'rxjs';
import { NzListModule } from 'ng-zorro-antd/list';
import { ApiService } from '../../../services/api.service';
import { INews } from '../../../interfaces/news';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SubString } from '../../../pipes/subString.pipe';
import { RouterModule } from '@angular/router';
import { LoadingService } from '../../../services/loading-service.service';

@Component({
  selector: 'news-page',
  standalone: true,
  imports: [NzListModule, NzIconModule, SubString, RouterModule],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);

  lstNews: INews[] = [];
  ngOnInit() {
    this.loadData(4);
  }

  loadData(pi: number): void {
    this.loadingService.setLoading(true);
    this.apiService
      .SearchNews(0, 10, '', '', '')
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
