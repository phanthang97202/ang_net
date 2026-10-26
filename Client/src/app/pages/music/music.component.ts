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
import {
  Subject,
  catchError,
  debounceTime,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { IMusicTrack } from '../../interfaces';
import { AudiusMusicService } from '../../services';
import { YouTubeMusicComponent } from './youtube-music.component';

@Component({
  selector: 'app-music',
  standalone: true,
  imports: [CommonModule, NzIconModule, TranslateModule, YouTubeMusicComponent],
  templateUrl: './music.component.html',
  styleUrls: [
    './music.component.scss',
    './music-list.component.scss',
    './music-search.component.scss',
  ],
})
export class MusicComponent {
  private readonly musicService = inject(AudiusMusicService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  @ViewChild('audioRef') private audioRef?: ElementRef<HTMLAudioElement>;

  tracks: IMusicTrack[] = [];
  musicSource: 'audius' | 'youtube' = 'audius';
  currentTrack: IMusicTrack | null = null;
  loading = true;
  searching = false;
  error = '';
  listError = '';
  playbackError = '';
  searchKeyword = '';
  activeQuery = '';
  isPlaying = false;
  isMuted = false;
  currentTime = 0;
  duration = 0;

  constructor() {
    this.searchTerms
      .pipe(
        map(query => query.trim()),
        debounceTime(350),
        tap(() => {
          this.searching = true;
          this.listError = '';
        }),
        switchMap(query => {
          const request = query
            ? this.musicService.searchTracks(query, 20)
            : this.musicService.getTrending(20);

          return request.pipe(
            map(tracks => ({ query, tracks, error: '' })),
            catchError(() =>
              of({
                query,
                tracks: [] as IMusicTrack[],
                error: 'T_MUSIC_SEARCH_ERROR',
              })
            )
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        // Bo qua response cu neu nguoi dung da go sang tu khoa khac trong luc
        // request truoc dang tra ve.
        if (result.query !== this.searchKeyword.trim()) return;
        this.searching = false;
        this.activeQuery = result.query;
        this.tracks = result.tracks;
        this.listError = result.error;
      });

    this.loadTracks();
  }

  get currentIndex(): number {
    if (!this.currentTrack) return -1;
    return this.tracks.findIndex(track => track.id === this.currentTrack?.id);
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
          this.currentTrack = tracks[0] ?? null;
          this.activeQuery = '';
          this.resetPlayback();
          if (tracks.length === 0) this.error = 'T_MUSIC_EMPTY';
        },
        error: () => (this.error = 'T_MUSIC_LOAD_ERROR'),
      });
  }

  selectTrack(index: number): void {
    const track = this.tracks[index];
    if (!track) return;

    if (track.id === this.currentTrack?.id) {
      this.playCurrentTrack();
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

    this.playCurrentTrack();
  }

  onSearchInput(event: Event): void {
    this.searchKeyword = (event.target as HTMLInputElement).value;
    this.searchTerms.next(this.searchKeyword);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    this.searchTerms.next(this.searchKeyword);
  }

  clearSearch(): void {
    if (!this.searchKeyword && !this.activeQuery) return;
    this.searchKeyword = '';
    this.searchTerms.next('');
  }

  selectMusicSource(source: 'audius' | 'youtube'): void {
    if (source === this.musicSource) return;
    this.audioRef?.nativeElement.pause();
    this.isPlaying = false;
    this.musicSource = source;
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
    const currentIndex = this.currentIndex;
    const baseIndex = currentIndex >= 0 ? currentIndex : offset > 0 ? -1 : 0;
    const index =
      (baseIndex + offset + this.tracks.length) % this.tracks.length;
    this.openTrack(index, true);
  }

  private openTrack(index: number, autoPlay: boolean): void {
    const track = this.tracks[index];
    const audio = this.audioRef?.nativeElement;
    if (!track || !audio) return;

    this.currentTrack = track;
    this.resetPlayback();
    audio.src = track.streamUrl;
    audio.load();
    if (autoPlay) {
      this.playCurrentTrack();
    }
  }

  private playCurrentTrack(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio || !this.currentTrack || this.isPlaying) return;

    this.playbackError = '';
    audio.play().catch(() => {
      this.isPlaying = false;
      this.playbackError = 'T_MUSIC_PLAY_ERROR';
    });
  }

  private resetPlayback(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = this.currentTrack?.durationSeconds ?? 0;
    this.playbackError = '';
  }
}
