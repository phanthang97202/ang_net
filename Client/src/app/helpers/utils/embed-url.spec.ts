import {
  detectLinkProvider,
  extractYoutubeVideoId,
  resolveLinkEmbed,
} from './embed-url';

describe('extractYoutubeVideoId', () => {
  it('đọc được mọi dạng link YouTube phổ biến', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toEqual({ id: 'dQw4w9WgXcQ', isShort: false });
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toEqual({ id: 'dQw4w9WgXcQ', isShort: false });
    expect(extractYoutubeVideoId('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ id: 'dQw4w9WgXcQ', isShort: true });
    expect(extractYoutubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toEqual({ id: 'dQw4w9WgXcQ', isShort: false });
  });

  it('không nhận link kênh hay domain giả mạo', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/@somechannel')).toBeNull();
    expect(extractYoutubeVideoId('https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ')).toBeNull();
  });
});

describe('detectLinkProvider', () => {
  it('nhận diện theo tên miền, kể cả subdomain', () => {
    expect(detectLinkProvider('https://vt.tiktok.com/ZS123/')).toBe('TikTok');
    expect(detectLinkProvider('https://fb.watch/abc/')).toBe('Facebook');
    expect(detectLinkProvider('https://www.instagram.com/p/Cabc123/')).toBe('Instagram');
    expect(detectLinkProvider('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('YouTube');
  });

  it('domain chỉ chứa tên mạng xã hội thì vẫn là Web', () => {
    expect(detectLinkProvider('https://notyoutube.com/watch?v=x')).toBe('Web');
    expect(detectLinkProvider('https://tiktok.com.evil.test/@a/video/1')).toBe('Web');
    expect(detectLinkProvider('không phải link')).toBe('Web');
  });
});

describe('resolveLinkEmbed', () => {
  it('YouTube: nhúng qua youtube-nocookie, có thumbnail, shorts là video dọc', () => {
    const watch = resolveLinkEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(watch.embedSrc).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(watch.aspectRatio).toBe('16 / 9');
    expect(watch.thumbnailUrl).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');

    expect(resolveLinkEmbed('https://youtube.com/shorts/dQw4w9WgXcQ').aspectRatio).toBe('9 / 16');
  });

  it('TikTok: link đầy đủ nhúng được, link rút gọn thì không', () => {
    const full = resolveLinkEmbed('https://www.tiktok.com/@someone/video/7312345678901234567');
    expect(full.embedSrc).toBe('https://www.tiktok.com/player/v1/7312345678901234567');
    expect(full.aspectRatio).toBe('9 / 16');

    const short = resolveLinkEmbed('https://vt.tiktok.com/ZS123/');
    expect(short.provider).toBe('TikTok');
    expect(short.embedSrc).toBeNull();
  });

  it('Facebook reel là video dọc', () => {
    const reel = resolveLinkEmbed('https://www.facebook.com/reel/123456789');
    expect(reel.embedSrc).toContain('https://www.facebook.com/plugins/video.php?href=');
    expect(reel.aspectRatio).toBe('9 / 16');
  });

  it('Instagram post nhúng qua /embed', () => {
    expect(resolveLinkEmbed('https://www.instagram.com/reels/Cabc123/').embedSrc).toBe(
      'https://www.instagram.com/reel/Cabc123/embed'
    );
  });

  it('link Web bất kỳ không bao giờ được đưa vào iframe', () => {
    const web = resolveLinkEmbed('https://example.com/bai-viet-hay');
    expect(web.provider).toBe('Web');
    expect(web.embedSrc).toBeNull();
  });
});
