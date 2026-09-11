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
import {
  SysParameterConfigService,
  SYS_PARAM_CODE,
} from '../../../services';
import { ShiftRoomPrice } from '../shift-report/types/shift-report-type';

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

// 1 cửa sổ thời gian (vd 1 đêm cụ thể: 21h ngày X -> 12h ngày X+1).
interface Window {
  start: number;
  end: number;
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

  // Bảng giá lấy từ tham số hệ thống SHIFT_ROOM_PRICES (từng phòng cụ thể,
  // không còn hardcode theo loại phòng). Rỗng = chưa cấu hình -> không có gì
  // để tính.
  roomPrices: ShiftRoomPrice[] = [];

  constructor(private config: SysParameterConfigService) {}

  ngOnInit() {
    this.checkin = new Date();
    this.config
      .getJson<ShiftRoomPrice[]>(SYS_PARAM_CODE.SHIFT_ROOM_PRICES)
      .subscribe(data => {
        this.roomPrices = Array.isArray(data) ? data : [];
      });
  }

  fmtK(vnd: number): string {
    return (vnd / 1000).toLocaleString('vi-VN');
  }

  // Làm tròn phụ thu theo giờ: mốc 15 phút cho mỗi nấc giờ tròn.
  // 0-15p=0h, 16-75p=1h, 76-135p=2h... Áp dụng cho check-in sớm, check-out
  // muộn, và phần vượt 2h đầu của thuê theo giờ.
  roundExtraHoursMs(ms: number): number {
    if (ms <= 0) return 0;
    const totalMin = Math.round(ms / 60000);
    const fullH = Math.floor(totalMin / 60);
    const remMin = totalMin % 60;
    return remMin > 15 ? fullH + 1 : fullH;
  }

  overlapMs(aS: number, aE: number, bS: number, bE: number): number {
    const s = Math.max(aS, bS);
    const e = Math.min(aE, bE);
    return Math.max(0, e - s);
  }

  // Build danh sách cửa sổ ngày (14h -> 12h trưa hôm sau) và cửa sổ đêm
  // (21h -> 12h trưa hôm sau) có giao với [checkin, checkout], quét rộng ra
  // 1 ngày trước/sau để không bỏ sót cửa sổ ở biên.
  private buildWindows(
    checkin: number,
    checkout: number
  ): { dayWindows: Window[]; nightWindows: Window[] } {
    const dayWindows: Window[] = [];
    const nightWindows: Window[] = [];

    const loopStart = new Date(checkin);
    loopStart.setHours(0, 0, 0, 0);
    loopStart.setDate(loopStart.getDate() - 1);
    const loopEnd = new Date(checkout);
    loopEnd.setHours(0, 0, 0, 0);
    loopEnd.setDate(loopEnd.getDate() + 2);

    for (
      let d = new Date(loopStart);
      d <= loopEnd;
      d.setDate(d.getDate() + 1)
    ) {
      // Phòng ngày: 14h hôm nay -> 12h trưa hôm sau
      const dayS = new Date(d);
      dayS.setHours(14, 0, 0, 0);
      const dayE = new Date(dayS);
      dayE.setDate(dayE.getDate() + 1);
      dayE.setHours(12, 0, 0, 0);
      if (this.overlapMs(checkin, checkout, dayS.getTime(), dayE.getTime()) > 0) {
        dayWindows.push({ start: dayS.getTime(), end: dayE.getTime() });
      }

      // Phòng đêm: 21h hôm nay -> 12h trưa hôm sau
      const nightS = new Date(d);
      nightS.setHours(21, 0, 0, 0);
      const nightE = new Date(nightS);
      nightE.setDate(nightE.getDate() + 1);
      nightE.setHours(12, 0, 0, 0);
      if (
        this.overlapMs(checkin, checkout, nightS.getTime(), nightE.getTime()) > 0
      ) {
        nightWindows.push({ start: nightS.getTime(), end: nightE.getTime() });
      }
    }

    return { dayWindows, nightWindows };
  }

  // Chọn dải k cửa sổ liên tiếp rẻ nhất trong danh sách windows (dùng chung
  // cho cả "theo ngày thuần túy" và "theo đêm thuần túy"). unitPrice là giá
  // của 1 cửa sổ (dayPrice hoặc nightPrice).
  private bestConsecutiveWindows(
    windows: Window[],
    checkin: number,
    checkout: number,
    unitPrice: number,
    extraFee: number,
    label: string
  ): Detail | null {
    let best: Detail | null = null;
    for (let i = 0; i < windows.length; i++) {
      for (let j = i; j < windows.length; j++) {
        const first = windows[i].start;
        const last = windows[j].end;
        const k = j - i + 1;
        const base = k * unitPrice;

        const earlyH = this.roundExtraHoursMs(Math.max(0, first - checkin));
        const lateH = this.roundExtraHoursMs(Math.max(0, checkout - last));
        const feeEarly = earlyH * extraFee;
        const feeLate = lateH * extraFee;
        const total = base + feeEarly + feeLate;

        if (!best || total < best.cost) {
          best = {
            type: label,
            cost: total,
            note: `${k} (giá gốc ${this.fmtK(base)}), nhận sớm ${earlyH}h → ${this.fmtK(feeEarly)}, trả muộn ${lateH}h → ${this.fmtK(feeLate)}`,
          };
        }
      }
    }
    return best;
  }

  // Phương án "đêm + phần dư": khách ở qua đêm (cửa sổ đêm đầu tiên giao với
  // khoảng thuê) rồi ở thêm sau 12h trưa hôm sau. Phần dư được tính bằng
  // CẢ HAI cách - phụ thu theo giờ, hoặc làm tròn thành n ngày trọn (giá
  // ngày) - rồi lấy phương án rẻ hơn, vì n ngày tròn có thể rẻ hơn phụ thu
  // giờ khi khách ở thêm quá lâu (vd trả muộn 10 tiếng thì 1 ngày trọn có
  // thể rẻ hơn phụ thu 10 giờ).
  private nightPlusExtra(
    nightWindows: Window[],
    checkin: number,
    checkout: number,
    nightPrice: number,
    dayPrice: number,
    extraFee: number
  ): Detail | null {
    const idx = nightWindows.findIndex(
      w => this.overlapMs(checkin, checkout, w.start, w.end) > 0
    );
    if (idx === -1) return null;

    const w = nightWindows[idx];
    const earlyMs = Math.max(0, w.start - checkin);
    const earlyH = this.roundExtraHoursMs(earlyMs);
    const feeEarly = earlyH * extraFee;

    const lateMs = Math.max(0, checkout - w.end);

    // Phương án A: đêm + phụ thu giờ thuần túy cho phần dư.
    const lateH_A = this.roundExtraHoursMs(lateMs);
    const totalA = nightPrice + feeEarly + lateH_A * extraFee;

    let total = totalA;
    let note = `1 đêm (${this.fmtK(nightPrice)}), sớm ${earlyH}h → ${this.fmtK(feeEarly)}, muộn ${lateH_A}h → ${this.fmtK(lateH_A * extraFee)}`;

    if (lateMs > 0) {
      // Phương án B: đêm + n ngày trọn (24h/ngày kể từ mốc 12h trưa kết thúc
      // đêm). So cả mức làm tròn xuống (còn dư giờ lẻ) lẫn làm tròn lên
      // (trọn hết) để bắt đúng điểm rẻ nhất.
      const dayMs = 24 * 3600000;
      const nDaysFloor = Math.floor(lateMs / dayMs);
      const remainderMs = lateMs - nDaysFloor * dayMs;
      const optFloor =
        nightPrice +
        feeEarly +
        nDaysFloor * dayPrice +
        this.roundExtraHoursMs(remainderMs) * extraFee;
      const optCeil = nightPrice + feeEarly + (nDaysFloor + 1) * dayPrice;
      const totalB = Math.min(optFloor, optCeil);

      if (totalB < total) {
        total = totalB;
        const nDays = optCeil <= optFloor ? nDaysFloor + 1 : nDaysFloor;
        note = `1 đêm (${this.fmtK(nightPrice)}) + ${nDays} ngày (${this.fmtK(nDays * dayPrice)}), sớm ${earlyH}h → ${this.fmtK(feeEarly)}`;
      }
    }

    return { type: 'Đêm + phụ thu/ngày', cost: total, note };
  }

  calculate(): void {
    if (!this.checkin || !this.checkout) {
      alert('Vui lòng nhập cả check-in và check-out');
      return;
    }
    if (!this.roomPrices.length) {
      alert('Chưa cấu hình bảng giá phòng (tham số hệ thống SHIFT_ROOM_PRICES)');
      return;
    }
    const checkin = new Date(this.checkin).getTime();
    const checkout = new Date(this.checkout).getTime();
    if (checkout <= checkin) {
      alert('Ngày giờ không hợp lệ (checkout phải lớn hơn checkin)');
      return;
    }

    const totalMs = checkout - checkin;
    const twoH = 2 * 3600000;
    const { dayWindows, nightWindows } = this.buildWindows(checkin, checkout);
    const results: Result[] = [];

    for (const p of this.roomPrices) {
      const hourPrice = p.hourPrice ?? 0;
      const dayPrice = p.dayPrice ?? 0;
      const nightPrice = p.nightPrice ?? 0;
      const extraFee = p.extraFee ?? 0;
      const details: Detail[] = [];

      // 1. Thuê theo giờ: giá gốc áp dụng cho 2h đầu, mọi loại phòng.
      if (totalMs <= twoH) {
        details.push({
          type: `Thuê theo giờ (${this.fmtK(hourPrice)})`,
          cost: hourPrice,
          note: `Áp dụng giá gốc 2h = ${this.fmtK(hourPrice)}`,
        });
      } else {
        const extraH = this.roundExtraHoursMs(totalMs - twoH);
        const extraVND = extraH * extraFee;
        details.push({
          type: `Thuê theo giờ (${this.fmtK(hourPrice)})`,
          cost: hourPrice + extraVND,
          note: `Giá gốc 2h = ${this.fmtK(hourPrice)}, vượt ${extraH}h → phụ thu ${this.fmtK(extraVND)}`,
        });
      }

      // 2. Thuê theo ngày thuần túy (14h -> 12h trưa hôm sau).
      const bestDay = this.bestConsecutiveWindows(
        dayWindows,
        checkin,
        checkout,
        dayPrice,
        extraFee,
        `Thuê theo ngày (${this.fmtK(dayPrice)})`
      );
      if (bestDay) details.push(bestDay);

      // 3. Thuê theo đêm thuần túy (21h -> 12h trưa hôm sau).
      const bestNight = this.bestConsecutiveWindows(
        nightWindows,
        checkin,
        checkout,
        nightPrice,
        extraFee,
        `Thuê theo đêm (${this.fmtK(nightPrice)})`
      );
      if (bestNight) details.push(bestNight);

      // 4. Đêm + n ngày tiếp theo (khách ở qua đêm rồi ở thêm).
      const nightPlus = this.nightPlusExtra(
        nightWindows,
        checkin,
        checkout,
        nightPrice,
        dayPrice,
        extraFee
      );
      if (nightPlus) details.push(nightPlus);

      const minCost = Math.min(...details.map(d => d.cost));
      const roomLabel = p.roomType
        ? `Phòng ${p.roomNumber} (${p.roomType})`
        : `Phòng ${p.roomNumber}`;
      results.push({ roomName: roomLabel, details, minCost });
    }

    this.results = results;
  }
}
