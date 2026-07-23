import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface IFeaturedImage {
  imageUrl: string;
  caption: string;
}

const SLIDE_INTERVAL_MS = 4000;

@Component({
  selector: 'app-home-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-sidebar.component.html',
  styleUrls: ['./home-sidebar.component.scss'],
})
export class HomeSidebarComponent implements OnInit, OnDestroy {
  featuredImages: IFeaturedImage[] = [
    {
      imageUrl:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGftRBcqFNiokLou_wbwK9TTFsi01_MJsiIFce931rsiMDsxCCaN2bUA&s=10',
      caption: 'GOAT 7',
    },
    {
      imageUrl:
        'https://cdn-img.thethao247.vn/origin_640x0/storage/files/nhatbinh02112002/2026/05/29/anh-66-6a19a66910e99.jpg',
      caption: '09h53',
    },
    {
      imageUrl:
        'https://static.bongda24h.vn/medias/standard/2016/7/11/vck-euro-2016-hinh-nhu-co-gi-do-sai-sai.jpg',
      caption: 'EURO 2016',
    },
  ];

  activeIndex = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => this.goToNext(), SLIDE_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  setActive(index: number): void {
    this.activeIndex = index;
  }

  private goToNext(): void {
    this.activeIndex = (this.activeIndex + 1) % this.featuredImages.length;
  }
}
