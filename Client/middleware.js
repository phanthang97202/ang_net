// Vercel Routing Middleware:
// 1) chèn động các thẻ meta (og:*, twitter:*, title) cho từng trang chi
//    tiết bài viết, thay cho bộ meta tĩnh/dùng chung trong index.html.
// 2) sinh /sitemap.xml động từ danh sách bài viết thật lấy qua API, vì
//    site dùng CMS/API riêng - sitemap tạo lúc build sẽ lập tức lỗi thời
//    mỗi khi có bài viết mới.
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
// Đổi từ .mjs sang .js + đổi tên đúng quy ước "middleware.js" trước đó vẫn
// không được Vercel build (build log không hề nhắc tới "middleware"), nên
// giờ khai báo tường minh qua vercel.json (proxy.entrypoint) thay vì dựa
// vào auto-detect. Viết theo cú pháp CommonJS (module.exports) giống hệt
// api/groq-chat.js đã chạy được, để không phải thêm "type": "module" vào
// package.json (tránh ảnh hưởng build Angular/ESLint đang mặc định
// CommonJS).

const API_BASE = 'https://ang-net.onrender.com/api/';
const SITE_NAME = 'Phan Thang Blog';

module.exports = async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/sitemap.xml') {
    return handleSitemap(url);
  }

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

// matcher khai báo ở vercel.json (proxy.matcher) để tránh 2 nguồn khai báo
// khác nhau; ở đây chỉ còn runtime.
module.exports.config = {
  runtime: 'nodejs',
};

function fetchOrigin(url) {
  return fetch(new URL('/index.html', url.origin));
}

async function handleSitemap(url) {
  const staticEntries = [
    { loc: `${url.origin}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${url.origin}/news`, changefreq: 'daily', priority: '0.8' },
    { loc: `${url.origin}/about`, changefreq: 'monthly', priority: '0.3' },
  ];

  let articleEntries = [];

  try {
    const res = await fetch(
      `${API_BASE}news/search?pageIndex=0&pageSize=1000&keyword=&userid=&categoryid=&onlyPublished=true`
    );

    if (res.ok) {
      const body = await res.json();
      const list = (body && body.objResult && body.objResult.DataList) || [];

      articleEntries = list
        .filter(item => item.NewsId && item.CategoryNewsId)
        .map(item => ({
          loc: `${url.origin}/news/${encodeURIComponent(item.CategoryNewsId)}/${encodeURIComponent(item.NewsId)}`,
          lastmod: toDateOnly(item.UpdatedDTime || item.CreatedDTime),
          changefreq: 'weekly',
          priority: '0.7',
        }));
    }
  } catch {
    // API lỗi -> vẫn trả sitemap với các trang tĩnh, không chặn crawl hoàn
    // toàn chỉ vì backend tạm thời không phản hồi.
  }

  const xml = buildSitemapXml([...staticEntries, ...articleEntries]);

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Cache ngắn hơn trang bài viết vì đây là danh sách tổng hợp, muốn
      // bài mới xuất hiện trong sitemap tương đối sớm.
      'cache-control': 'public, max-age=300, s-maxage=3600',
    },
  });
}

function toDateOnly(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function buildSitemapXml(entries) {
  const urlTags = entries
    .map(entry => {
      const lastmodTag = entry.lastmod
        ? `<lastmod>${entry.lastmod}</lastmod>`
        : '';
      return `  <url><loc>${escapeHtml(entry.loc)}</loc>${lastmodTag}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>\n`;
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
