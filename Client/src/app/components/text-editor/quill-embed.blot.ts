import Quill from 'quill';

const BlockEmbed: any = Quill.import('blots/block/embed');

// Mỗi lần load bài viết, ngx-quill chạy clipboard.convert(html) để đổi HTML -> Delta
// rồi render lại. Attribute nào không khai báo ở đây sẽ bị nuốt mất trong vòng đó,
// kể cả width/height do BlotFormatter ghi vào lúc kéo resize.
const ATTRIBUTES = [
  'width',
  'height',
  'title',
  'allow',
  'loading',
  'style',
  'data-embed',
];

export type EmbedType = 'iframe' | 'pdf';

export interface EmbedValue {
  src: string;
  type: EmbedType;
}

export class IframeEmbedBlot extends BlockEmbed {
  // Base class lấy qua Quill.import() nên không có kiểu, khai lại để dùng trong format()
  declare domNode: HTMLElement;

  static blotName = 'iframeEmbed';
  static className = 'ql-embed';
  static tagName = 'IFRAME';

  static create(value: EmbedValue | string) {
    const node = super.create(value) as HTMLElement;
    const src = typeof value === 'string' ? value : value.src;
    const type: EmbedType = typeof value === 'string' ? 'iframe' : value.type;
    const safeSrc = IframeEmbedBlot.sanitizeSrc(src);

    node.setAttribute('src', safeSrc);
    node.setAttribute('data-embed', type);
    node.setAttribute('frameborder', '0');
    node.setAttribute('allowfullscreen', 'true');
    node.setAttribute('width', '100%');

    // Video dọc (reel/short) cao gần gấp đôi bề ngang, ghim height cố định là
    // cắt mất đầu/cuối khung hình. Với nguồn nhận diện được thì để chiều cao tự
    // suy ra từ tỉ lệ khung hình, iframe rộng bao nhiêu cũng hiện đủ.
    const ratio = IframeEmbedBlot.aspectRatioFor(safeSrc, type);
    if (ratio) {
      node.setAttribute('style', `aspect-ratio:${ratio};height:auto`);
    } else {
      node.setAttribute('height', type === 'pdf' ? '600' : '400');
    }
    return node;
  }

  // Nội dung trong iframe là cross-origin nên không đo được chiều cao thật từ
  // ngoài. Chỉ còn cách suy tỉ lệ từ chính đường dẫn nhúng.
  private static aspectRatioFor(src: string, type: EmbedType): string | null {
    if (type !== 'iframe') return null;

    // FB reel và TikTok luôn là video dọc 9:16.
    if (/tiktok\.com\/player\//i.test(src)) return '9 / 16';
    if (/facebook\.com\/plugins\/video\.php/i.test(src)) {
      const href = IframeEmbedBlot.pluginHref(src);
      return href && /\/(reel|reels)\//i.test(href) ? '9 / 16' : '16 / 9';
    }

    // YouTube/Vimeo và các player ngang khác.
    if (/(youtube\.com|youtu\.be|player\.vimeo\.com)/i.test(src)) {
      return '16 / 9';
    }

    return null;
  }

  // Link video thật nằm trong tham số href của plugin, phải giải mã mới đọc được
  // nó là reel hay video thường.
  private static pluginHref(src: string): string | null {
    try {
      return new URL(src).searchParams.get('href');
    } catch {
      return null;
    }
  }

  // Quill.import('formats/link').sanitize dựa vào <a href> để đọc protocol, mà
  // trình duyệt lại hiểu chuỗi rác (vd nguyên đoạn HTML nhúng của TikTok) là
  // đường dẫn TƯƠNG ĐỐI rồi ghép với domain hiện tại -> protocol thành https:
  // nên vẫn lọt qua, và iframe kết thúc bằng việc load lại chính trang web này.
  // Chỉ nhận URL tuyệt đối http/https, còn lại trả about:blank.
  private static sanitizeSrc(src: string): string {
    try {
      const url = new URL(src);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.href;
      }
    } catch {
      // URL không parse được -> rơi xuống about:blank
    }
    return 'about:blank';
  }

  static formats(node: HTMLElement) {
    return ATTRIBUTES.reduce((formats: Record<string, string>, attribute) => {
      const value = node.getAttribute(attribute);
      if (value !== null) {
        formats[attribute] = value;
      }
      return formats;
    }, {});
  }

  static value(node: HTMLElement): EmbedValue {
    return {
      src: node.getAttribute('src') ?? '',
      type: (node.getAttribute('data-embed') as EmbedType) ?? 'iframe',
    };
  }

  format(name: string, value: string) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}
