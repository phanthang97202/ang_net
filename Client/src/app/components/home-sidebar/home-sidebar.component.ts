import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfigSkeletonComponent } from '../config-skeleton/config-skeleton.component';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { SocialLinksComponent } from '../social-links/social-links.component';
import { HotKeywordsComponent } from '../hot-keywords/hot-keywords.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import {
  ApiService,
  LangService,
  SysParameterConfigService,
  SYS_PARAM_CODE,
} from '../../services';
import {
  IHomeIntro,
  ISocialLink,
  IHomeFeaturedImage,
  IHashTagNews,
} from '../../interfaces';

// Giá trị mặc định khi tham số chưa cấu hình ở admin.
const defaultIntro = (translate: TranslateService): IHomeIntro => ({
  name: 'Phan Thang',
  avatar:
    'https://res.cloudinary.com/dumdpgmgs/image/upload/v1784814350/IMG_20230128_191009_apuscf.jpg',
  shortDescription: '09h53 09-07-2002',
  description: translate.instant('T_HOME_INTRO_DEFAULT_DESCRIPTION'),
  address: translate.instant('T_HOME_INTRO_DEFAULT_ADDRESS'),
});

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
    HotKeywordsComponent,
    SocialLinksComponent,
    TranslateModule,
    NzIconModule,
    NzImageModule,
    ConfigSkeletonComponent,
  ],
  templateUrl: './home-sidebar.component.html',
  styleUrls: ['./home-sidebar.component.scss'],
})
export class HomeSidebarComponent implements OnInit, OnDestroy {
  private config = inject(SysParameterConfigService);
  private destroyRef = inject(DestroyRef);
  private imageService = inject(NzImageService);
  private api = inject(ApiService);
  private langService = inject(LangService);
  private translate = inject(TranslateService);

  intro: IHomeIntro = defaultIntro(this.translate);
  socials: ISocialLink[] = DEFAULT_SOCIALS;
  featuredImages: IHomeFeaturedImage[] = DEFAULT_FEATURED;
  introLoading = true;
  socialsLoading = true;
  featuredLoading = true;

  activeIndex = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  // Khối "Từ khóa hot": top hashtag xếp theo số bài đã xuất bản đang dùng.
  hotTags: IHashTagNews[] = [];
  isHotTagsLoading = true;

  ngOnInit(): void {
    this.loadHotTags();

    this.config
      .getJson<IHomeIntro>(SYS_PARAM_CODE.HOME_INTRO)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.intro = data || defaultIntro(this.translate);
        this.introLoading = false;
      });

    this.config
      .getJson<ISocialLink[]>(SYS_PARAM_CODE.SOCIAL_LINKS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.socials =
          Array.isArray(data) && data.length > 0 ? data : DEFAULT_SOCIALS;
        this.socialsLoading = false;
      });

    this.config
      .getJson<IHomeFeaturedImage[]>(SYS_PARAM_CODE.HOME_FEATURED_IMAGES)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.featuredImages =
          Array.isArray(data) && data.length > 0 ? data : DEFAULT_FEATURED;
        this.activeIndex = 0;
        this.featuredLoading = false;
        this.startAutoplay();
      });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  /**
   * Tải lại khi đổi ngôn ngữ: hashtag lưu riêng cho vi/en. Luồng ngôn ngữ là
   * BehaviorSubject nên lần subscribe đầu đã có giá trị, không cần gọi thêm một
   * lần lúc khởi tạo. switchMap huỷ request cũ nếu người dùng đổi ngôn ngữ liên
   * tiếp, tránh kết quả về muộn ghi đè kết quả mới.
   *
   * Lỗi thì ẩn khối thay vì bật popup lỗi như phần lớn trang: đây là khối trang
   * trí ở sidebar, hỏng nó không đáng làm phiền người đang đọc.
   */
  private loadHotTags(): void {
    this.langService.$langSubjectObservable
      .pipe(
        switchMap(lang => {
          this.isHotTagsLoading = true;
          return this.api.GetTopHashTag(lang === 'en' ? 'en' : 'vi').pipe(
            catchError(() => of(null)),
            finalize(() => (this.isHotTagsLoading = false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        this.hotTags = res?.DataList || [];
      });
  }

  setActive(index: number): void {
    this.activeIndex = index;
  }

  // Hai mũi tên trên ảnh. Khởi động lại autoplay sau mỗi lần bấm: không thì
  // interval cũ có thể bắn ngay sau đó và nhảy tiếp một ảnh nữa, người xem chưa
  // kịp nhìn ảnh mình vừa chọn.
  prevSlide(): void {
    const total = this.featuredImages.length;
    if (total < 2) return;
    this.activeIndex = (this.activeIndex - 1 + total) % total;
    this.startAutoplay();
  }

  nextSlide(): void {
    const total = this.featuredImages.length;
    if (total < 2) return;
    this.activeIndex = (this.activeIndex + 1) % total;
    this.startAutoplay();
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
