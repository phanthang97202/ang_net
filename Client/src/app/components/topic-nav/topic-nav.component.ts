import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ApiService, LoadingService, ShowErrorService } from '../../services';

// ── Model ──────────────────────────────────────────────
export interface Topic {
  id: number | string;
  slug: string;
  name: string;
  emoji: string; // icon hiển thị (emoji hoặc có thể thay bằng iconUrl)
  postCount: number;
}

@Component({
  selector: 'app-topic-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topic-nav.component.html',
  styleUrls: ['./topic-nav.component.scss'],
})
export class TopicNavComponent implements OnInit {
  private http = inject(HttpClient);
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);
  loadingService = inject(LoadingService);
  topics: Topic[] = [];

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    // ── Gọi API thật ──────────────────────────────────────
    // Thay URL bên dưới bằng endpoint thực của bạn
    // this.http.get<Topic[]>('/api/topics')
    //   .pipe(finalize(() => (this.isLoading = false)))
    //   .subscribe({
    //     next: (data) => (this.topics = data),
    //     error: (err) => console.error('Failed to load topics', err),
    //   });
    this.loadingService.setLoading(true);
    this.apiService
      .SearchNews(0, 10, '', '', '')
      .pipe()
      .subscribe({
        next: res => {
          this.lstNews = res.objResult.DataList;
          this.loadingService.setLoading(false);
        },
        error: err => {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
          this.loadingService.setLoading(false);
          throw new Error(err);
        },
      });
  }

  trackById(_: number, topic: Topic): number | string {
    return topic.id;
  }
}
