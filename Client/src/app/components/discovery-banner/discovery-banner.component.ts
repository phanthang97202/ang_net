import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives';
import { MusicPlayerComponent } from '../music-player/music-player.component';
import { SysParameterConfigService, SYS_PARAM_CODE } from '../../services';
import { IHomeBanner } from '../../interfaces';

// Giá trị mặc định khi tham số HOME_BANNERS chưa được cấu hình ở admin.
const DEFAULT_BANNERS: IHomeBanner[] = [
  {
    title: 'Nhật Ký <span class="accent">Sở Thích</span> Và Đời Thường',
    description:
      'Đây là góc nhỏ của Phan Thang — nơi lưu lại những sở thích, suy nghĩ và trải nghiệm cá nhân trong cuộc sống hằng ngày.',
    image: '/assets/images/bg_banner.avif',
    buttonText: 'Khám phá bài viết',
    buttonLink: '/news',
  },
];

const SLIDE_INTERVAL_MS = 6000;

@Component({
  selector: 'app-discovery-banner',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ScrollRevealDirective,
    MusicPlayerComponent,
  ],
  templateUrl: './discovery-banner.component.html',
  styleUrls: ['./discovery-banner.component.scss'],
})
export class DiscoveryBannerComponent implements OnInit, OnDestroy {
  private config = inject(SysParameterConfigService);

  banners: IHomeBanner[] = DEFAULT_BANNERS;
  activeIndex = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.config
      .getJson<IHomeBanner[]>(SYS_PARAM_CODE.HOME_BANNERS)
      .subscribe(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.banners = data;
          this.activeIndex = 0;
        }
        this.startAutoplay();
      });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  get activeBanner(): IHomeBanner {
    return this.banners[this.activeIndex];
  }

  setActive(index: number): void {
    this.activeIndex = index;
  }

  // trackBy trả về chính activeIndex: khi đổi slide, key đổi -> Angular tạo lại
  // khối chữ -> CSS keyframe (.hero-text-anim) chạy lại tạo hiệu ứng fade/trượt.
  trackByActiveIndex(_: number, value: number): number {
    return value;
  }

  isExternal(link?: string): boolean {
    return /^https?:\/\//i.test(link || '');
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    if (this.banners.length > 1) {
      this.intervalId = setInterval(() => {
        this.activeIndex = (this.activeIndex + 1) % this.banners.length;
      }, SLIDE_INTERVAL_MS);
    }
  }

  private stopAutoplay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
