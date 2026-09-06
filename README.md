# Letter Solver Pro

## Video Studio SaaS

`/video-studio.html` adds the Chinese video studio: storyboard editing, optional AI scripts, ElevenLabs narration, aligned captions, Remotion/HyperFrames rendering and MP4/SRT downloads. Subscription: **30 USDT per 30 days**, renewed by explicit payment, with Alipay, WeChat Pay and manually verified USDT channels. Static hosting supports the editor; production rendering and payments require the separate Node service. Android/iOS packaging sources are in `mobile/`; real download URLs require signed, published applications.

Setup, configuration and current limitations: [video-saas/DEPLOY.zh-CN.md](video-saas/DEPLOY.zh-CN.md). Captions/Mirage API access is pending; current captions use ElevenLabs timing. No payment provider or paid AI service is enabled without server configuration.

Static website served at https://haowordtool.com. Existing HTML routes, advertising account and CNAME are preserved.

## Build and check

No dependency installation is required. Use Node.js:

```
node scripts/generate-site.mjs
node --test tests/solver.test.cjs
node --test tests/media.test.mjs
node scripts/validate-site.mjs
```

Edit templates in `scripts/generate-site.mjs`, article data in `scripts/content.mjs` and the two revised tutorials in `scripts/guide-improvements.mjs`. Generated HTML is checked into the repository for static hosting. Edit browser logic directly in `assets/solver-core.js` and `assets/site.js`; generation preserves these files.

Serve this directory over HTTP for testing: opening index.html as a local file cannot fetch the dictionary. No server API, external dictionary API or user search logging is introduced. The browser fetches the static dictionary once per page session on first search. User-entered searches are not placed into the URL. Prewritten tutorial links contain public sample racks; normal hosting/advertising services can see requested URLs as described in the site's privacy notice.

Dictionary provenance, limitations and checksum: [assets/DICTIONARY.md](assets/DICTIONARY.md).

## Release

Review the branch diff, run the checks, then merge into the existing publishing branch using the repository's established hosting configuration. Do not point CNAME to a second deployment. Keep a copy of the previous commit for rollback. Verify live CA? → CAT = 4 and CART? → TRACK = 6 after deployment.

Search Console setup and follow-up work: [SEARCH_GROWTH.zh-CN.md](SEARCH_GROWTH.zh-CN.md). Search traffic and AdSense approval are not guaranteed by this release.

## Media downloader

`/media-downloader.html` is a standalone, browser-only media download tool. Edit its HTML and `assets/media*` directly; generation preserves them and adds navigation and sitemap entries. No proxy server, accounts, payment, or additional dependencies are required.

Supports CORS-enabled audio/video files and unencrypted HLS VOD with MPEG-TS segments (up to 2,000 segments and 256 MiB total). Master playlists offer resolution selection. Live streams, DRM/encryption, DASH, fragmented MP4, byte ranges, discontinuities and separate audio tracks are rejected. HLS output is `.ts`, not transcoded MP4. Downloads remain in memory until saved or the page closes. Large files may exceed memory on mobile devices. Source URLs are never stored by this page; requests omit cookies and referrers, but the source sees the user's IP and requested URL. This route intentionally loads no third-party scripts.
