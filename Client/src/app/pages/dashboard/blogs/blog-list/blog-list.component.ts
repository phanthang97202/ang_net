import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
} from '../../../../services';
import { IDetailNews } from '../../../../interfaces';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NonNullableFormBuilder } from '@angular/forms';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { Router } from '@angular/router';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { AuthService } from '../../../../services';
// AntdModule chỉ có ReactiveFormsModule; switch ghim dùng [ngModel] nên cần FormsModule.
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    FormsModule,
  ],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);

  // Id người đang đăng nhập, đọc một lần chứ không gọi trong template: template
  // chạy lại mỗi vòng change detection, mà getAccountInfo() thì giải mã JWT.
  private currentUserId = '';

  dataSource: IDetailNews[] = [];
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  tableLoading = false;

  listButtonsHeader = [
    {
      text: 'Create',
      iconType: 'plus',
      onClick: () => this.handleOpenCreate(),
    },
  ];

  ngOnInit(): void {
    this.currentUserId = this.authService.getAccountInfo().nameid || '';
    this.fetchData();
  }

  /**
   * Chỉ tác giả mới sửa được bài của mình - kể cả Admin cũng không.
   * Khớp với NewsRespository.Update: chỗ đó chặn theo UserId, không có ngoại lệ
   * nào cho Admin. Ẩn nút ở đây để không mời người ta bấm vào rồi nhận lỗi.
   */
  canEdit(data: IDetailNews): boolean {
    return !!this.currentUserId && data.UserId === this.currentUserId;
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.fetchData();
  }

  private fetchData(): void {
    this.tableLoading = true;
    this.setLoading(true);
    this.api
      .SearchNews(this.pageIndex - 1, this.pageSize, '', '', '', false)
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
        complete: () => {
          this.tableLoading = false;
          this.setLoading(false);
        },
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

  /**
   * Ghim/bỏ ghim bài viết. Khác nút sửa, việc này KHÔNG giới hạn theo tác giả:
   * ghim là quyết định biên tập của cả trang chứ không phải sửa nội dung bài.
   */
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
