import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  IAnimeDetail,
  IAnimeEpisode,
  IAnimePlayback,
  IAnimeSearchItem,
} from '../../interfaces';
import { AnimeService } from '../../services';

@Component({
  selector: 'app-anime',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NzIconModule],
  templateUrl: './anime.component.html',
  styleUrl: './anime.component.scss',
})
export class AnimeComponent implements OnInit {
  private readonly animeService = inject(AnimeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  keyword = '';
  results: IAnimeSearchItem[] = [];
  detail: IAnimeDetail | null = null;
  playback: IAnimePlayback | null = null;
  safeEmbedUrl: SafeResourceUrl | null = null;
  selectedEpisode: number | null = null;
  isSearching = false;
  isLoadingDetail = false;
  isLoadingPlayback = false;
  hasSearched = false;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('aniListId'));
        if (Number.isInteger(id) && id > 0) {
          this.loadDetail(id);
        } else {
          this.detail = null;
          this.playback = null;
          this.safeEmbedUrl = null;
          const query = this.route.snapshot.queryParamMap.get('q') || '';
          this.keyword = query;
          if (query.trim().length >= 2) this.search(false);
        }
      });
  }

  search(updateUrl = true): void {
    const keyword = this.keyword.trim();
    if (keyword.length < 2 || this.isSearching) return;

    if (updateUrl) {
      void this.router.navigate(['/anime'], {
        queryParams: { q: keyword },
        replaceUrl: true,
      });
    }

    this.isSearching = true;
    this.hasSearched = true;
    this.results = [];
    this.animeService
      .search(keyword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (!response.Success) {
            this.message.error(response.ErrorMessage || 'Không thể tìm anime.');
            return;
          }
          this.results = response.DataList || [];
        },
        error: () => {
          this.isSearching = false;
          this.message.error('Không thể kết nối dịch vụ tìm kiếm.');
        },
        complete: () => (this.isSearching = false),
      });
  }

  playEpisode(episode: IAnimeEpisode): void {
    if (!this.detail || this.isLoadingPlayback) return;
    if (!episode.HasSource) {
      this.message.info('Tập phim này chưa có nguồn phát.');
      return;
    }

    this.isLoadingPlayback = true;
    this.selectedEpisode = episode.EpisodeNumber;
    this.animeService
      .playback(this.detail.AniListId, episode.EpisodeNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (!response.Success) {
            this.playback = null;
            this.safeEmbedUrl = null;
            this.message.info(response.ErrorMessage || 'Chưa có nguồn phát.');
            return;
          }
          this.playback = response.Data;
          this.safeEmbedUrl = response.Data.IsEmbed
            ? this.sanitizer.bypassSecurityTrustResourceUrl(response.Data.Url)
            : null;
          setTimeout(
            () =>
              document
                .querySelector('.anime-player')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
            0
          );
        },
        error: () => {
          this.isLoadingPlayback = false;
          this.message.error('Không thể mở tập phim này.');
        },
        complete: () => (this.isLoadingPlayback = false),
      });
  }

  trackAnime(_: number, anime: IAnimeSearchItem): number {
    return anime.AniListId;
  }

  trackEpisode(_: number, episode: IAnimeEpisode): number {
    return episode.EpisodeNumber;
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      FINISHED: 'Đã hoàn thành',
      RELEASING: 'Đang phát sóng',
      NOT_YET_RELEASED: 'Sắp phát hành',
      CANCELLED: 'Đã hủy',
      HIATUS: 'Tạm dừng',
    };
    return labels[status] || status || 'Đang cập nhật';
  }

  private loadDetail(aniListId: number): void {
    this.isLoadingDetail = true;
    this.detail = null;
    this.playback = null;
    this.safeEmbedUrl = null;
    this.selectedEpisode = null;

    this.animeService
      .detail(aniListId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (!response.Success) {
            this.message.error(response.ErrorMessage || 'Không thể tải anime.');
            return;
          }
          this.detail = response.Data;
        },
        error: () => {
          this.isLoadingDetail = false;
          this.message.error('Không thể tải thông tin anime.');
        },
        complete: () => (this.isLoadingDetail = false),
      });
  }
}
