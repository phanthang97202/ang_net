import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { environment } from '../../../../environments/environment';
import { AnalyticsReconciliation } from '../../../services/web-analytics.service';

@Component({
  selector: 'app-analytics-history',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule],
  template: ` <main class="detail-page" [attr.aria-busy]="loading || importing">
    <header>
      <div>
        <a routerLink="/dashboard/analytics">← Thống kê truy cập</a>
        <h1>Đối soát dữ liệu lịch sử</h1>
        <p>Kiểm tra nguồn, mốc thời gian và phần chồng lấn trước khi nhập.</p>
      </div>
      <button type="button" (click)="load()" [disabled]="loading || importing">
        <span nz-icon nzType="reload" [nzSpin]="loading"></span> Tải lại đối
        soát
      </button>
    </header>
    <p *ngIf="loading" class="notice" role="status">
      Đang kiểm tra dữ liệu lịch sử…
    </p>
    <p *ngIf="error" class="notice error" role="alert">{{ error }}</p>
    <p *ngIf="success" class="notice success" role="status">{{ success }}</p>
    <ng-container *ngIf="plan as data">
      <section class="panel">
        <h2>Phạm vi nhập</h2>
        <p>
          Nhập nhật ký mở phim trước
          <strong>{{ time(data.AnalyticsStartedAt) }}</strong
          >. Từ mốc này trở đi, dùng dữ liệu sự kiện đã ghi nhận; các log trùng
          giai đoạn chỉ dùng để đối soát.
        </p>
        <p>
          Bản ghi gốc được giữ nguyên. Nhập lại cùng bản ghi không tạo thêm lượt
          xem. Thông tin tài khoản, tập hoặc nguồn chưa từng lưu sẽ để trống.
        </p>
        <p *ngIf="data.MovieImportedAt">
          Lần nhập gần nhất: <strong>{{ time(data.MovieImportedAt) }}</strong
          >.
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nguồn</th>
                <th>Số lượng</th>
                <th>Cách xử lý</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nhật ký phim trước mốc thống kê</td>
                <td>{{ data.AuditBeforeAnalytics | number }}</td>
                <td>Nhập theo mã nhật ký gốc, chống trùng</td>
              </tr>
              <tr>
                <td>Nhật ký phim trong giai đoạn đã có sự kiện</td>
                <td>{{ data.AuditOverlappingAnalytics | number }}</td>
                <td>Giữ để kiểm tra, không cộng thêm</td>
              </tr>
              <tr>
                <td>Log phát phim thiếu định danh</td>
                <td>{{ data.UnrecognisedAuditRows | number }}</td>
                <td>Giữ nguyên để kiểm tra, không tự suy diễn</td>
              </tr>
              <tr>
                <td>Bản ghi trong bảng phim riêng</td>
                <td>{{ data.ExistingMovieRows | number }}</td>
                <td>Nguồn thống kê phim hiện tại</td>
              </tr>
              <tr>
                <td>Lượt xem bài viết tại mốc chuyển đổi</td>
                <td>{{ data.ArticleCounterSnapshot | number }}</td>
                <td>Đã giữ bộ đếm gốc trong DB</td>
              </tr>
              <tr>
                <td>Lượt xem reels tại mốc chuyển đổi</td>
                <td>{{ data.ReelCounterSnapshot | number }}</td>
                <td>Đã giữ bộ đếm gốc trong DB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <h2>Bộ đếm truy cập cũ</h2>
        <p *ngIf="data.RedisSnapshotExists">
          Đã lưu vào DB lúc {{ time(data.LegacyCapturedAt!) }}. Các lần xem
          thống kê sau không cần đọc Redis.
        </p>
        <p *ngIf="!data.RedisSnapshotExists && data.RedisAvailable">
          Đọc được nguồn cũ. Khi nhập, hệ thống lưu số liệu kèm mốc thời gian
          vào DB.
        </p>
        <p *ngIf="!data.RedisAvailable" class="notice">{{ data.RedisError }}</p>
        <p>
          Số tổng và số tháng được giữ đúng mức chi tiết đã lưu. Nếu không xác
          định được phần chồng lấn, số cũ được giữ riêng, không tự cộng vào tổng
          mới.
        </p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kỳ</th>
                <th>Lượt truy cập đã lưu</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of data.WebsiteValues">
                <td>{{ item.Period || 'Tổng theo bộ đếm cũ' }}</td>
                <td>{{ item.Value | number }}</td>
              </tr>
              <tr *ngIf="!data.WebsiteValues.length">
                <td colspan="2" class="empty">
                  Nguồn cũ chưa có số liệu đọc được.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <footer>
        <p>
          Bản đối soát: {{ time(data.GeneratedAt) }}. Nếu nguồn thay đổi, cần
          tải lại trước khi nhập.
        </p>
        <button
          type="button"
          class="primary"
          [disabled]="loading || importing || !canImport"
          (click)="apply()">
          <span nz-icon nzType="import" [nzSpin]="importing"></span>
          {{ importing ? 'Đang nhập…' : 'Nhập theo bản đối soát này' }}
        </button>
      </footer>
    </ng-container>
  </main>`,
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
