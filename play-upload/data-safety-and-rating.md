# Data safety (Play Console > App content > Data safety) — v1.1.0 (vc2)
Two cases. Use **B** only once the online leaderboard is configured (js/lb/config.js filled in); until then use **A**.

## A. Online leaderboard NOT configured (current build)
- Collect or share required user data? **No.** Purchases are handled by Google Play Billing (Google is the processor, so it isn't declared as your collection). Stats/nickname stay on-device.
- Result: "No data collected · No data shared"

## B. Online leaderboard enabled (Supabase)
- Collect or share required user data? **Yes**
- Encrypted in transit? **Yes** (HTTPS) · Users can request deletion? **Yes** (email info@phantasticvanguard.com)
- Data types:
  - **Personal info → User IDs**: *Collected*, not shared. Purpose: **App functionality** (nickname + random app-generated device ID on the leaderboard). Optional? **No** if the board auto-submits (current behaviour); processed ephemerally? No.
  - **App activity → Other user-generated content / In-app actions**: *Collected* (scores: pop streak, RPM, key count, sand cuts). Purpose: **App functionality**. Not shared.
  - Financial info → Purchase history: **Not collected by you** (Google Play processes purchases).
- Shared with third parties? **No** (Supabase is a service provider/processor, which Play does not count as sharing).

# Ads: **No ads**
# App access: all features available without login
# Target audience: **13–15, 16–17, 18+** (not under 13 → avoids Families policy; IAP + public nicknames would add requirements)

# Content rating (IARC) — re-take the questionnaire for v1.1
- Category: Game (Casual)
- Violence / fear / sexuality / language / drugs / crude humour / gambling: **No**
- Real-money items that give random rewards (loot boxes)? **No** — every item is a fixed, previewed cosmetic.
- **Digital purchases? YES** (in-app purchases)
- Users can interact/communicate? **No chat.** If asked about user-generated content shown to others: nicknames on a leaderboard — answer **Yes, user names are shared** only if the online board is enabled; they are filtered and there's no messaging.
- Shares location? No · Unrestricted web? No
- Expected: IARC 3+/Everyone with "In-App Purchases" interactive element (plus "Users Interact" if board online).
