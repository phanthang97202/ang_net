import { ChatLinksPipe } from './chat-links.pipe';

describe('Chat links', () => {
  const pipe = new ChatLinksPipe();
  it('links social, article and image URLs without modifying their text', () => {
    for (const text of [
      'https://www.tiktok.com/@user/video/123',
      'https://facebook.com/post/1',
      'https://youtu.be/abc?t=12',
      'https://example.com/a.png',
      'www.example.com/article',
    ]) {
      const parts = pipe.transform(text);
      expect(parts.length).toBe(1);
      expect(parts[0].text).toBe(text);
      expect(parts[0].href).toBe(
        text.startsWith('www.') ? `https://${text}` : text
      );
    }
  });
  it('preserves prose and punctuation around multiple URLs', () => {
    const text =
      'Xem (https://example.com/a), rồi https://example.com/wiki_(test).';
    const parts = pipe.transform(text);
    expect(parts.map(p => p.text).join('')).toBe(text);
    expect(parts.filter(p => p.href).map(p => p.text)).toEqual([
      'https://example.com/a',
      'https://example.com/wiki_(test)',
    ]);
  });
  it('leaves unsafe schemes, credential URLs and HTML as plain text', () => {
    for (const text of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'https://user:secret@example.com/',
      '<img src=x onerror=alert(1)>',
    ]) {
      const parts = pipe.transform(text);
      expect(parts.some(p => p.href)).toBeFalse();
      expect(parts.map(p => p.text).join('')).toBe(text);
    }
  });
});
