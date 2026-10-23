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
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
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
    NzButtonModule,
    NzInputModule,
    NzTableModule,
    BreadcrumbComponent,
  ],
  templateUrl: './movie-view-logs.component.html',
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
