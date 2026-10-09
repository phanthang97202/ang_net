import { Pipe, PipeTransform } from '@angular/core';

export interface ChatTextPart {
  text: string;
  href?: string;
}

@Pipe({ name: 'chatLinks', standalone: true, pure: true })
export class ChatLinksPipe implements PipeTransform {
  transform(message: string): ChatTextPart[] {
    const parts: ChatTextPart[] = [];
    const links = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
    let position = 0;
    for (const match of message.matchAll(links)) {
      const start = match.index!;
      let text = match[0].replace(/[.,!?;:，。！？、…]+$/, '');
      for (const [open, close] of [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
      ]) {
        while (
          text.endsWith(close) &&
          text.split(close).length > text.split(open).length
        ) {
          text = text.slice(0, -1);
        }
      }
      let href: string;
      try {
        const url = new URL(/^www\./i.test(text) ? `https://${text}` : text);
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.username ||
          url.password
        )
          continue;
        href = url.href;
      } catch {
        continue;
      }
      if (start > position)
        parts.push({ text: message.slice(position, start) });
      parts.push({ text, href });
      position = start + text.length;
    }
    if (position < message.length)
      parts.push({ text: message.slice(position) });
    return parts;
  }
}
