import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AnalyticsTop } from '../../../services/web-analytics.service';

@Component({
  selector: 'app-analytics-rankings',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './analytics-rankings.component.html',
  styleUrl: './analytics-rankings.component.scss',
})
export class AnalyticsRankingsComponent {
  @Input() articles: AnalyticsTop[] = [];
  @Input() movies: AnalyticsTop[] = [];
}
