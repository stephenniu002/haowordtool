# Railway first deployment

This image runs the authenticated publishing API and workspace only. It does not
run a browser worker or connect to the owner's AdsPower computer. Keep platform
credentials unset until a worker and the real account flow have been verified.

1. Deploy this repository with repository root `/` and config path
   `/publisher-service/railway.json`. Do not deploy the unrelated video-saas app.
2. Attach one persistent volume at `/data`. Use one replica. SQLite and media
   must survive restarts. Do not deploy without the volume.
3. Generate a Railway domain. Set `PUBLIC_ORIGIN` to its exact HTTPS origin
   without a trailing slash. Set a new `PUBLISHER_ENCRYPTION_KEY` (32 random bytes,
   base64), `PUBLISHER_ADMIN_EMAIL`, and a random `PUBLISHER_ADMIN_PASSWORD`
   of at least 14 characters using Railway's private variables. Never put these
   values in Git, chat, screenshots, build args, or deployment logs.
4. The image listens on Railway's `PORT`, exposes `/healthz`, limits individual
   uploads to 50 MiB and stored media per user to 200 MiB. These are storage limits,
   not spending limits. Confirm the account has free credit and a suitable usage
   cap in the dashboard before starting; do not upgrade or add paid resources.
5. Verify `/healthz`, login, authenticated upload, and data persistence before
   connecting the production website. First use the Railway-hosted workspace
   at `/publisher.html`; the current frontend calls its own origin's API.
6. To retain haowordtool.com/publisher.html, route that page, its two assets and
   `/api/publisher/*` to this service through the existing domain infrastructure,
   then set PUBLIC_ORIGIN to https://haowordtool.com. Review the routing change
   before deployment. Merely changing DNS or adding a cross-origin API URL does
   not configure the current session-cookie and CSRF model.

Facebook and TikTok remain AdsPower1-only. Do not upload the local AdsPower key
or expose its local API publicly. A separate authenticated local-worker bridge
is still required. Instagram and WeChat Channels are currently postponed.
