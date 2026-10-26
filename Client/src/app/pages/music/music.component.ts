import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { IMusicTrack } from '../../interfaces';
import { AudiusMusicService } from '../../services';

@Component({
  selector: 'app-music',
  standalone: true,
  imports: [CommonModule, NzIconModule, TranslateModule],
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss', './music-list.component.scss'],
})
export class MusicComponent {
  private readonly musicService = inject(AudiusMusicService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('audioRef') private audioRef?: ElementRef<HTMLAudioElement>;

  tracks: IMusicTrack[] = [];
  currentIndex = 0;
  loading = true;
  error = '';
  playbackError = '';
  isPlaying = false;
  isMuted = false;
  currentTime = 0;
  duration = 0;

  constructor() {
    this.loadTracks();
  }

  get currentTrack(): IMusicTrack | null {
    return this.tracks[this.currentIndex] ?? null;
  }

  get canSwitchTrack(): boolean {
    return this.tracks.length > 1;
  }

  get progressPercent(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }

  get remainingTimeLabel(): string {
    return `-${this.formatTime(Math.max(this.duration - this.currentTime, 0))}`;
  }

  loadTracks(refresh = false): void {
    this.loading = true;
    this.error = '';

    this.musicService
      .getTrending(20, refresh)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: tracks => {
          this.tracks = tracks;
          this.currentIndex = 0;
          this.resetPlayback();
          if (tracks.length === 0) this.error = 'T_MUSIC_EMPTY';
        },
        error: () => (this.error = 'T_MUSIC_LOAD_ERROR'),
      });
  }

  selectTrack(index: number): void {
    if (!this.tracks[index]) return;
    if (index === this.currentIndex) {
      this.togglePlay();
      return;
    }

    this.openTrack(index, true);
  }

  togglePlay(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || !this.currentTrack) return;

    this.playbackError = '';
    if (this.isPlaying) {
      audio.pause();
      return;
    }

    audio.play().catch(() => {
      this.isPlaying = false;
      this.playbackError = 'T_MUSIC_PLAY_ERROR';
    });
  }

  previousTrack(): void {
    this.openRelativeTrack(-1);
  }

  nextTrack(): void {
    this.openRelativeTrack(1);
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.audioRef) this.audioRef.nativeElement.muted = this.isMuted;
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
      : (this.currentTrack?.durationSeconds ?? 0);
  }

  onTimeUpdate(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    this.currentTime = audio.currentTime;
  }

  onPlay(): void {
    this.isPlaying = true;
    this.playbackError = '';
  }

  onPause(): void {
    this.isPlaying = false;
  }

  onEnded(): void {
    this.openRelativeTrack(1);
  }

  onPlaybackError(): void {
    this.isPlaying = false;
    this.playbackError = 'T_MUSIC_PLAY_ERROR';
  }

  hideBrokenArtwork(track: IMusicTrack): void {
    track.artworkUrl = '';
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  trackById(_index: number, track: IMusicTrack): string {
    return track.id;
  }

  private openRelativeTrack(offset: number): void {
    if (!this.canSwitchTrack) return;
    const index =
      (this.currentIndex + offset + this.tracks.length) % this.tracks.length;
    this.openTrack(index, true);
  }

  private openTrack(index: number, autoPlay: boolean): void {
    const track = this.tracks[index];
    const audio = this.audioRef?.nativeElement;
    if (!track || !audio) return;

    this.currentIndex = index;
    this.resetPlayback();
    audio.src = track.streamUrl;
    audio.load();
    if (autoPlay) {
      audio.play().catch(() => {
        this.isPlaying = false;
        this.playbackError = 'T_MUSIC_PLAY_ERROR';
      });
    }
  }

  private resetPlayback(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = this.currentTrack?.durationSeconds ?? 0;
    this.playbackError = '';
  }
}
