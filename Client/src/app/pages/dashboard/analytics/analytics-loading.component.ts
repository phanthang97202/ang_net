import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics-loading',
  standalone: true,
  template: `<div class="cards">
      @for (item of [1, 2, 3, 4, 5, 6]; track item) {
        <div class="card"><span></span><strong></strong><span></span></div>
      }
    </div>
    <div class="chart"></div>`,
  styles: [
    `
      .cards {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }
      .card,
      .chart {
        background: var(--admin-surface);
        border: 1px solid var(--admin-border);
        border-radius: var(--admin-radius-lg);
        padding: 18px;
      }
      .card {
        height: 142px;
      }
      span,
      strong {
        display: block;
        height: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
        background: var(--admin-surface-subtle);
      }
      strong {
        width: 55%;
        height: 30px;
      }
      .chart {
        height: 440px;
        background: var(--admin-surface);
      }
      @media (max-width: 1279px) {
        .cards {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 767px) {
        .cards {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
      }
    `,
  ],
})
export class AnalyticsLoadingComponent {}
