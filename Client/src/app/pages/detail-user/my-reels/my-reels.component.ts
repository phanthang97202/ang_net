import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { finalize } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { IReelDto } from '../../../interfaces/reel';

@Component({
  selector: 'app-my-reels',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, NzIconModule],
  templateUrl: './my-reels.component.html',
  styleUrls: [
    '../my-posts/my-posts.component.scss',
    './my-reels.component.scss',
  ],
})
export class MyReelsComponent implements OnInit {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  reels: IReelDto[] = [];
  loading = false;
  failed = false;
  hasMore = true;
  private cursor: string | null = null;

  ngOnInit(): void {
    this.loadMore();
  }

  cover(reel: IReelDto): string {
    return (
      reel.CoverUrl ||
      (reel.MediaType === 'Image' ? reel.Media[0]?.MediaUrl : '') ||
      ''
    );
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    this.failed = false;
    this.api
      .MyReels(12, this.cursor)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: response => {
          if (!response.Success || !response.objResult) {
            this.failed = true;
            return;
          }
          const page = response.objResult;
          this.reels = [
            ...new Map(
              [...this.reels, ...(page.DataList || [])].map(reel => [
                reel.ReelId,
                reel,
              ])
            ).values(),
          ];
          this.cursor = page.NextCursor;
          this.hasMore = page.HasMore;
        },
        error: () => (this.failed = true),
      });
  }
}
