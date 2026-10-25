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

# v1.2.4 — Share-to-unlock (one free upgrade)
- Shop card: **"Share Fidget with a friend or on your socials"**. It uses `navigator.share` (the record image is attached from the celebration screen when the OS supports file shares). It falls back to **Copy link to share**. After a share or copy, the user picks **one** non-premium upgrade, with live previews, and then sees an unlock reveal.
- It's one per install. It is stored locally as a **gifted entitlement** (`fidget.gift`), separate from Play purchases. Restore/`listPurchases` never adds or removes it. Uninstalling or clearing data loses it, and Premium can't be gifted.
- **Shares cannot be verified.** The Web Share API only says the share sheet closed without being cancelled. It doesn't tell us whether anything was posted, and copying the link also counts. Treat it as a thank-you, not a verified reward. Policy notes: no review or rating is required, no specific platform is named or required, and there is no incentive for ratings. This is consistent with Play's policy against incentivised ratings/reviews. Because the reward is a free digital item outside Play Billing for a non-payment action, it isn't a purchase and needs no Billing.

# Policy re-audit — v1.2.5 (versionCode 5), Oct 25, 2026 CT
Online leaderboard is **OFF** in this build (`js/lb/config.js` empty): scores, nickname and victory messages never leave the device.

| Area | Result | Notes / fix |
|---|---|---|
| Payments: Play Billing for digital goods | **PASS** | Premium and every upgrade is sold only through Play Billing (Digital Goods API). There's no other way to pay, and no web purchase link in the app. |
| Promo-code redeem flow | **PASS** | It only opens `play.google.com/redeem`. Play delivers the item, and the app re-reads purchases. There's no app-side code. |
| Share-to-unlock gift | **PASS (with wording)** | A free item for a non-monetary action, with no payment involved, so Billing isn't needed. No review or rating is asked for, and no platform is named or required. Wording: "Share Fidget with a friend or on your socials… pick one upgrade free". The share isn't verified (see v1.2.4). |
| Incentivized ratings/reviews | **PASS** | There's no rating or review prompt tied to any reward. |
| UGC (victory messages, nicknames) | **PASS now / BLOCKER before going online** | Offline, nothing is shown to other users, so the UGC policy doesn't apply yet. **Before filling config.js you must:** (1) publish UGC terms or acceptable-use rules in the app/privacy page; (2) add a server-side **report** (a `reports` table plus an RPC; today Report only hides the message on that device); (3) moderate, meaning you review reports and delete rows within a stated time; (4) consider letting users block a nickname. The client and server filters (profanity, links, contact info, 40-char cap) are already in place. |
| POST_NOTIFICATIONS | **FIXED** | The app sends no notifications. The permission is removed (`tools:node="remove"`). The DelegationService stays because it carries Play Billing. |
| `?devunlock` in Play app | **FIXED (was BLOCKER)** | vc4 and earlier honoured `?devunlock`, including a flag left in shared Chrome storage. Now it's ignored and wiped whenever the app runs as the Play app: the TWA launch URL is `/fidget/?src=twa`, there's an `android-app://` referrer, or Play Billing is present. This is sticky through `fidget.twa`. Test: `test_devlock.py`. |
| Data safety | **PASS, no change** | Answer set A (no data collected). Purchases are handled by Google Play. Switch to set B (adds nickname, scores, victory messages as user-generated content, and a device ID) only when the board is online. |
| Content rating | **UPDATE** | Digital purchases: **Yes**. Users interact / share content: **No** while offline. Answer **Yes** when the board goes online (nicknames + messages). Sharing a link through the OS share sheet isn't in-app user interaction. |
| Target audience 13+ / not appealing to children | **PASS** | Ages 13–15, 16–17, 18+. The visuals are neon/abstract and the text is teen/adult-neutral. There are no cartoon characters or kid-directed text. Don't put the app in "Designed for Families". |
| Privacy policy | **PASS** | It covers local storage (stats, nickname, messages, hidden messages, share gift), Play Billing, the optional online board and messages, and deletion by email. |
| Store listing claims | **FIXED** | It claimed weekly/all-time leaderboards "with a nickname", but they're local-only today, so it's reworded. Celebration, share gift and promo-code redeem were added. |
| Screenshots | **FIXED** | 6 new phone screenshots from v1.2.5 (`play-upload/phone/01-06.png`, 1080×1920) showing upgrades, the celebration and the shop. Composite: `preview/store-screens.png`. Script: `make_screens.py`. |

**Play Console form answers to change:** upload `fidget-1.2.5-vc5.aab` instead of vc4. Replace the 6 phone screenshots. Paste the updated full description from `listing.txt`. Retake IARC with digital purchases = Yes and users interact = No for now. Data safety stays as set A. In App content → Ads, answer "No ads". Target audience: 13+. Under Permissions there's no longer a notifications declaration.
