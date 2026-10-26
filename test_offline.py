import asyncio
from playwright.async_api import async_playwright
URL='http://localhost:8766/fidget/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); c=await b.new_context(viewport={'width':412,'height':915},is_mobile=True,has_touch=True)
    pg=await c.new_page(); errs=[]; net=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    await pg.goto(URL); await pg.wait_for_timeout(2500)
    await pg.reload(); await pg.wait_for_timeout(1500)
    pg.on('requestfinished',lambda r: net.append(r.url))
    cached=await pg.evaluate("caches.open('fidget-v34').then(c=>c.keys()).then(k=>k.map(r=>r.url))")
    await c.set_offline(True); errs.clear()
    await pg.reload(); await pg.wait_for_timeout(2000)
    ok=await pg.evaluate("!!window.__fidget")
    miss=[u for u in net if u.startswith('http://localhost') and u not in cached]
    print('offline boot',ok,'errs',errs[:5]); print('fetched not in precache',sorted(set(u.split('/fidget/')[1] for u in miss))[:30])
    print('FAILS',[] if ok and not errs else ['offline'])
    await b.close()
asyncio.run(main())
