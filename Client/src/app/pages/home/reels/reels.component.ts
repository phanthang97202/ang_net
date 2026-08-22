import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { ApiService, AuthService, ShowErrorService } from '../../../services';
import { IReelDto } from '../../../interfaces';
import { ReelItemComponent } from './reel-item/reel-item.component';

@Component({
  selector: 'app-reels-page',
  standalone: true,
  imports: [NzIconModule, ReelItemComponent],
  templateUrl: './reels.component.html',
  styleUrl: './reels.component.scss',
})
export class ReelsComponent implements OnInit, AfterViewInit, OnDestroy {
  private apiService = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private authService = inject(AuthService);
  private router = inject(Router);

  lstReels: IReelDto[] = [];
  activeIndex = 0;
  isMuted = true; // mặc định muted: bắt buộc để trình duyệt cho autoplay không cần tương tác
  isLoading = false;
  hasMore = true;

  private nextCursor: string | null = null;
  private readonly pageSize = 5;
  private readonly windowRadius = 1; // chỉ mount media cho activeIndex ± 1
  private readonly prefetchThreshold = 2; // còn 2 item nữa là hết danh sách thì tải thêm
  private readonly activeRatio = 0.6;

  @ViewChild('viewport') viewport!: ElementRef<HTMLElement>;
  @ViewChildren('reelHost') reelHosts!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;
  private observed = new Set<HTMLElement>();
  private feedSub?: Subscription;
  private hostsSub?: Subscription;

  ngOnInit(): void {
    this.loadNextPage();
  }

  ngAfterViewInit(): void {
    // root là khung cuộn của feed, không phải cửa sổ trình duyệt:
    // đo theo window sẽ cho tỉ lệ sai và activeIndex không bao giờ cập nhật đúng.
    this.observer = new IntersectionObserver(
      entries => this.onIntersect(entries),
      { root: this.viewport.nativeElement, threshold: [this.activeRatio] }
    );

    this.hostsSub = this.reelHosts.changes.subscribe(() => this.observeNew());
    this.observeNew();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.feedSub?.unsubscribe();
    this.hostsSub?.unsubscribe();
  }

  isMounted(i: number): boolean {
    return Math.abs(i - this.activeIndex) <= this.windowRadius;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  scrollToIndex(index: number): void {
    const host = this.reelHosts.get(index);
    host?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  onLikeToggled(reel: IReelDto): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Cập nhật lạc quan để nút phản hồi tức thì, rồi đồng bộ lại theo số thật từ server
    const previousLiked = reel.IsLikedByMe;
    const previousCount = reel.LikeCount;
    reel.IsLikedByMe = !previousLiked;
    reel.LikeCount = previousCount + (previousLiked ? -1 : 1);

    this.apiService.ReelLike(reel.ReelId).subscribe({
      next: res => {
        if (res?.Success && res.objResult) {
          reel.IsLikedByMe = res.objResult.Liked;
          reel.LikeCount = res.objResult.LikeCount;
        } else {
          reel.IsLikedByMe = previousLiked;
          reel.LikeCount = previousCount;
        }
      },
      error: () => {
        reel.IsLikedByMe = previousLiked;
        reel.LikeCount = previousCount;
      },
    });
  }

  private observeNew(): void {
    // Chỉ observe phần tử mới thêm: disconnect + observe lại toàn bộ mỗi lần nối trang
    // sẽ thành O(n^2) và bắn lại callback cho cả danh sách.
    this.reelHosts.forEach(host => {
      const el = host.nativeElement;
      if (!this.observed.has(el)) {
        this.observed.add(el);
        this.observer?.observe(el);
      }
    });
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    // isIntersecting true ngay khi chồng lấn > 0, không phải khi đạt ngưỡng - phải so theo
    // intersectionRatio, và lấy entry có tỉ lệ cao nhất, nếu không cuộn ngược sẽ chọn nhầm slide.
    let bestRatio = this.activeRatio;
    let bestIndex = -1;

    for (const entry of entries) {
      if (entry.intersectionRatio < bestRatio) {
        continue;
      }
      const idx = Number((entry.target as HTMLElement).dataset['index']);
      if (!Number.isNaN(idx)) {
        bestRatio = entry.intersectionRatio;
        bestIndex = idx;
      }
    }

    if (bestIndex >= 0) {
      this.activeIndex = bestIndex;
    }

    if (this.activeIndex >= this.lstReels.length - this.prefetchThreshold) {
      this.loadNextPage();
    }
  }

  private loadNextPage(): void {
    if (this.isLoading || !this.hasMore) {
      return;
    }

    this.isLoading = true;
    this.feedSub = this.apiService
      .ReelFeed(this.pageSize, this.nextCursor)
      .subscribe({
        next: res => {
          this.isLoading = false;

          // Backend trả HTTP 200 kèm Success=false khi lỗi nghiệp vụ, objResult có thể rỗng
          if (!res?.Success || !res.objResult) {
            this.hasMore = false;
            if (res?.ErrorMessage) {
              this.showErrorService.setShowError({
                icon: 'warning',
                message: res.ErrorMessage,
                title: 'Reels',
              });
            }
            return;
          }

          const { DataList, NextCursor, HasMore } = res.objResult;
          this.lstReels = [...this.lstReels, ...(DataList ?? [])];
          this.nextCursor = NextCursor;
          this.hasMore = HasMore;
        },
        error: err => {
          this.isLoading = false;
          // Dừng hẳn: người dùng vẫn đứng cuối danh sách nên mỗi lần cuộn nhẹ sẽ gọi lại
          // request đang lỗi, tạo vòng lặp vô hạn và spam modal lỗi.
          this.hasMore = false;
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
      });
  }
}
