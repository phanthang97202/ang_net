import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { SysParameterConfigService, SYS_PARAM_CODE } from '../../services';
import { IHomeSong } from '../../interfaces';

// Dùng khi tham số HOME_MUSIC chưa được cấu hình ở admin.
const DEFAULT_PLAYLIST: IHomeSong[] = [
  {
    id: 'moi-duyen-vang',
    title: 'Mối duyên vàng',
    artist: 'Tuấn Cry, Võ Thu Hà',
    albumArt: 'assets/images/moi_duyen_vang.webp',
    audioSrc: 'assets/music/moi_duyen_vang.mp3',
  },
];

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.scss'],
})
export class MusicPlayerComponent implements OnInit {
  private config = inject(SysParameterConfigService);

  @ViewChild('audioRef') audioRef!: ElementRef<HTMLAudioElement>;

  playlist: IHomeSong[] = DEFAULT_PLAYLIST;
  currentIndex = 0;

  isPlaying = false;
  isMuted = false;
  currentTime = 0;
  duration = 0;

  // Đổi bài chỉ đổi [src]; phải đợi audio nạp xong metadata mới play() được.
  private pendingAutoPlay = false;

  ngOnInit(): void {
    // Cả 2 lời gọi đọc chung một response đã cache trong service nên chỉ có
    // đúng một request đi ra.
    combineLatest([
      this.config.getJson<IHomeSong[]>(SYS_PARAM_CODE.HOME_MUSIC),
      this.config.getDefaultText(SYS_PARAM_CODE.HOME_MUSIC),
    ]).subscribe(([songs, defaultId]) => {
      const valid = (songs ?? []).filter(song => song?.audioSrc);
      if (valid.length > 0) {
        this.playlist = valid;
      }

      // DefaultValueVi chứa id của bài mặc định. Sai id hoặc bỏ trống thì lấy
      // bài đầu danh sách.
      const index = this.playlist.findIndex(
        song => song.id === (defaultId ?? '').trim()
      );
      this.currentIndex = index >= 0 ? index : 0;
    });
  }

  get currentSong(): IHomeSong | undefined {
    return this.playlist[this.currentIndex];
  }

  get title(): string {
    return this.currentSong?.title ?? '';
  }

  get artist(): string {
    return this.currentSong?.artist ?? '';
  }

  get albumArt(): string {
    return this.currentSong?.albumArt ?? '';
  }

  get audioSrc(): string {
    return this.currentSong?.audioSrc ?? '';
  }

  // Một bài thì 2 nút chuyển bài không có tác dụng gì.
  get canSwitchTrack(): boolean {
    return this.playlist.length > 1;
  }

  get progressPercent(): number {
    return this.duration ? (this.currentTime / this.duration) * 100 : 0;
  }

  get remainingTimeLabel(): string {
    const remaining = Math.max((this.duration || 0) - this.currentTime, 0);
    return `-${this.formatTime(remaining)}`;
  }

  togglePlay(): void {
    if (!this.audioSrc) return;
    const audio = this.audioRef.nativeElement;
    if (this.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  prevTrack(): void {
    this.goTo(this.currentIndex - 1);
  }

  nextTrack(): void {
    this.goTo(this.currentIndex + 1);
  }

  onPlay(): void {
    this.isPlaying = true;
  }

  onPause(): void {
    this.isPlaying = false;
  }

  onTimeUpdate(): void {
    this.currentTime = this.audioRef.nativeElement.currentTime;
  }

  onLoadedMetadata(): void {
    this.duration = this.audioRef.nativeElement.duration;
    if (!this.pendingAutoPlay) return;
    this.pendingAutoPlay = false;
    // play() trả về Promise và bị từ chối nếu trình duyệt chặn tự phát.
    this.audioRef.nativeElement.play().catch(() => (this.isPlaying = false));
  }

  onEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    if (this.canSwitchTrack) {
      this.goTo(this.currentIndex + 1, true);
    }
  }

  onSeekBarChange(event: Event): void {
    if (!this.audioSrc || !this.duration) return;
    const value = Number((event.target as HTMLInputElement).value);
    this.audioRef.nativeElement.currentTime = (value / 100) * this.duration;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.audioRef) {
      this.audioRef.nativeElement.muted = this.isMuted;
    }
  }

  formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Quay vòng ở cả hai đầu danh sách. autoPlay mặc định bám theo trạng thái
  // hiện tại: đang phát thì đổi bài xong phát tiếp, đang dừng thì vẫn dừng.
  private goTo(index: number, autoPlay = this.isPlaying): void {
    const total = this.playlist.length;
    if (total <= 1) return;

    this.currentIndex = ((index % total) + total) % total;
    this.currentTime = 0;
    this.duration = 0;
    this.pendingAutoPlay = autoPlay;
  }
}
