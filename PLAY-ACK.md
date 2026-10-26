# Google Play purchase acknowledgement

## Verdict: purchases are NOT auto-acknowledged
If a purchase isn't acknowledged within 3 days, Google Play refunds it and takes the item back.

- **Chrome Digital Goods API v2** only exposes `getDetails`, `listPurchases`, `listPurchaseHistory` and `consume`. There is no `acknowledge()`. Source: Chromium IDL, https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/payments/goods/digital_goods_service.idl
- **android-browser-helper `playbilling`** acknowledges only when Chrome sends it the legacy v1 `acknowledge` command (`DigitalGoodsRequestHandler` → `AcknowledgeCall`). The purchase flow (`PaymentActivity` / `PlayBillingWrapper.onPurchasesUpdated`) never calls `acknowledgePurchase` itself. Source: https://github.com/GoogleChrome/android-browser-helper/tree/main/playbilling/src/main/java/com/google/androidbrowserhelper/playbilling
- **Chrome for Developers, "Use Google Play Billing in your TWA"** says to verify and acknowledge the purchase on your backend. Source: https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- **ChromeOS.dev, "Implement Play Billing in your PWA" and its backend guide** say to acknowledge with `purchases.products.acknowledge` within 3 days, or the purchase is refunded. Sources: https://chromeos.dev/en/publish/pwa-play-billing and https://developers.google.com/chromeos/app-development/publish/play-billing-backend
- **Not a fix:** calling `consume()` from the client would make a one-time unlock purchasable again, so it can't be used for these permanent items.

The old client code called `svc.acknowledge`. That method doesn't exist, so it silently did nothing. It has been removed.

## The fix
- `backend/functions/play-ack/index.ts` is a Supabase Edge Function. It:
  - takes `{sku, token}`;
  - checks the SKU against the catalog;
  - calls `purchases.products.get` to verify the purchase;
  - calls `purchases.products.acknowledge` when the purchase is paid (`purchaseState` 0) and not yet acknowledged.
- `js/store/billing.js` calls the function after each purchase. It also calls it for every owned purchase on launch or resume, which covers promo codes and earlier failures. Acknowledged tokens are cached locally.
- The function is inert while `js/store/ackconfig.js` → `ACK_URL` is empty. Granting items never waits on it.

## Deploy steps (owner)
1. In Google Cloud, create a service account in the project linked to Play. Create a JSON key for it, and keep the key out of the repo.
2. In Play Console → Users and permissions, invite the service account email. Give it app access with the "View financial data" and "Manage orders and subscriptions" permissions.
3. Set up Supabase:
   - With the Supabase CLI, in a project dir, copy `backend/functions/play-ack` to `supabase/functions/play-ack`.
   - Run: `supabase secrets set PLAY_SA_JSON="$(cat key.json)"`
   - Run: `supabase functions deploy play-ack --no-verify-jwt`
4. Put `https://<ref>.supabase.co/functions/v1/play-ack` in `js/store/ackconfig.js`. Bump versions and push. The live site updates the TWA content, so no new AAB is needed.
5. Optional check: `curl -X POST <url> -d '{"sku":"premium_unlock","token":"x"}'` should return a 404 or verify error, not a 500.

## Library version
`android/app/build.gradle` uses `androidbrowserhelper:billing:1.2.0`. That version uses Play Billing Library 8.3.0, which meets Google's Aug 31, 2026 requirement. The library version doesn't change acknowledgement either way.
