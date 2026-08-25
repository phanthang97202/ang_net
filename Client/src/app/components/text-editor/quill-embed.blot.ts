import Quill from 'quill';

const BlockEmbed: any = Quill.import('blots/block/embed');

// Mỗi lần load bài viết, ngx-quill chạy clipboard.convert(html) để đổi HTML -> Delta
// rồi render lại. Attribute nào không khai báo ở đây sẽ bị nuốt mất trong vòng đó,
// kể cả width/height do BlotFormatter ghi vào lúc kéo resize.
const ATTRIBUTES = ['width', 'height', 'title', 'allow', 'loading', 'data-embed'];

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

    node.setAttribute('src', IframeEmbedBlot.sanitizeSrc(src));
    node.setAttribute('data-embed', type);
    node.setAttribute('frameborder', '0');
    node.setAttribute('allowfullscreen', 'true');
    node.setAttribute('width', '100%');
    node.setAttribute('height', type === 'pdf' ? '600' : '400');
    return node;
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
