import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TocPanelService } from '../../services';

interface TocItem {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

@Component({
  selector: 'app-news-toc-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './news-toc-list.component.html',
  styleUrl: './news-toc-list.component.scss',
})
export class NewsTocListComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() content = '';
  @Input() containerId = 'content-container';
  tocItems: TocItem[] = [];
  activeId = '';
  tocPanel = inject(TocPanelService);
  private zone = inject(NgZone);
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private highlightTimer?: ReturnType<typeof setTimeout>;
  private highlighted?: HTMLElement;
  private frame = 0;

  private readonly onScroll = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      let current = this.tocItems[0]?.id || '';
      for (const item of this.tocItems) {
        if (item.element.getBoundingClientRect().top > 110) break;
        current = item.id;
      }
      if (current !== this.activeId) {
        this.zone.run(() => (this.activeId = current));
      }
    });
  };

  ngAfterViewInit(): void {
    this.scheduleRefresh();
    this.zone.runOutsideAngular(() =>
      window.addEventListener('scroll', this.onScroll, { passive: true })
    );
  }

  ngOnChanges(): void {
    this.scheduleRefresh();
  }

  private scheduleRefresh(): void {
    clearTimeout(this.refreshTimer);
    // Đợi innerHTML của component cha cập nhật rồi đọc chính heading thật.
    this.refreshTimer = setTimeout(() => this.generateToc(), 0);
  }

  generateToc(): void {
    const container = document.getElementById(this.containerId);
    const headings =
      container?.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6');
    const usedIds = new Set<string>();
    this.tocItems = [];
    headings?.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      if (!text) return;
      // Giữ anchor có sẵn trong nội dung, chỉ đổi ID trống hoặc bị trùng.
      let id = heading.id;
      if (!id || usedIds.has(id) || document.getElementById(id) !== heading) {
        const baseId = this.generateId(text, index);
        id = baseId;
        let suffix = 1;
        while (
          usedIds.has(id) ||
          (document.getElementById(id) &&
            document.getElementById(id) !== heading)
        ) {
          id = `${baseId}-${suffix++}`;
        }
        heading.id = id;
      }
      usedIds.add(id);
      this.tocItems.push({
        id,
        text,
        level: Number(heading.tagName[1]),
        element: heading,
      });
    });
    this.activeId = this.tocItems[0]?.id || '';
    this.tocPanel.setHasItems(this.tocItems.length > 0);
    if (!this.tocItems.length) this.close();
  }

  generateId(text: string, index: number): string {
    const slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `toc-${slug || 'heading'}-${index}`;
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.tocPanel.close();
  }

  onItemClick(id: string): void {
    this.close();
    this.scrollToElement(id);
  }

  scrollToElement(id: string): void {
    const element = this.tocItems.find(item => item.id === id)?.element;
    if (!element) return;
    // offsetTop phụ thuộc offsetParent; rect + scrollY là vị trí trong trang.
    const top = element.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
    element.tabIndex = -1;
    element.focus({ preventScroll: true });
    this.highlighted?.classList.remove('toc-highlight');
    clearTimeout(this.highlightTimer);
    element.classList.add('toc-highlight');
    this.highlighted = element;
    this.highlightTimer = setTimeout(
      () => element.classList.remove('toc-highlight'),
      2000
    );
    this.activeId = id;
  }

  ngOnDestroy(): void {
    clearTimeout(this.refreshTimer);
    clearTimeout(this.highlightTimer);
    cancelAnimationFrame(this.frame);
    window.removeEventListener('scroll', this.onScroll);
    this.highlighted?.classList.remove('toc-highlight');
    this.close();
    this.tocPanel.setHasItems(false);
  }
}
