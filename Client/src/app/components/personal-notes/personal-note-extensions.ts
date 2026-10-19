import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const isImageDataUrl = (src: string) =>
  src.length <= Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 32 &&
  /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src);

export function personalNoteExtensions(readOnly = false) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: readOnly,
        defaultProtocol: 'https',
        isAllowedUri: (url, context) =>
          context.defaultValidate(url) &&
          /^(https?:\/\/|mailto:|tel:)/i.test(url),
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Image.extend({
      parseHTML() {
        return [
          {
            tag: 'img[src]',
            getAttrs: element =>
              isImageDataUrl(element.getAttribute('src') ?? '') ? null : false,
          },
        ];
      },
      addInputRules: () => [],
    }).configure({ allowBase64: true }),
  ];
}
