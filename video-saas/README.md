
## Protected App packages
Keep package files outside the public website output. Set ANDROID_PACKAGE_FILE or IOS_PACKAGE_FILE to a private local absolute path on the billing server. The old ANDROID_DOWNLOAD_URL / IOS_DOWNLOAD_URL are no longer exposed or used.
GET /api/video/apps/android and /api/video/apps/ios require a valid session and an active paid video subscription on every request; no public redirect is returned. Apple package distribution still requires the appropriate signed distribution setup.
The current Sites publication is static: this Node billing server is not deployed there. Production payments and protected package hosting remain unconfigured. Companion subscription entitlements must be connected separately; do not grant companion downloads using video subscription status.
