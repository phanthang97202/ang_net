import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AnalyticsLifetime } from '../../../services/web-analytics.service';

@Component({
  selector: 'app-analytics-lifetime',
  standalone: true,
  imports: [CommonModule],
  template: `<section
    *ngIf="data as value"
    aria-label="Số liệu lũy kế"
    class="lifetime">
    <div>
      <h2>Lũy kế và dữ liệu lịch sử</h2>
      <p>Toàn bộ dữ liệu đã lưu, không thay đổi theo bộ lọc ngày bên dưới.</p>
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
  styles: [
    `
      .lifetime {
        background: white;
        border: 1px solid var(--admin-border, #e2e8f0);
        border-radius: 12px;
        padding: 20px 22px;
        margin-bottom: 22px;
      }
      h2 {
        font-size: 15px;
        font-weight: 650;
        margin: 0;
        color: inherit;
      }
      p {
        color: #667085;
        font-size: 12px;
        margin: 5px 0 0;
        line-height: 1.7;
      }
      .totals {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 18px;
        margin-top: 18px;
      }
      .totals span {
        font-size: 11px;
        color: #667085;
        display: block;
        min-height: 32px;
      }
      .totals strong {
        display: block;
        font-size: 22px;
        font-weight: 650;
        margin-top: 7px;
      }
      .note {
        border-top: 1px solid #edf0f5;
        padding-top: 12px;
        margin-top: 16px;
        color: #667085;
      }
      @media (max-width: 1023px) {
        .totals {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 767px) {
        .lifetime {
          padding: 16px;
        }
        .totals {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
      }
    `,
  ],
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
