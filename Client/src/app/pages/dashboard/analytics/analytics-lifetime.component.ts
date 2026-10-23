import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AnalyticsLifetime } from '../../../services/web-analytics.service';

@Component({
  selector: 'app-analytics-lifetime',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  template: `<section
    *ngIf="data as value"
    aria-label="Số liệu lũy kế"
    class="lifetime">
    <div>
      <h2><span nz-icon nzType="history"></span>Lũy kế và dữ liệu lịch sử</h2>
      <p>Toàn bộ dữ liệu đã lưu, không thay đổi theo bộ lọc ngày.</p>
    </div>
    <div class="totals">
      <div>
        <span>{{
          value.LegacyWebsiteMerged
            ? 'Truy cập kế thừa + phát sinh mới'
            : 'Phiên truy cập DB đã ghi nhận'
        }}</span
        ><strong>{{ value.TotalVisits | number }}</strong>
      </div>
      <div>
        <span>Phiên tháng này đã ghi nhận</span
        ><strong>{{ value.MonthVisits | number }}</strong>
      </div>
      <div>
        <span>Tổng lượt xem bài viết</span
        ><strong>{{ value.ArticleViews | number }}</strong>
      </div>
      <div>
        <span>Tổng lượt xem reels</span
        ><strong>{{ value.ReelViews | number }}</strong>
      </div>
      <div>
        <span>Tổng lượt mở phim đã lưu</span
        ><strong>{{ value.MovieOpens | number }}</strong>
      </div>
    </div>
    <p *ngIf="!value.LegacyWebsiteImported" class="note">
      Bộ đếm website cũ chưa được lưu vào DB. Số truy cập hiện tại chỉ gồm phần
      đã ghi nhận; có thể kiểm tra tại mục Đối soát dữ liệu lịch sử.
    </p>
    <p class="note" *ngIf="value.DetailedFrom">
      Tháng này tính phiên theo giờ Việt Nam từ dữ liệu chi tiết đã ghi nhận. Số
      dư lịch sử không phân bổ vào ngày/tháng; bộ đếm cũ theo tab không dùng để
      so sánh với phiên mới.
    </p>
    <p class="note" *ngIf="value.PendingBalances">
      {{ value.PendingBalances }} số dư lịch sử cần đối soát, đang giữ riêng và
      không cộng vào tổng.
    </p>
    <p
      *ngIf="value.LegacyWebsiteImported && !value.LegacyWebsiteMerged"
      class="note">
      Số truy cập cũ được giữ riêng do chưa xác định được phần chồng lấn. Xem số
      tổng và từng tháng tại mục Đối soát dữ liệu lịch sử.
    </p>
    <p *ngIf="value.LegacyWebsiteMerged && value.LegacyCapturedAt" class="note">
      Đã kế thừa bộ đếm website cũ tại {{ time(value.LegacyCapturedAt) }}. Phần
      chi tiết theo giờ/ngày chỉ có từ lúc bắt đầu ghi sự kiện.
    </p>
  </section>`,
  styleUrl: './analytics-lifetime.component.scss',
})
export class AnalyticsLifetimeComponent {
  @Input() data?: AnalyticsLifetime;
  time(value: string): string {
    return new Date(value).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
    });
  }
}
