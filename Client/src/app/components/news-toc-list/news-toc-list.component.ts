import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AntdModule } from '../../modules';

interface TocItem {
  id: string;
  text: string;
  level: number;
  element?: HTMLElement;
}

@Component({
  selector: 'app-news-toc-list',
  standalone: true,
  imports: [AntdModule],
  templateUrl: './news-toc-list.component.html',
  styleUrl: './news-toc-list.component.scss',
})
export class NewsTocListComponent implements OnInit, OnChanges {
  @Input() content = '';
  @Input() containerId = 'content-container';

  tocItems: TocItem[] = [];
  activeId = '';

  ngOnInit() {
    this.generateToc();
    this.setupScrollListener();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && !changes['content'].firstChange) {
      setTimeout(() => {
        this.generateToc();
      }, 100);
    }
  }

  generateToc() {
    this.tocItems = [];

    // Tạo temporary div để parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.content;

    // Tìm tất cả các heading
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent?.trim() || '';
      const id = this.generateId(text, index);

      // Thêm id vào heading trong content thật
      this.addIdToHeading(text, id, index);

      this.tocItems.push({
        id,
        text,
        level,
        element: heading as HTMLElement,
      });
    });
  }

  generateId(text: string, index: number): string {
    // Tạo id từ text, loại bỏ ký tự đặc biệt
    const baseId = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return baseId || `heading-${index}`;
  }

  addIdToHeading(text: string, id: string, index: number) {
    // Tìm và thêm id vào heading trong DOM thật
    setTimeout(() => {
      const container = document.getElementById(this.containerId);
      if (container) {
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const heading = Array.from(headings).find(
          (h, i) => h.textContent?.trim() === text && i === index
        );

        if (heading && !heading.id) {
          heading.id = id;
        }
      }
    }, 50);
  }

  scrollToElement(id: string) {
    const element = document.getElementById(id);
    if (element) {
      // Smooth scroll với offset để tránh bị che bởi header
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });

      // Highlight element
      this.highlightElement(element);
      this.activeId = id;
    }
  }

  highlightElement(element: HTMLElement) {
    // Thêm class highlight tạm thời
    element.classList.add('toc-highlight');
    setTimeout(() => {
      element.classList.remove('toc-highlight');
    }, 2000);
  }

  setupScrollListener() {
    let ticking = false;

    const updateActiveId = () => {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let currentId = '';

      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 0) {
          currentId = heading.id;
        }
      });

      if (currentId && currentId !== this.activeId) {
        this.activeId = currentId;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveId);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }
}
