import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { AnalyticsReconciliation } from '../../../services/web-analytics.service';

@Component({
  selector: 'app-analytics-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzIconModule,
    NzButtonModule,
    BreadcrumbComponent,
  ],
  templateUrl: './analytics-history.component.html',
  styleUrl: './analytics-detail.scss',
})
export class AnalyticsHistoryComponent {
  private http = inject(HttpClient);
  private destroy = inject(DestroyRef);
  plan: AnalyticsReconciliation | null = null;
  loading = false;
  importing = false;
  error = '';
  success = '';
  constructor() {
    this.load();
  }
  get canImport(): boolean {
    return (
      !!this.plan &&
      (!this.plan.MovieImportedAt ||
        (!this.plan.RedisSnapshotExists && this.plan.RedisAvailable))
    );
  }
  time(value: string): string {
    return new Date(value).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
    });
  }
  load(): void {
    if (this.loading || this.importing) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    this.http
      .get<{ Success: boolean; Data: AnalyticsReconciliation }>(
        environment.apiUrl + 'AnalyticsHistory'
      )
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: response => {
          this.loading = false;
          this.plan = response.Success ? response.Data : null;
          if (!this.plan) this.error = 'Không thể tải bản đối soát.';
        },
        error: () => {
          this.loading = false;
          this.error = 'Không thể tải bản đối soát. Vui lòng thử lại.';
        },
      });
  }
  apply(): void {
    if (!this.plan || !this.canImport || this.importing || this.loading) return;
    this.importing = true;
    this.error = '';
    this.success = '';
    this.http
      .post<{
        Success: boolean;
        Data: AnalyticsReconciliation;
        ErrorMessage?: string;
      }>(environment.apiUrl + 'AnalyticsHistory/Import', {
        PlanToken: this.plan.PlanToken,
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: response => {
          this.importing = false;
          if (response.Success) {
            this.plan = response.Data;
            this.success =
              'Đã nhập dữ liệu lịch sử và giữ nguyên các bản ghi gốc.';
          } else
            this.error = response.ErrorMessage || 'Chưa nhập được dữ liệu.';
        },
        error: (error: HttpErrorResponse) => {
          this.importing = false;
          this.error =
            error.status === 409
              ? 'Nguồn đã thay đổi. Hãy tải lại bản đối soát trước khi nhập.'
              : 'Chưa hoàn tất nhập dữ liệu. Bạn có thể tải lại và tiếp tục; bản ghi đã nhập sẽ không bị nhân đôi.';
          if (error.status === 409) this.plan = null;
        },
      });
  }
}
