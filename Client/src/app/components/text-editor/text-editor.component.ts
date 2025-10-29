import {
  Component,
  EventEmitter,
  inject,
  Output,
  OnInit,
  isDevMode,
} from '@angular/core';
import {
  ContentChange,
  EditorChangeContent,
  EditorChangeSelection,
  QuillModule,
} from 'ngx-quill';
import { ApiService, ShowErrorService } from '../../services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import Quill from 'quill';
@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})

// 1. Component khởi tạo → blotFormatterReady = false
// 2. Hiển thị loading → *ngIf="!blotFormatterReady"
// 3. ngOnInit() chạy → load và register BlotFormatter
// 4. Sau khi register xong → blotFormatterReady = true
// 5. Editor được render → *ngIf="blotFormatterReady"
// 6. Lúc này module đã sẵn sàng → không còn lỗi
export class TextEditorComponent implements OnInit {
  editorModules: any;

  // Flag để track module registration
  blotFormatterReady = false;
  editorContent = '';
  content = '';
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  @Output('onContentChanged')
  onContentChanged: EventEmitter<{ ev: ContentChange; content: string }> =
    new EventEmitter();

  constructor(private sanitizer: DomSanitizer) {}

  // ==================Bản fix
  async ngOnInit() {
    if (isDevMode()) {
      if (typeof window === 'undefined') {
        console.warn('BlotFormatter not loaded (SSR)');
        this.setupEditorModules(false);
        return;
      }

      try {
        const module = await import('quill-blot-formatter');
        const BlotFormatter = module.default || module; // ✅ fix cho cả ESM & CJS

        Quill.register('modules/blotFormatter', BlotFormatter);
        console.log('✅ BlotFormatter module registered successfully');

        this.setupEditorModules(true);
        this.blotFormatterReady = true;
      } catch (error) {
        console.error('❌ Error registering BlotFormatter module:', error);
        this.setupEditorModules(false);
      }
    } else {
      this.blotFormatterReady = true;
    }
  }
  // ==========================================

  // ================Bản cũ: chạy local được mà production lỗi
  // async ngOnInit() {
  //   try {
  //     // Dynamic import để tránh lỗi Vite cache
  //     const BlotFormatter = await import('quill-blot-formatter').then(
  //       m => m.default
  //     );

  //     Quill.register('modules/blotFormatter', BlotFormatter);
  //     console.log('BlotFormatter module registered successfully');

  //     // Sau khi register xong, mới set up modules
  //     this.setupEditorModules(true);
  //     this.blotFormatterReady = true;
  //   } catch (error) {
  //     console.error('Error registering BlotFormatter module:', error);
  //     // Fallback: setup editor without blotFormatter
  //     this.setupEditorModules(false);
  //   }
  // }
  // ==========================================

  private setupEditorModules(includeBlotFormatter = true) {
    if (includeBlotFormatter) {
      this.editorModules = {
        blotFormatter: {
          actions: {
            alignLeft: true,
            alignCenter: true,
            alignRight: true,
            resize: true,
          },
          overlay: {
            className: 'blot-formatter__overlay',
            style: {
              position: 'absolute',
              boxSizing: 'border-box',
              border: '1px dashed #444',
            },
          },
          resize: {
            handleStyle: {
              position: 'absolute',
              height: '12px',
              width: '12px',
              backgroundColor: 'white',
              border: '1px solid #777',
              boxSizing: 'border-box',
              opacity: '0.80',
            },
          },
        },
      };
    }
  }

  onEditorCreated(editor: any) {
    if (isDevMode()) {
      if (editor.getModule('blotFormatter')) {
        console.log('BlotFormatter module is active');
      } else {
        console.log('BlotFormatter module is NOT active');
      }
    }
  }

  byPassHTML(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  handleonEditorChanged(ev: EditorChangeContent | EditorChangeSelection) {}

  handleContentChanged(ev: ContentChange) {
    this.onContentChanged.emit({ ev, content: this.content });
  }
}
