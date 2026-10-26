import { Component, OnDestroy, effect, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MusicLibraryService } from '../../services';

const TOAST_DURATION_MS = 4500;

/** Toast sau khi bấm ♥, có nút "Thêm vào bộ sưu tập" giống TikTok. Đặt một lần ở trang. */
@Component({
  selector: 'app-music-save-toast',
  standalone: true,
  imports: [NzIconModule, TranslateModule],
  template: `
    @if (library.toast(); as toast) {
      <div class="music-toast" role="status">
        <span class="music-toast__art">
          @if (toast.track.ThumbnailUrl) {
            <img [src]="toast.track.ThumbnailUrl" alt="" />
          } @else {
            <span nz-icon nzType="heart" nzTheme="fill"></span>
          }
        </span>
        <span class="music-toast__text">
          {{
            (toast.saved ? 'T_MUSIC_SAVED_TOAST' : 'T_MUSIC_UNSAVED_TOAST')
              | translate
          }}
        </span>
        @if (toast.saved) {
          <button
            type="button"
            class="music-toast__action"
            (click)="library.openPicker(toast.track)">
            {{ 'T_MUSIC_ADD_TO_COLLECTION' | translate }}
          </button>
        }
        <button
          type="button"
          class="music-toast__close"
          [attr.aria-label]="'T_MUSIC_CLOSE' | translate"
          (click)="library.toast.set(null)">
          <span nz-icon nzType="close" nzTheme="outline"></span>
        </button>
      </div>
    }
  `,
  styles: [
    `
      .music-toast {
        position: fixed;
        z-index: 1000;
        bottom: 24px;
        left: 50%;
        display: flex;
        width: max-content;
        max-width: calc(100vw - 32px);
        align-items: center;
        gap: 0.75rem;
        padding: 0.55rem 0.6rem 0.55rem 0.55rem;
        border-radius: 16px;
        background: #1f1b2e;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
        color: #fff;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.8rem;
        transform: translateX(-50%);
        animation: music-toast-in 0.25s ease;
      }

      .music-toast__art {
        display: grid;
        width: 38px;
        height: 38px;
        flex: none;
        place-items: center;
        overflow: hidden;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: #ff4d6d;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .music-toast__text {
        font-weight: 600;
      }

      .music-toast__action {
        padding: 0.45rem 0.8rem;
        border: 0;
        border-radius: 999px;
        background: var(--color-accent);
        color: #fff;
        font-family: inherit;
        font-size: 0.76rem;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
      }

      .music-toast__close {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
      }

      .music-toast button:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }

      @media (max-width: 480px) {
        .music-toast__text {
          display: none;
        }
      }

      @keyframes music-toast-in {
        from {
          opacity: 0;
          transform: translate(-50%, 12px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .music-toast {
          animation: none;
        }
      }
    `,
  ],
})
export class MusicSaveToastComponent implements OnDestroy {
  readonly library = inject(MusicLibraryService);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Mỗi toast mới (kể cả bấm liên tiếp) tính lại thời gian tự ẩn
    effect(() => {
      const toast = this.library.toast();
      clearTimeout(this.timer);
      if (!toast) return;
      this.timer = setTimeout(() => {
        if (this.library.toast() === toast) this.library.toast.set(null);
      }, TOAST_DURATION_MS);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
    this.library.toast.set(null);
  }
}
