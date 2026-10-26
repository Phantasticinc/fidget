# Stalled network (lie-fi): with SW installed, the app must still boot from cache in ~4s rather than hang.
import asyncio, time
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); c=await b.new_context(viewport={'width':412,'height':915}); pg=await c.new_page()
    await pg.goto(U); await pg.wait_for_function("navigator.serviceWorker.controller",timeout=15000); await pg.wait_for_timeout(1500)
    async def stall(route): await asyncio.sleep(20); await route.continue_()
    await c.route('**/*', stall)
    t=time.time(); await pg.reload(wait_until='load',timeout=30000); await pg.wait_for_function("document.querySelectorAll('#dock button').length>0",timeout=30000); dt=time.time()-t
    print('boot s',round(dt,1)); print('FAILS',['slow boot %.1f'%dt] if dt>12 else []); await b.close()
asyncio.run(main())
