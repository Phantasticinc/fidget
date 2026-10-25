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

---
# v1.1.0 (versionCode 2) — Premium, upgrades & leaderboard (Oct 25, 2026 CT)
Bundle: `play-upload/fidget-1.1.0-vc2.aab` (same upload key). TWA `features.playBilling.enabled = true` → adds the Play Billing library + `com.android.vending.BILLING` permission and the Digital Goods/Payment Request bridge.

| Check | Requirement | Status |
|---|---|---|
| Payments profile | Merchant account required before paid products can be created | USER — Play Console > Setup > Payments profile (link the org's payments profile; needs bank + tax info) |
| In-app products | Create each ID, set Active | USER — 13 products in `play-upload/PRODUCTS.md` / `products.csv`. IDs must match exactly |
| Billing policy | Digital goods must use Google Play Billing | PASS — only Play Billing via Digital Goods API; web build shows "available in the Android app" (no external payment links) |
| Loot boxes / dark patterns | Disclosure of odds; deceptive UI | PASS — no random items, no timers, no fake discounts, every item previewed live before purchase |
| Pay-to-win | n/a policy, but fairness | PASS — upgrades are cosmetic, same physics |
| Acknowledgement | Purchases must be acknowledged within 3 days | PASS — Bubblewrap's Play Billing bridge acknowledges PaymentRequest purchases; code also calls `acknowledge` when exposed |
| Restore | Users must keep purchases | PASS — `listPurchases()` on launch + "Restore purchases" button |
| Content rating | Re-take IARC; **Digital purchases = Yes** | USER — see data-safety-and-rating.md |
| Data safety | Update if leaderboard goes online | USER — option A now (no data collected); option B after Supabase is configured |
| Privacy policy | Must reflect purchases + leaderboard | UPDATED — privacy.html v1.1 |
| UGC (nicknames) | Filter + report/remove path | PASS — client and server profanity filter, no chat, deletion by email |
| Testing purchases | License testers | USER — Play Console > Setup > License testing: add your Gmail; test on Internal testing track |
| Version | Higher than last upload | PASS — versionCode 2 / 1.1.0 |

## Leaderboard decision
Play Games Services needs the native PGS SDK (not available to a Bubblewrap TWA without writing custom Java bridge code), so the board uses a **backend adapter**:
- Now: local-only boards (this device, weekly + all-time) — works with zero setup.
- Online: **Supabase** (free tier). Account the user must create: **one Supabase account + one project** (supabase.com, sign in with GitHub). Then: SQL editor → run `backend/supabase.sql`; copy *Project URL* and *anon public key* into `js/lb/config.js`; push. Then switch Data safety to option B.
- Anti-cheat (server, `submit_score` RPC, table not writable directly): RPM ≤ 3000, streak ≤ 5000, rate caps (keys ≤ 25/s, cuts ≤ 30/s, streak +15/s), one write per 5 s per metric, current-week only, nickname regex + profanity filter.

## Steps for v1.1 in Play Console
1. Payments profile → 2. create the 13 in-app products → 3. upload vc2 aab to Internal testing → 4. add license testers and test buy/restore on a phone → 5. re-take content rating (digital purchases Yes) → 6. update Data safety if board online → 7. promote.

# v1.2.3 — Free Premium promo codes (Redeem code)
Fidget has **no app-side master code** and never validates codes itself. Codes are Google Play promo codes, so Play enforces single use and nothing can be guessed from the app.

**Generate codes (Play Console, you do this — not automated):**
1. Play Console → *Fidget* → **Monetize → Promotions → Promo codes** (older UI: *Promotions* in the left menu) → **Create promotion**.
2. Type: **One-time code(s)** (each code works once — use this for "one free Premium for anyone"). Or **Custom code** (one shareable code, many redemptions, up to the limit you set).
3. Product: **`premium_unlock`** (the in-app product). Set name, start/end date (max 1 year), and quantity.
4. Quota: **up to 500 one-time codes per app per quarter** (Play's limit; shared across all products). Download the CSV of codes.
5. Share a code as text or as a link: `https://phantasticinc.github.io/fidget/?redeem=CODE` (opens Fidget's redeem prompt pre-filled) or directly `https://play.google.com/redeem?code=CODE`.

**How redeeming works in the app:** Shop → *Redeem code* or Settings → *Redeem a Play promo code* (or the `?redeem=CODE` deep link, which asks first) opens `https://play.google.com/redeem?code=CODE`. Google Play shows the item and the user confirms. When the user returns, the app calls `bill.restore()` (Digital Goods `listPurchases`) and Premium unlocks. Promo-code purchases are normal Play purchases, so they need acknowledging like any other (the existing purchase flow does this). They also show up in Restore on reinstall. A code redeemed for an in-app product **requires the app to be installed** from Play with the same account.

**Limits:** the web (non-TWA) build can open the redeem page, but it can't unlock anything because there's no Play Billing there. The app tells the user to open the Android app.
