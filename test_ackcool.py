# Celebration cooldown (full-screen once per metric per session, toast after) + server-side purchase ack wiring.
import asyncio, json, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/fidget/'
async def main():
  fails = []
  async with async_playwright() as p:
    b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(700)
    await pg.evaluate("__fidget.record.fake('streak',150,90)"); await pg.wait_for_timeout(600)
    if await pg.evaluate("document.getElementById('celeb').hidden"): fails.append('first record not full-screen')
    await pg.wait_for_timeout(2600); await pg.click('#cbClose'); await pg.wait_for_timeout(200)
    await pg.evaluate("__fidget.record.fake('streak',160,150)"); await pg.wait_for_timeout(300)
    if not await pg.evaluate("document.getElementById('celeb').hidden"): fails.append('second same-metric record went full-screen')
    t = await pg.evaluate("[...document.querySelectorAll('.toast')].map(x=>x.textContent+'|'+x.getAttribute('role')).join()")
    print('toast', t)
    if 'New record' not in t or 'status' not in t: fails.append('no toast')
    await pg.evaluate("__fidget.record.fake('rpm',300,200)"); await pg.wait_for_timeout(400)
    if await pg.evaluate("document.getElementById('celeb').hidden"): fails.append('other metric not full-screen')
    # ack: failure (502) is not cached, posts sku+token when configured, caches success
    calls = []
    async def h(r): calls.append(r.request.post_data); await r.fulfill(content_type='application/json', body=json.dumps({'ok': True}), headers={'Access-Control-Allow-Origin': '*'})
    await pg.route('https://ack.example/**', h)
    await pg.route('https://jrfswgwaknoelalyvxav.supabase.co/**', lambda r: r.fulfill(status=502, content_type='application/json', body='{"error":"verify failed"}', headers={'Access-Control-Allow-Origin': '*'}))
    res = await pg.evaluate("""(async()=>{const m=await import('./js/store/billing.js?v=7');
      const a=await m.ack('premium_unlock','tok_1234567890');
      const b=await m.ack('premium_unlock','tok_1234567890','https://ack.example/play-ack');
      const c=await m.ack('premium_unlock','tok_1234567890','https://ack.example/play-ack');
      return [a,b,c]})()""")
    print('ack', res, calls)
    if res != [False, True, False] or len(calls) != 1 or 'tok_1234567890' not in calls[0]: fails.append('ack wiring')
    fails += errs
  print('FAILS', fails)
asyncio.run(main())
