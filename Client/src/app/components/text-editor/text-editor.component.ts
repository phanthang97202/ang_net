import {
  Component,
  EventEmitter,
  inject,
  Output,
  OnInit,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import {
  ContentChange,
  EditorChangeContent,
  EditorChangeSelection,
  QuillModule,
} from 'ngx-quill';
import BlotFormatter, {
  ImageSpec,
  UnclickableBlotSpec,
} from 'quill-blot-formatter';
import { ApiService, ShowErrorService } from '../../services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { EmbedType, IframeEmbedBlot } from './quill-embed.blot';

// IframeVideoSpec của thư viện chỉ bắt selector 'iframe.ql-video'. Nới ra 'iframe'
// để resize được cả embed iframe/PDF do nút mới chèn vào.
class AnyIframeSpec extends UnclickableBlotSpec {
  constructor(formatter: BlotFormatter) {
    super(formatter, 'iframe');
  }
}

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() initContentBody: string = '';

  editorModules: any;
  editorContent = '';
  content = '';

  // Đăng ký qua đúng cơ chế customModules của ngx-quill. ngx-quill nạp Quill bằng
  // await import('quill') rồi mới dựng editor, nên tự gọi Quill.register() ở ngOnInit
  // là đua với vòng nạp đó - chạy được ở dev nhưng hỏng khi build production.
  readonly customModules = [
    { path: 'modules/blotFormatter', implementation: BlotFormatter },
    { path: 'formats/iframeEmbed', implementation: IframeEmbedBlot },
  ];

  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  @Output('onContentChanged')
  onContentChanged: EventEmitter<{ ev?: ContentChange; content: string }> =
    new EventEmitter();

  private quill: any;
  private domObserver?: MutationObserver;
  private syncTimer?: ReturnType<typeof setTimeout>;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.initContentBody) {
      this.content = this.initContentBody;
      this.editorContent = this.initContentBody;
    }

    this.setupEditorModules();
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

  ngOnDestroy(): void {
    this.domObserver?.disconnect();
    clearTimeout(this.syncTimer);
  }

  private setupEditorModules() {
    this.editorModules = {
      toolbar: {
        container: [
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
          ['iframeEmbed', 'pdfEmbed'],
        ],
        handlers: {
          iframeEmbed: () => this.insertEmbed('iframe'),
          pdfEmbed: () => this.insertEmbed('pdf'),
        },
      },
      blotFormatter: {
        specs: [ImageSpec, AnyIframeSpec],
      },
    };
  }

  private insertEmbed(type: EmbedType) {
    const url = window.prompt(
      type === 'pdf'
        ? 'Dán link file PDF (https://...)'
        : 'Dán link nhúng iframe (https://...)'
    );
    if (!url) return;

    const range = this.quill.getSelection(true);
    this.quill.insertEmbed(
      range.index,
      'iframeEmbed',
      { src: url.trim(), type },
      'user'
    );
    this.quill.setSelection(range.index + 1, 0, 'silent');
  }

  onEditorCreated(editor: any) {
    this.quill = editor;

    // BlotFormatter ghi width/height thẳng vào DOM chứ không đi qua Delta, nên Quill
    // không phát text-change và ngx-quill không đẩy giá trị mới ra ngoài. Không có
    // đoạn này thì kéo resize xong bấm Đăng là mất kích thước.
    this.domObserver = new MutationObserver(() => this.scheduleSync());
    this.domObserver.observe(editor.root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['width', 'height', 'style'],
    });
  }

  private scheduleSync() {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      const html = this.quill.root.innerHTML;
      if (html === this.content) return;
      this.content = html;
      this.onContentChanged.emit({ content: html });
    }, 200);
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
