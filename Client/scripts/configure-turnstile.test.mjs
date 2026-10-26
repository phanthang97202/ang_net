import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  configureTurnstileHtml,
  configureYouTubeHtml,
} from './configure-turnstile.mjs';

const html = '<html><head><title>Blog</title></head><body>App</body></html>';
const siteKey = '1x00000000000000000000AA';

test('embeds the Vercel public key without exposing other environment variables', () => {
  const result = configureTurnstileHtml(html, {
    TURNSTILE_SITE_KEY: siteKey,
    PRIVATE_SECRET: 'never-publish-me',
  });
  assert.ok(
    result.includes(`<meta name="turnstile-site-key" content="${siteKey}">`)
  );
  assert.ok(!result.includes('never-publish-me'));
  assert.ok(result.includes('<title>Blog</title>'));
});

test('supports the existing variable name and prefers the canonical name', () => {
  assert.ok(
    configureTurnstileHtml(html, { turnstileSiteKey: ` ${siteKey} ` }).includes(
      siteKey
    )
  );
  assert.ok(
    configureTurnstileHtml(html, {
      TURNSTILE_SITE_KEY: siteKey,
      turnstileSiteKey: 'other-site-key',
    }).includes(siteKey)
  );
});

test('preserves static Angular configuration when no build key is provided', () => {
  assert.equal(configureTurnstileHtml(html, {}), html);
});

test('replaces a previous key on repeated postbuild runs', () => {
  const configured = configureTurnstileHtml(html, {
    TURNSTILE_SITE_KEY: siteKey,
  });
  assert.equal(
    configureTurnstileHtml(configured, { TURNSTILE_SITE_KEY: siteKey }),
    configured
  );
  const result = configureTurnstileHtml(configured, {
    TURNSTILE_SITE_KEY: 'another-public-key',
  });
  assert.ok(!result.includes(siteKey));
  assert.equal((result.match(/name="turnstile-site-key"/g) || []).length, 1);
});

test('rejects invalid configuration without echoing its value', () => {
  const value = '\"><script>alert(1)</script>';
  assert.throws(
    () => configureTurnstileHtml(html, { TURNSTILE_SITE_KEY: value }),
    error => !error.message.includes(value)
  );
  assert.throws(() =>
    configureTurnstileHtml('<body>missing head</body>', {
      TURNSTILE_SITE_KEY: siteKey,
    })
  );
});

test('embeds only the public YouTube API key and replaces previous values', () => {
  const youtubeKey = 'AIzaSyExamplePublicKey1234567890';
  const configured = configureYouTubeHtml(html, {
    YOUTUBE_API_KEY: youtubeKey,
    PRIVATE_SECRET: 'never-publish-me',
  });
  assert.ok(
    configured.includes(`<meta name="youtube-api-key" content="${youtubeKey}">`)
  );
  assert.ok(!configured.includes('never-publish-me'));

  const replaced = configureYouTubeHtml(configured, {
    YOUTUBE_API_KEY: 'AIzaSyReplacementPublicKey123456',
  });
  assert.ok(!replaced.includes(youtubeKey));
  assert.equal((replaced.match(/name="youtube-api-key"/g) || []).length, 1);
});

test('preserves HTML without YouTube configuration and rejects invalid keys', () => {
  assert.equal(configureYouTubeHtml(html, {}), html);
  assert.throws(() =>
    configureYouTubeHtml(html, {
      YOUTUBE_API_KEY: '\"><script>alert(1)</script>',
    })
  );
});
