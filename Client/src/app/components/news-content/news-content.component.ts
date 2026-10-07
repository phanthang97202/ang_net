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
    const content = document.createElement('div');
    content.innerHTML = this.content;
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
      frame.loading = 'lazy';
    });
    this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(
      content.innerHTML
    );
  }
}
