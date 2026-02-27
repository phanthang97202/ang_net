import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-discovery-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discovery-banner.component.html',
  styleUrls: ['./discovery-banner.component.scss'],
})
export class DiscoveryBannerComponent {
  stats = [
    { number: '127', label: 'BÀI VIẾT' },
    { number: '34', label: 'ĐIỂM ĐẾN' },
    { number: '8K+', label: 'ĐỌC GIẢ' },
  ];

  latestPost = {
    title: '5 ngày lang thang Hà Giang một mình',
    category: 'Du lịch',
    readTime: '12 phút đọc',
  };
}
