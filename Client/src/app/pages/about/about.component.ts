import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ScrollRevealDirective } from '../../directives';
import { SocialLinksComponent } from '../../components';
import { ISocialLink } from '../../interfaces';

interface Experience {
  company: string;
  /** Chữ cái đầu dùng làm logo giả khi chưa có ảnh thật */
  logoText: string;
  logoColor: string;
  title: string;
  employmentTypeKey: string;
  periodKey: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    ScrollRevealDirective,
    SocialLinksComponent,
    NzIconModule,
    TranslateModule,
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  private message = inject(NzMessageService);
  private translate = inject(TranslateService);

  // Nội dung để cứng ở đây thay vì SysParameter: sửa nội dung = sửa mảng bên dưới.
  profile = {
    name: 'Thang Phan',
    handle: '@phanthang97202',
    headlineKey: 'T_ABOUT_HEADLINE',
    employmentTypeKey: 'T_ABOUT_FULL_TIME',
    locationKey: 'T_ABOUT_LOCATION',
    flag: '🇻🇳',
    avatar: 'assets/images/otogiri.jpg',
    bioKey: 'T_ABOUT_BIO',
  };

  skills = [
    'Angular',
    'ReactJs',
    '.NET',
    'TypeScript',
    'PostgreSQL',
    'Entity Framework',
    'RxJS',
    'SCSS',
    'Tailwind CSS',
    'Git',
  ];

  socialLinks: ISocialLink[] = [
    { icon: 'facebook', link: 'https://www.facebook.com/phanthang97202' },
    { icon: 'github', link: 'https://github.com/phanthang97202' },
    { icon: 'link', link: 'https://zalo.me/0394086707' },
  ];

  // Nội dung mẫu (lorem ipsum) - thay bằng kinh nghiệm thật khi cần
  experiences: Experience[] = [
    {
      company: 'Lorem Company',
      logoText: 'L',
      logoColor: '#e1306c',
      title: 'Senior Fullstack Developer',
      employmentTypeKey: 'T_ABOUT_FULL_TIME',
      periodKey: 'T_ABOUT_PERIOD_CURRENT',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    },
    {
      company: 'Ipsum Solutions',
      logoText: 'I',
      logoColor: '#5b4fe9',
      title: 'Fullstack Developer',
      employmentTypeKey: 'T_ABOUT_FULL_TIME',
      periodKey: 'T_ABOUT_PERIOD_SECOND',
      description:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
    },
    {
      company: 'Dolor Studio',
      logoText: 'D',
      logoColor: '#f2994a',
      title: 'Frontend Developer',
      employmentTypeKey: 'T_ABOUT_INTERNSHIP',
      periodKey: 'T_ABOUT_PERIOD_INTERNSHIP',
      description:
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.',
    },
  ];

  shareProfile(): void {
    // clipboard API cần HTTPS hoặc localhost; ngoài phạm vi đó sẽ reject
    navigator.clipboard
      .writeText(window.location.href)
      .then(() =>
        this.message.success(this.translate.instant('T_ABOUT_LINK_COPIED'))
      )
      .catch(() =>
        this.message.error(this.translate.instant('T_ABOUT_LINK_COPY_ERROR'))
      );
  }
}
