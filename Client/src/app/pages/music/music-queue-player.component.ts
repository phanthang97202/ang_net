import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { IMusicLibraryTrack } from '../../interfaces';
import {
  YouTubeIframeApi,
  YouTubePlayerApiService,
  YouTubePlayerInstance,
} from '../../services/youtube-player-api.service';
import { MusicShuffle } from './music-shuffle';

const AUDIUS_STREAM_URL = 'https://api.audius.co/v1/tracks';

/**
 * Trình phát cho danh sách trộn nhiều nguồn (Yêu thích, bộ sưu tập). Mỗi bài
 * chọn "engine" theo Provider: YouTube phát bằng IFrame Player, Audius phát bằng
 * <audio>. Thêm nguồn mới = thêm một nhánh engine ở đây.
 *
 * Bài không phát được (video bị chặn nhúng, file lỗi) thì tự chuyển bài tiếp
 * theo; lỗi liên tiếp hết cả danh sách thì dừng để không lặp vô hạn.
 */
@Component({
  selector: 'app-music-queue-player',
  standalone: true,
  imports: [NzIconModule, TranslateModule],
  templateUrl: './music-queue-player.component.html',
  styleUrls: [
    './music.component.scss',
    './youtube-music.component.scss',
    './music-queue-player.component.scss',
  ],
})
export class MusicQueuePlayerComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() tracks: IMusicLibraryTrack[] = [];
  @Input() index = -1;
  @Input() shuffle = false;
  @Input() shuffleLoading = false;
  @Output() indexChange = new EventEmitter<number>();
  @Output() shuffleChange = new EventEmitter<boolean>();

  @ViewChild('audioRef') private audioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('youtubeFrame')
  private youtubeFrame?: ElementRef<HTMLIFrameElement>;

  private readonly playerApi = inject(YouTubePlayerApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  private player: YouTubePlayerInstance | null = null;
  private playerReady = false;
  private playerInitializing = false;
  private initialVideoId = '';
  private pendingVideoId = '';
  private loadedTrackId = '';
  private consecutiveFailures = 0;
  private viewReady = false;
  private destroyed = false;
  private readonly shuffleOrder = new MusicShuffle();

  embedUrl: SafeResourceUrl | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  error = '';

  get current(): IMusicLibraryTrack | null {
    return this.tracks[this.index] ?? null;
  }

  get canSwitchTrack(): boolean {
    return this.tracks.length > 1;
  }

  get progressPercent(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shuffle'] && !changes['shuffle'].firstChange)
      this.shuffleOrder.reset();
    if (this.viewReady) this.loadCurrent();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.loadCurrent();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.audioRef?.nativeElement.pause();
    this.player?.destroy();
    this.player = null;
  }

  previous(): void {
    if (!this.canSwitchTrack) return;
    if (this.shuffle) {
      const ids = this.tracks
        .filter(track => track.Availability !== 'Unavailable')
        .map(track => track.TrackId);
      const previous = this.shuffleOrder.previous(ids, this.current?.TrackId);
      const index = this.tracks.findIndex(track => track.TrackId === previous);
      if (index >= 0) this.indexChange.emit(index);
      return;
    }
    this.indexChange.emit(
      (this.index - 1 + this.tracks.length) % this.tracks.length
    );
  }

  next(): void {
    if (this.tracks.length === 0) return;
    if (this.shuffle) {
      const ids = this.tracks
        .filter(track => track.Availability !== 'Unavailable')
        .map(track => track.TrackId);
      const next = this.shuffleOrder.next(ids, this.current?.TrackId);
      const index = this.tracks.findIndex(track => track.TrackId === next);
      if (index >= 0) this.indexChange.emit(index);
      return;
    }
    this.indexChange.emit((this.index + 1) % this.tracks.length);
  }

  togglePlay(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || !this.current) return;
    if (this.isPlaying) {
      audio.pause();
      return;
    }
    audio.play().catch(() => (this.isPlaying = false));
  }

  seek(event: Event): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || this.duration <= 0) return;
    const percent = Number((event.target as HTMLInputElement).value);
    audio.currentTime = (percent / 100) * this.duration;
  }

  onLoadedMetadata(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    this.duration = Number.isFinite(audio.duration)
      ? audio.duration
      : (this.current?.DurationSeconds ?? 0);
  }

  onTimeUpdate(): void {
    this.currentTime = this.audioRef?.nativeElement.currentTime ?? 0;
  }

  onAudioPlaying(): void {
    this.isPlaying = true;
    this.consecutiveFailures = 0;
    this.error = '';
  }

  onAudioError(): void {
    // <audio> vẫn bắn error khi bị gỡ src lúc chuyển sang YouTube - bỏ qua trường hợp đó
    if (this.current?.Provider !== 'Audius') return;
    this.isPlaying = false;
    this.skipBrokenTrack();
  }

  hideBrokenArtwork(track: IMusicLibraryTrack): void {
    track.ThumbnailUrl = '';
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  private loadCurrent(): void {
    const track = this.current;
    if (!track) {
      this.loadedTrackId = '';
      this.stopAudio();
      this.destroyYouTube();
      return;
    }
    if (track.TrackId === this.loadedTrackId) return;

    this.loadedTrackId = track.TrackId;
    this.error = '';
    this.currentTime = 0;
    this.duration = track.DurationSeconds ?? 0;

    if (track.Provider === 'YouTube') {
      this.stopAudio();
      this.playYouTube(track.ExternalId);
    } else {
      this.destroyYouTube();
      this.playAudius(track.ExternalId);
    }
  }

  private playAudius(externalId: string): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    audio.src = `${AUDIUS_STREAM_URL}/${encodeURIComponent(externalId)}/stream`;
    audio.load();
    audio.play().catch((error: unknown) => {
      this.isPlaying = false;
      // Trình duyệt chặn tự phát (không có thao tác người dùng): chờ bấm Play,
      // không tính là bài lỗi
      if (error instanceof DOMException && error.name === 'NotAllowedError')
        return;
    });
  }

  private stopAudio(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    this.isPlaying = false;
  }

  private playYouTube(videoId: string): void {
    this.pendingVideoId = videoId;

    if (this.player) {
      if (this.playerReady) this.player.loadVideoById(videoId);
      return;
    }
    if (this.playerInitializing) return;

    this.initialVideoId = videoId;
    const url =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` +
      `?autoplay=1&enablejsapi=1&playsinline=1&rel=0` +
      `&origin=${encodeURIComponent(location.origin)}`;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.changeDetector.detectChanges();
    void this.initializePlayer();
  }

  private destroyYouTube(): void {
    this.player?.destroy();
    this.player = null;
    this.playerReady = false;
    this.embedUrl = null;
  }

  private async initializePlayer(): Promise<void> {
    const frame = this.youtubeFrame?.nativeElement;
    if (!frame || this.playerInitializing) return;

    this.playerInitializing = true;
    try {
      const iframeApi = await this.playerApi.load();
      // Người dùng đã chuyển sang bài Audius trong lúc chờ tải API
      if (this.destroyed || !frame.isConnected) return;

      this.player = new iframeApi.Player(frame, {
        events: {
          onReady: event => this.onPlayerReady(event.target),
          onStateChange: event =>
            this.onPlayerStateChange(iframeApi, event.data),
          onError: () => this.zone.run(() => this.skipBrokenTrack()),
        },
      });
    } catch {
      this.zone.run(() => (this.error = 'T_MUSIC_YOUTUBE_PLAYER_ERROR'));
    } finally {
      this.playerInitializing = false;
    }
  }

  private onPlayerReady(player: YouTubePlayerInstance): void {
    this.zone.run(() => {
      if (this.destroyed || this.player === null) return;
      this.player = player;
      this.playerReady = true;

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
    this.zone.run(() => {
      if (state === iframeApi.PlayerState.PLAYING) {
        this.consecutiveFailures = 0;
        this.error = '';
      } else if (state === iframeApi.PlayerState.ENDED) {
        this.next();
      }
    });
  }

  private skipBrokenTrack(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.tracks.length) {
      this.error = 'T_MUSIC_PLAY_ERROR';
      return;
    }
    this.error = 'T_MUSIC_SKIPPED_UNAVAILABLE';
    this.next();
  }
}
