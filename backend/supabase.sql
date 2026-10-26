-- Fidget leaderboard (Supabase / Postgres). Run once in the SQL editor of a new Supabase project.
-- Clients can ONLY call submit_score() and read the two views. No chat, no real names. Free text = a filtered nickname and an
-- optional victory message (<=40 chars, filtered here server-side: profanity/slurs, links, emails, phone numbers, @handles).
create table if not exists public.scores (
  device text not null check (length(device) between 8 and 64),
  nick text not null check (nick ~ '^[A-Za-z0-9_-]{3,16}$'),
  metric text not null check (metric in ('streak','rpm','keys','cuts')),
  week text not null check (week ~ '^\d{4}-W\d{2}$'),
  value integer not null check (value >= 0),
  msg text check (msg is null or char_length(msg) <= 40),
  updated_at timestamptz not null default now(),
  primary key (device, metric, week)
);
alter table public.scores enable row level security;   -- no policies: direct table access denied to anon
revoke all on public.scores from anon, authenticated;
alter table public.scores add column if not exists msg text check (msg is null or char_length(msg) <= 40);  -- for existing installs

-- Victory-message filter (mirrors js/lb/msg.js). Returns null when the message is acceptable, else a reason.
create or replace function public.msg_problem(m text) returns text language plpgsql immutable as $$
declare z text;
begin
  if m is null then return null; end if;
  if char_length(m) > 40 then return 'length'; end if;
  if m ~ '[[:cntrl:]]' then return 'control'; end if;
  if m ~* '(https?:|www\.|[a-z0-9-]+\s*(\.|dot)\s*(com|net|org|io|gg|me|co|app|xyz|ly|tv|link|ru|info)\M)' then return 'link'; end if;
  if m ~* '([[:alnum:]._+-]+\s*(@|\mat\M)\s*[[:alnum:]-]+\s*(\.|dot)\s*[[:alnum:]]+)|(@[[:alnum:]_]{2,})|(\+?[0-9][0-9 ().-]{6,}[0-9])|\m(snap(chat)?|insta(gram)?|tiktok|discord|whatsapp|telegram|kik|dm me|add me)\M' then return 'contact'; end if;
  -- ALLOW: harmless whole words containing a blocked substring (keep in sync with js/lb/rules.js)
  z := translate(regexp_replace(lower(m), '(^|[^a-z])(grape|grapes|grapefruit|drape|drapes|scrape|scraped|scraper|skyscraper|trapeze|spicy|spice|spices|despicable|conspicuous|document|documents|cucumber|cumin|circumstance|accumulate|cumulative|analysis|analyst|analyze|analog|canal|canals|banal|sussex|essex|sextet|raccoon|racoon|tycoon|cocoon|peacock|cockatoo|cocktail|cockpit|hancock|dickens|scunthorpe|crisis|torpedo|pedometer)(?![a-z])', '\1 ', 'g'), '@4310!|57$', 'aaeioiists');
  z := regexp_replace(z, '[^a-z]', '', 'g');
  if z ~ '(fuck|shit|cunt|bitch|nigg|fag|slut|whore|dick|cock|pussy|rape|nazi|hitler|kkk|porn|sex|penis|vagina|cum|twat|wank|retard|asshole|bastard|chink|spic|kike|tranny|dyke|coon|gook|wetback|kys|killyourself|nude|onlyfans|xxx|anal|jizz|boob|tits|heil|isis|jihad|pedo|molest|incest)' then return 'profanity'; end if;
  return null;
end $$;


-- Nickname filter (mirrors js/lb/nick.js + js/lb/rules.js): format, profanity (leetspeak), reserved names, phone-like digits.
create table if not exists public.reserved_nicks (word text primary key);
insert into public.reserved_nicks values ('admin'),('moderator'),('mod'),('staff'),('official'),('support'),('fidget'),('phantastic'),('vanguard'),('google'),('android'),('system'),('root'),('owner'),('developer'),('dev'),('huy'),('null'),('undefined'),('anonymous'),('everyone'),('here') on conflict do nothing;
alter table public.reserved_nicks enable row level security;
revoke all on public.reserved_nicks from anon, authenticated;
create or replace function public.nick_problem(n text) returns text language plpgsql stable security definer set search_path = public as $$
declare z text; w text;
begin
  if n is null or n !~ '^[A-Za-z0-9_-]{3,16}$' then return 'format'; end if;
  z := regexp_replace(translate(regexp_replace(lower(n), '(^|[^a-z])(grape|grapes|grapefruit|drape|drapes|scrape|scraped|scraper|skyscraper|trapeze|spicy|spice|spices|despicable|conspicuous|document|documents|cucumber|cumin|circumstance|accumulate|cumulative|analysis|analyst|analyze|analog|canal|canals|banal|sussex|essex|sextet|raccoon|racoon|tycoon|cocoon|peacock|cockatoo|cocktail|cockpit|hancock|dickens|scunthorpe|crisis|torpedo|pedometer)(?![a-z])', '\1 ', 'g'), '@4310!|57$', 'aaeioiists'), '[^a-z]', '', 'g');
  w := regexp_replace(lower(n), '[^a-z]', '', 'g');
  if z ~ '(fuck|shit|cunt|bitch|nigg|fag|slut|whore|dick|cock|pussy|rape|nazi|hitler|kkk|porn|sex|penis|vagina|cum|twat|wank|retard|asshole|bastard|chink|spic|kike|tranny|dyke|coon|gook|wetback|kys|killyourself|nude|onlyfans|xxx|anal|jizz|boob|tits|heil|isis|jihad|pedo|molest|incest)' then return 'profanity'; end if;
  if exists (select 1 from reserved_nicks r where (length(r.word) <= 4 and w = r.word) or (length(r.word) > 4 and position(r.word in z) > 0)) then return 'reserved'; end if;
  if n ~ '^[0-9]+$' or n ~ '[0-9]{7,}' then return 'phone'; end if;
  return null;
end $$;
revoke all on function public.nick_problem(text) from public, anon, authenticated;

-- ===== Moderation =====
-- bans: kind 'device' (full install id) or 'nick' (lowercase). Banned installs/nicks can't submit and are hidden from boards.
create table if not exists public.bans (kind text not null check (kind in ('device','nick')), value text not null, reason text, created_at timestamptz not null default now(), primary key (kind, value));
-- per-entry moderation state. An "entry" = one install's row(s) for one metric. status: visible | hidden | approved (approved = reviewed, immune to auto-hide until re-reported after the message changes).
create table if not exists public.entry_state (device text not null, metric text not null, status text not null default 'visible' check (status in ('visible','hidden','approved')), msg_at_review text, updated_at timestamptz not null default now(), primary key (device, metric));
-- reports: one per reporting install per entry (reporter stored only as a SHA-256 hash of its random install id).
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_hash text not null,
  device text not null, metric text not null,
  nick text, msg text, reason text check (reason is null or char_length(reason) <= 40),
  status text not null default 'pending' check (status in ('pending','resolved')),
  created_at timestamptz not null default now(),
  unique (reporter_hash, device, metric)
);
create index if not exists reports_pending on public.reports (status, device, metric);
-- admins: Supabase Auth user ids allowed to moderate (insert your own uid once, see MODERATION.md).
create table if not exists public.admins (user_id uuid primary key);
alter table public.bans enable row level security;
alter table public.entry_state enable row level security;
alter table public.reports enable row level security;
alter table public.admins enable row level security;
revoke all on public.bans, public.entry_state, public.reports, public.admins from anon, authenticated;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
-- RLS: anon has no table access at all (only RPCs + views). Signed-in admins can read everything; writes go through admin_act().
grant select on public.scores, public.bans, public.entry_state, public.reports, public.admins to authenticated;
drop policy if exists admin_read on public.scores;      create policy admin_read on public.scores      for select to authenticated using (public.is_admin());
drop policy if exists admin_read on public.bans;        create policy admin_read on public.bans        for select to authenticated using (public.is_admin());
drop policy if exists admin_read on public.entry_state; create policy admin_read on public.entry_state for select to authenticated using (public.is_admin());
drop policy if exists admin_read on public.reports;     create policy admin_read on public.reports     for select to authenticated using (public.is_admin());
drop policy if exists self_read on public.admins;       create policy self_read on public.admins       for select to authenticated using (user_id = auth.uid());

drop function if exists public.submit_score(text, text, text, text, integer);
create or replace function public.submit_score(p_device text, p_nick text, p_metric text, p_week text, p_value integer, p_msg text default null)
returns void language plpgsql security definer set search_path = public as $$
declare prev record; secs numeric; cap integer;
begin
  p_msg := nullif(btrim(regexp_replace(p_msg, '\s+', ' ', 'g')), '');
  if public.msg_problem(p_msg) is not null then raise exception 'message'; end if;
  if p_week <> to_char(now() at time zone 'utc', 'IYYY-"W"IW') then raise exception 'stale week'; end if;
  if public.nick_problem(p_nick) is not null then raise exception 'nickname'; end if;
  if exists (select 1 from bans where (kind = 'device' and value = p_device) or (kind = 'nick' and value = lower(p_nick))) then raise exception 'banned'; end if;
  -- absolute sanity caps
  cap := case p_metric when 'rpm' then 3000 when 'streak' then 5000 else 2000000 end;
  if p_value > cap then raise exception 'cap'; end if;
  select * into prev from scores where device = p_device and metric = p_metric and week = p_week;
  if found then
    secs := greatest(1, extract(epoch from now() - prev.updated_at));
    if p_value <= prev.value then update scores set nick = p_nick, msg = coalesce(p_msg, msg) where device = p_device and metric = p_metric and week = p_week; return; end if;
    -- rate caps: humans can't tap >25 keys/s or make >30 sand cuts/s, or extend a pop streak faster than 15/s
    if p_metric = 'keys' and p_value - prev.value > secs * 25 + 50 then raise exception 'rate'; end if;
    if p_metric = 'cuts' and p_value - prev.value > secs * 30 + 50 then raise exception 'rate'; end if;
    if p_metric = 'streak' and p_value - prev.value > secs * 15 + 30 then raise exception 'rate'; end if;
    if secs < 5 then raise exception 'too fast'; end if;  -- throttle: one write per 5 s per metric
    update scores set value = p_value, nick = p_nick, msg = coalesce(p_msg, msg), updated_at = now() where device = p_device and metric = p_metric and week = p_week;
  else
    if p_metric in ('keys','cuts') and p_value > 3000 then raise exception 'first submit too large'; end if;
    insert into scores (device, nick, metric, week, value, updated_at, msg) values (p_device, p_nick, p_metric, p_week, p_value, now(), p_msg);
  end if;
end $$;
revoke all on function public.submit_score(text, text, text, text, integer, text) from public, anon, authenticated;
revoke all on function public.msg_problem(text) from public, anon, authenticated;
grant execute on function public.submit_score(text, text, text, text, integer, text) to anon;

-- Public boards hide: entries with status 'hidden', banned installs and banned nicknames.
create or replace function public.visible(p_device text, p_metric text, p_nick text) returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from entry_state e where e.device = p_device and e.metric = p_metric and e.status = 'hidden')
     and not exists (select 1 from bans b where (b.kind = 'device' and b.value = p_device) or (b.kind = 'nick' and b.value = lower(p_nick))) $$;
drop view if exists public.lb_week; drop view if exists public.lb_all;
create view public.lb_week as
  select nick, left(device, 8) as device, metric, value, msg from scores
  where week = to_char(now() at time zone 'utc', 'IYYY-"W"IW') and public.visible(device, metric, nick);
create view public.lb_all as
  select * from (select (array_agg(nick order by updated_at desc))[1] as nick, left(device, 8) as device, metric,
         (array_agg(msg order by updated_at desc) filter (where msg is not null))[1] as msg,
         case when metric in ('rpm','streak') then max(value) else sum(value) end::integer as value,
         (array_agg(device))[1] as full_device
  from scores group by device, metric) t where public.visible(t.full_device, t.metric, t.nick);
revoke all on public.lb_week, public.lb_all from anon, authenticated;  -- Supabase default grants would expose full_device

grant select (nick, device, metric, value, msg) on public.lb_week, public.lb_all to anon, authenticated;
revoke all on function public.visible(text, text, text) from public, anon, authenticated;
grant execute on function public.visible(text, text, text) to anon, authenticated;


-- ===== Reporting (anon) =====
-- report_entry: p_reporter = the reporter's own random install id; p_device = the 8-char public id shown on the board.
-- One report per install per entry (unique). 3 distinct pending reports => entry auto-hidden until reviewed.
create or replace function public.report_entry(p_reporter text, p_device text, p_metric text, p_reason text default null)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare tgt record; h text; n integer;
begin
  if p_reporter is null or length(p_reporter) not between 8 and 64 then raise exception 'reporter'; end if;
  if p_device !~ '^[A-Za-z0-9-]{8}$' then raise exception 'entry'; end if;
  if p_metric not in ('streak','rpm','keys','cuts') then raise exception 'metric'; end if;
  p_reason := left(nullif(btrim(p_reason), ''), 40);
  h := encode(digest(p_reporter, 'sha256'), 'hex');
  if (select count(*) from reports where reporter_hash = h and created_at > now() - interval '1 day') >= 20 then raise exception 'rate'; end if;
  select device, nick, msg into tgt from scores where left(device, 8) = p_device and metric = p_metric order by updated_at desc limit 1;
  if not found then raise exception 'entry'; end if;
  if tgt.device = p_reporter then raise exception 'self'; end if;
  insert into reports (reporter_hash, device, metric, nick, msg, reason) values (h, tgt.device, p_metric, tgt.nick, tgt.msg, p_reason)
    on conflict (reporter_hash, device, metric) do nothing;
  if not found then return 'duplicate'; end if;
  select count(distinct reporter_hash) into n from reports where device = tgt.device and metric = p_metric and status = 'pending';
  if n >= 3 then
    insert into entry_state (device, metric, status, updated_at) values (tgt.device, p_metric, 'hidden', now())
      on conflict (device, metric) do update set status = 'hidden', updated_at = now()
      where entry_state.status <> 'approved' or entry_state.msg_at_review is distinct from tgt.msg;
  end if;
  return 'ok';
end $$;
revoke all on function public.report_entry(text, text, text, text) from public, anon, authenticated;
grant execute on function public.report_entry(text, text, text, text) to anon;

-- ===== Admin actions (authenticated + admins row) =====
-- p_action: approve (restore + resolve reports) | hide | delete (remove the entry's scores) | ban_device | ban_nick
create or replace function public.admin_act(p_device text, p_metric text, p_action text, p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare m text; nk text;
begin
  if not public.is_admin() then raise exception 'not admin'; end if;
  select msg, nick into m, nk from scores where device = p_device and metric = p_metric order by updated_at desc limit 1;
  if p_action = 'approve' then
    insert into entry_state values (p_device, p_metric, 'approved', m, now()) on conflict (device, metric) do update set status = 'approved', msg_at_review = m, updated_at = now();
  elsif p_action = 'hide' then
    insert into entry_state values (p_device, p_metric, 'hidden', m, now()) on conflict (device, metric) do update set status = 'hidden', msg_at_review = m, updated_at = now();
  elsif p_action = 'delete' then
    delete from scores where device = p_device and metric = p_metric; delete from entry_state where device = p_device and metric = p_metric;
  elsif p_action = 'ban_device' then
    insert into bans values ('device', p_device, p_note, now()) on conflict do nothing;
  elsif p_action = 'ban_nick' then
    if nk is null then select nick into nk from reports where device = p_device and metric = p_metric order by id desc limit 1; end if;
    insert into bans values ('nick', lower(nk), p_note, now()) on conflict do nothing;
  else raise exception 'action'; end if;
  update reports set status = 'resolved' where device = p_device and metric = p_metric and status = 'pending';
  return 'ok';
end $$;
revoke all on function public.admin_act(text, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_act(text, text, text, text) to authenticated;
-- Review queue for admin.html: one row per reported entry.
create or replace function public.admin_queue(p_status text default 'pending')
returns table (device text, metric text, nick text, msg text, value integer, reports bigint, reasons text[], first_at timestamptz, state text, banned boolean)
language sql stable security definer set search_path = public as $$
  select r.device, r.metric, coalesce(s.nick, max(r.nick)), coalesce(s.msg, max(r.msg)), s.value, count(*), array_remove(array_agg(distinct r.reason), null), min(r.created_at),
         coalesce(e.status, 'visible'), exists (select 1 from bans b where (b.kind = 'device' and b.value = r.device) or (b.kind = 'nick' and b.value = lower(coalesce(s.nick, max(r.nick)))))
  from reports r
  left join lateral (select nick, msg, value from scores x where x.device = r.device and x.metric = r.metric order by updated_at desc limit 1) s on true
  left join entry_state e on e.device = r.device and e.metric = r.metric
  where public.is_admin() and r.status = p_status
  group by r.device, r.metric, s.nick, s.msg, s.value, e.status order by min(r.created_at) $$;
revoke all on function public.admin_queue(text) from public, anon, authenticated;
grant execute on function public.admin_queue(text) to authenticated;

-- ===== Email Huy on new reports =====
-- Preferred (no SQL needed): Supabase Dashboard -> Database -> Webhooks -> "reports" table, INSERT -> Supabase Edge Function
-- "notify-report" (backend/functions/notify-report/index.ts), which emails info@phantasticvanguard.com. See MODERATION.md.
-- Alternative via pg_net (enable the extension first, then fill in the URL + secret):
-- create or replace function public.notify_report() returns trigger language plpgsql security definer as $t$
-- begin perform net.http_post(url := 'https://<project-ref>.supabase.co/functions/v1/notify-report',
--   headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <service-or-webhook-secret>'),
--   body := jsonb_build_object('type','INSERT','table','reports','record', to_jsonb(new))); return new; end $t$;
-- create trigger reports_notify after insert on public.reports for each row execute function public.notify_report();
