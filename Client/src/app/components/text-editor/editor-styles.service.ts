import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/** CSS toolbar/dialog chỉ cần khi mở editor; CSS nội dung vẫn tải toàn blog. */
@Injectable({ providedIn: 'root' })
export class EditorStylesService {
  private document = inject(DOCUMENT);
  private translate = inject(TranslateService);
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
        reject(new Error(this.translate.instant('T_EDITOR_STYLES_LOAD_ERROR')));
      };
      this.document.head.appendChild(link);
    }));
  }
}
