import { Component, OnInit } from '@angular/core';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../modules';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { TaxDiffCalculatorComponent } from '../tax-diff-calculator/tax-diff-calculator.component';

interface RoomType {
  hour: number;
  night: number;
  day: number;
  extra: number;
}
interface Detail {
  type: string;
  cost: number;
  note: string;
}
interface Result {
  roomName: string;
  details: Detail[];
  minCost: number;
}

@Component({
  selector: 'app-calculating-hotel-fee',
  standalone: true,
  imports: [
    FormsModule,
    NzDatePickerModule,
    NzButtonModule,
    NzFormModule,
    NzCardModule,
    NzTableModule,
    DecimalPipe,
    SlicePipe,
    CommonModule,
    TaxDiffCalculatorComponent,
  ],
  templateUrl: './calculating-hotel-fee.component.html',
  styleUrls: ['./calculating-hotel-fee.component.scss'],
})
export class CalculatingHotelFeeComponent implements OnInit {
  checkin: Date | null = null;
  checkout: Date | null = null;
  results: Result[] = [];

  readonly UNIT = 1000;
  readonly roomTypes: Record<string, RoomType> = {
    'Đơn thường': { hour: 230, night: 500, day: 550, extra: 50 },
    'Đơn VIP': { hour: 260, night: 550, day: 650, extra: 50 },
    'Đôi thường': { hour: 260, night: 550, day: 650, extra: 50 },
    'Đôi VIP': { hour: 350, night: 600, day: 700, extra: 50 },
    'Phòng 3': { hour: 350, night: 700, day: 900, extra: 60 },
    'Phòng 301': { hour: 400, night: 800, day: 1200, extra: 60 },
    '901 (Family)': { hour: 450, night: 1000, day: 1600, extra: 80 },
  };

  ngOnInit() {
    this.checkin = new Date();
  }

  fmtK(vnd: number): string {
    return (vnd / 1000).toLocaleString('vi-VN');
  }

  roundExtraHoursMs(ms: number): number {
    if (ms <= 0) return 0;
    const full = Math.floor(ms / 3600000);
    const remMin = Math.round((ms % 3600000) / 60000);
    return remMin > 10 ? full + 1 : full;
  }

  overlapMs(aS: number, aE: number, bS: number, bE: number): number {
    const s = Math.max(aS, bS);
    const e = Math.min(aE, bE);
    return Math.max(0, e - s);
  }

  calculate(): void {
    if (!this.checkin || !this.checkout) {
      alert('Vui lòng nhập cả check-in và check-out');
      return;
    }
    const checkin = new Date(this.checkin);
    const checkout = new Date(this.checkout);
    if (checkout <= checkin) {
      alert('Ngày giờ không hợp lệ (checkout phải lớn hơn checkin)');
      return;
    }

    const totalMs = checkout.getTime() - checkin.getTime();
    const results: Result[] = [];

    for (const [roomName, p] of Object.entries(this.roomTypes)) {
      const priceHour = p.hour * this.UNIT;
      const priceNight = p.night * this.UNIT;
      const priceDay = p.day * this.UNIT;
      const extraPerHour = p.extra * this.UNIT;

      const details: Detail[] = [];

      // --- 1. Hour-based ---
      const twoH = 2 * 3600000;
      if (totalMs <= twoH) {
        details.push({
          type: `Thuê theo giờ (${p.hour})`,
          cost: priceHour,
          note: `Áp dụng giá gốc 2h = ${p.hour}`,
        });
      } else {
        const extraH = this.roundExtraHoursMs(totalMs - twoH);
        const extraVND = extraH * extraPerHour;
        details.push({
          type: `Thuê theo giờ (${p.hour})`,
          cost: priceHour + extraVND,
          note: `Giá gốc 2h = ${p.hour}, vượt ${extraH}h → phụ thu ${this.fmtK(extraVND)}`,
        });
      }

      // --- 2. Build day/night windows ---
      const dayWindows: { start: Date; end: Date }[] = [];
      const nightWindows: { start: Date; end: Date }[] = [];
      const loopStart = new Date(checkin);
      loopStart.setHours(0, 0, 0, 0);
      loopStart.setDate(loopStart.getDate() - 1);
      const loopEnd = new Date(checkout);
      loopEnd.setHours(0, 0, 0, 0);
      loopEnd.setDate(loopEnd.getDate() + 1);

      for (
        let d = new Date(loopStart);
        d <= loopEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const dayS = new Date(d);
        dayS.setHours(14, 0, 0, 0);
        const dayE = new Date(d);
        dayE.setDate(dayE.getDate() + 1);
        dayE.setHours(12, 0, 0, 0);

        if (
          this.overlapMs(
            checkin.getTime(),
            checkout.getTime(),
            dayS.getTime(),
            dayE.getTime()
          ) > 0
        )
          dayWindows.push({ start: new Date(dayS), end: new Date(dayE) });

        const nightS = new Date(d);
        nightS.setHours(21, 0, 0, 0);
        const nightE = new Date(d);
        nightE.setDate(nightE.getDate() + 1);
        nightE.setHours(12, 0, 0, 0);

        if (
          this.overlapMs(
            checkin.getTime(),
            checkout.getTime(),
            nightS.getTime(),
            nightE.getTime()
          ) > 0
        )
          nightWindows.push({ start: new Date(nightS), end: new Date(nightE) });
      }

      // --- 3. Day-based ---
      let bestDay: Detail | null = null;
      for (let i = 0; i < dayWindows.length; i++) {
        for (let j = i; j < dayWindows.length; j++) {
          const first = dayWindows[i].start;
          const last = dayWindows[j].end;
          const k = j - i + 1;
          const base = k * priceDay;

          const earlyMs = Math.max(0, first.getTime() - checkin.getTime());
          const lateMs = Math.max(0, checkout.getTime() - last.getTime());
          const earlyH = this.roundExtraHoursMs(earlyMs);
          const lateH = this.roundExtraHoursMs(lateMs);
          const feeEarly = earlyH * extraPerHour;
          const feeLate = lateH * extraPerHour;

          const total = base + feeEarly + feeLate;
          const note = `${k} ngày (giá gốc ${this.fmtK(base)}), nhận sớm ${earlyH}h → ${this.fmtK(feeEarly)}, trả muộn ${lateH}h → ${this.fmtK(feeLate)}`;
          if (!bestDay || total < bestDay.cost)
            bestDay = { type: `Thuê theo ngày (${p.day})`, cost: total, note };
        }
      }
      if (bestDay) details.push(bestDay);

      // --- 4. Night-based ---
      let bestNight: Detail | null = null;
      for (let i = 0; i < nightWindows.length; i++) {
        for (let j = i; j < nightWindows.length; j++) {
          const first = nightWindows[i].start;
          const last = nightWindows[j].end;
          const k = j - i + 1;
          const base = k * priceNight;

          const earlyMs = Math.max(0, first.getTime() - checkin.getTime());
          const lateMs = Math.max(0, checkout.getTime() - last.getTime());
          const earlyH = this.roundExtraHoursMs(earlyMs);
          const lateH = this.roundExtraHoursMs(lateMs);
          const feeEarly = earlyH * extraPerHour;
          const feeLate = lateH * extraPerHour;
          const total = base + feeEarly + feeLate;

          if (!bestNight || total < bestNight.cost)
            bestNight = {
              type: `Thuê theo đêm (${p.night})`,
              cost: total,
              note: `${k} đêm (giá gốc ${this.fmtK(base)}), sớm ${earlyH}h → ${this.fmtK(feeEarly)}, muộn ${lateH}h → ${this.fmtK(feeLate)}`,
            };
        }
      }
      if (bestNight) details.push(bestNight);

      // --- 5. Hybrid: overlap night + day ---
      const firstOverlappingNightIndex = nightWindows.findIndex(
        w =>
          this.overlapMs(
            checkin.getTime(),
            checkout.getTime(),
            w.start.getTime(),
            w.end.getTime()
          ) > 0
      );
      if (firstOverlappingNightIndex !== -1) {
        const w = nightWindows[firstOverlappingNightIndex];

        // Early (before 21h)
        const earlyMs = Math.max(0, w.start.getTime() - checkin.getTime());
        const earlyH = this.roundExtraHoursMs(earlyMs);
        const feeEarly = earlyH * extraPerHour;

        // Late (after 12h next day)
        const lateMs = Math.max(0, checkout.getTime() - w.end.getTime());
        const lateH = this.roundExtraHoursMs(lateMs);
        const feeLate = lateH * extraPerHour;

        const total = priceNight + feeEarly + feeLate;
        const note = `1 đêm đầu (${p.night}), sớm ${earlyH}h → ${this.fmtK(feeEarly)}, muộn ${lateH}h → ${this.fmtK(feeLate)}`;
        details.push({
          type: `Đêm đầu + phụ thu`,
          cost: total,
          note,
        });
      }

      // --- Best cost ---
      const minCost = Math.min(...details.map(d => d.cost));
      results.push({ roomName, details, minCost });
    }

    this.results = results;
  }
}
