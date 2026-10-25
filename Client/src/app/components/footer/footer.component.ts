import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  VisitTrackingService,
  SysParameterConfigService,
  SYS_PARAM_CODE,
  AuthService,
} from '../../services';
import { IFooterContent, ISocialLink } from '../../interfaces';
import { SocialLinksComponent } from '../social-links/social-links.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigSkeletonComponent } from '../config-skeleton/config-skeleton.component';

// Admin cấu hình URL này qua SysParameter (FOOTER_MAP_EMBED); chỉ chấp nhận
// đúng dạng URL nhúng Google Maps chính chủ trước khi bypass Angular sanitizer
// cho iframe[src] - nếu không, một giá trị bị nhập sai/độc hại có thể nhúng
// domain tuỳ ý ngay trên trang chính chủ.
const GOOGLE_MAPS_EMBED_PATTERN = /^https:\/\/www\.google\.com\/maps\/embed\?/;

const DEFAULT_SOCIALS: ISocialLink[] = [
  { icon: 'twitter', link: '#' },
  { icon: 'facebook', link: '#' },
  { icon: 'instagram', link: '#' },
  { icon: 'linkedin', link: '#' },
];

const defaultFooterContent = (translate: TranslateService): IFooterContent => ({
  brandName: 'Phan',
  brandAccent: 'Thang',
  tagline: translate.instant('T_FOOTER_DEFAULT_TAGLINE'),
  copyright: translate.instant('T_FOOTER_DEFAULT_COPYRIGHT'),
});

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    SocialLinksComponent,
    TranslateModule,
    ConfigSkeletonComponent,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  private authService = inject(AuthService);
  private visitTrackingService = inject(VisitTrackingService);
  private config = inject(SysParameterConfigService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);
  private translate = inject(TranslateService);

  currentYear = new Date().getFullYear();
  stats$ = this.visitTrackingService.stats$;
  socials: ISocialLink[] = DEFAULT_SOCIALS;
  footerContent: IFooterContent = defaultFooterContent(this.translate);
  contentLoading = true;
  socialsLoading = true;
  mapLoading = true;

  canViewReport(permission: string): boolean {
    return (
      this.authService.isLoggedIn() &&
      this.authService.hasPermission(permission)
    );
  }

  get copyrightText(): string {
    return this.footerContent.copyright.replace(
      /\{year\}/g,
      String(this.currentYear)
    );
  }

  // null = chưa cấu hình hoặc URL không hợp lệ -> template ẩn hẳn khối map
  // thay vì hiện 1 iframe rỗng xấu xí.
  mapEmbedUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    this.config
      .getJson<IFooterContent>(SYS_PARAM_CODE.FOOTER_CONTENT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.footerContent = {
          ...defaultFooterContent(this.translate),
          ...data,
        };
        this.contentLoading = false;
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
      .getText(SYS_PARAM_CODE.FOOTER_MAP_EMBED)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(url => {
        this.mapEmbedUrl =
          url && GOOGLE_MAPS_EMBED_PATTERN.test(url)
            ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
            : null;
        this.mapLoading = false;
      });
  }
}
