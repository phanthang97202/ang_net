import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { finalize } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { IDetailNews } from '../../../interfaces';
import { NewsCardComponent } from '../../../components/news-card/news-card.component';
import { InfiniteScrollDirective } from '../../../directives/infinite-scroll.directive';

@Component({
  selector: 'app-my-favorites',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NzIconModule,
    NewsCardComponent,
    InfiniteScrollDirective,
  ],
  templateUrl: './my-favorites.component.html',
  styleUrl: '../my-posts/my-posts.component.scss',
})
export class MyFavoritesComponent implements OnInit {
  @Output() countChanged = new EventEmitter<number>(true);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  posts: IDetailNews[] = [];
  loading = false;
  failed = false;
  hasMore = true;
  private cursor: string | null = null;

  ngOnInit(): void {
    this.loadMore();
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    this.failed = false;
    this.api
      .MyFavorites(12, this.cursor)
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
          const existing = new Set(this.posts.map(post => post.NewsId));
          this.posts = [
            ...this.posts,
            ...page.DataList.filter(post => !existing.has(post.NewsId)),
          ];
          this.cursor = page.NextCursor;
          this.hasMore = page.HasMore;
          this.countChanged.emit(page.ItemCount);
        },
        error: () => (this.failed = true),
      });
  }
}
