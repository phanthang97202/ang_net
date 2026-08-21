// Vercel Routing Middleware: chèn động các thẻ meta (og:*, twitter:*, title)
// cho từng trang chi tiết bài viết, thay cho bộ meta tĩnh/dùng chung trong
// index.html.
//
// Vì sao cần: đây là Angular SPA render phía client. Zalo/Facebook/Telegram...
// không chạy JavaScript khi tạo preview link - chúng chỉ đọc thẳng HTML gốc
// trả về từ server. Angular tự set lại <title>/meta sau khi bootstrap (qua
// Title/Meta service) nhưng lúc đó crawler đã đọc xong HTML tĩnh rồi, nên mọi
// bài viết khi share đều hiện đúng 1 tiêu đề/ảnh mặc định của cả site.
//
// Cách xử lý: áp dụng cho MỌI request khớp route bài viết (không chỉ khi phát
// hiện bot qua User-Agent) - vì danh sách User-Agent của các app rất khó biết
// đầy đủ/chính xác (vd Zalo không công bố rõ ràng) và có thể đổi bất cứ lúc
// nào. Người dùng thật vẫn nhận đúng index.html gốc (kèm script Angular) nên
// trải nghiệm SPA không đổi - chỉ có phần <meta> trong <head> là được thay
// bằng nội dung bài viết trước khi HTML rời server.
//
// Vercel chỉ tự nhận diện Routing Middleware qua đúng tên file
// "middleware.js"/"middleware.ts" ở gốc project - bản .mjs trước đó không
// được build (build log không hề nhắc tới "middleware"). Viết theo cú pháp
// CommonJS (module.exports) giống hệt api/groq-chat.js đã chạy được, để
// không phải thêm "type": "module" vào package.json (tránh ảnh hưởng build
// Angular/ESLint đang mặc định CommonJS).

const API_BASE = 'https://ang-net.onrender.com/api/';
const SITE_NAME = 'Phan Thang - Blog cá nhân';

module.exports = async function middleware(request) {
  const url = new URL(request.url);
  // /news/:categoryId/:newsId -> ['', 'news', categoryId, newsId]
  const segments = url.pathname.split('/').filter(Boolean);
  const newsId = segments[2];

  if (!newsId) {
    return fetchOrigin(url);
  }

  try {
    const apiRes = await fetch(
      `${API_BASE}news/detail?newsid=${encodeURIComponent(newsId)}`
    );

    if (!apiRes.ok) {
      return fetchOrigin(url);
    }

    const body = await apiRes.json();
    const article = body && body.Data;

    if (!article) {
      return fetchOrigin(url);
    }

    const htmlRes = await fetchOrigin(url);
    const html = await htmlRes.text();

    const title = article.ShortTitle
      ? `${article.ShortTitle} - ${SITE_NAME}`
      : SITE_NAME;
    const description = article.ShortDescription || '';
    const image = article.Thumbnail || `${url.origin}/assets/images/logo.png`;
    const pageUrl = url.toString();

    const injected = injectMetaTags(html, {
      title,
      description,
      image,
      pageUrl,
    });

    return new Response(injected, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // Cache ở CDN của Vercel theo từng URL bài viết, để crawler share
        // lại (hoặc người xem lại) không phải gọi API + render lại mỗi lần -
        // trình duyệt (max-age) vẫn refetch sau 5 phút, CDN giữ tối đa 1
        // ngày và âm thầm làm mới trong lúc vẫn phục vụ bản cũ.
        'cache-control':
          'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    // Lỗi mạng/API lỗi -> trả về trang bình thường, không chặn người dùng
    // thật vì lỗi ở bước làm giàu meta tag.
    return fetchOrigin(url);
  }
};

module.exports.config = {
  matcher: '/news/:categoryId/:newsId',
  runtime: 'nodejs',
};

function fetchOrigin(url) {
  return fetch(new URL('/index.html', url.origin));
}

function injectMetaTags(html, { title, description, image, pageUrl }) {
  let result = html;

  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  );

  result = setMetaContent(result, 'name', 'description', description);
  result = setMetaContent(result, 'property', 'og:type', 'article');
  result = setMetaContent(result, 'property', 'og:title', title);
  result = setMetaContent(result, 'property', 'og:description', description);
  result = setMetaContent(result, 'property', 'og:image', image);
  result = setMetaContent(result, 'property', 'og:url', pageUrl);
  result = setMetaContent(result, 'name', 'twitter:title', title);
  result = setMetaContent(result, 'name', 'twitter:description', description);
  result = setMetaContent(result, 'name', 'twitter:image', image);

  return result;
}

// Thay giá trị content="..." của 1 thẻ <meta attr="attrValue" content="..."/>,
// bất kể attr/content nằm cùng dòng hay tách dòng trong index.html.
function setMetaContent(html, attr, attrValue, newContent) {
  const re = new RegExp(
    `(<meta[^>]*${attr}=["']${escapeRegExp(attrValue)}["'][^>]*content=["'])[^"']*(["'])`,
    'i'
  );
  return html.replace(re, `$1${escapeHtml(newContent)}$2`);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
