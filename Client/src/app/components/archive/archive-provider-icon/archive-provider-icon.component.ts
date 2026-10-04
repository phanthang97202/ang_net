import { Component, Input } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TArchiveItemKind, TArchiveProvider } from '../../../interfaces';

/** Biểu tượng nguồn của một mục. Bộ icon ng-zorro không có TikTok nên tự vẽ. */
@Component({
  selector: 'app-archive-provider-icon',
  standalone: true,
  imports: [NzIconModule],
  template: `
    @switch (provider) {
      @case ('YouTube') {
        <span nz-icon nzType="youtube" nzTheme="outline"></span>
      }
      @case ('Facebook') {
        <span nz-icon nzType="facebook" nzTheme="outline"></span>
      }
      @case ('Instagram') {
        <span nz-icon nzType="instagram" nzTheme="outline"></span>
      }
      @case ('TikTok') {
        <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
          <path
            d="M16.5 3c.29 2.06 1.44 3.4 3.5 3.53v2.4c-1.19.12-2.24-.27-3.46-1V14.9c0 4.62-5.04 6.07-7.86 2.72-1.82-2.17-1.01-5.98 3.32-6.14v2.46c-.66.11-1.37.28-1.75.55-1.15.79-.78 2.9 1.02 2.87 1.19-.02 1.98-.94 1.98-2.13V3h3.25Z" />
        </svg>
      }
      @case ('Cloudinary') {
        <span nz-icon [nzType]="kind === 'Video' ? 'video-camera' : 'picture'" nzTheme="outline"></span>
      }
      @default {
        <span nz-icon nzType="link" nzTheme="outline"></span>
      }
    }
  `,
  styles: [':host { display: inline-flex; align-items: center; line-height: 1; }'],
})
export class ArchiveProviderIconComponent {
  @Input({ required: true }) provider!: TArchiveProvider;
  @Input() kind: TArchiveItemKind = 'Link';
}
