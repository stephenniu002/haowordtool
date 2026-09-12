import test from 'node:test';
import assert from 'node:assert/strict';
import {optimize} from '../scripts/optimize-search.mjs';

const page = (url, extra = '') => `<html><head><title>Example</title><link rel="canonical" href="https://haowordtool.com${url}">${extra}</head><body>Original content</body></html>`;

test('entry-only pages remain available but are excluded from indexing and language clusters', () => {
  const html = page('/fr/pricing.html', '<meta name="localization-status" content="entry-only"><link rel="alternate" hreflang="en" href="https://haowordtool.com/en/pricing.html">');
  const result = optimize(new Map([['fr/pricing.html', html]]));
  assert.match(result.pages.get('fr/pricing.html'), /noindex,follow/);
  assert.match(result.pages.get('fr/pricing.html'), /Original content/);
  assert.doesNotMatch(result.pages.get('fr/pricing.html'), /hreflang/);
  assert.equal(result.urls.length, 0);
});

test('complete language counterparts have identical self-inclusive reciprocal annotations', () => {
  const result = optimize(new Map([['index.html', page('/')], ['en/index.html', page('/en/')]]));
  const annotations = html => html.match(/<link rel="alternate"[^>]*>/g);
  assert.deepEqual(annotations(result.pages.get('index.html')), annotations(result.pages.get('en/index.html')));
  assert.equal(annotations(result.pages.get('index.html')).length, 3);
  assert.deepEqual(optimize(result.pages), result);
});

test('preserve noindex and canonical aliases; neither enters sitemap or hreflang', () => {
  const result = optimize(new Map([
    ['index.html', page('/')],
    ['en/index.html', page('/en/', '<meta name="robots" content="noindex,follow">')],
    ['app-builder.html', page('/')]
  ]));
  assert.deepEqual(result.urls, ['https://haowordtool.com/']);
  assert.doesNotMatch(result.pages.get('index.html'), /hreflang/);
  assert.doesNotMatch(result.sitemap, /lastmod|priority|changefreq/);
});
