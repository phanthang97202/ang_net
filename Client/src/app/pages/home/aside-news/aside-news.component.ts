import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { ShowErrorService, ApiService, LangService } from '../../../services';
import { IDetailNews, IHashTagNews } from '../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../modules';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryTreeComponent } from '../../../components/category-tree/category-tree.component';
import { Subscription, finalize } from 'rxjs';

@Component({
  selector: 'app-aside-news',
  standalone: true,
  imports: [
    AntdModule,
    CategoryTreeComponent,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
  ],
  templateUrl: './aside-news.component.html',
  styleUrl: './aside-news.component.scss',
})
export class AsideNewsComponent implements OnInit, OnChanges {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  private langService = inject(LangService);
  private destroyRef = inject(DestroyRef);

  // Không báo qua LoadingService: đó là bộ đếm request chung của cả app và nó
  // bật spinner che kín màn hình. Khối này chỉ là thanh bên, hai request lại
  // xong ở hai thời điểm khác nhau (còn loadNews() chạy lại mỗi lần đổi bài),
  // nên báo vào đó là làm spinner và skeleton của trang chi tiết nhấp nháy theo
  // lịch của thanh bên. Chỗ này dùng trạng thái loading cục bộ ở dưới.

  // detailMode được truyền riêng thay vì suy ra từ categoryId. Lúc trang chi
  // tiết vừa dựng, categoryId vẫn rỗng; nếu suy ra từ đó thì component sẽ gọi
  // nhầm danh sách bài mới nhất trước khi biết bài hiện tại thuộc chuyên mục nào.
  @Input() detailMode = false;
  @Input() contentLoading = false;
  @Input() categoryId = '';
  @Input() excludeNewsId = '';

  lstNews: IDetailNews[] = [];
  lstTopHashTag: IHashTagNews[] = [];
  isNewsLoading = true;
  isTopHashTagLoading = true;
  isCategoryLoading = true;

  private initialized = false;
  private newsSubscription?: Subscription;
  private topHashTagSubscription?: Subscription;

  get isRelatedMode(): boolean {
    return this.detailMode;
  }

  // Ở trang chi tiết, ba khối dùng chung một nhịp hiển thị. Khối nào tải xong
  // trước vẫn giữ skeleton cho tới khi phần còn lại sẵn sàng, tránh sidebar co
  // giãn và lần lượt "nhảy" nội dung vào màn hình.
  get isSidebarLoading(): boolean {
    return (
      this.detailMode &&
      (this.contentLoading ||
        this.isNewsLoading ||
        this.isTopHashTagLoading ||
        this.isCategoryLoading)
    );
  }

  get showNewsSkeleton(): boolean {
    return this.detailMode
      ? this.isSidebarLoading
      : this.isNewsLoading && this.lstNews.length === 0;
  }

  get showTopHashTagSkeleton(): boolean {
    return this.detailMode
      ? this.isSidebarLoading
      : this.isTopHashTagLoading && this.lstTopHashTag.length === 0;
  }

  ngOnInit() {
    this.initialized = true;

    if (this.canLoadNews()) {
      this.loadNews();
    } else {
      this.waitForArticleContext();
    }

    this.langService.$langSubjectObservable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadTopHashTag());
  }

  // Component nằm ngoài khối *ngIf của trang chi tiết nên nó có mặt trước khi
  // bài viết tải xong, và khi chuyển sang bài khác nó cũng không bị dựng lại.
  // Cả hai trường hợp đều tới đây chứ không qua ngOnInit.
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    const newsContextChanged =
      changes['detailMode'] ||
      changes['contentLoading'] ||
      changes['categoryId'] ||
      changes['excludeNewsId'];

    if (!newsContextChanged) return;

    if (this.canLoadNews()) {
      this.loadNews();
    } else {
      this.waitForArticleContext();
    }
  }

  onCategoryLoadingChange(isLoading: boolean): void {
    this.isCategoryLoading = isLoading;
  }

  private canLoadNews(): boolean {
    return !this.detailMode || (!this.contentLoading && !!this.categoryId);
  }

  private waitForArticleContext(): void {
    // Hủy request của bài trước ngay khi route bắt đầu đổi. Response cũ vì thế
    // không thể quay về muộn rồi ghi đè danh sách của bài mới.
    this.newsSubscription?.unsubscribe();
    this.lstNews = [];
    this.isNewsLoading = true;
  }

  private loadNews(): void {
    // API sắp sẵn theo CreatedDTime giảm dần và lọc theo danh mục khi categoryId
    // khác rỗng, nên chỉ còn phải bỏ bài đang đọc ra.
    this.newsSubscription?.unsubscribe();
    this.lstNews = [];
    this.isNewsLoading = true;

    const requestedCategoryId = this.categoryId;
    const requestedExcludedNewsId = this.excludeNewsId;

    this.newsSubscription = this.apiService
      .SearchNews(0, 10, '', '', requestedCategoryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isNewsLoading = false))
      )
      .subscribe({
        next: res => {
          this.lstNews = res.objResult.DataList.filter(
            item => item.NewsId !== requestedExcludedNewsId
          );
        },
        error: err => {
          this.lstNews = [];
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
      });
  }

  private loadTopHashTag(): void {
    this.topHashTagSubscription?.unsubscribe();
    this.lstTopHashTag = [];
    this.isTopHashTagLoading = true;

    const languageCode = this.langService.getLang() === 'en' ? 'en' : 'vi';
    this.topHashTagSubscription = this.apiService
      .GetTopHashTag(languageCode)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isTopHashTagLoading = false))
      )
      .subscribe({
        next: res => {
          this.lstTopHashTag = res.DataList;
        },
        error: err => {
          this.lstTopHashTag = [];
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
      });
  }
}
