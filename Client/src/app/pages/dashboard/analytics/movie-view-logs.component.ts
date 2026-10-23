import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MovieViewLog } from '../../../services/web-analytics.service';
import { shiftDay, vietnamDay } from './analytics.component';

@Component({
  selector: 'app-movie-view-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzDatePickerModule,
    NzIconModule,
  ],
  template: ` <main class="detail-page" [attr.aria-busy]="loading">
    <header>
      <div>
        <a routerLink="/dashboard/analytics">← Thống kê truy cập</a>
        <h1>Nhật ký mở phim</h1>
        <p>Tài khoản, phim, tập và thời điểm mở trình phát thành công.</p>
      </div>
      <button type="button" (click)="search()" [disabled]="loading">
        <span nz-icon nzType="reload" [nzSpin]="loading"></span> Làm mới
      </button>
    </header>
    <form class="filters" (ngSubmit)="search()">
      <div class="filter-field">
        <span>Khoảng ngày</span
        ><nz-range-picker
          name="range"
          aria-label="Khoảng ngày nhật ký"
          [(ngModel)]="range"
          nzFormat="dd/MM/yyyy"
          [nzAllowClear]="false"></nz-range-picker>
      </div>
      <label class="grow"
        >Tìm kiếm<input
          name="keyword"
          [(ngModel)]="keyword"
          maxlength="200"
          placeholder="Tên phim, tên hoặc mã tài khoản" /></label
      ><button class="primary" type="submit">Lọc nhật ký</button>
    </form>
    <p class="notice">
      Thời gian theo giờ Việt Nam. Bản ghi cũ có thể thiếu thông tin tài khoản,
      tập hoặc nguồn phát. Nhật ký này ghi nhận mở trình phát, chưa đo thời
      lượng xem.
    </p>
    <p *ngIf="error" class="notice error" role="alert">{{ error }}</p>
    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Thời điểm</th>
              <th>Tài khoản</th>
              <th>Phim / tập</th>
              <th>Nguồn phát</th>
              <th>Nguồn dữ liệu</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of rows; trackBy: track">
              <td class="nowrap">{{ time(item.OccurredAt) }}</td>
              <td>
                {{ item.ActorName || item.UserId || 'Chưa có thông tin'
                }}<small *ngIf="item.UserId && item.ActorName">{{
                  item.UserId
                }}</small>
              </td>
              <td>
                <a
                  [routerLink]="['/phim', item.MovieSlug]"
                  target="_blank"
                  rel="noopener"
                  >{{ item.MovieTitle }}</a
                ><small>{{
                  item.EpisodeName ||
                    item.EpisodeSlug ||
                    'Chưa lưu thông tin tập'
                }}</small>
              </td>
              <td>
                {{
                  item.ServerName ||
                    (item.ServerId !== null
                      ? 'Nguồn ' + item.ServerId
                      : 'Chưa có thông tin')
                }}
              </td>
              <td>
                {{
                  item.Source === 'playback'
                    ? 'Ghi nhận trực tiếp'
                    : item.Source === 'audit-legacy'
                      ? 'Nhật ký cũ'
                      : 'Thống kê cũ'
                }}
              </td>
            </tr>
            <tr *ngIf="!rows.length && !loading">
              <td colspan="5" class="empty">
                Chưa có nhật ký trong khoảng thời gian đã chọn.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <div #sentinel class="load-more">
      <span *ngIf="loading" role="status">Đang tải nhật ký…</span
      ><button *ngIf="!loading && nextCursor" type="button" (click)="more()">
        {{ error ? 'Thử tải lại' : 'Xem thêm' }}</button
      ><span *ngIf="!loading && rows.length && !nextCursor"
        >Đã hiển thị hết {{ rows.length | number }} bản ghi.</span
      >
    </div>
  </main>`,
  styleUrl: './analytics-detail.scss',
})
export class MovieViewLogsComponent {
  private http = inject(HttpClient);
  private destroy = inject(DestroyRef);
  private request?: Subscription;
  private observer?: IntersectionObserver;
  private generation = 0;
  rows: MovieViewLog[] = [];
  nextCursor: string | null = null;
  loading = false;
  error = '';
  keyword = '';
  range = [
    new Date(shiftDay(vietnamDay(), -6) + 'T12:00:00'),
    new Date(vietnamDay() + 'T12:00:00'),
  ];
  @ViewChild('sentinel') set sentinel(element: ElementRef<HTMLElement>) {
    this.sentinelElement = element?.nativeElement;
    this.observer?.disconnect();
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting) && !this.error) this.more();
      },
      { rootMargin: '180px' }
    );
    if (element) this.observer.observe(element.nativeElement);
  }
  constructor() {
    this.destroy.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = undefined;
      this.sentinelElement = undefined;
      this.request?.unsubscribe();
    });
    this.search();
  }
  time(value: string): string {
    return new Date(value).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
    });
  }
  track(_: number, item: MovieViewLog): string {
    return item.EventId;
  }
  search(): void {
    this.generation++;
    this.request?.unsubscribe();
    this.loading = false;
    this.rows = [];
    this.nextCursor = null;
    this.fetch();
  }
  more(): void {
    if (!this.loading && this.nextCursor) this.fetch(this.nextCursor);
  }
  private fetch(cursor?: string): void {
    if (this.range.length !== 2) {
      this.error = 'Chọn đầy đủ khoảng ngày.';
      return;
    }
    const format = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-');
    const from = format(this.range[0]);
    const to = format(this.range[1]);
    const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
    if (days < 1 || days > 93 || to > vietnamDay()) {
      this.error = 'Chọn tối đa 93 ngày, không vượt quá hôm nay.';
      return;
    }
    this.loading = true;
    this.error = '';
    const generation = this.generation;
    let params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('keyword', this.keyword.trim())
      .set('pageSize', 30);
    if (cursor) params = params.set('cursor', cursor);
    this.request = this.http
      .get<{
        Success: boolean;
        Data: { Items: MovieViewLog[]; NextCursor: string | null };
      }>(environment.apiUrl + 'MovieViewLogs', { params })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: response => {
          if (generation !== this.generation) return;
          this.loading = false;
          if (!response.Success || !response.Data) {
            this.error = 'Không thể tải nhật ký.';
            return;
          }
          const ids = new Set(this.rows.map(row => row.EventId));
          this.rows = [
            ...this.rows,
            ...response.Data.Items.filter(row => !ids.has(row.EventId)),
          ];
          this.nextCursor =
            response.Data.NextCursor === cursor
              ? null
              : response.Data.NextCursor;
          // Keep loading while a short result does not fill the viewport.
          if (this.nextCursor && this.observer) {
            this.observer.disconnect();
            queueMicrotask(() => {
              if (this.sentinelElement)
                this.observer?.observe(this.sentinelElement);
            });
          }
        },
        error: () => {
          if (generation === this.generation) {
            this.loading = false;
            this.error = 'Không thể tải nhật ký. Vui lòng thử lại.';
          }
        },
      });
  }
  private sentinelElement?: HTMLElement;
}
