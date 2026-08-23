import Quill from 'quill';

const BlockEmbed: any = Quill.import('blots/block/embed');
const Link: any = Quill.import('formats/link');

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

    // Link.sanitize chỉ cho qua http/https/mailto/tel, còn lại trả về about:blank
    node.setAttribute('src', Link.sanitize(src));
    node.setAttribute('data-embed', type);
    node.setAttribute('frameborder', '0');
    node.setAttribute('allowfullscreen', 'true');
    node.setAttribute('width', '100%');
    node.setAttribute('height', type === 'pdf' ? '600' : '400');
    return node;
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
