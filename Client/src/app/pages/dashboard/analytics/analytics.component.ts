import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnalyticsLoadingComponent } from './analytics-loading.component';
import { AnalyticsRankingsComponent } from './analytics-rankings.component';
import {
  AnalyticsMetric,
  AnalyticsPoint,
  AnalyticsReport,
} from '../../../services/web-analytics.service';

export const vietnamDay = (date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
export const shiftDay = (day: string, offset: number): string => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzDatePickerModule,
    NzButtonModule,
    NzCheckboxModule,
    BreadcrumbComponent,
    AnalyticsLoadingComponent,
    AnalyticsRankingsComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent {
  private http = inject(HttpClient);
  private destroyed = inject(DestroyRef);
  private requests = new Subject<void>();
  readonly metrics: {
    key: AnalyticsMetric;
    label: string;
    icon: string;
  }[] = [
    {
      key: 'Sessions',
      label: 'Lượt truy cập',
      icon: 'team',
    },
    {
      key: 'Pages',
      label: 'Lượt xem trang',
      icon: 'global',
    },
    {
      key: 'Articles',
      label: 'Mở bài viết',
      icon: 'read',
    },
    {
      key: 'Movies',
      label: 'Mở xem phim',
      icon: 'play-circle',
    },
    {
      key: 'Reels',
      label: 'Lượt xem reels',
      icon: 'video-camera',
    },
  ];
  readonly presets = [
    { days: 1, label: 'Hôm nay' },
    { days: 7, label: '7 ngày' },
    { days: 30, label: '30 ngày' },
  ];
  activePreset = 7;
  from = shiftDay(vietnamDay(), -6);
  to = vietnamDay();
  range: Date[] = [
    new Date(`${this.from}T12:00:00`),
    new Date(`${this.to}T12:00:00`),
  ];
  report: AnalyticsReport | null = null;
  loading = true;
  error = '';
  rangeError = '';
  metric: AnalyticsMetric = 'Sessions';
  compare = false;
  hovered: number | null = null;
  chartPoints: {
    x: number;
    y: number;
    index: number;
    label: string;
    value: number;
  }[] = [];
  currentPath = '';
  previousPath = '';
  areaPath = '';
  yLabels: number[] = [];
  xLabels: { label: string; position: number }[] = [];
  max = 1;

  constructor() {
    this.requests
      .pipe(
        startWith(undefined),
        switchMap(() => {
          this.loading = true;
          this.error = '';
          this.report = null;
          return this.http
            .get<{ Success: boolean; Data: AnalyticsReport }>(
              `${environment.apiUrl}Analytics/Report`,
              {
                params: { from: this.from, to: this.to },
              }
            )
            .pipe(
              map(response => ({
                data: response.Success ? response.Data : null,
                error: response.Success ? '' : 'Không thể tải thống kê.',
              })),
              catchError(error =>
                of({
                  data: null,
                  error:
                    error.status === 403
                      ? 'Bạn chưa có quyền xem thống kê truy cập.'
                      : 'Không thể tải thống kê. Vui lòng thử lại.',
                })
              )
            );
        }),
        takeUntilDestroyed(this.destroyed)
      )
      .subscribe(result => {
        this.loading = false;
        this.report = result.data;
        this.error = result.error;
        if (!this.canCompare(this.metric)) this.compare = false;
        this.draw();
      });
  }

  selectPreset(days: number): void {
    this.activePreset = days;
    this.to = vietnamDay();
    this.from = shiftDay(this.to, 1 - days);
    this.range = [
      new Date(`${this.from}T12:00:00`),
      new Date(`${this.to}T12:00:00`),
    ];
    this.rangeError = '';
    this.refresh();
  }

  changeRange(dates: Date[]): void {
    if (dates.length !== 2) return;
    const format = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const from = format(dates[0]);
    const to = format(dates[1]);
    const days =
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        86_400_000 +
      1;
    if (days < 1 || days > 93 || to > vietnamDay()) {
      this.rangeError = 'Chọn tối đa 93 ngày, không vượt quá hôm nay.';
      return;
    }
    this.rangeError = '';
    this.from = from;
    this.to = to;
    this.activePreset = 0;
    this.refresh();
  }

  disabledDate = (date: Date): boolean => {
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return day > vietnamDay();
  };
  refresh(): void {
    this.requests.next();
  }
  selectMetric(metric: AnalyticsMetric): void {
    this.metric = metric;
    if (!this.canCompare(metric)) this.compare = false;
    this.draw();
  }
  get metricLabel(): string {
    return this.metrics.find(item => item.key === this.metric)!.label;
  }
  get tooltip() {
    return this.chartPoints.find(point => point.index === this.hovered);
  }
  get total(): number {
    return this.report?.Current[this.metric] ?? 0;
  }
  get coverageStart(): string | null {
    return (
      this.report?.Coverage?.[this.metric] ??
      this.report?.CollectionStartedAt ??
      null
    );
  }
  canCompare(metric: AnalyticsMetric): boolean {
    if (!this.report) return false;
    if (this.report.DataQuality?.[metric])
      return this.report.DataQuality[metric]!.CanCompare;
    if (!this.report.Coverage) return this.report.PreviousPeriodComplete;
    const start = this.report.Coverage[metric];
    return (
      !!start &&
      Date.parse(start) <=
        Date.parse(`${this.report.PreviousFrom}T00:00:00+07:00`)
    );
  }
  delta(metric: AnalyticsMetric): string {
    const quality = this.report?.DataQuality?.[metric];
    if (
      !this.report ||
      (quality && quality.Current !== 'complete') ||
      !this.canCompare(metric)
    )
      return '';
    const previous = this.report.Previous[metric];
    const current = this.report.Current[metric];
    if (previous === 0)
      return current === 0 ? 'Không thay đổi' : 'Có phát sinh trong kỳ';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với kỳ trước`;
  }
  trend(metric: AnalyticsMetric): string {
    if (!this.report || !this.canCompare(metric)) return '';
    return this.report.Current[metric] > this.report.Previous[metric]
      ? 'up'
      : this.report.Current[metric] < this.report.Previous[metric]
        ? 'down'
        : '';
  }
  metricValue(metric: AnalyticsMetric): number | string {
    return this.report?.DataQuality?.[metric]?.Current === 'unavailable' &&
      !this.report.Current[metric]
      ? '—'
      : (this.report?.Current[metric] ?? 0);
  }
  displayDate(value: string): string {
    return value.split('-').reverse().join('/');
  }

  draw(): void {
    this.hovered = null;
    this.chartPoints = [];
    if (!this.report) return;
    const report = this.report;
    const points = this.report.Points;
    const covered = (point: AnalyticsPoint) => {
      const hourly = point.Bucket.includes('T');
      const start = Date.parse(
        `${point.Bucket}${hourly ? ':00:00' : 'T00:00:00'}+07:00`
      );
      const end = start + (hourly ? 3_600_000 : 86_400_000);
      return (
        start <= Date.parse(report.GeneratedAt) &&
        ((!!this.coverageStart && end > Date.parse(this.coverageStart)) ||
          point[this.metric] > 0)
      );
    };
    const values = points.map(point =>
      covered(point) && (!point.HasGap || point[this.metric] > 0)
        ? point[this.metric]
        : null
    );
    const previous = this.report.PreviousPoints.map((point, index) =>
      values[index] === null ? null : point[this.metric]
    );
    const peak = Math.max(
      1,
      ...values.map(value => value ?? 0),
      ...(this.compare ? previous.map(value => value ?? 0) : [])
    );
    const magnitude = 10 ** Math.floor(Math.log10(peak / 4));
    this.max = Math.max(4, Math.ceil(peak / 4 / magnitude) * magnitude * 4);
    this.yLabels = [
      this.max,
      this.max * 0.75,
      this.max * 0.5,
      this.max * 0.25,
      0,
    ];
    const x = (index: number) =>
      8 + (index / Math.max(1, points.length - 1)) * 984;
    const y = (value: number) => 226 - (value / this.max) * 210;
    const path = (items: (number | null)[]) =>
      items
        .map((value, i) =>
          value === null
            ? ''
            : `${i === 0 || items[i - 1] === null ? 'M' : 'L'}${x(i)},${y(value)}`
        )
        .join(' ');
    this.currentPath = path(values);
    this.previousPath = this.compare ? path(previous) : '';
    const first = values.findIndex(value => value !== null);
    const last =
      values.length -
      1 -
      [...values].reverse().findIndex(value => value !== null);
    this.areaPath =
      first >= 0
        ? `${this.currentPath} L${x(last)},226 L${x(first)},226 Z`
        : '';
    values.forEach((value, index) => {
      if (value !== null)
        this.chartPoints.push({
          x: x(index),
          y: y(value),
          value,
          index,
          label: points[index].Bucket.includes('T')
            ? `${points[index].Bucket.slice(11)}:00`
            : this.displayDate(points[index].Bucket),
        });
    });
    const labels = [
      ...new Set([
        0,
        Math.round((points.length - 1) * 0.25),
        Math.round((points.length - 1) * 0.5),
        Math.round((points.length - 1) * 0.75),
        points.length - 1,
      ]),
    ];
    this.xLabels = labels.map(index => ({
      position: x(index) / 10,
      label: points[index].Bucket.includes('T')
        ? `${points[index].Bucket.slice(11)}h`
        : points[index].Bucket.slice(5).split('-').reverse().join('/'),
    }));
  }
}
