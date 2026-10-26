import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Publish only this public Site key. Never serialize the build environment.
export function configureTurnstileHtml(html, env) {
  const siteKey = (env.TURNSTILE_SITE_KEY || env.turnstileSiteKey || '').trim();
  if (!siteKey) return html;
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(siteKey)) {
    throw new Error(
      'TURNSTILE_SITE_KEY has an invalid format. Use the public Cloudflare Site key.'
    );
  }
  if (!/<\/head\s*>/i.test(html))
    throw new Error('Built index.html has no head element.');
  const cleaned = html.replace(
    /<meta\b[^>]*name=["']turnstile-site-key["'][^>]*>\s*/gi,
    ''
  );
  return cleaned.replace(
    /<\/head\s*>/i,
    `<meta name="turnstile-site-key" content="${siteKey}">\n</head>`
  );
}

// Google API key la khoa cong khai bat buoc phai gui tu trinh duyet khi tim kiem.
// Khong ghi cung trong bundle; Vercel chen no vao HTML luc build va khoa phai duoc
// gioi han HTTP referrer + YouTube Data API trong Google Cloud Console.
export function configureYouTubeHtml(html, env) {
  const apiKey = (env.YOUTUBE_API_KEY || '').trim();
  if (!apiKey) return html;
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(apiKey)) {
    throw new Error('YOUTUBE_API_KEY has an invalid format.');
  }
  if (!/<\/head\s*>/i.test(html))
    throw new Error('Built index.html has no head element.');
  const cleaned = html.replace(
    /<meta\b[^>]*name=["']youtube-api-key["'][^>]*>\s*/gi,
    ''
  );
  return cleaned.replace(
    /<\/head\s*>/i,
    `<meta name="youtube-api-key" content="${apiKey}">\n</head>`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const indexPath = fileURLToPath(
    new URL('../dist/client/browser/index.html', import.meta.url)
  );
  const html = await readFile(indexPath, 'utf8');
  const configured = configureYouTubeHtml(
    configureTurnstileHtml(html, process.env),
    process.env
  );
  await writeFile(indexPath, configured, 'utf8');
  console.log(
    configured === html
      ? 'Public config: no build-time key override.'
      : 'Public config: build-time keys added to built index.html.'
  );
}
