import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../modules';
@Component({
  selector: 'app-news-content',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './news-content.component.html',
  styleUrl: './news-content.component.scss',
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
    if (this.content) {
      this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(
        this.content
      );
    }
  }
}
