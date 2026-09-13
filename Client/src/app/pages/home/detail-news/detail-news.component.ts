import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzImageService } from 'ng-zorro-antd/image';
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
import { NewsRatingComponent } from '../../../components/news-rating/news-rating.component';
import { buildNewsSlides, stepSlide } from '../../../helpers';

@Component({
  selector: 'app-detail-news-page',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    NewsCommentsComponent,
    NewsRatingComponent,
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

  // Số bình luận do app-news-comments đếm (gồm cả trả lời lồng nhau), chuyển
  // sang thanh công cụ bên trái để hiện cạnh icon bình luận.
  commentCount = 0;

  // Giữ điểm mới ngay trên detailNews để nếu có chỗ khác trong trang cùng đọc
  // AvgPoint thì không bị lệch với con số khối đánh giá đang hiện.
  onRated(result: { avgPoint: number; totalPoint: number }): void {
    this.detailNews.AvgPoint = result.avgPoint;
    this.detailNews.TotalPoint = result.totalPoint;
  }

  private imageService = inject(NzImageService);
  private destroyRef = inject(DestroyRef);

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

  // Mở lightbox với cả bộ slide của bài viết (ảnh đại diện + ảnh trong nội dung)
  // để lật qua lại ngay trong đó, mở đúng ở ảnh đang xem.
  openPreview(): void {
    if (!this.slides.length) return;

    const ref = this.imageService.preview(
      this.slides.map(src => ({ src, alt: this.detailNews?.ShortTitle }))
    );
    ref.switchTo(this.activeSlide);

    // Đóng lightbox ở ảnh nào thì slider ngoài hiện tiếp ảnh đó, không giật về
    // tấm cũ. animationStateChanged bắt được cả 3 kiểu đóng (nút X, Esc, click
    // ra nền) vì kiểu nào cũng chạy qua animation 'leave' - closeClick thì chỉ
    // bắn khi bấm nút X.
    const instance = ref.previewInstance;
    instance.animationStateChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.phaseName !== 'done' || event.toState !== 'void') return;
        this.activeSlide = instance.index;
      });
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
