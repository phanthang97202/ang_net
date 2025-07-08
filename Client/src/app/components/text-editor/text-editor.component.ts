import { Component, EventEmitter, inject, Output, OnInit } from '@angular/core';
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
export class TextEditorComponent implements OnInit {
  editorModules = {
    blotFormatter: {
      actions: {
        alignLeft: true,
        alignCenter: true,
        alignRight: true,
        // delete: true,
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

  editorContent = '';
  content = '';
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  @Output('onContentChanged')
  onContentChanged: EventEmitter<{ ev: ContentChange; content: string }> =
    new EventEmitter();

  constructor(private sanitizer: DomSanitizer) {}

  async ngOnInit() {
    try {
      // Dynamic import để tránh lỗi Vite cache
      const BlotFormatter = await import('quill-blot-formatter').then(
        m => m.default
      );

      Quill.register('modules/blotFormatter', BlotFormatter);
      console.log('BlotFormatter module registered successfully');
    } catch (error) {
      console.error('Error registering BlotFormatter module:', error);
    }
  }

  onEditorCreated(editor: any) {
    if (editor.getModule('blotFormatter')) {
      console.log('BlotFormatter module is active');
    } else {
      console.log('BlotFormatter module is NOT active');
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
