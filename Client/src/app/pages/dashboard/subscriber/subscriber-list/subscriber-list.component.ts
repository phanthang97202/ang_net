import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService, AuthService, ShowErrorService } from '../../../../services';
import { ISubscriberItem } from '../../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';

// Lọc theo trạng thái: '' = tất cả, 'active' = còn nhận, 'inactive' = đã huỷ.
type TStatusFilter = '' | 'active' | 'inactive';

@Component({
  selector: 'app-subscriber-list',
  standalone: true,
  imports: [
    AntdModule,
    FormsModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
  ],
  templateUrl: './subscriber-list.component.html',
  styleUrls: ['./subscriber-list.component.scss'],
})
export class SubscriberComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(NonNullableFormBuilder);

  dataSource: ISubscriberItem[] = [];
  isLoading = false;
  canUpdateSubscriber = this.authService.hasPermission('subscriber.update');

  // Phân trang ở SERVER: danh sách email có thể dài, tải hết về rồi phân trang
  // tại client là kéo cả bảng qua mạng mỗi lần mở màn hình.
  pageIndex = 1;
  pageSize = 20;
  itemCount = 0;

  searchForm = this.fb.group({
    Keyword: this.fb.control(''),
    Status: this.fb.control<TStatusFilter>(''),
  });

  ngOnInit(): void {
    this.fetchData();
  }

  handleSearch(): void {
    this.pageIndex = 1;
    this.fetchData();
  }

  handleResetSearch(): void {
    this.searchForm.reset({ Keyword: '', Status: '' });
    this.pageIndex = 1;
    this.fetchData();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    this.fetchData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchData();
  }

  // Gom email đang hiện ra clipboard để dán vào ô BCC khi muốn gửi thư tay.
  // Chỉ lấy người còn nhận - gửi cho người đã huỷ là đúng thứ họ vừa từ chối.
  copyActiveEmails(): void {
    const emails = this.dataSource
      .filter(x => x.FlagActive)
      .map(x => x.Email)
      .join(', ');

    if (!emails) {
      this.message.info('Trang này không có email nào đang nhận thư.');
      return;
    }

    if (!navigator.clipboard) {
      this.message.info('Trình duyệt không cho chép tự động.');
      return;
    }

    navigator.clipboard.writeText(emails).then(() => {
      this.message.success('Đã chép email của trang hiện tại.');
    });
  }

  handleToggleActive(data: ISubscriberItem, flagActive: boolean): void {
    this.isLoading = true;
    this.api
      .SubscriberToggleActive(data.SubscriberId, flagActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.message.success(
              flagActive
                ? `Đã bật nhận thư cho ${data.Email}.`
                : `Đã tạm ngừng nhận thư cho ${data.Email}.`
            );
          } else {
            this.message.error(
              response?.ErrorMessage || 'Không thể cập nhật trạng thái người đăng ký.'
            );
          }
          this.fetchData();
        },
        error: err => {
          this.isLoading = false;
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
          this.fetchData();
        },
      });
  }

  private fetchData(): void {
    const { Keyword, Status } = this.searchForm.getRawValue();

    // Bỏ trống = lấy cả hai trạng thái, nên phải là undefined chứ không phải
    // false (false nghĩa là "chỉ lấy người đã huỷ").
    const onlyActive =
      Status === '' ? undefined : Status === 'active' ? true : false;

    this.isLoading = true;

    this.api
      .SubscriberSearch(this.pageIndex - 1, this.pageSize, Keyword, onlyActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.isLoading = false;
          this.dataSource = res.objResult?.DataList || [];
          this.itemCount = res.objResult?.ItemCount || 0;
        },
        error: err => {
          this.isLoading = false;
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
      });
  }
}
