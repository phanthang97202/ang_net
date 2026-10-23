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
        <span>Truy cập tháng này</span
        ><strong>{{ value.MonthVisits | number }}</strong>
      </div>
      <div>
        <span>Lượt xem bài viết hiện có</span
        ><strong>{{ value.ArticleViews | number }}</strong>
      </div>
      <div>
        <span>Lượt xem reels hiện có</span
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
