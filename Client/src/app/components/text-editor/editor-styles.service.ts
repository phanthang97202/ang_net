import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** CSS toolbar/dialog chỉ cần khi mở editor; CSS nội dung vẫn tải toàn blog. */
@Injectable({ providedIn: 'root' })
export class EditorStylesService {
  private document = inject(DOCUMENT);
  private loaded?: Promise<void>;

  load(): Promise<void> {
    return (this.loaded ??= new Promise<void>((resolve, reject) => {
      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL(
        'assets/styles/ckeditor5-editor.css',
        this.document.baseURI
      ).href;
      link.onload = () => resolve();
      link.onerror = () => {
        link.remove();
        this.loaded = undefined;
        reject(new Error('Không tải được giao diện trình soạn thảo.'));
      };
      this.document.head.appendChild(link);
    }));
  }
}
