import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IReelDto } from '../../../../interfaces';

@Component({
  selector: 'app-reel-item',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './reel-item.component.html',
  styleUrl: './reel-item.component.scss',
})
export class ReelItemComponent implements OnChanges {
  @Input({ required: true }) reel!: IReelDto;
  @Input() isActive = false;
  @Input() isMuted = true;
  @Input() isMounted = false;

  @Output() likeToggled = new EventEmitter<IReelDto>();

  @ViewChild('videoRef') videoRef?: ElementRef<HTMLVideoElement>;

  isPlaying = false;

  get isVideo(): boolean {
    return this.reel.MediaType === 'Video';
  }

  get mediaUrl(): string {
    return this.reel.Media?.[0]?.MediaUrl ?? '';
  }

  // Trả về null khi rỗng: bind chuỗi rỗng vào src/poster khiến trình duyệt
  // tải lại chính trang hiện tại rồi vẽ icon ảnh vỡ.
  get coverUrl(): string | null {
    return this.reel.CoverUrl || null;
  }

  get avatarUrl(): string | null {
    return this.reel.UserAvatar || null;
  }

  get authorInitial(): string {
    return (this.reel.UserFullName || '?').charAt(0).toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const video = this.videoRef?.nativeElement;
    if (!this.isVideo || !video) {
      return;
    }

    // Mute do [muted] trong template lo, ở đây chỉ điều khiển play/pause
    if (changes['isActive']) {
      if (this.isActive) {
        video.play().catch(() => {
          // Trình duyệt chặn autoplay: bỏ qua, không cần báo lỗi cho người dùng
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }
  }

  onCanPlay(): void {
    if (this.isActive) {
      this.videoRef?.nativeElement.play().catch(() => {
          // Trình duyệt chặn autoplay: bỏ qua, không cần báo lỗi cho người dùng
        });
    }
  }

  togglePlay(): void {
    const video = this.videoRef?.nativeElement;
    if (!this.isVideo || !video) {
      return;
    }
    if (video.paused) {
      video.play().catch(() => {
          // Trình duyệt chặn autoplay: bỏ qua, không cần báo lỗi cho người dùng
        });
    } else {
      video.pause();
    }
  }

  onPlay(): void {
    this.isPlaying = true;
  }

  onPause(): void {
    this.isPlaying = false;
  }

  onLike(): void {
    this.likeToggled.emit(this.reel);
  }

  formatCount(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
    }
    return `${value ?? 0}`;
  }
}
