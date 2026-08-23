import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IReelDto, IReelMediaDto } from '../../../../interfaces';

@Component({
  selector: 'app-reel-item',
  standalone: true,
  imports: [NzIconModule],
  templateUrl: './reel-item.component.html',
  styleUrl: './reel-item.component.scss',
})
export class ReelItemComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) reel!: IReelDto;
  @Input() isActive = false;
  @Input() isMuted = true;
  @Input() isMounted = false;

  @Output() likeToggled = new EventEmitter<IReelDto>();
  @Output() muteToggled = new EventEmitter<void>();
  // Tách riêng khỏi likeToggled: double-tap của TikTok chỉ THÍCH, không bao giờ bỏ thích
  @Output() doubleTapLiked = new EventEmitter<IReelDto>();
  @Output() commentsOpened = new EventEmitter<IReelDto>();

  @ViewChild('videoRef') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('slideTrack') slideTrack?: ElementRef<HTMLElement>;

  isPlaying = false;
  showHeartBurst = false;
  slideIndex = 0;

  private singleTapTimer?: ReturnType<typeof setTimeout>;
  private heartBurstTimer?: ReturnType<typeof setTimeout>;
  private readonly doubleTapDelayMs = 250;

  get isVideo(): boolean {
    return this.reel.MediaType === 'Video';
  }

  get mediaUrl(): string {
    return this.reel.Media?.[0]?.MediaUrl ?? '';
  }

  /** Ảnh trong bài, đã sắp theo SortOrder từ server */
  get images(): IReelMediaDto[] {
    return this.reel.Media ?? [];
  }

  get hasMultipleImages(): boolean {
    return !this.isVideo && this.images.length > 1;
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
    // Rời khỏi màn hình thì trả carousel về ảnh đầu, giống video được tua về 0
    if (changes['isActive'] && !this.isActive && this.slideIndex !== 0) {
      this.slideIndex = 0;
      this.slideTrack?.nativeElement.scrollTo({ left: 0 });
    }

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

  ngOnDestroy(): void {
    clearTimeout(this.singleTapTimer);
    clearTimeout(this.heartBurstTimer);
  }

  /**
   * Nháy đơn = play/pause, nháy đúp = thả tim. Phải hoãn nháy đơn lại một nhịp,
   * nếu không nháy đúp sẽ chạy play -> pause -> play trước khi kịp nhận ra là double-tap.
   */
  onStageTap(): void {
    if (this.singleTapTimer) {
      clearTimeout(this.singleTapTimer);
      this.singleTapTimer = undefined;
      this.onDoubleTap();
      return;
    }

    this.singleTapTimer = setTimeout(() => {
      this.singleTapTimer = undefined;
      this.togglePlay();
    }, this.doubleTapDelayMs);
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

  private onDoubleTap(): void {
    this.playHeartBurst();
    // Đã thích rồi thì chỉ chạy hiệu ứng, không gọi API để tránh bị bỏ thích
    if (!this.reel.IsLikedByMe) {
      this.doubleTapLiked.emit(this.reel);
    }
  }

  private playHeartBurst(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    clearTimeout(this.heartBurstTimer);
    // Tắt rồi bật lại để chạy lại animation khi nháy đúp liên tiếp
    this.showHeartBurst = false;
    requestAnimationFrame(() => {
      this.showHeartBurst = true;
      this.heartBurstTimer = setTimeout(() => {
        this.showHeartBurst = false;
      }, 800);
    });
  }

  // ── Carousel ảnh ────────────────────────────────────────────────────
  // Cuộn ngang bằng CSS scroll-snap nên vuốt trên cảm ứng chạy sẵn, không cần
  // thư viện gesture; nút mũi tên chỉ việc scroll tới đúng slide.

  goToSlide(index: number, event?: Event): void {
    event?.stopPropagation();

    const track = this.slideTrack?.nativeElement;
    const clamped = Math.min(Math.max(index, 0), this.images.length - 1);
    this.slideIndex = clamped;
    track?.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  }

  prevSlide(event: Event): void {
    this.goToSlide(this.slideIndex - 1, event);
  }

  nextSlide(event: Event): void {
    this.goToSlide(this.slideIndex + 1, event);
  }

  /** Đồng bộ chấm chỉ báo khi người dùng tự vuốt thay vì bấm nút */
  onTrackScroll(): void {
    const track = this.slideTrack?.nativeElement;
    if (!track || track.clientWidth === 0) {
      return;
    }
    this.slideIndex = Math.round(track.scrollLeft / track.clientWidth);
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

  onOpenComments(): void {
    this.commentsOpened.emit(this.reel);
  }

  // stopPropagation: nút nằm đè lên stage, không được kích hoạt play/pause của stage
  onMute(event: Event): void {
    event.stopPropagation();
    this.muteToggled.emit();
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
