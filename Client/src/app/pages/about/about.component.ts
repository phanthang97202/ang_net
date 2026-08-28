import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
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
  employmentType: string;
  period: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ScrollRevealDirective, SocialLinksComponent, NzIconModule, TranslateModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  private message = inject(NzMessageService);

  // Nội dung để cứng ở đây thay vì SysParameter: sửa nội dung = sửa mảng bên dưới.
  profile = {
    name: 'Thang Phan',
    handle: '@phanthang97202',
    headline: 'Lập trình viên Fullstack',
    employmentType: 'Toàn thời gian',
    location: 'Hà Nam, Việt Nam',
    flag: '🇻🇳',
    avatar: 'assets/images/otogiri.jpg',
    bio: 'Mình viết phần mềm và ghi lại những gì học được trên đường đi. Blog này là nơi lưu lại các thử nghiệm, ghi chú kỹ thuật và vài suy nghĩ đời thường.',
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
      employmentType: 'Toàn thời gian',
      period: 'Tháng 6, 2023 - Hiện tại · 2 năm',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    },
    {
      company: 'Ipsum Solutions',
      logoText: 'I',
      logoColor: '#5b4fe9',
      title: 'Fullstack Developer',
      employmentType: 'Toàn thời gian',
      period: 'Tháng 1, 2021 - Tháng 5, 2023 · 2 năm 5 tháng',
      description:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
    },
    {
      company: 'Dolor Studio',
      logoText: 'D',
      logoColor: '#f2994a',
      title: 'Frontend Developer',
      employmentType: 'Thực tập',
      period: 'Tháng 7, 2020 - Tháng 12, 2020 · 6 tháng',
      description:
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.',
    },
  ];

  shareProfile(): void {
    // clipboard API cần HTTPS hoặc localhost; ngoài phạm vi đó sẽ reject
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => this.message.success('Đã sao chép liên kết trang'))
      .catch(() => this.message.error('Không sao chép được liên kết'));
  }
}
