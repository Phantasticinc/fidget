# First open of a toy fails (network blip): app stays on previous toy, no stuck state; a re-tap retries.
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); c=await b.new_context(viewport={'width':412,'height':915},service_workers='block'); pg=await c.new_page(); n={'k':0}
    async def h(route):
      n['k']+=1
      if n['k']==1: await route.abort()
      else: await route.continue_()
    await c.route('**/toys/spin.js*', h)
    await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(1200)
    await pg.click('#dock [data-toy="spin"]'); await pg.wait_for_timeout(800)
    on1=await pg.evaluate("document.querySelector('#dock .on')?.dataset.toy")
    await pg.click('#dock [data-toy="spin"]'); await pg.wait_for_timeout(1200)
    on2=await pg.evaluate("document.querySelector('#dock .on')?.dataset.toy"); hud=await pg.evaluate("document.getElementById('hud').textContent")
    print(on1,on2,hud,n); print('FAILS',[x for x,cnd in [('not reverted',on1!='pop'),('retry failed',on2!='spin')] if cnd]); await b.close()
asyncio.run(main())
