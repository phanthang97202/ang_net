import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const middleware = require('../middleware.js');
const origin = 'https://thangphan.vercel.app';
const article = {
  NewsId: 'test-post', CategoryNewsId: 'code', ShortTitle: 'Bài thử',
  ShortDescription: 'Mô tả', ContentBody: '<p>Nội dung</p>',
  CreatedDTime: '2026-10-30T00:00:00Z',
};

test('SEO responses use the production origin even on preview deployments', async () => {
  const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
  const robots = await readFile(new URL('../src/robots.txt', import.meta.url), 'utf8');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.includes('/index.html')) return new Response(html);
    if (url.includes('/news/detail?')) return Response.json({ Data: article });
    if (url.includes('/news/search?')) return Response.json({ objResult: { DataList: [article] } });
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    assert.match(robots, new RegExp(`Sitemap: ${origin}/sitemap\\.xml`));
    for (const path of ['/', '/news/code/test-post', '/sitemap.xml', '/rss.xml']) {
      const response = await middleware(new Request(`https://preview.example${path}`));
      const body = await response.text();
      assert.equal(response.status, 200, path);
      assert.ok(body.includes(origin), path);
      assert.ok(!body.includes('phanthang.site'), path);
      if (path === '/') assert.ok(body.includes(`<link rel="canonical" href="${origin}/">`));
      if (path === '/news/code/test-post') {
        assert.ok(body.includes(`<link rel="canonical" href="${origin}${path}">`));
        assert.ok(body.includes(`"@id":"${origin}${path}"`));
      }
      if (path === '/sitemap.xml' || path === '/rss.xml') assert.ok(body.includes(`${origin}/news/code/test-post`));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
