import { Component, Input, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IMusicTrackPreview } from '../../interfaces';
import { MusicLibraryService } from '../../services';

/**
 * Nút ♥ Lưu / Bỏ lưu của một bài, dùng chung cho kết quả YouTube, Audius và
 * Thư viện. Lưu xong service hiện toast "Thêm vào bộ sưu tập" như TikTok.
 */
@Component({
  selector: 'app-music-save-button',
  standalone: true,
  imports: [NzIconModule, TranslateModule],
  template: `
    <button
      type="button"
      class="music-save"
      [class.is-saved]="saved"
      [disabled]="busy"
      [attr.aria-pressed]="saved"
      [attr.aria-label]="
        (saved ? 'T_MUSIC_UNSAVE_TRACK' : 'T_MUSIC_SAVE_TRACK')
          | translate: { title: track.Title }
      "
      (click)="toggle($event)">
      <span
        nz-icon
        [nzType]="busy ? 'loading' : 'heart'"
        [nzTheme]="saved && !busy ? 'fill' : 'outline'"></span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .music-save {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--color-text-muted);
        font-size: 1.05rem;
        cursor: pointer;
        transition:
          color 0.18s ease,
          background 0.18s ease,
          transform 0.18s ease;

        &:hover:not(:disabled) {
          background: var(--color-accent-bg);
          color: #ff4d6d;
        }

        &.is-saved {
          color: #ff4d6d;
        }

        &.is-saved:not(:disabled) .anticon {
          animation: music-save-pop 0.32s ease;
        }

        &:disabled {
          cursor: progress;
        }

        &:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      }

      @keyframes music-save-pop {
        50% {
          transform: scale(1.3);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .music-save,
        .music-save.is-saved .anticon {
          transition: none;
          animation: none;
        }
      }
    `,
  ],
})
export class MusicSaveButtonComponent {
  @Input({ required: true }) track!: IMusicTrackPreview;

  private library = inject(MusicLibraryService);
  private message = inject(NzMessageService);
  private translate = inject(TranslateService);

  busy = false;

  get saved(): boolean {
    return this.library.isSaved(this.track.Provider, this.track.ExternalId);
  }

  toggle(event: Event): void {
    // Nút nằm trong dòng bài hát: không để click lan ra thành "phát bài"
    event.stopPropagation();
    if (this.busy) return;

    this.busy = true;
    this.library.toggleSave(this.track).subscribe({
      next: () => (this.busy = false),
      error: (error: unknown) => {
        this.busy = false;
        this.message.error(
          (error instanceof Error && error.message) ||
            this.translate.instant('T_MUSIC_SAVE_ERROR')
        );
      },
    });
  }
}
