import { Component, inject, OnInit } from '@angular/core';
import { ApiService, ShowErrorService, SITE_TITLE } from '../../../services';
import { IDetailNews } from '../../../interfaces';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, Title } from '@angular/platform-browser';
import {
  REUSE_COMPONENT_MODULES,
  AntdModule,
  REUSE_PIPE_MODULE,
} from '../../../modules';
import { NewsCommentsComponent } from './news-comments/news-comments.component';
import { buildNewsSlides, stepSlide } from '../../../helpers';

@Component({
  selector: 'app-detail-news-page',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    NewsCommentsComponent,
  ],
  templateUrl: './detail-news.component.html',
  styleUrl: './detail-news.component.scss',
})
export class DetailNewsComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  router = inject(ActivatedRoute);

  // Cờ riêng của trang thay vì LoadingService: service đó đếm request của toàn
  // app và cũng là thứ bật spinner che kín màn hình, nên skeleton ở đây vừa bị
  // trùng với spinner vừa bật tắt theo request của component khác.
  isLoading = true;

  newsId = '';
  detailNews!: IDetailNews;

  // Ảnh đại diện luôn đứng đầu, sau đó tới ảnh lấy từ nội dung bài viết.
  slides: string[] = [];
  activeSlide = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private titleService: Title
  ) {}

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

  prevSlide(): void {
    this.activeSlide = stepSlide(this.activeSlide, this.slides.length, -1);
  }

  nextSlide(): void {
    this.activeSlide = stepSlide(this.activeSlide, this.slides.length, 1);
  }

  loadData(newsId: string): void {
    this.isLoading = true;
    this.apiService.GetNewsByKey(newsId).subscribe({
      next: res => {
        this.detailNews = res.Data;
        this.slides = buildNewsSlides(
          res.Data.Thumbnail,
          res.Data.ContentBody
        );
        this.activeSlide = 0;
        this.titleService.setTitle(
          `${this.detailNews.ShortTitle} - ${SITE_TITLE}`
        );
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
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
