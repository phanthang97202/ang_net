// Vercel Routing Middleware:
// 1) chèn động các thẻ meta (title, description, og:*, twitter:*) + canonical
//    + structured data JSON-LD cho từng trang, thay cho bộ meta tĩnh/dùng
//    chung trong index.html.
// 2) sinh /sitemap.xml động từ danh sách bài viết thật lấy qua API, vì
//    site dùng CMS/API riêng - sitemap tạo lúc build sẽ lập tức lỗi thời
//    mỗi khi có bài viết mới.
// 3) trả HTTP 404 thật (kèm noindex) cho URL bài viết không tồn tại, thay vì
//    200 + trang trắng - nếu không Search Console sẽ báo "Soft 404" hàng loạt.
//
// Vì sao cần: đây là Angular SPA render phía client. Zalo/Facebook/Telegram...
// không chạy JavaScript khi tạo preview link - chúng chỉ đọc thẳng HTML gốc
// trả về từ server. Angular tự set lại <title>/meta sau khi bootstrap (qua
// Title/Meta service) nhưng lúc đó crawler đã đọc xong HTML tĩnh rồi, nên mọi
// bài viết khi share đều hiện đúng 1 tiêu đề/ảnh mặc định của cả site.
//
// Cách xử lý: áp dụng cho MỌI request khớp route công khai (không chỉ khi phát
// hiện bot qua User-Agent) - vì danh sách User-Agent của các app rất khó biết
// đầy đủ/chính xác (vd Zalo không công bố rõ ràng) và có thể đổi bất cứ lúc
// nào. Người dùng thật vẫn nhận đúng index.html gốc (kèm script Angular) nên
// trải nghiệm SPA không đổi - chỉ có phần <head> là được thay bằng nội dung
// thật của trang trước khi HTML rời server.
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

// Hardcode origin production thay vì lấy url.origin: canonical có nhiệm vụ gộp
// mọi biến thể host về 1 địa chỉ duy nhất. Vercel còn phục vụ site qua các
// domain *.vercel.app (preview/deploy), nếu để chúng tự trỏ về chính mình thì
// các domain đó thành bản sao cạnh tranh với domain chính trên Google.
const SITE_ORIGIN = 'https://www.phanthang.site';
const DEFAULT_DESCRIPTION =
  'Blog cá nhân của Phan Thang - chia sẻ bài viết, tin tức và trải nghiệm.';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/assets/images/logo.png`;

// Nguồn dữ liệu duy nhất cho các trang tĩnh (không phải bài viết): vừa dùng để
// chèn meta, vừa dùng để sinh phần đầu sitemap - tránh 2 danh sách lệch nhau
// (trước đây sitemap khai báo /about trong khi route /about đã bị comment).
// Thêm route công khai mới thì khai báo ở đây VÀ ở proxy.matcher/vercel.json.
const PAGE_META = {
  '/': {
    title: `${SITE_NAME} - Chia sẻ bài viết, tin tức và trải nghiệm`,
    description: DEFAULT_DESCRIPTION,
    changefreq: 'daily',
    priority: '1.0',
  },
  '/news': {
    title: `Tin tức - ${SITE_NAME}`,
    description:
      'Tổng hợp bài viết và tin tức mới nhất trên Phan Thang Blog: ẩm thực, du lịch, phim ảnh và nhiều chủ đề khác.',
    changefreq: 'daily',
    priority: '0.8',
  },
  '/reels': {
    title: `Reels - ${SITE_NAME}`,
    description: 'Những video reel ngắn được chia sẻ trên Phan Thang Blog.',
    changefreq: 'weekly',
    priority: '0.5',
  },
  '/tools/shift-report': {
    title: `Báo cáo ca trực - ${SITE_NAME}`,
    description:
      'Công cụ ghi nhận và bàn giao báo cáo ca trực cho lễ tân khách sạn: tiền mặt, chuyển khoản, chi tiêu và số phòng theo từng ca.',
    changefreq: 'monthly',
    priority: '0.5',
  },
  '/tools/revenue-report': {
    title: `Báo cáo doanh thu - ${SITE_NAME}`,
    description:
      'Thống kê doanh thu khách sạn theo ca trực và theo lễ tân: tiền mặt, chuyển khoản, chi tiêu và tổng doanh thu.',
    changefreq: 'monthly',
    priority: '0.5',
  },
  '/tools/calculating-hotel-fee': {
    title: `Tính phí khách sạn - ${SITE_NAME}`,
    description:
      'Công cụ dự toán chi phí thuê phòng khách sạn theo giờ check-in, giờ check-out và kiểu thuê.',
    changefreq: 'monthly',
    priority: '0.5',
  },
};

module.exports = async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/sitemap.xml') {
    return handleSitemap();
  }

  // /news/:categoryId/:newsId -> ['', 'news', categoryId, newsId]
  const segments = url.pathname.split('/').filter(Boolean);

  if (segments[0] === 'news' && segments[2]) {
    return handleArticle(url.pathname, segments[2], url.origin);
  }

  return handleStaticPage(url.pathname, url.origin);
};

// matcher khai báo ở vercel.json (proxy.matcher) để tránh 2 nguồn khai báo
// khác nhau; ở đây chỉ còn runtime.
module.exports.config = {
  runtime: 'nodejs',
};

// Lấy shell HTML từ chính origin của request chứ không phải SITE_ORIGIN: trên
// preview deployment của Vercel, index.html của prod trỏ tới bundle JS của
// prod - phải phục vụ đúng build của deployment đang chạy. SITE_ORIGIN chỉ
// dùng cho canonical/og:url/sitemap, tức phần "danh tính" URL.
function fetchOrigin(origin) {
  return fetch(new URL('/index.html', origin));
}

// --------------------------------------------------------------- trang tĩnh

async function handleStaticPage(pathname, origin) {
  const key = normalizePath(pathname);
  const meta = PAGE_META[key];

  if (!meta) {
    // Route không khai báo (chỉ xảy ra nếu matcher rộng hơn PAGE_META): trả
    // nguyên index.html, không tự bịa canonical trỏ sai chỗ.
    return fetchOrigin(origin);
  }

  const canonical = SITE_ORIGIN + key;
  const html = await (await fetchOrigin(origin)).text();

  const injected = injectHead(
    injectMetaTags(html, {
      title: meta.title,
      description: meta.description,
      image: DEFAULT_IMAGE,
      pageUrl: canonical,
      type: 'website',
    }),
    canonicalTag(canonical) +
      (key === '/' ? jsonLdTag(buildWebSiteSchema()) : '')
  );

  return htmlResponse(injected);
}

// ----------------------------------------------------------------- bài viết

async function handleArticle(pathname, newsId, origin) {
  let body;

  try {
    const apiRes = await fetch(
      `${API_BASE}news/detail?newsid=${encodeURIComponent(newsId)}`
    );

    // API lỗi ở tầng vận chuyển (5xx, Render đang ngủ dậy...) -> fail open:
    // trả trang bình thường, status 200. Chỉ được phép 404 khi API trả lời rõ
    // ràng rằng bài không tồn tại, nếu không backend chập chờn sẽ khiến Google
    // gỡ index của cả loạt bài đang sống.
    if (!apiRes.ok) {
      return fetchOrigin(origin);
    }

    body = await apiRes.json();
  } catch {
    return fetchOrigin(origin);
  }

  const article = body && body.Data;

  // API trả 200 kèm Data: null + Success: false cho id không tồn tại.
  if (!article) {
    return notFoundResponse(origin);
  }

  const canonical = SITE_ORIGIN + normalizePath(pathname);
  const title = article.ShortTitle
    ? `${article.ShortTitle} - ${SITE_NAME}`
    : SITE_NAME;
  const description = article.ShortDescription || '';
  const image = article.Thumbnail || DEFAULT_IMAGE;

  const html = await (await fetchOrigin(origin)).text();

  const injected = injectHead(
    injectMetaTags(html, {
      title,
      description,
      image,
      pageUrl: canonical,
      type: 'article',
    }),
    canonicalTag(canonical) +
      jsonLdTag(buildArticleSchema(article, canonical, image)) +
      jsonLdTag(buildBreadcrumbSchema(article, canonical))
  );

  return htmlResponse(injected);
}

async function notFoundResponse(origin) {
  const html = await (await fetchOrigin(origin)).text();

  const injected = injectHead(
    injectMetaTags(html, {
      title: `Không tìm thấy trang - ${SITE_NAME}`,
      description: '',
      image: DEFAULT_IMAGE,
      pageUrl: SITE_ORIGIN,
      type: 'website',
    }),
    '<meta name="robots" content="noindex">'
  );

  return new Response(injected, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

// ----------------------------------------------------------- structured data

function buildArticleSchema(article, canonical, image) {
  const published = article.CreatedDTime;
  const modified = article.UpdatedDTime || published;
  const keywords = (article.LstHashTagNews || [])
    .map(tag => tag && tag.HashTagNewsName)
    .filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    // Google khuyến nghị headline <= 110 ký tự, và không kèm tên site.
    headline: truncate(article.ShortTitle || SITE_NAME, 110),
    description: article.ShortDescription || '',
    image: [image],
    inLanguage: 'vi-VN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Person', name: article.FullName || 'Phan Thang' },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE },
    },
  };

  if (published) schema.datePublished = published;
  if (modified) schema.dateModified = modified;
  if (keywords.length) schema.keywords = keywords.join(', ');

  return schema;
}

// Chỉ 3 cấp: chưa có route liệt kê bài theo chuyên mục (/news/:categoryId),
// nên không đưa chuyên mục vào breadcrumb để khỏi trỏ tới URL không tồn tại.
function buildBreadcrumbSchema(article, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_ORIGIN },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tin tức',
        item: `${SITE_ORIGIN}/news`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.ShortTitle || SITE_NAME,
        item: canonical,
      },
    ],
  };
}

function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'vi-VN',
  };
}

// ------------------------------------------------------------------ sitemap

async function handleSitemap() {
  const staticEntries = Object.keys(PAGE_META).map(key => ({
    loc: SITE_ORIGIN + key,
    changefreq: PAGE_META[key].changefreq,
    priority: PAGE_META[key].priority,
  }));

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
          loc: `${SITE_ORIGIN}/news/${encodeURIComponent(item.CategoryNewsId)}/${encodeURIComponent(item.NewsId)}`,
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

// ------------------------------------------------------------------ helpers

function htmlResponse(html) {
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Cache ở CDN của Vercel theo từng URL, để crawler share lại (hoặc
      // người xem lại) không phải gọi API + render lại mỗi lần - trình duyệt
      // (max-age) vẫn refetch sau 5 phút, CDN giữ tối đa 1 ngày và âm thầm
      // làm mới trong lúc vẫn phục vụ bản cũ.
      'cache-control':
        'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

// Bỏ dấu "/" thừa ở cuối để "/news" và "/news/" không thành 2 URL khác nhau
// trong mắt Google.
function normalizePath(pathname) {
  const clean = pathname.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

function truncate(str, max) {
  return str.length <= max ? str : `${str.slice(0, max - 1).trimEnd()}…`;
}

function canonicalTag(canonical) {
  return `<link rel="canonical" href="${escapeHtml(canonical)}">`;
}

// Escape "<" bên trong JSON để chuỗi "</script>" lỡ nằm trong dữ liệu bài viết
// không đóng sớm thẻ <script> (JSON vẫn hợp lệ vì < là escape chuẩn).
function jsonLdTag(schema) {
  const json = JSON.stringify(schema).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function injectHead(html, extra) {
  if (!extra) return html;
  // Dùng hàm thay cho chuỗi thay thế: nội dung chèn vào có thể chứa "$&",
  // "$'"... vốn mang nghĩa đặc biệt trong String.replace.
  return html.replace('</head>', () => `${extra}</head>`);
}

function injectMetaTags(html, { title, description, image, pageUrl, type }) {
  let result = html;

  result = result.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${escapeHtml(title)}</title>`
  );

  result = setMetaContent(result, 'name', 'description', description);
  result = setMetaContent(result, 'property', 'og:type', type);
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
  return html.replace(
    re,
    (match, prefix, quote) => `${prefix}${escapeHtml(newContent)}${quote}`
  );
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
