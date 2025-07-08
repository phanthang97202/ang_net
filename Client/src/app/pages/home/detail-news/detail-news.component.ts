import { Component, inject, OnInit } from '@angular/core';
import {
  ApiService,
  ShowErrorService,
  LoadingService,
} from '../../../services';
import { IDetailNews } from '../../../interfaces';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import {
  REUSE_COMPONENT_MODULES,
  AntdModule,
  REUSE_PIPE_MODULE,
} from '../../../modules';
@Component({
  selector: 'app-detail-news-page',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './detail-news.component.html',
  styleUrl: './detail-news.component.scss',
})
export class DetailNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  router = inject(ActivatedRoute);
  loadingService = inject(LoadingService);
  isLoading$ = this.loadingService.getLoading();

  newsId = '';
  detailNews!: IDetailNews;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Subscribe to paramMap to react to changes in the route parameters
    this.router.paramMap.subscribe(params => {
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
      next: res => {
        this.detailNews = res.Data;
      },
      error: err => {
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
