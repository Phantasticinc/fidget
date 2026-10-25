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
  z := translate(lower(m), '@4310!|57$', 'aaeioiists');
  z := regexp_replace(z, '[^a-z]', '', 'g');
  if z ~ '(fuck|shit|cunt|bitch|nigg|fag|slut|whore|dick|cock|pussy|rape|nazi|hitler|kkk|porn|sex|penis|vagina|cum|twat|wank|retard|asshole|bastard|chink|spic|kike|tranny|dyke|coon|gook|wetback|kys|killyourself|nude|onlyfans|xxx)' then return 'profanity'; end if;
  return null;
end $$;

drop function if exists public.submit_score(text, text, text, text, integer);
create or replace function public.submit_score(p_device text, p_nick text, p_metric text, p_week text, p_value integer, p_msg text default null)
returns void language plpgsql security definer set search_path = public as $$
declare prev record; secs numeric; cap integer;
begin
  p_msg := nullif(btrim(regexp_replace(p_msg, '\s+', ' ', 'g')), '');
  if public.msg_problem(p_msg) is not null then raise exception 'message'; end if;
  if p_week <> to_char(now() at time zone 'utc', 'IYYY-"W"IW') then raise exception 'stale week'; end if;
  if lower(regexp_replace(p_nick, '[^a-zA-Z]', '', 'g')) ~ '(fuck|shit|cunt|bitch|nigg|fag|slut|whore|nazi|hitler|porn|rape|retard)' then raise exception 'nickname'; end if;
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
revoke all on function public.submit_score(text, text, text, text, integer, text) from public;
revoke all on function public.msg_problem(text) from public;
grant execute on function public.submit_score(text, text, text, text, integer, text) to anon;

create or replace view public.lb_week as
  select nick, left(device, 8) as device, metric, value, msg from scores
  where week = to_char(now() at time zone 'utc', 'IYYY-"W"IW');
create or replace view public.lb_all as
  select (array_agg(nick order by updated_at desc))[1] as nick, left(device, 8) as device, metric,
         (array_agg(msg order by updated_at desc) filter (where msg is not null))[1] as msg,
         case when metric in ('rpm','streak') then max(value) else sum(value) end::integer as value
  from scores group by device, metric;
grant select on public.lb_week, public.lb_all to anon;
