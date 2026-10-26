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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const indexPath = fileURLToPath(
    new URL('../dist/client/browser/index.html', import.meta.url)
  );
  const html = await readFile(indexPath, 'utf8');
  const configured = configureTurnstileHtml(html, process.env);
  await writeFile(indexPath, configured, 'utf8');
  console.log(
    configured === html
      ? 'Turnstile: no build Site key override; using Angular configuration.'
      : 'Turnstile: public Site key added to built index.html.'
  );
}
