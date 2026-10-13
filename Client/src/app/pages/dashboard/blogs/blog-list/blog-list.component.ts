import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { INewsAuthor } from '../../../../interfaces/news';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
  NewsCacheService,
} from '../../../../services';
import { IDetailNews } from '../../../../interfaces';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AntdModule } from '../../../../modules/antd.module';
import { BreadcrumbComponent } from '../../../../components/breadcrumb/breadcrumb.component';
import { NewsImgDirective } from '../../../../directives/news-img.directive';
import { LocalDTime } from '../../../../pipes/localeDTime.pipe';
import { Router } from '@angular/router';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { AuthService } from '../../../../services';
// AntdModule chỉ có ReactiveFormsModule; switch ghim dùng [ngModel] nên cần FormsModule.
import { FormsModule } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [
    AntdModule,
    BreadcrumbComponent,
    NewsImgDirective,
    LocalDTime,
    FormsModule,
  ],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit, AfterViewChecked {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private newsCacheService = inject(NewsCacheService);
  private modal = inject(NzModalService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  private dataRequest?: Subscription;
  readonly canFilterAuthors = this.authService.isAdminPermission();
  authors: INewsAuthor[] = [];
  filters = this.defaultFilters();
  private appliedFilters = this.defaultFilters();
  sort = 'latest';
  readonly sortOptions = [
    { value: 'latest', label: 'Ngày tạo: mới nhất' },
    { value: 'oldest', label: 'Ngày tạo: cũ nhất' },
    { value: 'updated', label: 'Cập nhật gần nhất' },
    { value: 'title', label: 'Tiêu đề: A → Z' },
    { value: 'title_desc', label: 'Tiêu đề: Z → A' },
    { value: 'views', label: 'Lượt xem: cao → thấp' },
    { value: 'views_asc', label: 'Lượt xem: thấp → cao' },
    { value: 'likes', label: 'Nhiều lượt thích nhất' },
  ];

  private defaultFilters() {
    return {
      title: '',
      dates: [] as Date[],
      author: null as string | null,
      pinned: null as boolean | null,
      status: '',
    };
  }

  get hasFilters(): boolean {
    const f = this.appliedFilters;
    return !!(
      f.title ||
      f.dates.length ||
      f.author ||
      f.pinned !== null ||
      f.status
    );
  }

  applyFilters(): void {
    this.appliedFilters = {
      ...this.filters,
      title: this.filters.title.trim(),
      dates: [...(this.filters.dates || [])],
    };
    this.pageIndex = 1;
    this.fetchData();
  }

  resetFilters(): void {
    this.filters = this.defaultFilters();
    this.sort = 'latest';
    this.applyFilters();
  }

  changeSort(): void {
    this.pageIndex = 1;
    this.fetchData();
  }

  // Id người đang đăng nhập, đọc một lần chứ không gọi trong template: template
  // chạy lại mỗi vòng change detection, mà getAccountInfo() thì giải mã JWT.
  private currentUserId = '';

  dataSource: IDetailNews[] = [];
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  tableLoading = false;

  listButtonsHeader: {
    text: string;
    iconType: string;
    nzType?: 'primary' | 'default';
    nzDanger?: boolean;
    onClick: () => void;
  }[] = [];

  ngOnInit(): void {
    this.currentUserId = this.authService.getAccountInfo().nameid || '';
    if (this.canFilterAuthors) {
      this.api
        .NewsAuthors()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => (this.authors = response?.DataList || []),
          error: error => this.handleApiError(error),
        });
    }
    this.listButtonsHeader = [
      ...(this.authService.hasPermission('blog.noticenews')
        ? [
            {
              text: 'Xóa cache',
              iconType: 'clear',
              nzType: 'default' as const,
              nzDanger: true,
              onClick: () => this.confirmClearCache(),
            },
          ]
        : []),
      {
        text: 'Tạo bài viết',
        iconType: 'plus',
        nzType: 'primary',
        onClick: () => this.handleOpenCreate(),
      },
    ];
    this.fetchData();
  }

  ngAfterViewChecked(): void {
    const dateInputs =
      this.host.nativeElement.querySelectorAll<HTMLInputElement>(
        '#blog-created-range, #blog-created-range-end'
      );
    dateInputs.forEach((input, index) => {
      input.setAttribute(
        'aria-label',
        index === 0 ? 'Ngày tạo: từ ngày' : 'Ngày tạo: đến ngày'
      );
      if (index === 1) input.id = 'blog-created-range-end';
    });
    // NG-ZORRO 17 không truyền accessible name xuống input nội bộ của bộ chọn
    // số dòng/trang. Pagination có thể render lại sau mỗi lần tải dữ liệu nên
    // gắn nhãn sau view-check để luôn giữ được tên điều khiển cho screen reader.
    const pageSizeInput =
      this.host.nativeElement.querySelector<HTMLInputElement>(
        '.ant-pagination-options-size-changer input'
      );
    if (pageSizeInput && !pageSizeInput.hasAttribute('aria-label')) {
      pageSizeInput.setAttribute('aria-label', 'Số bài viết mỗi trang');
    }
  }

  confirmClearCache(): void {
    this.modal.confirm({
      nzTitle: 'Xóa cache bài viết?',
      nzContent:
        'Danh sách, cây danh mục và chi tiết bài viết sẽ được tải mới từ dữ liệu gốc.',
      nzOkText: 'Xóa cache',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.clearNewsCache(),
    });
  }

  private clearNewsCache(): Promise<void> {
    this.setLoading(true);

    return new Promise((resolve, reject) => {
      this.api.ClearNewsCache().subscribe({
        next: response => {
          if (!response?.Success) {
            const error = new Error(
              response?.ErrorMessage || 'Không thể xóa cache'
            );
            this.handleApiError(error);
            reject(error);
            return;
          }

          this.newsCacheService.clear();
          this.message.success(
            `Đã xóa cache bài viết (${response.Data?.DeletedKeyCount ?? 0} khóa)`
          );
          this.fetchData();
          resolve();
        },
        error: err => {
          this.handleApiError(err);
          reject(err);
        },
        complete: () => this.setLoading(false),
      });
    });
  }

  /**
   * Chỉ tác giả mới sửa được bài của mình - kể cả Admin cũng không.
   * Khớp với NewsRespository.Update: chỗ đó chặn theo UserId, không có ngoại lệ
   * nào cho Admin. Ẩn nút ở đây để không mời người ta bấm vào rồi nhận lỗi.
   */
  canEdit(data: IDetailNews): boolean {
    return !!this.currentUserId && data.UserId === this.currentUserId;
  }

  /**
   * Gửi thư báo bài mới là quyền riêng, không đi kèm quyền sửa bài: đây là hành
   * động ra ngoài tới hộp thư người thật và không thu hồi được.
   *
   * Ẩn nút chỉ để đỡ mời người ta bấm vào rồi nhận 403 - chặn thật nằm ở
   * [Authorize(Policy = "blog.noticenews")] trên endpoint.
   */
  get canNotify(): boolean {
    return this.authService.hasPermission('blog.noticenews');
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    if (
      params.pageIndex === this.pageIndex &&
      params.pageSize === this.pageSize
    )
      return;
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.fetchData();
  }

  private fetchData(): void {
    this.dataRequest?.unsubscribe();
    this.tableLoading = true;
    this.setLoading(true);
    const f = this.appliedFilters;
    const start = f.dates[0] ? new Date(f.dates[0]) : undefined;
    const end = f.dates[1] ? new Date(f.dates[1]) : undefined;
    start?.setHours(0, 0, 0, 0);
    if (end) {
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
    }
    this.dataRequest = this.api
      .SearchNews(
        this.pageIndex - 1,
        this.pageSize,
        f.title,
        this.canFilterAuthors ? f.author || '' : this.currentUserId,
        '',
        false,
        '',
        this.sort,
        false,
        ['Public', 'Private', 'Tenant'].includes(f.status) ? f.status : '',
        {
          titleOnly: true,
          createdFrom: start?.toISOString(),
          createdBefore: end?.toISOString(),
          isPinned: f.pinned ?? undefined,
          published: f.status === 'draft' ? false : f.status ? true : undefined,
        }
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.tableLoading = false;
          this.setLoading(false);
        })
      )
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.dataSource = response.objResult?.DataList || [];
            this.total = response.objResult?.ItemCount || 0;
          } else {
            this.showErrorService.setShowError({
              icon: 'warning',
              message: JSON.stringify(response, null, 2),
              title: response?.ErrorMessage || 'Error',
            });
          }
        },
        error: err => this.handleApiError(err),
      });
  }

  handleDetail(data: IDetailNews): void {
    // Chặn cả ở đây chứ không chỉ ẩn nút: ẩn nút chỉ là bề mặt, gọi hàm này bằng
    // cách khác vẫn mở được màn hình sửa.
    if (!this.canEdit(data)) {
      this.message.warning('Chỉ tác giả mới sửa được bài viết này');
      return;
    }
    this.router.navigate([`/dashboard/blog/edit`, data.NewsId]);
  }

  handleOpenCreate(): void {
    this.router.navigate(['/dashboard/blog/create']);
  }

  isPublic(data: IDetailNews): boolean {
    return data.FlagActive && data.WhoCanSee === 'Public';
  }

  statusLabel(data: IDetailNews): string {
    if (!data.FlagActive) return 'Bản nháp';
    if (data.WhoCanSee === 'Tenant') return 'Trong nhóm';
    return data.WhoCanSee === 'Private' ? 'Chỉ mình tôi' : 'Công khai';
  }

  statusClass(data: IDetailNews): string {
    if (!data.FlagActive) return 'blog-list-page__status--draft';
    return data.WhoCanSee !== 'Public'
      ? 'blog-list-page__status--private'
      : 'blog-list-page__status--public';
  }

  statusIcon(data: IDetailNews): string {
    if (!data.FlagActive) return 'file-text';
    if (data.WhoCanSee === 'Tenant') return 'team';
    return data.WhoCanSee === 'Private' ? 'lock' : 'global';
  }

  /**
   * Ghim/bỏ ghim bài viết. Khác nút sửa, việc này KHÔNG giới hạn theo tác giả:
   * ghim là quyết định biên tập của cả trang chứ không phải sửa nội dung bài.
   */
  handleNotifySubscribers(data: IDetailNews): void {
    this.setLoading(true);
    this.api.NotifyNewPost(data.NewsId).subscribe({
      next: response => {
        if (response?.Success) {
          const sent = response.Data?.SentCount ?? 0;
          this.message.success(
            sent > 0
              ? `Đã đưa ${sent} thư vào hàng đợi gửi`
              : 'Chưa có ai đăng ký nhận bài'
          );
        } else {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(response, null, 2),
            title: response?.ErrorMessage || 'Error',
          });
        }
        // Tải lại trong cả hai nhánh: server đánh dấu NotifiedAt trước khi đẩy
        // thư nên nút phải đổi trạng thái theo đúng dữ liệu thật dưới DB.
        this.fetchData();
      },
      error: err => {
        this.setLoading(false);
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
      },
    });
  }

  handleTogglePin(data: IDetailNews, isPinned: boolean): void {
    // Thứ tự ghim mặc định đẩy bài mới ghim lên trước các bài đã ghim: người ghim
    // thường muốn bài vừa chọn nổi nhất. Muốn xếp khác thì sửa trực tiếp trong DB
    // - màn hình này chưa có ô nhập thứ tự.
    const pinOrder = isPinned ? this.nextPinOrder() : 0;

    this.setLoading(true);
    this.api.NewsTogglePin(data.NewsId, isPinned, pinOrder).subscribe({
      next: response => {
        if (response?.Success) {
          this.message.success(isPinned ? 'Đã ghim bài viết' : 'Đã bỏ ghim');
          this.fetchData();
        } else {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(response, null, 2),
            title: response?.ErrorMessage || 'Error',
          });
          // Tải lại để switch trở về đúng trạng thái thật dưới DB.
          this.fetchData();
        }
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  /** Số thứ tự nhỏ hơn mọi bài đang ghim, để bài vừa ghim đứng đầu. */
  private nextPinOrder(): number {
    const orders = this.dataSource
      .filter(x => x.IsPinned)
      .map(x => x.PinOrder ?? 0);
    return orders.length ? Math.min(...orders) - 1 : 0;
  }

  private setLoading(isLoading: boolean): void {
    this.loadingService.setLoading(isLoading);
  }

  private handleApiError(err: any): void {
    this.tableLoading = false;
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }
}
