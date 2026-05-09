import {
  Component,
  EventEmitter,
  inject,
  Output,
  OnInit,
  isDevMode,
  Input,
  OnChanges,
  SimpleChanges,
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

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements OnInit, OnChanges {
  @Input() initContentBody: string = '';

  editorModules: any;
  blotFormatterReady = false;
  editorContent = '';
  content = '';

  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  @Output('onContentChanged')
  onContentChanged: EventEmitter<{ ev: ContentChange; content: string }> =
    new EventEmitter();

  constructor(private sanitizer: DomSanitizer) {}

  // text-editor.component.ts
  async ngOnInit() {
    if (this.initContentBody) {
      this.content = this.initContentBody;
      this.editorContent = this.initContentBody;
    }

    this.setupEditorModules();
    this.blotFormatterReady = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initContentBody'] && !changes['initContentBody'].firstChange) {
      const newContent = changes['initContentBody'].currentValue;
      if (newContent !== this.content) {
        this.content = newContent;
        this.editorContent = newContent;
      }
    }
  }

  private setupEditorModules() {
    this.editorModules = {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ header: 1 }, { header: 2 }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ['clean'],
        ['link', 'image', 'video'],
      ],
      // Không có blotFormatter
    };
  }

  onEditorCreated(editor: any) {
    if (isDevMode()) {
      if (editor.getModule('blotFormatter')) {
        console.log('✅ BlotFormatter module is active');
      } else {
        console.log('⚠️ BlotFormatter module is NOT active');
      }
    }
  }

  byPassHTML(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  handleonEditorChanged(ev: EditorChangeContent | EditorChangeSelection) {
    // Handle editor change if needed
  }

  handleContentChanged(ev: ContentChange) {
    this.onContentChanged.emit({ ev, content: this.content });
  }
}
