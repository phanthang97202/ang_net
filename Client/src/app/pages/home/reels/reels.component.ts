import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService, ShowErrorService } from '../../../services';
import { IReelDto } from '../../../interfaces';
import { AntdModule } from '../../../modules';
import { ReelItemComponent } from './reel-item/reel-item.component';

@Component({
  selector: 'app-reels-page',
  standalone: true,
  imports: [AntdModule, ReelItemComponent],
  templateUrl: './reels.component.html',
  styleUrl: './reels.component.scss',
})
export class ReelsComponent implements OnInit, AfterViewInit, OnDestroy {
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  lstReels: IReelDto[] = [];
  activeIndex = 0;
  isMuted = true; // mặc định muted: bắt buộc để trình duyệt cho autoplay không cần tương tác
  isLoading = false;
  hasMore = true;
  nextCursor: string | null = null;

  private readonly pageSize = 5;
  private readonly windowRadius = 1; // chỉ mount media cho activeIndex ± 1
  private readonly prefetchThreshold = 2; // còn 2 item nữa là hết trang thì tải thêm

  @ViewChildren('reelHost') reelHosts!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;
  private feedSub?: Subscription;
  private hostsSub?: Subscription;

  ngOnInit(): void {
    this.loadNextPage();
  }

  ngAfterViewInit(): void {
    this.hostsSub = this.reelHosts.changes.subscribe(() =>
      this.setupObserver()
    );
    this.setupObserver();
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

  private setupObserver(): void {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      entries => this.onIntersect(entries),
      { threshold: 0.6 }
    );
    this.reelHosts.forEach(host => this.observer!.observe(host.nativeElement));
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Number((entry.target as HTMLElement).dataset['index']);
        if (!Number.isNaN(idx)) {
          this.activeIndex = idx;
        }
      }
    });

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
          const { DataList, NextCursor, HasMore } = res.objResult;
          this.lstReels = [...this.lstReels, ...DataList];
          this.nextCursor = NextCursor;
          this.hasMore = HasMore;
          this.isLoading = false;
        },
        error: err => {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
          this.isLoading = false;
        },
      });
  }
}
