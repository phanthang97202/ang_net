import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SocialLinksComponent } from '../social-links/social-links.component';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
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
  // NzImageModule phải nằm ở đây dù template không dùng thẻ nz-image nào:
  // NzImageService không khai providedIn:'root' mà được cấp qua providers của
  // module, thiếu nó là inject ra NullInjectorError.
  imports: [
    CommonModule,
    SocialLinksComponent,
    TranslateModule,
    NzIconModule,
    NzImageModule,
  ],
  templateUrl: './home-sidebar.component.html',
  styleUrls: ['./home-sidebar.component.scss'],
})
export class HomeSidebarComponent implements OnInit, OnDestroy {
  private config = inject(SysParameterConfigService);
  private destroyRef = inject(DestroyRef);
  private imageService = inject(NzImageService);

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
    this.stopAutoplay();
  }

  setActive(index: number): void {
    this.activeIndex = index;
  }

  // Mở lightbox với CẢ danh sách ảnh chứ không riêng ảnh đang hiện, để người xem
  // lật qua lại giữa các ảnh nổi bật ngay trong đó. Autoplay phải dừng lúc này:
  // không dừng thì slide dưới nền vẫn chạy, đóng lightbox ra là thấy ảnh đã nhảy
  // sang tấm khác so với lúc bấm mở.
  openPreview(): void {
    this.stopAutoplay();

    const ref = this.imageService.preview(
      this.featuredImages.map(img => ({
        src: img.image,
        alt: img.caption,
      }))
    );
    ref.switchTo(this.activeIndex);

    // Không dùng closeClick: nó chỉ bắn khi bấm nút X, còn đóng bằng phím Esc hay
    // click ra nền thì không, và autoplay sẽ chết luôn. animationStateChanged bắt
    // được cả ba vì kiểu đóng nào cũng chạy qua animation 'leave'.
    // takeUntilDestroyed để rời trang lúc lightbox còn mở thì không bị startAutoplay()
    // dựng lại interval trên component đã huỷ.
    const instance = ref.previewInstance;
    instance.animationStateChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.phaseName !== 'done' || event.toState !== 'void') return;

        // Ảnh người xem dừng lại trong lightbox trở thành slide đang hiện, đóng ra
        // không bị giật về tấm cũ.
        this.activeIndex = instance.index;
        this.startAutoplay();
      });
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    if (this.featuredImages.length > 1) {
      this.intervalId = setInterval(() => this.goToNext(), SLIDE_INTERVAL_MS);
    }
  }

  private stopAutoplay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private goToNext(): void {
    this.activeIndex = (this.activeIndex + 1) % this.featuredImages.length;
  }
}
