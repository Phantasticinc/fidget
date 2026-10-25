do $$ begin create role anon; exception when others then null; end $$; do $$ begin create role authenticated; exception when others then null; end $$;
create schema auth; create schema extensions; create extension pgcrypto schema extensions;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
grant usage on schema auth, extensions to anon, authenticated; grant usage on schema public to anon, authenticated;
