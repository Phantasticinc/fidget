// Supabase Edge Function: verifies and acknowledges a Google Play one-time purchase.
// Why: neither Chrome's Digital Goods API v2 (getDetails/listPurchases/listPurchaseHistory/consume only)
// nor android-browser-helper acknowledges purchases automatically. Unacknowledged purchases are
// auto-refunded by Google Play after 3 days. See PLAY-ACK.md.
// Deploy: supabase functions deploy play-ack --no-verify-jwt
// Secret: supabase secrets set PLAY_SA_JSON="$(cat service-account.json)"
const PKG = 'com.phantasticvanguard.fidget';
const SKUS = new Set(['premium_unlock', 'pop_pack_liquidmetal', 'pop_pack_neonjelly', 'pop_pack_lava', 'spin_plasma', 'spin_obsidian', 'spin_aurora',
  'click_crystal', 'click_holo', 'click_walnut', 'sand_galaxy', 'sand_glowtide', 'sand_goldrush']);
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };
const b64u = (b: ArrayBuffer | Uint8Array | string) => btoa(typeof b === 'string' ? b : String.fromCharCode(...new Uint8Array(b as ArrayBuffer)))
  .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
let cached: { tok: string; exp: number } | null = null;
async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.tok;
  const sa = JSON.parse(Deno.env.get('PLAY_SA_JSON') ?? '{}');
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const der = Uint8Array.from(atob(String(sa.private_key).replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${claim}`)));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }) });
  const j = await r.json(); if (!j.access_token) throw new Error('oauth failed');
  cached = { tok: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cached.tok;
}
const out = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return out({ error: 'method' }, 405);
  let sku = '', token = '';
  try { ({ sku, token } = await req.json()); } catch (_) { return out({ error: 'json' }, 400); }
  if (!SKUS.has(sku) || typeof token !== 'string' || token.length < 10 || token.length > 4096) return out({ error: 'bad request' }, 400);
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}/purchases/products/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(token)}`;
  try {
    const auth = { Authorization: `Bearer ${await accessToken()}` };
    const g = await fetch(base, { headers: auth });
    if (!g.ok) return out({ error: 'verify failed', status: g.status }, g.status === 404 || g.status === 400 ? 404 : 502);
    const p = await g.json();
    if (p.purchaseState !== 0) return out({ ok: false, state: p.purchaseState }); // 1 cancelled, 2 pending
    if (p.acknowledgementState === 1) return out({ ok: true, already: true });
    const a = await fetch(`${base}:acknowledge`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: '{}' });
    return a.ok ? out({ ok: true }) : out({ error: 'ack failed', status: a.status }, 502);
  } catch (e) { return out({ error: String(e) }, 500); }
});
