# Search indexing maintenance

Run the scoped SEO pass without rebuilding unrelated assets:

```sh
node scripts/optimize-search.mjs
node --test tests/search-seo.test.mjs
node scripts/optimize-search.mjs --check
node scripts/validate-site.mjs
```

The localized-page generator also runs this pass at the end. Inspect the diff
before committing; no ZIP, mobile, or service builds are needed for SEO changes.

## Content readiness

The 115 localized counterpart pages and four localized directory homepages are
entry pages, not full translations of their corresponding products or policies.
They carry `localization-status=entry-only` and `noindex,follow`. Keep them
accessible, but do not submit them in the sitemap or claim their translations
are complete. The English editor homepage is a full working page, not an entry.

To make a counterpart indexable, translate the actual page content, features,
navigation, labels, and policy/service details. Update its generator to stop
emitting the entry-only marker, remove the provisional noindex rule for that
page, and review the complete rendered translation before adding it to the
language groups in `scripts/optimize-search.mjs`.

Existing noindex decisions for unfinished tools and private workspaces are
preserved. The project-sharing shell has no public content without local state
and is also noindex. Noindex is not an access-control mechanism.

## Sitemap and language links

The sitemap includes only self-canonical, indexable pages in the public content
directories. Demos and backend/frontend application source trees are excluded.
No generated timestamps are used for lastmod: a build is not evidence of a
meaningful content update. Canonical aliases remain outside the sitemap.

Hreflang groups must represent equivalent content, include themselves, and be
reciprocal. Only indexable canonical members are included. Directory homepages
with generic copy are not equivalents of the working editor.

## After deployment

Verify that the production HTML and sitemap match the committed version.
In Google Search Console, submit `https://haowordtool.com/sitemap.xml` and inspect
the homepage, `/en/`, and selected original guides. Check the rendered HTML,
user-declared versus Google-selected canonical, and indexing status. Search
Console access and live deployment must be verified separately; a successful
local audit does not establish indexing or ranking improvements.

References:
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
