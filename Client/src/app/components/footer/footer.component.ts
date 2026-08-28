import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  VisitTrackingService,
  SysParameterConfigService,
  SYS_PARAM_CODE,
} from '../../services';
import { ISocialLink } from '../../interfaces';
import { SocialLinksComponent } from '../social-links/social-links.component';
import { TranslateModule } from '@ngx-translate/core';

const DEFAULT_SOCIALS: ISocialLink[] = [
  { icon: 'twitter', link: '#' },
  { icon: 'facebook', link: '#' },
  { icon: 'instagram', link: '#' },
  { icon: 'linkedin', link: '#' },
];

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule, SocialLinksComponent, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  private visitTrackingService = inject(VisitTrackingService);
  private config = inject(SysParameterConfigService);
  private destroyRef = inject(DestroyRef);

  currentYear = new Date().getFullYear();
  stats$ = this.visitTrackingService.stats$;
  socials: ISocialLink[] = DEFAULT_SOCIALS;

  ngOnInit(): void {
    this.config
      .getJson<ISocialLink[]>(SYS_PARAM_CODE.SOCIAL_LINKS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.socials = data;
        }
      });
  }
}
