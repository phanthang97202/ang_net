import { Component, effect, inject, untracked } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IMusicCollection, IMusicTrackPreview } from '../../interfaces';
import { MusicLibraryService, musicTrackKey } from '../../services';
import { archiveVisibilityOption } from '../archive/archive-visibility';
import { MusicCollectionFormComponent } from './music-collection-form.component';

/**
 * Modal "Thêm vào bộ sưu tập": bấm một bộ để thêm / gỡ bài, hoặc tạo bộ mới
 * rồi thêm luôn. Mở qua MusicLibraryService.openPicker, đặt một lần ở trang.
 */
@Component({
  selector: 'app-music-collection-picker',
  standalone: true,
  imports: [
    NzIconModule,
    NzModalModule,
    TranslateModule,
    MusicCollectionFormComponent,
  ],
  templateUrl: './music-collection-picker.component.html',
  styleUrl: './music-collection-picker.component.scss',
})
export class MusicCollectionPickerComponent {
  readonly library = inject(MusicLibraryService);
  private message = inject(NzMessageService);
  private translate = inject(TranslateService);

  readonly visibilityOption = archiveVisibilityOption;

  collections: IMusicCollection[] = [];
  loading = false;
  loadError = false;
  busyCollectionId = '';
  isFormOpen = false;

  constructor() {
    effect(() => {
      const track = this.library.pickerTrack();
      untracked(() => {
        this.isFormOpen = false;
        if (track) this.load(track);
      });
    });
  }

  get track(): IMusicTrackPreview | null {
    return this.library.pickerTrack();
  }

  load(track: IMusicTrackPreview): void {
    this.loading = true;
    this.loadError = false;
    this.library.myCollections(track).subscribe({
      next: response => {
        this.loading = false;
        this.loadError = !response?.Success;
        this.collections = response?.DataList ?? [];
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      },
    });
  }

  toggle(collection: IMusicCollection): void {
    const track = this.track;
    if (!track || this.busyCollectionId) return;

    this.busyCollectionId = collection.CollectionId;
    if (collection.ContainsTrack) {
      const trackId =
        this.library
          .savedKeys()
          .get(musicTrackKey(track.Provider, track.ExternalId)) ||
        track.TrackId ||
        '';
      this.library
        .removeFromCollection(collection.CollectionId, trackId)
        .subscribe({
          next: response =>
            this.afterToggle(
              collection,
              !!response?.Success,
              false,
              response?.ErrorMessage
            ),
          error: () => this.afterToggle(collection, false, false),
        });
      return;
    }

    this.library.addToCollection(collection.CollectionId, track).subscribe({
      next: response =>
        this.afterToggle(
          collection,
          !!response?.Success,
          true,
          response?.ErrorMessage
        ),
      error: () => this.afterToggle(collection, false, true),
    });
  }

  /** Tạo bộ mới từ modal này thì thêm luôn bài đang chọn vào bộ đó. */
  onCollectionCreated(collection: IMusicCollection): void {
    this.isFormOpen = false;
    this.collections = [
      { ...collection, ContainsTrack: false },
      ...this.collections,
    ];
    this.toggle(this.collections[0]);
  }

  close(): void {
    if (this.busyCollectionId) return;
    this.library.closePicker();
  }

  private afterToggle(
    collection: IMusicCollection,
    success: boolean,
    added: boolean,
    errorMessage?: string
  ): void {
    this.busyCollectionId = '';
    if (!success) {
      this.message.error(
        errorMessage ||
          this.translate.instant('T_MUSIC_COLLECTION_UPDATE_ERROR')
      );
      return;
    }

    this.collections = this.collections.map(c =>
      c.CollectionId === collection.CollectionId
        ? {
            ...c,
            ContainsTrack: added,
            ItemCount: Math.max(0, c.ItemCount + (added ? 1 : -1)),
          }
        : c
    );
    this.message.success(
      this.translate.instant(
        added
          ? 'T_MUSIC_ADDED_TO_COLLECTION'
          : 'T_MUSIC_REMOVED_FROM_COLLECTION',
        { name: collection.Name }
      )
    );
  }
}
