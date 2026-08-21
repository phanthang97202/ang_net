import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

// Fades + slides a block into view the first time it scrolls into the
// viewport. Reveals once (does not re-hide on scroll-out) and respects
// prefers-reduced-motion.
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input() appScrollRevealDelay = 0;

  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const host = this.el.nativeElement;
    this.renderer.addClass(host, 'scroll-reveal');
    if (this.appScrollRevealDelay) {
      this.renderer.setStyle(
        host,
        '--scroll-reveal-delay',
        `${this.appScrollRevealDelay}ms`
      );
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.renderer.addClass(host, 'is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderer.addClass(host, 'is-visible');
            this.observer?.unobserve(host);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
