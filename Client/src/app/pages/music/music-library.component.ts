import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  catchError,
  finalize,
  firstValueFrom,
  tap,
} from 'rxjs';
import { archiveVisibilityOption } from '../../components/archive/archive-visibility';
import { MusicCollectionFormComponent } from '../../components/music-library/music-collection-form.component';
import { MusicSaveButtonComponent } from '../../components/music-library/music-save-button.component';
import {
  IMusicCollection,
  IMusicLibraryTrack,
  IMusicLibraryTrackResponse,
  IMusicTrackPreview,
} from '../../interfaces';
import { AuthService, MusicLibraryService } from '../../services';
import { MusicQueuePlayerComponent } from './music-queue-player.component';

const FAVORITES = 'favorites';
const PAGE_SIZE = 100;

interface PendingConfirm {
  title: string;
  message: string;
  run: () => Observable<unknown>;
}

/**
 * Tab "Thư viện" của trang Âm nhạc: Yêu thích + các bộ sưu tập của tôi.
 * Truyền sharedCollectionId thì thành trang xem một bộ được chia sẻ
 * (/music/collection/:id) - không có thanh chọn bộ, chỉ chủ sở hữu sửa được.
 */
@Component({
  selector: 'app-music-library',
  standalone: true,
  imports: [
    NzIconModule,
    NzModalModule,
    TranslateModule,
    MusicCollectionFormComponent,
    MusicSaveButtonComponent,
    MusicQueuePlayerComponent,
  ],
  templateUrl: './music-library.component.html',
  styleUrls: [
    './music.component.scss',
    './music-list.component.scss',
    './music-library.component.scss',
  ],
})
export class MusicLibraryComponent implements OnInit, OnChanges {
  @Input() sharedCollectionId = '';

  private library = inject(MusicLibraryService);
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  private translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly favorites = FAVORITES;
  readonly visibilityOption = archiveVisibilityOption;

  collections: IMusicCollection[] = [];
  selectedKey = FAVORITES;
  sharedCollection: IMusicCollection | null = null;

  tracks: IMusicLibraryTrack[] = [];
  itemCount = 0;
  pageIndex = 0;
  loading = false;
  loadingMore = false;
  loadError = '';

  // Hàng đợi tách khỏi danh sách đang xem: chuyển sang bộ khác vẫn phát tiếp
  queue: IMusicLibraryTrack[] = [];
  queueIndex = -1;
  queueKey = '';
  shuffle = false;
  shuffleLoading = false;
  private shuffleRequest = 0;
  private queuePageIndex = 0;
  private queueItemCount = 0;

  isFormOpen = false;
  editingCollection: IMusicCollection | null = null;
  pendingConfirm: PendingConfirm | null = null;
  isConfirming = false;
  busyTrackId = '';

  private initialized = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelShufflePreparation());
    // Lưu / bỏ lưu / sửa bộ ở bất kỳ đâu (tab YouTube, modal chọn bộ...) thì tải lại
    effect(() => {
      this.library.changes();
      untracked(() => {
        if (this.initialized && !this.isShared) this.reloadAll();
      });
    });
  }

  get isShared(): boolean {
    return !!this.sharedCollectionId;
  }

  /** Người xem có được bấm ♥ không (trang chia sẻ mở được cả khi chưa đăng nhập). */
  get canSave(): boolean {
    return this.auth.isLoggedIn() && this.auth.hasPermission('music.use');
  }

  get selectedCollection(): IMusicCollection | null {
    if (this.isShared) return this.sharedCollection;
    return (
      this.collections.find(c => c.CollectionId === this.selectedKey) ?? null
    );
  }

  get hasMore(): boolean {
    return this.tracks.length < this.itemCount;
  }

  ngOnInit(): void {
    this.initialized = true;
    this.reloadAll();
  }

  ngOnChanges(): void {
    if (this.initialized) {
      this.cancelShufflePreparation();
      this.reloadAll();
    }
  }

  select(key: string): void {
    if (key === this.selectedKey) return;
    this.cancelShufflePreparation();
    this.selectedKey = key;
    this.loadTracks();
  }

  play(index: number): void {
    const track = this.tracks[index];
    if (!track) return;
    if (this.isActive(track)) return;
    this.cancelShufflePreparation();
    if (this.queueKey !== this.currentListKey) this.shuffle = false;
    this.queue = [...this.tracks];
    this.queueIndex = index;
    this.queueKey = this.currentListKey;
    this.queuePageIndex = this.pageIndex;
    this.queueItemCount = this.itemCount;
  }

  setQueueShuffle(enabled: boolean): void {
    if (!enabled) {
      this.shuffle = false;
      return;
    }
    void this.prepareShuffle(false);
  }

  shuffleCurrentList(): void {
    if (this.shuffle && this.queueKey === this.currentListKey) {
      this.shuffle = false;
      return;
    }
    void this.prepareShuffle(true);
  }

  private cancelShufflePreparation(): void {
    this.shuffleRequest++;
    this.shuffleLoading = false;
  }

  /** Fetch every page before shuffling so later tracks have the same chance. */
  private async prepareShuffle(fromCurrentList: boolean): Promise<void> {
    if (this.shuffleLoading || this.loading || this.loadingMore) return;
    const key = fromCurrentList ? this.currentListKey : this.queueKey;
    const all = [...(fromCurrentList ? this.tracks : this.queue)];
    let page = fromCurrentList ? this.pageIndex : this.queuePageIndex;
    let total = fromCurrentList ? this.itemCount : this.queueItemCount;
    if (!key || !all.length) return;
    const request = ++this.shuffleRequest;
    this.shuffleLoading = true;
    try {
      while (all.length < total) {
        const response = await firstValueFrom(
          (key === FAVORITES
            ? this.library.saved(page + 1, PAGE_SIZE)
            : this.library.collectionTracks(key, page + 1, PAGE_SIZE)
          ).pipe(takeUntilDestroyed(this.destroyRef))
        );
        if (request !== this.shuffleRequest) return;
        if (!response?.Success || !response.objResult)
          throw new Error('Failed to load playlist');
        const existing = new Set(all.map(track => track.TrackId));
        const more = response.objResult.DataList.filter(
          track => !existing.has(track.TrackId)
        );
        if (!more.length) throw new Error('Incomplete playlist');
        all.push(...more);
        page++;
        total = response.objResult.ItemCount;
      }
      if (request !== this.shuffleRequest) return;
      if (fromCurrentList && this.currentListKey !== key) return;
      if (!fromCurrentList && this.queueKey !== key) return;
      const playable = all.filter(
        track => track.Availability !== 'Unavailable'
      );
      if (!playable.length) {
        this.message.error(this.translate.instant('T_MUSIC_PLAY_ERROR'));
        return;
      }
      const currentId = this.queue[this.queueIndex]?.TrackId;
      this.queue = all;
      this.queueKey = key;
      this.queuePageIndex = page;
      this.queueItemCount = total;
      this.shuffle = true;
      if (fromCurrentList) {
        this.tracks = [...all];
        this.pageIndex = page;
        this.itemCount = total;
        const chosen = playable[Math.floor(Math.random() * playable.length)];
        this.queueIndex = all.findIndex(
          track => track.TrackId === chosen.TrackId
        );
        for (let index = 0; index < all.length; index += PAGE_SIZE)
          this.refreshSaveState(all.slice(index, index + PAGE_SIZE));
      } else {
        this.queueIndex = all.findIndex(track => track.TrackId === currentId);
      }
    } catch {
      if (request === this.shuffleRequest)
        this.message.error(
          this.translate.instant('T_MUSIC_LIBRARY_LOAD_ERROR')
        );
    } finally {
      if (request === this.shuffleRequest) this.shuffleLoading = false;
    }
  }

  isActive(track: IMusicLibraryTrack): boolean {
    return (
      this.queueKey === this.currentListKey &&
      this.queue[this.queueIndex]?.TrackId === track.TrackId
    );
  }

  preview(track: IMusicLibraryTrack): IMusicTrackPreview {
    return {
      Provider: track.Provider,
      ExternalId: track.ExternalId,
      TrackId: track.TrackId,
      Title: track.Title,
      Artist: track.Artist,
      ThumbnailUrl: track.ThumbnailUrl,
    };
  }

  openPicker(track: IMusicLibraryTrack, event: Event): void {
    event.stopPropagation();
    this.library.openPicker(this.preview(track));
  }

  openCreate(): void {
    this.editingCollection = null;
    this.isFormOpen = true;
  }

  openEdit(): void {
    this.editingCollection = this.selectedCollection;
    this.isFormOpen = true;
  }

  onCollectionSaved(collection: IMusicCollection): void {
    this.isFormOpen = false;
    // Danh sách bộ tự tải lại qua library.changes; tạo mới thì mở luôn bộ đó
    if (!this.editingCollection) this.selectedKey = collection.CollectionId;
    if (this.isShared) this.sharedCollection = collection;
  }

  moveTrack(track: IMusicLibraryTrack, direction: 'up' | 'down'): void {
    const collection = this.selectedCollection;
    if (!collection || this.busyTrackId) return;

    this.busyTrackId = track.TrackId;
    this.library
      .moveCollectionItem(collection.CollectionId, track.TrackId, direction)
      .pipe(finalize(() => (this.busyTrackId = '')))
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.message.error(
              response?.ErrorMessage ||
                this.translate.instant('T_MUSIC_COLLECTION_UPDATE_ERROR')
            );
            return;
          }
          // Đổi chỗ ngay trên danh sách đang xem, không phải tải lại
          const from = this.tracks.findIndex(t => t.TrackId === track.TrackId);
          const to = direction === 'up' ? from - 1 : from + 1;
          if (from < 0 || to < 0 || to >= this.tracks.length) return;
          const next = [...this.tracks];
          [next[from], next[to]] = [next[to], next[from]];
          this.tracks = next;
        },
        error: () =>
          this.message.error(
            this.translate.instant('T_MUSIC_COLLECTION_UPDATE_ERROR')
          ),
      });
  }

  removeFromCollection(track: IMusicLibraryTrack): void {
    const collection = this.selectedCollection;
    if (!collection || this.busyTrackId) return;

    this.busyTrackId = track.TrackId;
    this.library
      .removeFromCollection(collection.CollectionId, track.TrackId)
      .pipe(finalize(() => (this.busyTrackId = '')))
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.message.error(
              response?.ErrorMessage ||
                this.translate.instant('T_MUSIC_COLLECTION_UPDATE_ERROR')
            );
            return;
          }
          // Gỡ ngay trên danh sách đang xem (trang chia sẻ không tự tải lại theo library.changes)
          this.tracks = this.tracks.filter(t => t.TrackId !== track.TrackId);
          this.itemCount = Math.max(0, this.itemCount - 1);
          this.message.success(
            this.translate.instant('T_MUSIC_REMOVED_FROM_COLLECTION', {
              name: collection.Name,
            })
          );
        },
        error: () =>
          this.message.error(
            this.translate.instant('T_MUSIC_COLLECTION_UPDATE_ERROR')
          ),
      });
  }

  confirmDeleteCollection(): void {
    const collection = this.selectedCollection;
    if (!collection) return;
    this.pendingConfirm = {
      title: this.translate.instant('T_MUSIC_DELETE_COLLECTION_TITLE', {
        name: collection.Name,
      }),
      message: this.translate.instant('T_MUSIC_DELETE_COLLECTION_MESSAGE', {
        count: collection.ItemCount,
      }),
      run: () => this.deleteCollection(collection),
    };
  }

  runConfirm(): void {
    if (!this.pendingConfirm || this.isConfirming) return;
    this.isConfirming = true;
    this.pendingConfirm
      .run()
      .pipe(
        finalize(() => {
          this.isConfirming = false;
          this.pendingConfirm = null;
        })
      )
      .subscribe();
  }

  cancelConfirm(): void {
    if (this.isConfirming) return;
    this.pendingConfirm = null;
  }

  copyShareLink(): void {
    const collection = this.selectedCollection;
    if (!collection) return;
    const url = `${window.location.origin}/music/collection/${collection.CollectionId}`;
    navigator.clipboard
      .writeText(url)
      .then(() =>
        this.message.success(
          this.translate.instant('T_MUSIC_SHARE_LINK_COPIED')
        )
      )
      .catch(() => this.message.info(url));
  }

  loadMore(): void {
    if (this.loadingMore || this.shuffleLoading || !this.hasMore) return;
    this.loadingMore = true;
    this.fetchPage(this.pageIndex + 1)
      .pipe(finalize(() => (this.loadingMore = false)))
      .subscribe(response => {
        if (!response?.Success) return;
        this.pageIndex++;
        const more = response.objResult?.DataList ?? [];
        this.tracks = [...this.tracks, ...more];
        if (
          this.queueKey === this.currentListKey &&
          this.queuePageIndex === this.pageIndex - 1
        ) {
          const known = new Set(this.queue.map(track => track.TrackId));
          this.queue = [
            ...this.queue,
            ...more.filter(track => !known.has(track.TrackId)),
          ];
          this.queuePageIndex = this.pageIndex;
          this.queueItemCount = this.itemCount;
        }
        this.refreshSaveState(more);
      });
  }

  hideBrokenArtwork(track: IMusicLibraryTrack): void {
    track.ThumbnailUrl = '';
  }

  formatTime(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')}`;
  }

  get currentListKey(): string {
    return this.isShared ? this.sharedCollectionId : this.selectedKey;
  }

  private reloadAll(): void {
    if (this.isShared) {
      this.library.collection(this.sharedCollectionId).subscribe({
        next: response => {
          this.sharedCollection = response?.Success ? response.Data : null;
          if (!this.sharedCollection) {
            this.loadError = 'T_MUSIC_COLLECTION_NOT_FOUND';
            return;
          }
          this.loadTracks();
        },
        error: () => (this.loadError = 'T_MUSIC_COLLECTION_NOT_FOUND'),
      });
      return;
    }

    this.library.myCollections().subscribe({
      next: response => {
        this.collections = response?.Success ? (response.DataList ?? []) : [];
        // Bộ đang xem vừa bị xoá thì quay về Yêu thích
        if (
          this.selectedKey !== FAVORITES &&
          !this.collections.some(c => c.CollectionId === this.selectedKey)
        ) {
          this.selectedKey = FAVORITES;
        }
        this.loadTracks();
      },
      error: () => this.loadTracks(),
    });
  }

  private loadTracks(): void {
    this.loading = true;
    this.loadError = '';
    this.fetchPage(0)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(response => {
        if (!response?.Success) {
          this.tracks = [];
          this.itemCount = 0;
          this.loadError = this.isShared
            ? 'T_MUSIC_COLLECTION_NOT_FOUND'
            : 'T_MUSIC_LIBRARY_LOAD_ERROR';
          return;
        }
        this.pageIndex = 0;
        this.tracks = response.objResult?.DataList ?? [];
        this.itemCount = response.objResult?.ItemCount ?? this.tracks.length;
        this.refreshSaveState(this.tracks);
      });
  }

  private fetchPage(pageIndex: number): Observable<IMusicLibraryTrackResponse> {
    const key = this.currentListKey;
    const request =
      key === FAVORITES
        ? this.library.saved(pageIndex, PAGE_SIZE)
        : this.library.collectionTracks(key, pageIndex, PAGE_SIZE);
    return request.pipe(
      catchError(() => {
        this.loadError = 'T_MUSIC_LIBRARY_LOAD_ERROR';
        return EMPTY;
      })
    );
  }

  private refreshSaveState(tracks: IMusicLibraryTrack[]): void {
    if (this.canSave) this.library.refreshSaveState(tracks);
  }

  private deleteCollection(collection: IMusicCollection): Observable<unknown> {
    return this.library.deleteCollection(collection.CollectionId).pipe(
      tap({
        next: response => {
          if (!response?.Success) {
            this.message.error(
              response?.ErrorMessage ||
                this.translate.instant('T_MUSIC_COLLECTION_DELETE_ERROR')
            );
            return;
          }
          this.message.success(
            this.translate.instant('T_MUSIC_COLLECTION_DELETED')
          );
        },
        error: () =>
          this.message.error(
            this.translate.instant('T_MUSIC_COLLECTION_DELETE_ERROR')
          ),
      }),
      catchError(() => EMPTY)
    );
  }
}
