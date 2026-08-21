import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-music-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.scss'],
})
export class MusicPlayerComponent {
  @Input() title = 'Tên bài hát';
  @Input() artist = 'Nghệ sĩ';
  @Input() albumArt = '';
  @Input() audioSrc = '';

  @ViewChild('audioRef') audioRef!: ElementRef<HTMLAudioElement>;

  isPlaying = false;
  isMuted = false;
  currentTime = 0;
  duration = 0;

  private readonly seekStepSeconds = 10;

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
  }

  onEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  seek(deltaSeconds: number): void {
    if (!this.audioSrc) return;
    const audio = this.audioRef.nativeElement;
    audio.currentTime = Math.min(
      Math.max(audio.currentTime + deltaSeconds, 0),
      this.duration || 0
    );
  }

  seekBack(): void {
    this.seek(-this.seekStepSeconds);
  }

  seekForward(): void {
    this.seek(this.seekStepSeconds);
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
}
