# Letter Solver Pro

Static website served at https://haowordtool.com. Existing HTML routes, advertising account and CNAME are preserved.

## Build and check

No dependency installation is required. Use Node.js:

```
node scripts/generate-site.mjs
node --test tests/*.test.cjs
node scripts/validate-site.mjs
```

Edit templates in `scripts/generate-site.mjs`, article data in `scripts/content.mjs` and the two revised tutorials in `scripts/guide-improvements.mjs`. Generated HTML is checked into the repository for static hosting. Edit browser logic directly in `assets/solver-core.js` and `assets/site.js`; generation preserves these files.

Serve this directory over HTTP for testing: opening index.html as a local file cannot fetch the dictionary. No server API, external dictionary API or user search logging is introduced. The browser fetches the static dictionary once per page session on first search. User-entered searches are not placed into the URL. Prewritten tutorial links contain public sample racks; normal hosting/advertising services can see requested URLs as described in the site's privacy notice.

Dictionary provenance, limitations and checksum: [assets/DICTIONARY.md](assets/DICTIONARY.md). The loader verifies the exact SHA-256 before indexing, shares concurrent loads and permits retries after failures. Serve over HTTPS (or localhost for development) so the browser's Web Crypto integrity check is available.

## Release

Review the branch diff, run the checks, then merge into the existing publishing branch using the repository's established hosting configuration. Do not point CNAME to a second deployment. Keep a copy of the previous commit for rollback. Verify live CA? → CAT = 4 and CART? → TRACK = 6 after deployment.

Search Console setup and follow-up work: [SEARCH_GROWTH.zh-CN.md](SEARCH_GROWTH.zh-CN.md). Search traffic and AdSense approval are not guaranteed by this release.

## Creative workspaces
Video Studio, App Studio and AI Companion are linked from the home page. GitHub Pages serves the public interfaces; paid rendering, checkout and protected app packages require a separately configured backend. See video-saas/DEPLOY.zh-CN.md.
