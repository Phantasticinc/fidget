# Leaderboard moderation

Online mode is **off** while `js/lb/config.js` is empty. Everything below only matters once you turn it on.

## Rules shown to players
> Be kind · no links, handles, emails or phone numbers · max 40 chars

Players see this line under the victory-message box and on the leaderboard sheet.

**Messages (≤40 chars)** are blocked if they contain:
- profanity or slurs, including leetspeak such as `sh1t`
- links, for example `x.com`, `www.` or `site dot com`
- emails
- phone numbers
- `@handles`
- "add me", "dm me", or social app names

**Nicknames** must be 3–16 characters using letters, digits, `_` or `-`. They are rejected if they are:
- profane
- reserved, for example admin, mod, staff, official, support, fidget, phantastic, google, huy or dev
- phone-like: all digits, or 7 or more digits in a row

The rules are checked in two places that must stay in sync:
- the client: `js/lb/rules.js`, `msg.js` and `nick.js`
- the server: `msg_problem()`, `nick_problem()` and `reserved_nicks` in `backend/supabase.sql`

## How reports work
- Each leaderboard row has a **Report** button. It only appears in online mode and never on your own row.
- Each install can report an entry once. This is remembered on the device and enforced by `unique(reporter_hash, device, metric)`.
- The reporter is stored only as a SHA-256 hash of its random install id.
- Once **3 distinct pending reports** arrive, the entry is **auto-hidden** from `lb_week`/`lb_all` until you review it.
- The reporting device also hides the reported message for itself straight away.
- Each install can send at most 20 reports per day. Reporting yourself is rejected.
- Every new report emails **info@phantasticvanguard.com** through the `notify-report` Edge Function.

## Admin page
The admin page is at `https://phantasticinc.github.io/fidget/admin.html`. The app doesn't link to it and it is marked noindex.

You sign in with your Supabase Auth user. All data and actions go through `admin_queue()` and `admin_act()`, which refuse anyone whose user id isn't in `public.admins`. RLS also limits table reads to admins.

| Action | What it does |
|---|---|
| Approve (restore) | Makes the entry visible again and resolves its reports. It stays immune to auto-hide until the message changes. |
| Hide | Keeps the entry off the boards. |
| Delete entry | Removes that install's scores for the metric. |
| Ban install | Hides the install's entries everywhere and blocks new submissions. |
| Ban nickname | Bans the nickname (case-insensitive) everywhere and for any install. |

## Setup checklist (when you want online mode)
1. Create a free Supabase project at supabase.com. You can sign in with GitHub.
2. Open the SQL editor, paste all of `backend/supabase.sql` and run it. Running it again later is safe.
3. Under **Authentication → Providers → Email**, turn **off "Allow new users to sign up"**. Then go to **Authentication → Users → Add user**, enter info@phantasticvanguard.com with a strong password, and copy the user's UID.
4. In the SQL editor, run `insert into public.admins values ('<your-UID>');`
5. Set up email alerts:
   - Create a free Resend account at resend.com. Verify a sending domain, or use `onboarding@resend.dev`, which can only send to the account's own email address.
   - Get an API key.
   - Install the Supabase CLI, then run:
     ```
     supabase login
     supabase link --project-ref <ref>
     ```
   - Copy `backend/functions/notify-report` to `supabase/functions/notify-report`.
   - Run:
     ```
     supabase secrets set RESEND_API_KEY=<key> WEBHOOK_SECRET=<random string>
     supabase functions deploy notify-report --no-verify-jwt
     ```
   - In the Dashboard, go to **Database → Webhooks → Create**:
     - Table: `public.reports`
     - Event: Insert
     - Type: Supabase Edge Functions → `notify-report`
     - HTTP header: `x-webhook-secret: <same random string>`
   - The `pg_net` trigger at the bottom of the SQL file is an alternative to the Database Webhook.
6. Under **Project Settings → API**, copy the Project URL and the **anon public** key into `js/lb/config.js`, then commit and push.
7. Test it:
   - Report an entry from 3 test devices. You should get an email, and the entry should disappear.
   - Open `admin.html` and click Approve. The entry should come back.
8. Update the Play Console:
   - Data safety: answer set B (see `play-upload/data-safety-and-rating.md`).
   - Content rating: users interact = Yes.
   - Ship a new build.
