import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { shiftDay, vietnamDay } from './analytics.component';

interface Count { Kind: string; Count: number }
interface MusicReport {
  Counts: Count[]; Users: number; UniqueSongs: number; Collections: { CollectionId: string; Name: string }[];
  Songs: { Provider: string; TrackId: string; Title: string; Count: number }[];
  Keywords: { Provider: string; Keyword: string; Count: number }[];
  Days: { Day: string; Kind: string; Count: number }[];
  Recent: { EventId: string; OccurredAt: string; Kind: string; Provider: string; Title: string; Keyword: string; UserName: string | null }[];
}

@Component({
  selector: 'app-music-analytics', standalone: true,
  imports: [CommonModule, FormsModule, NzButtonModule, NzDatePickerModule, NzIconModule, BreadcrumbComponent],
  templateUrl: './music-analytics.component.html', styleUrl: './music-analytics.component.scss',
})
export class MusicAnalyticsComponent {
  private readonly http = inject(HttpClient);
  private readonly destroy = inject(DestroyRef);
  private generation = 0;
  range = [new Date(shiftDay(vietnamDay(), -6) + 'T12:00:00'), new Date(vietnamDay() + 'T12:00:00')];
  provider = '';
  collectionId = '';
  collections: { CollectionId: string; Name: string }[] = [];
  loading = false;
  error = '';
  report: MusicReport | null = null;
  points: { day: string; searches: number; plays: number }[] = [];

  constructor() { this.search(); }
  count(kind: string): number { return this.report?.Counts.find(x => x.Kind === kind)?.Count ?? 0; }
  get maxPoint(): number { return Math.max(1, ...this.points.flatMap(p => [p.searches, p.plays])); }
  label(kind: string): string {
    return ({ search: 'Tìm kiếm', search_error: 'Lỗi tìm kiếm', click: 'Chọn bài', play: 'Phát thành công', play_error: 'Lỗi phát' } as Record<string, string>)[kind] ?? kind;
  }
  time(value: string): string { return new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }); }
  search(): void {
    if (this.range?.length !== 2 || !this.range[0] || !this.range[1]) { this.error = 'Chọn đầy đủ khoảng ngày.'; return; }
    const format = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    const from = format(this.range[0]), to = format(this.range[1]);
    const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
    if (days < 1 || days > 93 || to > vietnamDay()) { this.error = 'Chọn tối đa 93 ngày, không vượt quá hôm nay.'; return; }
    const generation = ++this.generation;
    this.loading = true; this.error = ''; this.report = null;
    const params = new HttpParams().set('from', from).set('to', to).set('provider', this.provider).set('collectionId', this.collectionId);
    this.http.get<{ Success: boolean; Data: MusicReport }>(environment.apiUrl + 'MusicAnalytics/Report', { params })
      .pipe(takeUntilDestroyed(this.destroy)).subscribe({
        next: result => {
          if (generation !== this.generation) return;
          this.loading = false;
          if (!result.Success || !result.Data) { this.error = 'Không thể tải thống kê.'; return; }
          this.report = result.Data;
          this.collections = result.Data.Collections;
          const points = new Map<string, { day: string; searches: number; plays: number }>();
          for (let i = 0; i < days; i++) {
            const day = shiftDay(from, i);
            points.set(day, { day, searches: 0, plays: 0 });
          }
          for (const row of result.Data.Days) {
            const point = points.get(row.Day.slice(0, 10));
            if (point && row.Kind === 'search') point.searches = row.Count;
            if (point && row.Kind === 'play') point.plays = row.Count;
          }
          this.points = [...points.values()];
        },
        error: () => { if (generation === this.generation) { this.loading = false; this.error = 'Không thể tải thống kê. Vui lòng thử lại.'; } },
      });
  }
}
