import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { IYouTubeMusicTrack } from '../../interfaces';
import {
  YOUTUBE_KEY_MISSING,
  YouTubeMusicService,
} from '../../services/youtube-music.service';

@Component({
  selector: 'app-youtube-music',
  standalone: true,
  imports: [CommonModule, NzIconModule, TranslateModule],
  templateUrl: './youtube-music.component.html',
  styleUrls: [
    './music.component.scss',
    './music-list.component.scss',
    './music-search.component.scss',
    './youtube-music.component.scss',
  ],
})
export class YouTubeMusicComponent {
  private readonly api = inject(YouTubeMusicService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  query = '';
  activeQuery = '';
  tracks: IYouTubeMusicTrack[] = [];
  currentTrack: IYouTubeMusicTrack | null = null;
  embedUrl: SafeResourceUrl | null = null;
  searching = false;
  searched = false;
  error = '';

  get currentIndex(): number {
    if (!this.currentTrack) return -1;
    return this.tracks.findIndex(track => track.id === this.currentTrack?.id);
  }

  onInput(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
  }

  submit(event: Event): void {
    event.preventDefault();
    const query = this.query.trim();
    if (!query || this.searching) return;

    this.searching = true;
    this.error = '';
    this.api
      .search(query, 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: tracks => {
          this.tracks = tracks;
          this.activeQuery = query;
          this.searched = true;
          this.searching = false;
        },
        error: (error: unknown) => {
          this.tracks = [];
          this.activeQuery = query;
          this.searched = true;
          this.searching = false;
          this.error =
            error instanceof Error && error.message === YOUTUBE_KEY_MISSING
              ? 'T_MUSIC_YOUTUBE_NOT_CONFIGURED'
              : 'T_MUSIC_YOUTUBE_SEARCH_ERROR';
        },
      });
  }

  clearSearch(): void {
    this.query = '';
    this.activeQuery = '';
    this.tracks = [];
    this.searched = false;
    this.error = '';
  }

  play(track: IYouTubeMusicTrack): void {
    this.currentTrack = track;
    const url =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(track.id)}` +
      `?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}` +
      `&reload=${Date.now()}`;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  hideBrokenThumbnail(track: IYouTubeMusicTrack): void {
    track.thumbnailUrl = '';
  }

  trackById(_index: number, track: IYouTubeMusicTrack): string {
    return track.id;
  }
}
