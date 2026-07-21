import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, LoadingService, ShowErrorService } from '../../services';

// ── Model ──────────────────────────────────────────────
export interface Topic {
  id: string;
  name: string;
}

@Component({
  selector: 'app-topic-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topic-nav.component.html',
  styleUrls: ['./topic-nav.component.scss'],
})
export class TopicNavComponent implements OnInit {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  topics: Topic[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.isLoading = true;
    this.apiService.GetAllActiveNewsCategory().subscribe({
      next: res => {
        this.topics = (res.DataList || []).map(category => ({
          id: category.NewsCategoryId,
          name: category.NewsCategoryName,
        }));
        this.isLoading = false;
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        this.isLoading = false;
        throw new Error(err);
      },
    });
  }

  trackById(_: number, topic: Topic): string {
    return topic.id;
  }
}
