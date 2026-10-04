/**
 * Đọc link/mã nhúng của các mạng xã hội ra đường dẫn iframe nhúng được.
 * Dùng chung cho trình soạn bài viết và thư viện lưu trữ - thêm nguồn mới
 * thì thêm ở đây, cả hai nơi cùng được.
 */

export type LinkProvider = 'YouTube' | 'TikTok' | 'Facebook' | 'Instagram' | 'Web';

export interface ResolvedLinkEmbed {
  provider: LinkProvider;
  /** null = không nhúng được, hiển thị dạng thẻ link */
  embedSrc: string | null;
  /** Tỉ lệ khung hình CSS ("16 / 9"); null = để chiều cao cố định */
  aspectRatio: string | null;
  /** Thumbnail tự suy ra được từ link (hiện chỉ YouTube) */
  thumbnailUrl: string | null;
}

export function extractTiktokVideoId(input: string): string | null {
  const match =
    input.match(/tiktok\.com\/(?:@[^/]+\/video|player\/v1)\/(\d+)/) ??
    input.match(/data-video-id=["'](\d+)["']/);
  return match ? match[1] : null;
}

export function toFacebookPluginSrc(input: string): string | null {
  const href = extractFacebookHref(input);
  if (!href) return null;

  if (/facebook\.com\/plugins\/(video|post)\.php/.test(href)) {
    return href;
  }

  const encoded = encodeURIComponent(href);

  return isFacebookVideo(href)
    ? `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false`
    : `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true`;
}

export function extractFacebookHref(input: string): string | null {
  const embedded =
    input.match(/<iframe[^>]+src=["']([^"']+)["']/i) ??
    input.match(/data-href=["']([^"']+)["']/i) ??
    input.match(/\scite=["']([^"']+)["']/i);
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

export function extractInstagramPermalink(input: string): string | null {
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

export function toInstagramEmbedSrc(
  permalink: string,
  captioned: boolean
): string | null {
  if (/instagram\.com\/share\//i.test(permalink)) return null;

  const match = permalink.match(
    /instagram\.com\/(?:[^/?#]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (!match) return null;

  const type = match[1].toLowerCase();
  const kind = type === 'reels' ? 'reel' : type;
  const suffix = captioned ? '/captioned' : '';
  return `https://www.instagram.com/${kind}/${match[2]}/embed${suffix}`;
}

/** watch?v=, youtu.be/, shorts/, embed/, live/ đều ra cùng một mã video. */
export function extractYoutubeVideoId(
  input: string
): { id: string; isShort: boolean } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./i, '').toLowerCase();
  let id: string | null = null;
  let isShort = false;

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const path = url.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/i);
    if (path) {
      id = path[2];
      isShort = path[1].toLowerCase() === 'shorts';
    } else {
      id = url.searchParams.get('v');
    }
  }

  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? { id, isShort } : null;
}

/**
 * Link bất kỳ -> cách hiển thị. Không nhận ra thì vẫn trả provider để giao
 * diện vẽ thẻ link đúng biểu tượng.
 */
export function resolveLinkEmbed(rawUrl: string): ResolvedLinkEmbed {
  const raw = (rawUrl ?? '').trim();
  const provider = detectLinkProvider(raw);
  const result: ResolvedLinkEmbed = {
    provider,
    embedSrc: null,
    aspectRatio: null,
    thumbnailUrl: null,
  };

  switch (provider) {
    case 'YouTube': {
      const video = extractYoutubeVideoId(raw);
      if (video) {
        result.embedSrc = `https://www.youtube-nocookie.com/embed/${video.id}`;
        result.aspectRatio = video.isShort ? '9 / 16' : '16 / 9';
        result.thumbnailUrl = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
      }
      break;
    }
    case 'TikTok': {
      // Link rút gọn vt.tiktok.com không chứa mã video, không nhúng được
      const id = extractTiktokVideoId(raw);
      if (id) {
        result.embedSrc = `https://www.tiktok.com/player/v1/${id}`;
        result.aspectRatio = '9 / 16';
      }
      break;
    }
    case 'Facebook': {
      result.embedSrc = toFacebookPluginSrc(raw);
      const href = extractFacebookHref(raw);
      if (result.embedSrc && href && isFacebookVideo(href)) {
        result.aspectRatio = /\/(reel|reels)\//i.test(href) ? '9 / 16' : '16 / 9';
      }
      break;
    }
    case 'Instagram': {
      const permalink = extractInstagramPermalink(raw);
      result.embedSrc = permalink ? toInstagramEmbedSrc(permalink, false) : null;
      break;
    }
  }

  return result;
}

/** Phải khớp với ArchiveService.DetectProvider ở backend. */
export function detectLinkProvider(rawUrl: string): LinkProvider {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return 'Web';
  }

  const is = (domain: string) => host === domain || host.endsWith('.' + domain);

  if (is('youtube.com') || is('youtu.be')) return 'YouTube';
  if (is('tiktok.com')) return 'TikTok';
  if (is('facebook.com') || is('fb.watch')) return 'Facebook';
  if (is('instagram.com')) return 'Instagram';
  return 'Web';
}

function isFacebookVideo(href: string): boolean {
  return (
    /\/(videos|reel|reels|watch)\//.test(href) ||
    /\/share\/[vr]\//.test(href) ||
    /fb\.watch\//.test(href) ||
    /[?&]v=\d/.test(href)
  );
}
