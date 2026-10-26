# Under heavy CPU throttle the main canvas drops DPR; unthrottled at DPR 2 it stays 2.
import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'
async def run(rate):
  async with async_playwright() as p:
    b=await p.chromium.launch(); c=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,is_mobile=True,has_touch=True); pg=await c.new_page()
    await pg.goto(U); await pg.wait_for_timeout(800)
    s=await c.new_cdp_session(pg); await s.send('Emulation.setCPUThrottlingRate',{'rate':rate}); await pg.evaluate("window._n=0;(function f(){_n++;requestAnimationFrame(f)})()")
    await pg.wait_for_timeout(9000)
    print(rate,'frames',await pg.evaluate('_n')); r=await pg.evaluate("document.querySelector('canvas').width/innerWidth"); await b.close(); return r
async def main():
  fast=await run(1); slow=await run(20); print('fast',fast,'slow',slow)
  print('FAILS',[x for x,c in [('fast dropped',fast<1.9),('slow not dropped',slow>1.6)] if c])
asyncio.run(main())
