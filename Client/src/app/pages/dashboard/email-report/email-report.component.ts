import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder } from '@angular/forms';
import {
  IEmailDeliveryItem,
  IEmailDeliverySummary,
  TEmailDeliveryStatus,
} from '../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../modules';
import { ApiService, ShowErrorService } from '../../../services';

type TStatusFilter = '' | TEmailDeliveryStatus;

@Component({
  selector: 'app-email-report',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './email-report.component.html',
  styleUrls: ['./email-report.component.scss'],
})
export class EmailReportComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(NonNullableFormBuilder);

  summary: IEmailDeliverySummary = {
    Total: 0,
    Pending: 0,
    Succeeded: 0,
    Failed: 0,
    Skipped: 0,
  };
  dataSource: IEmailDeliveryItem[] = [];
  isLoading = false;
  pageIndex = 1;
  pageSize = 20;
  itemCount = 0;

  searchForm = this.fb.group({
    Keyword: this.fb.control(''),
    Status: this.fb.control<TStatusFilter>(''),
  });

  // Màn này không tạo dữ liệu, hành động chính của trang là tải lại báo cáo.
  listButtonsHeader = [
    {
      text: 'Làm mới',
      iconType: 'sync',
      onClick: () => this.fetchData(),
    },
  ];

  ngOnInit(): void {
    this.fetchData();
  }

  // Tính trên số thư THỰC SỰ được gửi đi, không tính thư bỏ qua: bỏ qua vì người
  // nhận đã tắt không phải lỗi gửi, để trong mẫu số thì tỉ lệ tụt xuống oan.
  get successRate(): number {
    const attempted = this.summary.Total - this.summary.Skipped;
    return attempted
      ? Math.round((this.summary.Succeeded / attempted) * 100)
      : 0;
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

  statusLabel(status: TEmailDeliveryStatus): string {
    const labels: Record<TEmailDeliveryStatus, string> = {
      Pending: 'Đang chờ',
      Succeeded: 'Thành công',
      Failed: 'Thất bại',
      Skipped: 'Đã bỏ qua',
    };
    return labels[status];
  }

  /** Hậu tố class cho thẻ trạng thái, thay cho nzColor mặc định của ng-zorro. */
  statusModifier(status: TEmailDeliveryStatus): string {
    const modifiers: Record<TEmailDeliveryStatus, string> = {
      Pending: 'pending',
      Succeeded: 'success',
      Failed: 'failed',
      Skipped: 'skipped',
    };
    return modifiers[status];
  }

  statusIcon(status: TEmailDeliveryStatus): string {
    const icons: Record<TEmailDeliveryStatus, string> = {
      Pending: 'clock-circle',
      Succeeded: 'check-circle',
      Failed: 'close-circle',
      Skipped: 'minus-circle',
    };
    return icons[status];
  }

  fetchData(): void {
    const { Keyword, Status } = this.searchForm.getRawValue();
    this.isLoading = true;

    this.api
      .EmailDeliveryReport(
        this.pageIndex - 1,
        this.pageSize,
        Keyword.trim(),
        Status
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.isLoading = false;
          this.summary = res.Data?.Summary || this.summary;
          this.dataSource = res.Data?.Page?.DataList || [];
          this.itemCount = res.Data?.Page?.ItemCount || 0;
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
