import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { combineLatest, distinctUntilChanged, finalize, map, Subscription } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  IMovieLibraryCatalog,
  IMovieLibraryDetail,
  IMovieLibraryEpisode,
  IMovieLibraryItem,
  IMovieLibraryPlayback,
  IMovieLibraryServer,
} from '../../interfaces/movie';
import { MovieService } from '../../services';
import { MovieVideoComponent } from './movie-video.component';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzIconModule,
    MovieVideoComponent,
  ],
  templateUrl: './movie.component.html',
  styleUrls: ['./movie.component.scss', './movie-wishlist.scss'],
})
export class MovieComponent implements OnInit {
  private readonly api = inject(MovieService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(NzMessageService);
  private request?: Subscription;
  private playbackRequest?: Subscription;
  private embedFallbackAttempted = false;
  @ViewChild('player') private player?: ElementRef<HTMLElement>;

  keyword = '';
  wishlistView = false;
  readonly wishlistPending = new Set<string>();
  query = '';
  page = 1;
  slug = '';
  catalog: IMovieLibraryCatalog | null = null;
  detail: IMovieLibraryDetail | null = null;
  server: IMovieLibraryServer | null = null;
  playback: IMovieLibraryPlayback | null = null;
  selectedEpisode = '';
  safeEmbedUrl: SafeResourceUrl | null = null;
  loading = false;
  loadingPlayback = false;
  error = '';
  playbackError = '';
  playbackNotice = '';

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.request?.unsubscribe();
      this.playbackRequest?.unsubscribe();
    });
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([params, query]) => ({
          slug: params.get('slug') || '',
          keyword: (query.get('q') || '').slice(0, 100),
          wishlist: query.get('view') === 'wishlist',
          page: Math.max(
            1,
            Math.min(10000, Math.trunc(Number(query.get('page'))) || 1)
          ),
        })),
        distinctUntilChanged(
          (a, b) =>
            a.slug === b.slug && a.keyword === b.keyword && a.page === b.page && a.wishlist === b.wishlist
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(state => {
        this.slug = state.slug;
        this.wishlistView = state.wishlist;
        this.query = this.keyword = state.keyword;
        this.page = state.page;
        this.load();
      });
  }

  search(): void {
    void this.router.navigate(['/phim'], {
      queryParams: { q: this.keyword.trim() || null, page: null, view: this.wishlistView ? 'wishlist' : null },
    });
  }

  changePage(page: number): void {
    void this.router.navigate(['/phim'], {
      queryParams: { q: this.query || null, page, view: this.wishlistView ? 'wishlist' : null },
    });
  }

  load(): void {
    this.request?.unsubscribe();
    this.resetPlayback();
    this.loading = true;
    this.error = '';
    this.detail = null;
    this.catalog = null;
    this.server = null;
    if (this.slug) {
      this.request = this.api.libraryDetail(this.slug).subscribe({
        next: response => {
          this.loading = false;
          if (!response.Success || !response.Data) {
            this.error = response.ErrorMessage || 'Không thể tải phim.';
            return;
          }
          this.detail = response.Data;
          this.server =
            this.detail.Servers.find(s => s.Episodes.some(e => e.HasSource)) ||
            this.detail.Servers[0] ||
            null;
        },
        error: err => this.loadError(err),
      });
    } else {
      const source = this.wishlistView
        ? this.api.wishlist(this.query, this.page)
        : this.api.library(this.query, this.page);
      this.request = source.subscribe({
        next: response => {
          this.loading = false;
          if (!response.Success || !response.Data) {
            this.error =
              response.ErrorMessage || 'Không thể tải danh sách phim.';
            return;
          }
          this.catalog = response.Data;
          this.page = response.Data.Page;
        },
        error: err => this.loadError(err),
      });
    }
  }

  toggleWishlist(movie: IMovieLibraryItem): void {
    if (this.wishlistPending.has(movie.Slug)) return;
    this.wishlistPending.add(movie.Slug);
    const request = movie.IsWishlisted
      ? this.api.removeWishlist(movie.Slug)
      : this.api.saveWishlist(movie.Slug);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.wishlistPending.delete(movie.Slug))
    ).subscribe({
      next: response => {
        if (!response.Success) {
          this.messages.error(response.ErrorMessage || 'Không thể cập nhật yêu thích.');
          return;
        }
        movie.IsWishlisted = response.Data;
        this.catalog?.Items.filter(item => item.Slug === movie.Slug)
          .forEach(item => item.IsWishlisted = response.Data);
        if (this.detail?.Slug === movie.Slug) this.detail.IsWishlisted = response.Data;
        if (!response.Data && this.wishlistView && !this.slug) this.load();
      },
      error: err => this.messages.error(
        err?.error?.ErrorMessage || 'Không thể cập nhật yêu thích. Vui lòng thử lại.'
      ),
    });
  }

  selectServer(server: IMovieLibraryServer): void {
    if (this.server?.Id === server.Id) return;
    const current = this.selectedEpisode;
    this.resetPlayback();
    this.server = server;
    const match = server.Episodes.find(e => e.Slug === current && e.HasSource);
    if (match) this.playEpisode(match);
  }

  playEpisode(episode: IMovieLibraryEpisode): void {
    if (!this.detail || !this.server || !episode.HasSource) return;
    this.resetPlayback();
    this.selectedEpisode = episode.Slug;
    this.loadingPlayback = true;
    requestAnimationFrame(() =>
      this.player?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    );
    this.playbackRequest = this.api
      .libraryPlayback(this.detail.Slug, this.server.Id, episode.Slug)
      .subscribe({
        next: response => {
          this.loadingPlayback = false;
          if (!response.Success || !response.Data) {
            this.playbackError =
              response.ErrorMessage || 'Tập phim chưa có nguồn phát.';
            return;
          }
          this.playback = response.Data;
          // Prefer the provider's player; use HLS only when no valid embed exists.
          if (this.playback.EmbedUrl) this.useEmbed();
          if (!this.safeEmbedUrl && this.playback.Url) this.playbackError = '';
          if (!this.safeEmbedUrl && !this.playback.Url) {
            this.playbackError =
              'Tập phim chưa có trình phát khả dụng. Hãy thử nguồn khác.';
          }
        },
        error: err => {
          this.loadingPlayback = false;
          this.playbackError =
            err?.error?.ErrorMessage ||
            'Không thể mở tập phim. Hãy thử lại hoặc chọn nguồn khác.';
        },
      });
  }

  useEmbed(): void {
    if (!this.playback?.EmbedUrl || this.safeEmbedUrl) return;
    // Never trust an arbitrary iframe URL, even when returned by the backend.
    try {
      const url = new URL(this.playback.EmbedUrl);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'player.phimapi.com' ||
        !url.pathname.startsWith('/player/')
      )
        return;
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        url.href
      );
      this.playbackError = '';
      this.playbackNotice = '';
    } catch {
      this.playbackError = 'Nguồn trình phát mặc định không hợp lệ.';
    }
  }

  videoError(): void {
    // Ignore duplicate/late errors from a player that has already been removed.
    if (!this.playback || this.safeEmbedUrl) return;
    if (!this.embedFallbackAttempted && this.playback.EmbedUrl) {
      this.embedFallbackAttempted = true;
      this.useEmbed();
      if (this.safeEmbedUrl) {
        this.playbackNotice =
          'HLS gặp lỗi, đã tự chuyển sang trình phát mặc định.';
        return;
      }
    }
    this.playbackError =
      'Không thể phát video bằng HLS. Hãy chọn trình phát mặc định hoặc thử nguồn khác.';
  }

  useHls(): void {
    if (!this.playback?.Url || !this.safeEmbedUrl) return;
    this.safeEmbedUrl = null;
    this.playbackError = '';
    this.playbackNotice = '';
  }

  private resetPlayback(): void {
    this.playbackRequest?.unsubscribe();
    this.playback = null;
    this.safeEmbedUrl = null;
    this.selectedEpisode = '';
    this.loadingPlayback = false;
    this.playbackError = '';
    this.playbackNotice = '';
    this.embedFallbackAttempted = false;
  }

  private loadError(err: { error?: { ErrorMessage?: string } }): void {
    this.loading = false;
    this.error =
      err?.error?.ErrorMessage ||
      'Không thể kết nối nguồn phim. Vui lòng thử lại.';
  }
}
