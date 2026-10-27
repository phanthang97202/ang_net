import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MusicSaveButtonComponent } from '../../components/music-library/music-save-button.component';
import { IMusicTrackPreview, IYouTubeMusicTrack } from '../../interfaces';
import { MusicLibraryService } from '../../services/music-library.service';
import { MusicShuffle } from './music-shuffle';
import {
  YOUTUBE_KEY_MISSING,
  YouTubeMusicService,
} from '../../services/youtube-music.service';
import {
  YouTubeIframeApi,
  YouTubePlayerApiService,
  YouTubePlayerInstance,
} from '../../services/youtube-player-api.service';

@Component({
  selector: 'app-youtube-music',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    TranslateModule,
    MusicSaveButtonComponent,
  ],
  templateUrl: './youtube-music.component.html',
  styleUrls: [
    './music.component.scss',
    './music-list.component.scss',
    './music-search.component.scss',
    './youtube-music.component.scss',
  ],
})
export class YouTubeMusicComponent implements OnDestroy {
  private readonly api = inject(YouTubeMusicService);
  private readonly playerApi = inject(YouTubePlayerApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly library = inject(MusicLibraryService);
  private readonly previews = new WeakMap<
    IYouTubeMusicTrack,
    IMusicTrackPreview
  >();

  @ViewChild('youtubeFrame')
  private youtubeFrame?: ElementRef<HTMLIFrameElement>;

  private player: YouTubePlayerInstance | null = null;
  private playerReady = false;
  private playerInitializing = false;
  private initialVideoId = '';
  private pendingVideoId = '';
  private destroyed = false;
  private readonly shuffleOrder = new MusicShuffle();
  shuffle = false;

  query = '';
  activeQuery = '';
  tracks: IYouTubeMusicTrack[] = [];
  currentTrack: IYouTubeMusicTrack | null = null;
  embedUrl: SafeResourceUrl | null = null;
  searching = false;
  searched = false;
  error = '';
  playerError = '';

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
          this.library.refreshSaveState(
            tracks.map(track => ({ Provider: 'YouTube', ExternalId: track.id }))
          );
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
    this.pendingVideoId = track.id;
    this.playerError = '';

    if (this.player) {
      if (this.playerReady) this.player.loadVideoById(track.id);
      return;
    }

    if (this.playerInitializing) return;

    this.initialVideoId = track.id;
    const url =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(track.id)}` +
      `?autoplay=1&enablejsapi=1&playsinline=1&rel=0` +
      `&origin=${encodeURIComponent(location.origin)}`;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.changeDetector.detectChanges();
    void this.initializePlayer();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.player?.destroy();
    this.player = null;
  }

  /** Cùng một object cho mỗi bài để nút ♥ không nhận input mới ở mỗi lượt change detection. */
  savePreview(track: IYouTubeMusicTrack): IMusicTrackPreview {
    let preview = this.previews.get(track);
    if (!preview) {
      preview = {
        Provider: 'YouTube',
        ExternalId: track.id,
        Title: track.title,
        Artist: track.artist,
        ThumbnailUrl: track.thumbnailUrl,
      };
      this.previews.set(track, preview);
    }
    return preview;
  }

  hideBrokenThumbnail(track: IYouTubeMusicTrack): void {
    track.thumbnailUrl = '';
  }

  trackById(_index: number, track: IYouTubeMusicTrack): string {
    return track.id;
  }

  private async initializePlayer(): Promise<void> {
    const frame = this.youtubeFrame?.nativeElement;
    if (!frame || this.playerInitializing) return;

    this.playerInitializing = true;
    try {
      const iframeApi = await this.playerApi.load();
      if (this.destroyed || !frame.isConnected) return;

      this.player = new iframeApi.Player(frame, {
        events: {
          onReady: event => this.onPlayerReady(event.target),
          onStateChange: event =>
            this.onPlayerStateChange(iframeApi, event.data),
          onError: () => this.onPlayerError(),
        },
      });
    } catch {
      this.zone.run(() => (this.playerError = 'T_MUSIC_YOUTUBE_PLAYER_ERROR'));
    } finally {
      this.playerInitializing = false;
    }
  }

  private onPlayerReady(player: YouTubePlayerInstance): void {
    this.zone.run(() => {
      if (this.destroyed) return;
      this.player = player;
      this.playerReady = true;
      this.playerError = '';

      if (this.pendingVideoId !== this.initialVideoId) {
        player.loadVideoById(this.pendingVideoId);
        return;
      }

      player.playVideo();
    });
  }

  private onPlayerStateChange(
    iframeApi: YouTubeIframeApi,
    state: number
  ): void {
    if (state !== iframeApi.PlayerState.ENDED) return;
    this.zone.run(() => this.playNextTrack());
  }

  private onPlayerError(): void {
    this.zone.run(() => (this.playerError = 'T_MUSIC_YOUTUBE_PLAYER_ERROR'));
  }

  toggleShuffle(): void {
    this.shuffle = !this.shuffle;
    this.shuffleOrder.reset();
  }

  shuffleResults(): void {
    if (this.shuffle) {
      this.toggleShuffle();
      return;
    }
    if (!this.tracks.length) return;
    this.toggleShuffle();
    const id = this.shuffleOrder.next(
      this.tracks.map(track => track.id),
      this.currentTrack?.id
    );
    const track = this.tracks.find(item => item.id === id);
    if (track) this.play(track);
  }

  previousTrack(): void {
    if (!this.tracks.length) return;
    const id = this.shuffle
      ? this.shuffleOrder.previous(
          this.tracks.map(track => track.id),
          this.currentTrack?.id
        )
      : this.tracks[
          (this.currentIndex <= 0 ? this.tracks.length : this.currentIndex) - 1
        ]?.id;
    const track = this.tracks.find(item => item.id === id);
    if (track) this.play(track);
  }

  playNextTrack(): void {
    if (this.tracks.length === 0) return;
    if (this.shuffle) {
      const id = this.shuffleOrder.next(
        this.tracks.map(track => track.id),
        this.currentTrack?.id
      );
      const track = this.tracks.find(item => item.id === id);
      if (track) this.play(track);
      return;
    }
    const nextIndex =
      this.currentIndex < 0 ? 0 : (this.currentIndex + 1) % this.tracks.length;
    const nextTrack = this.tracks[nextIndex];
    if (nextTrack) this.play(nextTrack);
  }
}
