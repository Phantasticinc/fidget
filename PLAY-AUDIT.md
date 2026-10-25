# Google Play audit — Fidget (com.phantasticvanguard.fidget)
Audited Oct 25, 2026 (CT) against current Play Console Help / policy pages.

| Check | Requirement (current) | Status |
|---|---|---|
| Target API | New apps must target API 36 (since Aug 31, 2026) | PASS — targetSdk 36, minSdk 24, compileSdk 36 |
| 16 KB page size | Applies to native .so libs | PASS / N/A — bundle has 0 native libraries |
| Format / signing | Signed .aab, Play App Signing | PASS — fidget-1.0.0-vc1.aab, versionCode 1 / 1.0.0, `bundletool validate` OK, jar verified |
| Digital Asset Links | https://phantasticinc.github.io/.well-known/assetlinks.json | FIXED — new repo Phantasticinc/Phantasticinc.github.io, served as JSON, Google DAL API `linked: true` for upload key. **Must add Play app-signing SHA-256 after first upload** |
| Privacy policy URL | Public, non-PDF, linked in-app | PASS — https://phantasticinc.github.io/fidget/privacy.html (200), linked in Settings |
| Data safety | Required for all apps | READY — "No data collected / shared" (see play-upload/data-safety-and-rating.md) |
| Ads declaration | Required | READY — No ads |
| App access | Login creds if gated | READY — no restrictions |
| Content rating (IARC) | Questionnaire required | READY — all "No" → expect 3+/Everyone |
| Target audience | Under-13 triggers Families policy | READY — select 13+ only; no child-directed appeal |
| Health/medical claims | No unsubstantiated medical claims; health declaration | PASS — copy says "relaxation toy, not a medical device"; no anxiety/ADHD/therapy claims |
| App name ≤30 | | PASS — "Fidget: Tactile Toys" (20) |
| Short desc ≤80 | | PASS — 75 chars |
| Full desc ≤4000 | | PASS — ~1,000 chars, no keyword stuffing/emoji spam |
| Icon 512×512 32-bit PNG | | FIXED — store-assets/icon-512.png (RGBA) |
| Feature graphic 1024×500 | | FIXED — feature-graphic-1024x500.png |
| Phone screenshots | ≥2, 16:9/9:16, 320–3840 px, long side ≤2× short | FIXED — 6 × 1080×1920 framed shots (old raw 824×1830 shots failed the 2:1 limit) |
| Offline / quality | Works offline, no crashes, back button | PASS — service worker cache fidget-v3; headless test 0 errors; TWA back = system back. Not tested on a physical device |
| Address bar in TWA | Shows if DAL fails | FIXED via assetlinks (re-check after adding Play key) |
| 12 testers × 14 days | Only personal accounts created after Nov 13, 2023 | N/A if the account is the **Organization** account (Phantastic.Vanguard LLC, D-U-N-S 149982532). If Console still shows the requirement, it applies. |
| Developer verification / package registration | All Play packages must be registered (effective Sep 30, 2026) | USER — confirm com.phantasticvanguard.fidget appears registered on the Android developer verification page |

## What you must do in Play Console
1. Create app "Fidget: Tactile Toys" → App, Free, default language en-US; accept declarations.
2. Upload `play-upload/fidget-1.0.0-vc1.aab` to **Internal testing** first (opt in to Play App Signing, the default).
3. Setup > App signing → copy the **App signing key SHA-256** → send it to me to add to assetlinks.json (keep the upload-key entry too). Until then the installed app shows a URL bar.
4. Fill App content using `play-upload/data-safety-and-rating.md`.
5. Store listing: paste `listing.txt`; upload icon, feature graphic, phone/01–06.png. Contact email info@phantasticvanguard.com.
6. Install from internal testing on a real phone: check no URL bar, sound/haptics, offline launch.
7. Promote to Production (or Closed testing if Console requires it) → Send for review.

Back up `android/upload-keystore.jks` + `android/KEYSTORE-SECRETS.txt` somewhere safe (password manager). They are git-ignored and exist only on the box.
