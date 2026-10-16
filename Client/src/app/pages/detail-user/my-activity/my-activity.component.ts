import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { finalize } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { LangService } from '../../../services/lang-service.service';
import { IBlogActivity, TBlogActivityKind } from '../../../interfaces/my-blog';
import { InfiniteScrollDirective } from '../../../directives/infinite-scroll.directive';

@Component({
  selector: 'app-my-activity',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    NzIconModule,
    InfiniteScrollDirective,
  ],
  templateUrl: './my-activity.component.html',
  styleUrls: [
    '../my-posts/my-posts.component.scss',
    './my-activity.component.scss',
  ],
})
export class MyActivityComponent implements OnInit {
  private api = inject(ApiService);
  private lang = inject(LangService);
  private destroyRef = inject(DestroyRef);
  activities: IBlogActivity[] = [];
  loading = false;
  failed = false;
  hasMore = true;
  private cursor: string | null = null;
  readonly actions: Record<TBlogActivityKind, { key: string; icon: string }> = {
    PostLiked: { key: 'T_ACTIVITY_POST_LIKED', icon: 'heart' },
    PostUnliked: { key: 'T_ACTIVITY_POST_UNLIKED', icon: 'heart' },
    Commented: { key: 'T_ACTIVITY_COMMENTED', icon: 'message' },
    CommentLiked: { key: 'T_ACTIVITY_COMMENT_LIKED', icon: 'like' },
    CommentUnliked: { key: 'T_ACTIVITY_COMMENT_UNLIKED', icon: 'like' },
    Rated: { key: 'T_ACTIVITY_RATED', icon: 'star' },
  };

  ngOnInit(): void {
    this.loadMore();
  }

  title(activity: IBlogActivity): string {
    return this.lang.getLang() === 'en' && activity.HasEnglishTranslation
      ? activity.TitleEn
      : activity.Title;
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    this.failed = false;
    this.api
      .MyActivity(20, this.cursor)
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
          const existing = new Set(
            this.activities.map(item => item.ActivityId)
          );
          this.activities = [
            ...this.activities,
            ...page.DataList.filter(item => !existing.has(item.ActivityId)),
          ];
          this.cursor = page.NextCursor;
          this.hasMore = page.HasMore;
        },
        error: () => (this.failed = true),
      });
  }
}
