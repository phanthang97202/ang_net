import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AntdModule } from '../../../modules';
import { BreadcrumbComponent } from '../../../components';
import {
  IAnimeAdminCatalog,
  IAnimeAdminEpisode,
  IAnimeSearchItem,
  IAnimeSource,
  IAnimeSourceSave,
} from '../../../interfaces';
import { AnimeService } from '../../../services';

@Component({
  selector: 'app-anime-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AntdModule,
    NzEmptyModule,
    NzSpinModule,
    BreadcrumbComponent,
  ],
  templateUrl: './anime-manager.component.html',
  styleUrl: './anime-manager.component.scss',
})
export class AnimeManagerComponent implements OnInit {
  private readonly animeService = inject(AnimeService);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly sanitizer = inject(DomSanitizer);

  searchKeyword = '';
  catalogKeyword = '';
  searchResults: IAnimeSearchItem[] = [];
  catalog: IAnimeAdminCatalog[] = [];
  episodes: IAnimeAdminEpisode[] = [];
  selectedAnime: IAnimeAdminCatalog | null = null;
  selectedEpisode: IAnimeAdminEpisode | null = null;
  editingSource: IAnimeSource | null = null;
  sourceModalVisible = false;
  previewVisible = false;
  previewUrl: SafeResourceUrl | string | null = null;
  previewIsEmbed = false;
  searching = false;
  loadingCatalog = false;
  loadingEpisodes = false;
  savingSource = false;
  importingId: number | null = null;

  sourceForm: IAnimeSourceSave = this.emptySourceForm();

  ngOnInit(): void {
    this.loadCatalog();
  }

  searchAniList(): void {
    const keyword = this.searchKeyword.trim();
    if (keyword.length < 2 || this.searching) return;

    this.searching = true;
    this.searchResults = [];
    this.animeService.search(keyword, 1, 8).subscribe({
      next: response => {
        if (response.Success) {
          this.searchResults = response.DataList || [];
        } else {
          this.message.error(response.ErrorMessage || 'Không thể tìm anime.');
        }
      },
      error: err => {
        this.searching = false;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.searching = false),
    });
  }

  importAnime(item: IAnimeSearchItem): void {
    if (this.importingId !== null) return;
    this.importingId = item.AniListId;
    this.animeService.importAnime(item.AniListId).subscribe({
      next: response => {
        if (!response.Success) {
          this.message.error(response.ErrorMessage || 'Không thể nhập anime.');
          return;
        }
        this.message.success(`Đã nhập ${item.Title} và danh sách tập.`);
        this.loadCatalog(item.AniListId);
      },
      error: err => {
        this.importingId = null;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.importingId = null),
    });
  }

  loadCatalog(selectAniListId?: number): void {
    this.loadingCatalog = true;
    this.animeService.adminCatalog(this.catalogKeyword.trim()).subscribe({
      next: response => {
        if (!response.Success) {
          this.message.error(response.ErrorMessage || 'Không thể tải kho anime.');
          return;
        }
        this.catalog = response.DataList || [];
        if (selectAniListId) {
          const imported = this.catalog.find(x => x.AniListId === selectAniListId);
          if (imported) this.selectAnime(imported);
        } else if (
          this.selectedAnime &&
          !this.catalog.some(x => x.AnimeId === this.selectedAnime?.AnimeId)
        ) {
          this.selectedAnime = null;
          this.episodes = [];
        }
      },
      error: err => {
        this.loadingCatalog = false;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.loadingCatalog = false),
    });
  }

  clearCatalogSearch(): void {
    if (!this.catalogKeyword) return;
    this.catalogKeyword = '';
    this.loadCatalog();
  }

  selectAnime(anime: IAnimeAdminCatalog): void {
    this.selectedAnime = anime;
    this.loadingEpisodes = true;
    this.episodes = [];
    this.animeService.adminEpisodes(anime.AniListId).subscribe({
      next: response => {
        if (response.Success) {
          this.episodes = response.DataList || [];
        } else {
          this.message.error(response.ErrorMessage || 'Không thể tải danh sách tập.');
        }
      },
      error: err => {
        this.loadingEpisodes = false;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.loadingEpisodes = false),
    });
  }

  openSourceModal(episode: IAnimeAdminEpisode, source?: IAnimeSource): void {
    if (!this.selectedAnime) return;
    this.selectedEpisode = episode;
    this.editingSource = source || null;
    this.sourceForm = {
      SourceId: source?.SourceId || '',
      AniListId: this.selectedAnime.AniListId,
      EpisodeNumber: episode.EpisodeNumber,
      EpisodeTitle: episode.Title,
      Provider: source?.Provider || 'youtube',
      SourceValue: source?.SourceValue || '',
      Quality: source?.Quality || '1080p',
      Language: source?.Language || 'Vietsub',
      Priority: source?.Priority ?? episode.Sources.length,
      FlagActive: source?.FlagActive ?? true,
    };
    this.previewVisible = false;
    this.previewUrl = null;
    this.sourceModalVisible = true;
  }

  closeSourceModal(): void {
    if (this.savingSource) return;
    this.sourceModalVisible = false;
    this.previewVisible = false;
    this.previewUrl = null;
  }

  saveSource(): void {
    if (this.savingSource || !this.sourceForm.SourceValue.trim()) return;
    this.savingSource = true;
    this.animeService.saveSource(this.sourceForm).subscribe({
      next: response => {
        if (!response.Success) {
          this.message.error(response.ErrorMessage || 'Không thể lưu nguồn phát.');
          return;
        }
        this.message.success(this.editingSource ? 'Đã cập nhật nguồn phát.' : 'Đã thêm nguồn phát.');
        this.sourceModalVisible = false;
        if (this.selectedAnime) this.selectAnime(this.selectedAnime);
        this.loadCatalog();
      },
      error: err => {
        this.savingSource = false;
        this.message.error(this.errorMessage(err));
      },
      complete: () => (this.savingSource = false),
    });
  }

  toggleSource(source: IAnimeSource, flagActive: boolean): void {
    const previous = source.FlagActive;
    source.FlagActive = flagActive;
    this.animeService.toggleSource(source.SourceId, flagActive).subscribe({
      next: response => {
        if (!response.Success) {
          source.FlagActive = previous;
          this.message.error(response.ErrorMessage || 'Không thể đổi trạng thái nguồn.');
        } else {
          this.loadCatalog();
        }
      },
      error: err => {
        source.FlagActive = previous;
        this.message.error(this.errorMessage(err));
      },
    });
  }

  confirmDeleteSource(source: IAnimeSource): void {
    this.modal.confirm({
      nzTitle: 'Xóa nguồn phát?',
      nzContent: 'Nguồn này sẽ bị xóa khỏi tập phim. Thao tác không thể hoàn tác.',
      nzOkText: 'Xóa nguồn',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzClassName: 'admin-modal',
      nzOnOk: () => this.deleteSource(source),
    });
  }

  showPreview(): void {
    const value = this.sourceForm.SourceValue.trim();
    if (!value) {
      this.message.warning('Vui lòng nhập nguồn phát trước khi xem thử.');
      return;
    }

    if (this.sourceForm.Provider === 'youtube') {
      const id = this.youtubeId(value);
      if (!id) {
        this.message.warning('Link hoặc video ID YouTube chưa hợp lệ.');
        return;
      }
      this.previewIsEmbed = true;
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
      );
    } else {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:') throw new Error();
        this.previewIsEmbed = false;
        this.previewUrl = value;
      } catch {
        this.message.warning('Nguồn MP4/HLS phải là đường dẫn HTTPS hợp lệ.');
        return;
      }
    }
    this.previewVisible = true;
  }

  providerLabel(provider: string): string {
    const labels: Record<string, string> = {
      youtube: 'YouTube',
      mp4: 'MP4',
      hls: 'HLS',
    };
    return labels[provider] || provider;
  }

  trackSearch(_: number, item: IAnimeSearchItem): number {
    return item.AniListId;
  }

  trackCatalog(_: number, item: IAnimeAdminCatalog): string {
    return item.AnimeId;
  }

  private deleteSource(source: IAnimeSource): Promise<void> {
    return new Promise(resolve => {
      this.animeService.deleteSource(source.SourceId).subscribe({
        next: response => {
          if (response.Success) {
            this.message.success('Đã xóa nguồn phát.');
            if (this.selectedAnime) this.selectAnime(this.selectedAnime);
            this.loadCatalog();
          } else {
            this.message.error(response.ErrorMessage || 'Không thể xóa nguồn phát.');
          }
          resolve();
        },
        error: err => {
          this.message.error(this.errorMessage(err));
          resolve();
        },
      });
    });
  }

  private youtubeId(value: string): string {
    const raw = value.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    try {
      const url = new URL(raw);
      if (url.hostname.endsWith('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || '';
      if (!url.hostname.endsWith('youtube.com') && !url.hostname.endsWith('youtube-nocookie.com')) return '';
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/').filter(Boolean).pop() || '';
      return url.searchParams.get('v') || '';
    } catch {
      return '';
    }
  }

  private emptySourceForm(): IAnimeSourceSave {
    return {
      SourceId: '',
      AniListId: 0,
      EpisodeNumber: 0,
      EpisodeTitle: '',
      Provider: 'youtube',
      SourceValue: '',
      Quality: '1080p',
      Language: 'Vietsub',
      Priority: 0,
      FlagActive: true,
    };
  }

  private errorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Đã có lỗi xảy ra.';
    const response = err as { error?: { ErrorMessage?: unknown }; message?: unknown };
    const message = response.error?.ErrorMessage ?? response.message;
    return typeof message === 'string' ? message : 'Đã có lỗi xảy ra.';
  }
}
