import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { EMPTY, Subject, catchError, map, of, switchMap } from 'rxjs';
import { endOfDay, format, startOfMonth } from 'date-fns';
import { ShiftReportService } from '../shift-report/services/shift-report.service';
import { AuthService } from '../../../services';
import {
  ShiftRentalDay,
  ShiftRentalQuery,
  ShiftRentalStatistics,
} from '../shift-report/types/shift-report-type';

@Component({
  selector: 'app-shift-rental-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzSelectModule,
    NzIconModule,
  ],
  templateUrl: './shift-rental-statistics.component.html',
  styleUrl: './shift-rental-statistics.component.scss',
})
export class ShiftRentalStatisticsComponent implements OnInit {
  private api = inject(ShiftReportService);
  private auth = inject(AuthService);
  private destroy = inject(DestroyRef);
  private requests = new Subject<ShiftRentalQuery | null>();
  range = [startOfMonth(new Date()), new Date()];
  receptionist: string | null = null;
  receptionists: string[] = [];
  data: ShiftRentalStatistics | null = null;
  loading = false;
  error = '';
  mode: 'count' | 'share' = 'count';
  chartType: 'bar' | 'line' | 'area' = 'line';
  selectedIndex = 0;
  // Tỷ trọng ngày/đêm của cả kỳ, chỉ tính trên những ngày có đủ 2 ca.
  share: { day: number; night: number } | null = null;
  private countAxisMax = 4;
  private today = format(new Date(), 'yyyy-MM-dd');
  disabledDate = (date: Date): boolean => date > endOfDay(new Date());

  // Khung cuộn mở ở đầu kỳ; cuộn tới ngày đang chọn (ngày gần nhất có báo cáo).
  @ViewChild('chartScroll') set chartScroll(
    ref: ElementRef<HTMLElement> | undefined
  ) {
    if (!ref || !this.data) return;
    const el = ref.nativeElement;
    const column = el.scrollWidth / this.data.Days.length;
    el.scrollLeft = (this.selectedIndex + 1) * column - el.clientWidth;
  }

  constructor() {
    this.requests
      .pipe(
        switchMap(query =>
          query === null
            ? EMPTY
            : this.api.getRentalStatistics(query).pipe(
                map(data => ({ data, error: '' })),
                catchError((err: HttpErrorResponse) =>
                  of({
                    data: null,
                    error:
                      (err.status === 400 && err.error?.message) ||
                      'Không thể tải thống kê thuê phòng. Vui lòng thử lại.',
                  })
                )
              )
        ),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe(result => {
        this.loading = false;
        this.error = result.error;
        this.data = result.data;
        if (result.data) {
          this.countAxisMax = this.calculateAxisMax(result.data.Days);
          this.receptionists = result.data.Receptionists;
          this.selectedIndex = result.data.Days.reduce(
            (last, day, index) =>
              day.DayReports + day.NightReports + day.OtherReports > 0
                ? index
                : last,
            0
          );
          this.share = this.calculateShare(result.data.Days);
          // Mỗi lễ tân thường chỉ trực 1 ca/ngày nên tỷ trọng ca của riêng
          // một người không có ý nghĩa.
          if (result.data.ReceptionistName) this.mode = 'count';
        }
      });
  }
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (
      !this.auth.isLoggedIn() ||
      !this.auth.hasPermission('rentalstatistics.view')
    ) {
      this.invalidate('Bạn không có quyền xem thống kê thuê phòng.');
      return;
    }
    const dates = this.range;
    if (
      dates?.length !== 2 ||
      dates.some(
        date => !(date instanceof Date) || !Number.isFinite(date.getTime())
      )
    ) {
      this.invalidate('Chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
      return;
    }
    const fromDate = format(dates[0], 'yyyy-MM-dd');
    const toDate = format(dates[1], 'yyyy-MM-dd');
    const days = (Date.parse(toDate) - Date.parse(fromDate)) / 86400000 + 1;
    if (days < 1 || days > 93) {
      this.invalidate('Chọn khoảng ngày hợp lệ, tối đa 93 ngày.');
      return;
    }
    this.loading = true;
    this.error = '';
    this.data = null;
    this.requests.next({
      fromDate,
      toDate,
      receptionistName: this.receptionist || undefined,
    });
  }
  private invalidate(message: string): void {
    // Cancel an in-flight valid request as well as hiding its old result.
    this.requests.next(null);
    this.loading = false;
    this.data = null;
    this.error = message;
  }
  reset(): void {
    this.range = [startOfMonth(new Date()), new Date()];
    this.receptionist = null;
    this.load();
  }
  setMode(mode: 'count' | 'share'): void {
    this.mode = mode;
    // Hai đường tỷ trọng luôn đối xứng qua 50% nên chế độ % chỉ dùng cột/miền chồng.
    if (mode === 'share' && this.chartType === 'line') this.chartType = 'area';
  }
  percent(count: number, total: number): number | null {
    return total > 0 ? (count * 100) / total : null;
  }
  // Thiếu 1 ca thì ca còn lại luôn thành 100%, nên chỉ tính tỷ trọng khi đủ 2 ca.
  hasShare(day: ShiftRentalDay): boolean {
    return (
      day.DayReports > 0 &&
      day.NightReports > 0 &&
      day.DayRentals + day.NightRentals > 0
    );
  }
  private calculateShare(
    days: ShiftRentalDay[]
  ): { day: number; night: number } | null {
    const complete = days.filter(day => day.DayReports && day.NightReports);
    const dayRentals = complete.reduce((sum, day) => sum + day.DayRentals, 0);
    const total = complete.reduce(
      (sum, day) => sum + day.DayRentals + day.NightRentals,
      0
    );
    if (!total) return null;
    const day = (dayRentals * 100) / total;
    return { day, night: 100 - day };
  }
  get axisMax(): number {
    return this.mode === 'share' ? 100 : this.countAxisMax;
  }
  private calculateAxisMax(days: ShiftRentalDay[]): number {
    const max = Math.max(
      1,
      ...days.map(day => Math.max(day.DayRentals, day.NightRentals))
    );
    const raw = max / 4;
    const power = 10 ** Math.floor(Math.log10(raw));
    const step = Math.max(
      1,
      ([1, 2, 5, 10].find(value => value * power >= raw) || 10) * power
    );
    return step * 4;
  }
  get ticks(): number[] {
    return [0, 1, 2, 3, 4].map(index => (this.axisMax * index) / 4);
  }
  height(day: ShiftRentalDay, shift: 'day' | 'night'): number {
    const count = shift === 'day' ? day.DayRentals : day.NightRentals;
    if (this.mode === 'count') return (count * 100) / this.axisMax;
    return this.hasShare(day)
      ? (count * 100) / (day.DayRentals + day.NightRentals)
      : 0;
  }
  get selected(): ShiftRentalDay | null {
    return this.data?.Days[this.selectedIndex] || null;
  }
  hasPoint(day: ShiftRentalDay, shift: 'day' | 'night'): boolean {
    return this.mode === 'share'
      ? this.hasShare(day)
      : (shift === 'day' ? day.DayReports : day.NightReports) > 0;
  }
  linePath(shift: 'day' | 'night', area = false): string {
    // Ở chế độ %, miền ca đêm chồng lên ca ngày: từ đường ca ngày lên mốc 100%.
    const stacked = shift === 'night' && this.mode === 'share';
    const base = stacked ? 0 : 240;
    const segments: string[] = [];
    let points: { x: number; y: number }[] = [];
    const flush = () => {
      if (!points.length) return;
      const path = points
        .map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`)
        .join(' ');
      segments.push(
        area
          ? `${path} L${points[points.length - 1].x},${base} L${points[0].x},${base} Z`
          : path
      );
      points = [];
    };
    this.data?.Days.forEach((day, index) => {
      // A missing shift is a gap; a recorded zero stays on the baseline.
      if (!this.hasPoint(day, shift)) {
        flush();
        return;
      }
      const height = this.height(day, shift) * 2.4;
      points.push({
        x: (index + 0.5) * 58,
        y: stacked ? height : 240 - height,
      });
    });
    flush();
    return segments.join(' ');
  }
  coverageLabel(day: ShiftRentalDay): string {
    if (!day.DayShiftReported && !day.NightShiftReported) return '—';
    // Ca của hôm nay có thể chưa kết thúc nên chưa tính là thiếu.
    return day.Date < this.today &&
      (!day.DayShiftReported || !day.NightShiftReported)
      ? 'Thiếu ca'
      : '';
  }
  describe(day: ShiftRentalDay): string {
    const shift = (rentals: number, reports: number, reported: boolean) =>
      reports
        ? rentals + ' lượt'
        : reported
          ? 'do lễ tân khác trực'
          : 'chưa có báo cáo';
    return `${day.Date}: Ca ngày ${shift(day.DayRentals, day.DayReports, day.DayShiftReported)}, Ca đêm ${shift(day.NightRentals, day.NightReports, day.NightShiftReported)}`;
  }
}
