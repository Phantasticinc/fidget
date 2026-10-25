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
  - **App activity → Other user-generated content / In-app actions**: *Collected* (scores: pop streak, RPM, key count, sand cuts; plus the optional ≤40-char **victory message** a player can attach to a record). Purpose: **App functionality**. Not shared with third parties (shown publicly in-app on the board). Optional? **Yes** for messages.
  - Victory messages: filtered client-side (js/lb/msg.js) and server-side (msg_problem() in backend/supabase.sql) for profanity/slurs, links, emails, phone numbers, @handles; 40-char cap enforced by a DB check. Players can hide ("Report") any message locally. Deletion on request by email (privacy.html).
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
- Users can interact/communicate? **No chat.** User-generated content shown to others when the online board is enabled: nicknames and optional ≤40-char victory messages next to scores — answer **Yes, users can interact / share content** for that build. Both are filtered (client + server), there is no direct messaging, and any message can be hidden with "Report". With the board offline (current build) messages stay on the device → **No**.
- Shares location? No · Unrestricted web? No
- Expected: IARC 3+/Everyone with "In-App Purchases" interactive element (plus "Users Interact" if board online — nicknames + victory messages).
