// Supabase Edge Function: emails a new leaderboard report to the moderator.
// Deploy: supabase functions deploy notify-report --no-verify-jwt
// Secrets: supabase secrets set RESEND_API_KEY=... WEBHOOK_SECRET=<random> [NOTIFY_TO=info@phantasticvanguard.com] [NOTIFY_FROM="Fidget <reports@yourdomain>"]
// Trigger: Dashboard -> Database -> Webhooks -> table public.reports, event INSERT, type "Supabase Edge Functions" -> notify-report,
//          add HTTP header  x-webhook-secret: <same random value>.
const TO = Deno.env.get('NOTIFY_TO') ?? 'info@phantasticvanguard.com';
const FROM = Deno.env.get('NOTIFY_FROM') ?? 'Fidget Reports <onboarding@resend.dev>';
const ADMIN = 'https://phantasticinc.github.io/fidget/admin.html';
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) return new Response('forbidden', { status: 403 });
  const { record: r } = await req.json();
  if (!r) return new Response('no record', { status: 400 });
  const html = `<p>New leaderboard report.</p><p><b>${esc(r.nick)}</b> (${esc(r.metric)}, install ${esc(String(r.device).slice(0, 8))})<br>Message: “${esc(r.msg) || '—'}”<br>Reason: ${esc(r.reason) || '—'}</p><p>Entries auto-hide after 3 reports. Review: <a href="${ADMIN}">${ADMIN}</a></p>`;
  const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], subject: `Fidget report: ${r.nick ?? 'entry'} (${r.metric})`, html }) });
  return new Response(await res.text(), { status: res.ok ? 200 : 502 });
});
