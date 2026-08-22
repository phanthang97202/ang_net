import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  VisitTrackingService,
  SysParameterConfigService,
  SYS_PARAM_CODE,
} from '../../services';
import { ISocialLink } from '../../interfaces';
import { SocialLinksComponent } from '../social-links/social-links.component';

const DEFAULT_SOCIALS: ISocialLink[] = [
  { icon: 'twitter', link: '#' },
  { icon: 'facebook', link: '#' },
  { icon: 'instagram', link: '#' },
  { icon: 'linkedin', link: '#' },
];

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule, SocialLinksComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  private visitTrackingService = inject(VisitTrackingService);
  private config = inject(SysParameterConfigService);

  currentYear = new Date().getFullYear();
  stats$ = this.visitTrackingService.stats$;
  socials: ISocialLink[] = DEFAULT_SOCIALS;

  ngOnInit(): void {
    this.config
      .getJson<ISocialLink[]>(SYS_PARAM_CODE.SOCIAL_LINKS)
      .subscribe(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.socials = data;
        }
      });
  }
}
