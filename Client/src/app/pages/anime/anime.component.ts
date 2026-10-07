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
import { combineLatest, distinctUntilChanged, map, Subscription } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
  IAnimeLibraryCatalog,
  IAnimeLibraryDetail,
  IAnimeLibraryEpisode,
  IAnimeLibraryPlayback,
  IAnimeLibraryServer,
} from '../../interfaces/anime';
import { AnimeService } from '../../services';
import { AnimeVideoComponent } from './anime-video.component';

@Component({
  selector: 'app-anime',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzIconModule,
    AnimeVideoComponent,
  ],
  templateUrl: './anime.component.html',
  styleUrl: './anime.component.scss',
})
export class AnimeComponent implements OnInit {
  private readonly api = inject(AnimeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private playbackRequest?: Subscription;
  @ViewChild('player') private player?: ElementRef<HTMLElement>;

  keyword = '';
  query = '';
  page = 1;
  slug = '';
  catalog: IAnimeLibraryCatalog | null = null;
  detail: IAnimeLibraryDetail | null = null;
  server: IAnimeLibraryServer | null = null;
  playback: IAnimeLibraryPlayback | null = null;
  selectedEpisode = '';
  safeEmbedUrl: SafeResourceUrl | null = null;
  loading = false;
  loadingPlayback = false;
  error = '';
  playbackError = '';

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
          page: Math.max(
            1,
            Math.min(10000, Math.trunc(Number(query.get('page'))) || 1)
          ),
        })),
        distinctUntilChanged(
          (a, b) =>
            a.slug === b.slug && a.keyword === b.keyword && a.page === b.page
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(state => {
        this.slug = state.slug;
        this.query = this.keyword = state.keyword;
        this.page = state.page;
        this.load();
      });
  }

  search(): void {
    void this.router.navigate(['/anime'], {
      queryParams: { q: this.keyword.trim() || null, page: null },
    });
  }

  changePage(page: number): void {
    void this.router.navigate(['/anime'], {
      queryParams: { q: this.query || null, page },
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
            this.error = response.ErrorMessage || 'Không thể tải anime.';
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
      this.request = this.api.library(this.query, this.page).subscribe({
        next: response => {
          this.loading = false;
          if (!response.Success || !response.Data) {
            this.error =
              response.ErrorMessage || 'Không thể tải danh sách phim.';
            return;
          }
          this.catalog = response.Data;
        },
        error: err => this.loadError(err),
      });
    }
  }

  selectServer(server: IAnimeLibraryServer): void {
    if (this.server?.Id === server.Id) return;
    const current = this.selectedEpisode;
    this.resetPlayback();
    this.server = server;
    const match = server.Episodes.find(e => e.Slug === current && e.HasSource);
    if (match) this.playEpisode(match);
  }

  playEpisode(episode: IAnimeLibraryEpisode): void {
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
          if (!this.playback.Url) this.useEmbed();
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
    if (!this.playback?.EmbedUrl) return;
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
    } catch {
      this.playbackError = 'Nguồn phát dự phòng không hợp lệ.';
    }
  }

  videoError(): void {
    this.playbackError =
      'Trình phát không tải được video. Thử nguồn khác hoặc trình phát dự phòng.';
  }

  private resetPlayback(): void {
    this.playbackRequest?.unsubscribe();
    this.playback = null;
    this.safeEmbedUrl = null;
    this.selectedEpisode = '';
    this.loadingPlayback = false;
    this.playbackError = '';
  }

  private loadError(err: { error?: { ErrorMessage?: string } }): void {
    this.loading = false;
    this.error =
      err?.error?.ErrorMessage ||
      'Không thể kết nối nguồn phim. Vui lòng thử lại.';
  }
}
