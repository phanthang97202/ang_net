import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeEvent, CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {
  Alignment,
  Autoformat,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  Paragraph,
  PasteFromOffice,
  PlainTableOutput,
  RemoveFormat,
  SourceEditing,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  Underline,
  type EditorConfig,
} from 'ckeditor5';
import viTranslations from 'ckeditor5/translations/vi.js';
import {
  extractInstagramPermalink,
  extractTiktokVideoId,
  toFacebookPluginSrc,
  toInstagramEmbedSrc,
} from '../../helpers/utils/embed-url';

type EmbedType = 'iframe' | 'pdf';

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CKEditorModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent implements OnChanges {
  @Input() initContentBody = '';

  @Output()
  readonly contentChanged = new EventEmitter<{ content: string }>();

  readonly Editor = ClassicEditor;
  readonly editorConfig: EditorConfig = {
    language: 'vi',
    translations: [viTranslations],
    plugins: [
      Alignment,
      Autoformat,
      Base64UploadAdapter,
      BlockQuote,
      Bold,
      Code,
      CodeBlock,
      Essentials,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      GeneralHtmlSupport,
      Heading,
      Image,
      ImageCaption,
      ImageInsert,
      ImageResize,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Italic,
      Link,
      LinkImage,
      List,
      Paragraph,
      PasteFromOffice,
      PlainTableOutput,
      RemoveFormat,
      SourceEditing,
      Strikethrough,
      Subscript,
      Superscript,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      Underline,
    ],
    toolbar: {
      items: [
        'undo',
        'redo',
        '|',
        'sourceEditing',
        '|',
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'code',
        '|',
        'fontFamily',
        'fontSize',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'link',
        'insertImage',
        'insertTable',
        'blockQuote',
        'codeBlock',
        '|',
        'bulletedList',
        'numberedList',
        'outdent',
        'indent',
        '|',
        'subscript',
        'superscript',
        'alignment',
        'removeFormat',
      ],
      shouldNotGroupWhenFull: false,
    },
    image: {
      toolbar: [
        'imageTextAlternative',
        'toggleImageCaption',
        '|',
        'imageStyle:inline',
        'imageStyle:wrapText',
        'imageStyle:breakText',
        '|',
        'resizeImage',
        'linkImage',
      ],
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'toggleTableCaption',
        '|',
        'tableProperties',
        'tableCellProperties',
      ],
    },
    htmlSupport: {
      // Giữ lại HTML hợp lệ khi chuyển qua lại giữa chế độ trực quan và mã nguồn.
      // Các phần tử/thuộc tính có thể thực thi mã bị loại để bài viết không trở
      // thành điểm chèn XSS khi trang chi tiết dùng innerHTML.
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true,
        },
      ],
      disallow: [
        {
          name: /^(script|style|object|embed|form|input|button|textarea|select|option|meta|link|base)$/i,
        },
        { name: /.*/, attributes: /^on.*$/i },
        {
          name: /.*/,
          attributes: [
            {
              key: /^(href|src|xlink:href|formaction)$/i,
              value: /^\s*(javascript|vbscript):/i,
            },
          ],
        },
      ],
    },
  };

  content = '';
  private editorInstance?: ClassicEditor;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['initContentBody']) return;

    const newContent = changes['initContentBody'].currentValue ?? '';
    if (newContent !== this.content) {
      this.content = newContent;
    }
  }

  onReady(editor: ClassicEditor): void {
    this.editorInstance = editor;
  }

  handleContentChanged(event: ChangeEvent<ClassicEditor>): void {
    const content = event.editor.getData();
    this.content = content;
    this.contentChanged.emit({ content });
  }

  insertEmbed(type: EmbedType): void {
    if (!this.editorInstance) return;

    const input = window.prompt(
      type === 'pdf'
        ? 'Dán link file PDF (https://...)'
        : 'Dán link nhúng iframe, hoặc link/mã nhúng TikTok, Facebook, Instagram'
    );
    if (!input) return;

    const src = this.toEmbedSrc(input, type);
    if (!src) {
      window.alert(
        'Link không hợp lệ. Hãy dán một đường dẫn http/https hợp lệ.'
      );
      return;
    }

    const height = type === 'pdf' ? '600' : '400';
    const html = `<iframe class="ql-embed" data-embed="${type}" src="${this.escapeAttribute(src)}" width="100%" height="${height}" frameborder="0" allowfullscreen="true" loading="lazy"></iframe>`;
    const viewFragment = this.editorInstance.data.processor.toView(html);
    const modelFragment = this.editorInstance.data.toModel(viewFragment);

    this.editorInstance.model.insertContent(modelFragment);
    this.editorInstance.editing.view.focus();
  }

  private toEmbedSrc(input: string, type: EmbedType): string | null {
    const raw = input.trim();
    if (!raw) return null;

    if (type === 'iframe') {
      const tiktokId = extractTiktokVideoId(raw);
      if (tiktokId) return `https://www.tiktok.com/player/v1/${tiktokId}`;

      const facebookSrc = toFacebookPluginSrc(raw);
      if (facebookSrc) return facebookSrc;

      const instagramLink = extractInstagramPermalink(raw);
      if (instagramLink) {
        return toInstagramEmbedSrc(
          instagramLink,
          /data-instgrm-captioned/i.test(raw)
        );
      }
    }

    try {
      const url = new URL(raw);
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
