import { CommonModule, Location } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IDetailNews, TWhoCanSee } from '../../../interfaces';
import { AuthService, ApiService, ShowErrorService } from '../../../services';
import { NewsCardComponent } from '../../../components/news-card/news-card.component';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { MyFavoritesComponent } from '../my-favorites/my-favorites.component';
import { catchError, forkJoin, of } from 'rxjs';

type PostVisibilityTab =
  | Extract<TWhoCanSee, 'Public' | 'Private'>
  | 'Favorites';

const PLACEHOLDER_COLORS = [
  '#5b4fe9',
  '#e95f9c',
  '#3fb2a6',
  '#f2994a',
  '#7a6b8a',
  '#4a90d9',
];

@Component({
  selector: 'app-my-posts',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NzIconModule,
    NewsCardComponent,
    PaginationComponent,
    MyFavoritesComponent,
  ],
  templateUrl: './my-posts.component.html',
  styleUrl: './my-posts.component.scss',
})
export class MyPostsComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private showErrorService = inject(ShowErrorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);

  readonly tabs: { value: PostVisibilityTab; labelKey: string }[] = [
    { value: 'Public', labelKey: 'T_PUBLICPOSTS' },
    { value: 'Private', labelKey: 'T_PRIVATEPOSTS' },
    { value: 'Favorites', labelKey: 'T_FAVORITEPOSTS' },
  ];

  posts: IDetailNews[] = [];
  activeTab: PostVisibilityTab = 'Public';
  currentPage = 0;
  pageSize = 6;
  itemCount = 0;
  isLoading = false;
  tabCounts: Record<PostVisibilityTab, number | null> = {
    Public: null,
    Private: null,
    Favorites: null,
  };

  ngOnInit(): void {
    const visibility = this.route.snapshot.queryParamMap.get('visibility');
    this.activeTab =
      visibility === 'Favorites'
        ? 'Favorites'
        : visibility === 'Private'
          ? 'Private'
          : 'Public';
    this.loadTabCounts();
    if (this.activeTab !== 'Favorites') this.loadPosts(0);
  }

  changeTab(tab: PostVisibilityTab): void {
    if (tab === this.activeTab || this.isLoading) return;

    this.activeTab = tab;
    if (tab === 'Favorites') {
      this.posts = [];
      this.itemCount = 0;
    } else this.loadPosts(0);
    this.updateUrl();
  }

  changePage(pageIndex: number): void {
    this.loadPosts(pageIndex);
  }

  placeholderColor(index: number): string {
    return PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
  }

  onFavoriteCountChanged(count: number): void {
    this.itemCount = count;
    this.tabCounts.Favorites = count;
  }

  private loadPosts(pageIndex: number): void {
    const userId = this.authService.getAccountInfo().nameid || '';
    if (!userId) return;

    this.isLoading = true;
    this.api
      .SearchNews(
        pageIndex,
        this.pageSize,
        '',
        userId,
        '',
        true,
        '',
        '',
        false,
        this.activeTab
      )
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.showApiError(response?.ErrorMessage || 'Error');
            return;
          }
          this.posts = response.objResult?.DataList || [];
          this.currentPage = response.objResult?.PageIndex || 0;
          this.itemCount = response.objResult?.ItemCount || 0;
          this.tabCounts[this.activeTab] = this.itemCount;
        },
        error: error => this.showApiError(error?.message || 'Error'),
        complete: () => (this.isLoading = false),
      });
  }

  private loadTabCounts(): void {
    const userId = this.authService.getAccountInfo().nameid || '';
    if (!userId) return;

    const countPosts = (
      visibility: Extract<PostVisibilityTab, 'Public' | 'Private'>
    ) =>
      this.api
        .SearchNews(0, 1, '', userId, '', true, '', '', false, visibility)
        .pipe(catchError(() => of(null)));

    forkJoin({
      publicPosts: countPosts('Public'),
      privatePosts: countPosts('Private'),
      favorites: this.api.MyFavorites(1, null).pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ publicPosts, privatePosts, favorites }) => {
        this.tabCounts.Public =
          publicPosts?.objResult?.ItemCount ?? this.tabCounts.Public;
        this.tabCounts.Private =
          privatePosts?.objResult?.ItemCount ?? this.tabCounts.Private;
        this.tabCounts.Favorites =
          favorites?.objResult?.ItemCount ?? this.tabCounts.Favorites;
      });
  }

  private updateUrl(): void {
    const queryParams = {
      ...this.route.snapshot.queryParams,
      tab: 'posts',
      visibility: this.activeTab,
    };
    this.location.replaceState(
      this.router
        .createUrlTree([], { relativeTo: this.route, queryParams })
        .toString()
    );
  }

  private showApiError(message: string): void {
    this.isLoading = false;
    this.showErrorService.setShowError({
      icon: 'warning',
      message,
      title: 'Error',
    });
  }
}
