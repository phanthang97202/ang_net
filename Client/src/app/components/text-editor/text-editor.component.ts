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
    const input = window.prompt(
      type === 'pdf'
        ? 'Dán link file PDF (https://...)'
        : 'Dán link nhúng iframe, hoặc link/mã nhúng TikTok, Facebook, Instagram'
    );
    if (!input) return;

    const src = this.toEmbedSrc(input, type);
    if (!src) {
      window.alert(
        'Link không hợp lệ. Hãy dán một đường dẫn https://... (hoặc link/mã nhúng TikTok, Facebook, Instagram).'
      );
      return;
    }

    const range = this.quill.getSelection(true);
    this.quill.insertEmbed(range.index, 'iframeEmbed', { src, type }, 'user');
    this.quill.setSelection(range.index + 1, 0, 'silent');
  }

  // Chuỗi dán vào không phải lúc nào cũng là URL nhúng dùng được: TikTok cho ra
  // đoạn <blockquote> + <script> (không nhét vào iframe được), còn link chia sẻ
  // thường thì trỏ tới trang xem video chứ không phải player. Quy về URL player
  // chính thức; thứ gì không phải URL http/https tuyệt đối thì loại luôn thay vì
  // để iframe hiểu nhầm thành đường dẫn tương đối.
  private toEmbedSrc(input: string, type: EmbedType): string | null {
    const raw = input.trim();
    if (!raw) return null;

    if (type === 'iframe') {
      const tiktokId = this.extractTiktokVideoId(raw);
      if (tiktokId) {
        return `https://www.tiktok.com/player/v1/${tiktokId}`;
      }

      const facebookSrc = this.toFacebookPluginSrc(raw);
      if (facebookSrc) {
        return facebookSrc;
      }

      // Đã chắc là link Instagram thì không rơi xuống nhánh iframe chung nữa:
      // instagram.com chặn iframe bằng X-Frame-Options, có nhúng cũng ra khung
      // trắng. Trả null để báo link sai còn hơn chèn vào một khung hỏng.
      const instagramLink = this.extractInstagramPermalink(raw);
      if (instagramLink) {
        return this.toInstagramEmbedSrc(
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

  // Bắt được cả link chia sẻ (.../@user/video/123), link player sẵn có, lẫn
  // nguyên đoạn mã nhúng TikTok (data-video-id="123").
  private extractTiktokVideoId(input: string): string | null {
    const match =
      input.match(/tiktok\.com\/(?:@[^/]+\/video|player\/v1)\/(\d+)/) ??
      input.match(/data-video-id=["'](\d+)["']/);
    return match ? match[1] : null;
  }

  // Facebook cũng không nhúng thẳng link chia sẻ được, phải bọc qua plugin
  // video.php (video/reel) hoặc post.php (bài viết/ảnh). Link plugin có sẵn thì
  // giữ nguyên vì người dùng có thể đã tự chỉnh tham số width/show_text.
  private toFacebookPluginSrc(input: string): string | null {
    const href = this.extractFacebookHref(input);
    if (!href) return null;

    if (/facebook\.com\/plugins\/(video|post)\.php/.test(href)) {
      return href;
    }

    const isVideo =
      /\/(videos|reel|reels|watch)\//.test(href) ||
      /\/share\/[vr]\//.test(href) ||
      /fb\.watch\//.test(href) ||
      /[?&]v=\d/.test(href);

    // Không truyền width: FB vốn tự co nội dung theo bề ngang thật của iframe,
    // truyền vào thì nó dựng player theo tỉ lệ của width rồi thu nhỏ cho vừa
    // khung, chừa lại một dải trống phía dưới. Ngược lại height thì phải truyền
    // đúng bằng chiều cao blot dựng iframe (400, xem quill-embed.blot.ts) để
    // player lấp đầy khung. post.php không có tham số height nên chiều cao bài
    // viết cao thấp ra sao là do FB quyết.
    const encoded = encodeURIComponent(href);
    return isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&height=400`
      : `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true`;
  }

  // Facebook đưa ra 3 kiểu mã nhúng: iframe plugins sẵn, thẻ SDK
  // <div class="fb-video" data-href> và <blockquote class="fb-post" cite>.
  // Hai kiểu sau chỉ chạy khi trang có SDK của FB nên rút link ra tự bọc plugin.
  private extractFacebookHref(input: string): string | null {
    const embedded =
      input.match(/<iframe[^>]+src=["']([^"']+)["']/i) ??
      input.match(/data-href=["']([^"']+)["']/i) ??
      input.match(/\scite=["']([^"']+)["']/i);

    // Mã nhúng là HTML nên & trong query bị escape thành &amp;, không decode thì
    // các tham số sau href dính liền vào giá trị href.
    const candidate = (embedded ? embedded[1] : input).replace(/&amp;/g, '&');

    try {
      const url = new URL(candidate.trim());
      return /(^|\.)(facebook\.com|fb\.watch)$/i.test(url.hostname)
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  // Mã nhúng Instagram là <blockquote> + <script src=embed.js>, nhét vào iframe
  // không chạy. Nhưng IG có sẵn endpoint /embed nhúng iframe thẳng được, nên chỉ
  // cần rút permalink trong data-instgrm-permalink ra.
  private extractInstagramPermalink(input: string): string | null {
    const embedded =
      input.match(/data-instgrm-permalink=["']([^"']+)["']/i) ??
      input.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    const candidate = (embedded ? embedded[1] : input.trim()).replace(
      /&amp;/g,
      '&'
    );

    try {
      const url = new URL(candidate);
      return /(^|\.)instagram\.com$/i.test(url.hostname) ? url.href : null;
    } catch {
      return null;
    }
  }

  private toInstagramEmbedSrc(
    permalink: string,
    captioned: boolean
  ): string | null {
    // Nút "Sao chép liên kết" trên app IG cho ra dạng /share/<token>, là link
    // chuyển hướng nên không đọc được shortcode ở phía trình duyệt.
    if (/instagram\.com\/share\//i.test(permalink)) return null;

    // Bài viết có cả dạng /p/<code> lẫn /<user>/p/<code>.
    const match = permalink.match(
      /instagram\.com\/(?:[^/?#]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]+)/i
    );
    if (!match) return null;

    const type = match[1].toLowerCase();
    const kind = type === 'reels' ? 'reel' : type;
    const suffix = captioned ? '/captioned' : '';
    return `https://www.instagram.com/${kind}/${match[2]}/embed${suffix}`;
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
