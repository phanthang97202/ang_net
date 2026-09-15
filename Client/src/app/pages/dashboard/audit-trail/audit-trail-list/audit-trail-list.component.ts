import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
} from '../../../../services';
import { IAuditTrail } from '../../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { NonNullableFormBuilder } from '@angular/forms';
import { AuditTrailLevelType, AuditTrailTypeType } from '../../../../types';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './audit-trail-list.component.html',
  styleUrls: ['./audit-trail-list.component.scss'],
})
export class AuditTrailComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private loadingService = inject(LoadingService);
  private fb = inject(NonNullableFormBuilder);

  dataSource: IAuditTrail[] = [];

  // Phân trang phía server: tổng số bản ghi do API trả về, không suy ra được từ
  // dataSource (chỉ chứa đúng một trang).
  pageIndex = 1; // nz-table đếm từ 1, API đếm từ 0
  pageSize = 20;
  total = 0;
  isLoading = false;

  levelOptions: AuditTrailLevelType[] = [
    'TRACE',
    'DEBUG',
    'INFORMATION',
    'WARNING',
    'ERROR',
    'CRITICAL',
  ];
  trailTypeOptions: AuditTrailTypeType[] = [
    'POST',
    'PUT',
    'DELETE',
    'GET',
    'PATCH',
  ];

  searchForm = this.fb.group({
    Keyword: this.fb.control(''),
    Level: this.fb.control(''),
    TrailType: this.fb.control(''),
  });

  // Bản ghi đang xem chi tiết; null = đóng popup.
  detailRow: IAuditTrail | null = null;

  ngOnInit(): void {
    this.fetchData();
  }

  private fetchData(): void {
    const raw = this.searchForm.getRawValue();
    // nz-select nzAllowClear set null khi xoá lựa chọn -> ép về '' để query
    // không mang chuỗi "null".
    const keyword = raw.Keyword || '';
    const level = raw.Level || '';
    const trailType = raw.TrailType || '';

    this.setLoading(true);
    this.api
      .AuditTrailSearch({
        pageIndex: this.pageIndex - 1,
        pageSize: this.pageSize,
        keyword,
        level,
        trailType,
      })
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
        complete: () => this.setLoading(false),
      });
  }

  handleSearch(): void {
    // Lọc mới thì phải về trang 1: giữ nguyên trang hiện tại có thể rơi vào
    // vùng không còn bản ghi nào và hiện ra bảng trống.
    this.pageIndex = 1;
    this.fetchData();
  }

  handleResetSearch(): void {
    this.searchForm.reset({ Keyword: '', Level: '', TrailType: '' });
    this.pageIndex = 1;
    this.fetchData();
  }

  handlePageIndexChange(index: number): void {
    this.pageIndex = index;
    this.fetchData();
  }

  handlePageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchData();
  }

  handleOpenDetail(data: IAuditTrail): void {
    this.detailRow = data;
  }

  handleCloseDetail(): void {
    this.detailRow = null;
  }

  // JSON trong OldValues/NewValues được backend serialize một dòng; xuống dòng +
  // thụt lề để đọc được trong popup. Chuỗi không phải JSON thì trả nguyên văn.
  formatJson(value: string): string {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  private setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
    this.loadingService.setLoading(isLoading);
  }

  private handleApiError(err: any): void {
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }
}
