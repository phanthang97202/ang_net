import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';

@Directive({ selector: '[appInfiniteScroll]', standalone: true })
export class InfiniteScrollDirective
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() appInfiniteScroll = true;
  @Output() loadMore = new EventEmitter<void>();
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (
          this.appInfiniteScroll &&
          entries.some(entry => entry.isIntersecting)
        ) {
          this.zone.run(() => this.loadMore.emit());
        }
      },
      { rootMargin: '320px 0px' }
    );
    this.sync();
  }

  ngOnChanges(): void {
    this.sync();
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private sync(): void {
    this.observer?.disconnect();
    // Reobserve after each request so short pages keep filling the viewport.
    if (this.appInfiniteScroll)
      this.observer?.observe(this.element.nativeElement);
  }
}
