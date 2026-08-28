import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SocialLinksComponent } from '../social-links/social-links.component';
import { TranslateModule } from '@ngx-translate/core';
import { SysParameterConfigService, SYS_PARAM_CODE } from '../../services';
import {
  IHomeIntro,
  ISocialLink,
  IHomeFeaturedImage,
} from '../../interfaces';

// Giá trị mặc định khi tham số chưa cấu hình ở admin.
const DEFAULT_INTRO: IHomeIntro = {
  name: 'Phan Thang',
  avatar:
    'https://res.cloudinary.com/dumdpgmgs/image/upload/v1784814350/IMG_20230128_191009_apuscf.jpg',
  shortDescription: '09h53 09-07-2002',
  description:
    'Phan Thang chia sẻ những suy nghĩ, trải nghiệm cuộc sống và góc nhìn cá nhân về công việc, sáng tạo và sự trưởng thành mỗi ngày.',
  address: 'Hà Nam City',
};

const DEFAULT_SOCIALS: ISocialLink[] = [
  { icon: 'twitter', link: '#' },
  { icon: 'facebook', link: '#' },
  { icon: 'instagram', link: '#' },
  { icon: 'linkedin', link: '#' },
];

const DEFAULT_FEATURED: IHomeFeaturedImage[] = [
  {
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGftRBcqFNiokLou_wbwK9TTFsi01_MJsiIFce931rsiMDsxCCaN2bUA&s=10',
    caption: 'GOAT 7',
  },
  {
    image:
      'https://cdn-img.thethao247.vn/origin_640x0/storage/files/nhatbinh02112002/2026/05/29/anh-66-6a19a66910e99.jpg',
    caption: '09h53',
  },
  {
    image:
      'https://static.bongda24h.vn/medias/standard/2016/7/11/vck-euro-2016-hinh-nhu-co-gi-do-sai-sai.jpg',
    caption: 'EURO 2016',
  },
];

const SLIDE_INTERVAL_MS = 4000;

@Component({
  selector: 'app-home-sidebar',
  standalone: true,
  imports: [CommonModule, SocialLinksComponent, TranslateModule],
  templateUrl: './home-sidebar.component.html',
  styleUrls: ['./home-sidebar.component.scss'],
})
export class HomeSidebarComponent implements OnInit, OnDestroy {
  private config = inject(SysParameterConfigService);
  private destroyRef = inject(DestroyRef);

  intro: IHomeIntro = DEFAULT_INTRO;
  socials: ISocialLink[] = DEFAULT_SOCIALS;
  featuredImages: IHomeFeaturedImage[] = DEFAULT_FEATURED;

  activeIndex = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.config
      .getJson<IHomeIntro>(SYS_PARAM_CODE.HOME_INTRO)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (data) {
          this.intro = data;
        }
      });

    this.config
      .getJson<ISocialLink[]>(SYS_PARAM_CODE.SOCIAL_LINKS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.socials = data;
        }
      });

    this.config
      .getJson<IHomeFeaturedImage[]>(SYS_PARAM_CODE.HOME_FEATURED_IMAGES)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.featuredImages = data;
          this.activeIndex = 0;
        }
        this.startAutoplay();
      });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  setActive(index: number): void {
    this.activeIndex = index;
  }

  private startAutoplay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.featuredImages.length > 1) {
      this.intervalId = setInterval(() => this.goToNext(), SLIDE_INTERVAL_MS);
    }
  }

  private goToNext(): void {
    this.activeIndex = (this.activeIndex + 1) % this.featuredImages.length;
  }
}
