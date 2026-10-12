import test from 'node:test';
import assert from 'node:assert/strict';
import {optimize} from '../scripts/optimize-search.mjs';

const page = (url, extra = '') => `<html><head><title>Example</title><link rel="canonical" href="https://haowordtool.com${url}">${extra}</head><body>Original content</body></html>`;

test('entry-only pages remain available and are indexed (noindex removed per 2026-10-11 SEO fix)', () => {
  const html = page('/fr/pricing.html', '<meta name="localization-status" content="entry-only"><link rel="alternate" hreflang="en" href="https://haowordtool.com/en/pricing.html">');
  const result = optimize(new Map([['fr/pricing.html', html]]));
  assert.doesNotMatch(result.pages.get('fr/pricing.html'), /noindex/);
  assert.match(result.pages.get('fr/pricing.html'), /Original content/);
});

test('complete language counterparts have identical self-inclusive reciprocal annotations', () => {
  const result = optimize(new Map([['learn/index.html', page('/learn/')], ['en/learn/index.html', page('/en/learn/')]]));
  const annotations = html => html.match(/<link rel="alternate"[^>]*>/g);
  assert.deepEqual(annotations(result.pages.get('learn/index.html')), annotations(result.pages.get('en/learn/index.html')));
  assert.equal(annotations(result.pages.get('learn/index.html')).length, 3);
  assert.deepEqual(optimize(result.pages), result);
});

test('index,follow pages enter sitemap; canonical aliases excluded (updated 2026-10-11)', () => {
  const result = optimize(new Map([
    ['index.html', page('/')],
    ['en/index.html', page('/en/', '<meta name="robots" content="index,follow">')],
    ['app-builder.html', page('/')]
  ]));
  assert.deepEqual(result.urls, ['https://haowordtool.com/', 'https://haowordtool.com/en/']);
  assert.doesNotMatch(result.pages.get('index.html'), /hreflang/);
  assert.doesNotMatch(result.sitemap, /lastmod|priority|changefreq/);
});

test('redesigned English root is not incorrectly grouped as the legacy Chinese home',()=>{const result=optimize(new Map([['index.html',page('/')],['en/index.html',page('/en/')]]));assert.doesNotMatch(result.pages.get('index.html'),/hreflang/);assert.doesNotMatch(result.pages.get('en/index.html'),/hreflang/)});

