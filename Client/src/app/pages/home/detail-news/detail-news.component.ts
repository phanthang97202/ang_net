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
import { DomSanitizer } from '@angular/platform-browser';
import { LocalDTime } from '../../../pipes/localeDTime.pipe';

@Component({
  selector: 'detail-news-page',
  standalone: true,
  imports: [NzListModule, NzIconModule, SubString, RouterModule, LocalDTime],
  templateUrl: './detail-news.component.html',
  styleUrl: './detail-news.component.scss',
})
export class DetailNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  router = inject(ActivatedRoute);
  loadingService = inject(LoadingService);

  newsId = '';
  detailNews!: IDetailNews;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Subscribe to paramMap to react to changes in the route parameters
    this.router.paramMap.subscribe((params) => {
      const newNewsId = params.get('newsId') || '';
      // Call loadData only if the newsId has changed
      if (newNewsId !== this.newsId) {
        this.newsId = newNewsId;
        this.loadData(this.newsId);
      }
    });
  }

  byPassHTML(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  loadData(newsId: string): void {
    this.loadingService.setLoading(true);
    this.apiService.GetNewsByKey(newsId).subscribe({
      next: (res) => {
        this.detailNews = res.Data;
      },
      error: (err) => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
    });
  }
}
