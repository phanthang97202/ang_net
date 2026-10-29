import {
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NewsTocListComponent } from '../news-toc-list/news-toc-list.component';
import DOMPurify from 'dompurify';
@Component({
  selector: 'app-news-content',
  standalone: true,
  imports: [CommonModule, NewsTocListComponent],
  templateUrl: './news-content.component.html',
  styleUrl: './news-content.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NewsContentComponent implements OnInit, OnChanges {
  @Input() content = '';
  @Input() showToc = true;

  sanitizedContent: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.updateSanitizedContent();
  }

  ngOnChanges() {
    this.updateSanitizedContent();
  }

  private updateSanitizedContent() {
    // Never trust stored HTML, including articles written before validation existed.
    // Keep iframe support only for known external embed providers.
    const content = DOMPurify.sanitize(this.content, {
      RETURN_DOM: true,
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading'],
      FORBID_ATTR: ['srcdoc'],
    }) as HTMLElement;
    // Cover nằm ngoài nội dung; ảnh và embed trong bài chỉ tải khi sắp đọc tới.
    content.querySelectorAll('img').forEach(img => {
      const width = Number(img.getAttribute('width'));
      const height = Number(img.getAttribute('height'));
      if (width > 0 && height > 0) {
        img.style.aspectRatio = `${width} / ${height}`;
        img.loading = 'lazy';
      } else {
        // Ảnh chưa có kích thước cần tải sớm để tránh đổi vị trí khi nhảy mục lục.
        img.loading = 'eager';
      }
      img.decoding = 'async';
    });
    content.querySelectorAll('iframe').forEach(frame => {
      if (!this.safeEmbed(frame.getAttribute('src'))) { frame.remove(); return; }
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer';
    });
    content.querySelectorAll('a[target="_blank"]').forEach(link => link.setAttribute('rel', 'noopener noreferrer'));
    this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(
      content.innerHTML
    );
  }

  private safeEmbed(src: string | null): boolean {
    try {
      const url = new URL(src ?? '');
      if (url.protocol !== 'https:') return false;
      const host = url.hostname.toLowerCase();
      return ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'www.tiktok.com',
        'facebook.com', 'www.facebook.com', 'www.instagram.com', 'open.spotify.com', 'drive.google.com',
        'docs.google.com', 'res.cloudinary.com'].includes(host);
    } catch { return false; }
  }
}
