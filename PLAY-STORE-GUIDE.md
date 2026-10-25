# Publishing Fidget to Google Play (TWA via Bubblewrap)

1. `npm i -g @bubblewrap/cli` (needs JDK 17 + Android SDK; Bubblewrap can install them).
2. `bubblewrap init --manifest https://phantasticinc.github.io/fidget/manifest.json` — or reuse `twa-manifest.json` here (package `com.phantasticvanguard.fidget`, targetSdk 36).
3. `bubblewrap build` → `app-release-bundle.aab`. Keep `android.keystore` + passwords safe (never commit).
4. Digital Asset Links: GitHub Pages project sites can't serve `/.well-known/` at the domain root, so either
   (a) host on a custom domain (e.g. fidget.phantasticvanguard.com) and serve `/.well-known/assetlinks.json` there, or
   (b) put `assetlinks.json` in a `Phantasticinc.github.io` user-site repo. Fingerprint: from Play Console → App integrity (App signing key SHA-256).
   Without it the app still runs but shows a browser URL bar.
5. Play Console:
   - Category: Health & Fitness or Casual. Target audience: 13+. Not designed for children.
   - Ads: No. In-app purchases: No.
   - Data safety: *No data collected, no data shared.* (Only on-device localStorage settings.)
   - Health apps declaration: wellness/relaxation, **not a medical device**; app shows disclaimer in Settings and privacy policy.
   - Privacy policy URL: https://phantasticinc.github.io/fidget/privacy.html
   - Content rating questionnaire: no violence, no user content, no sharing → Everyone/PEGI 3.
6. Store listing: short description "Physics fidget toys with real haptics. No ads, works offline." Screenshots in `preview/`.
