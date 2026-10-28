import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True)
    cdp=await pg.context.new_cdp_session(pg); await cdp.send('HeapProfiler.enable')
    await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(1500)
    async def heap():
      await cdp.send('HeapProfiler.collectGarbage'); return (await pg.evaluate('performance.memory.usedJSHeapSize'))/1e6
    async def cycle():
      for t in ['pop','spin','click','cube']:
        await pg.evaluate(f"__fidget.select('{t}')"); m=pg.mouse
        await m.move(100,400); await m.down()
        for i in range(25): await m.move(100+i*9,400+(i%5)*20); await pg.wait_for_timeout(10)
        await m.up(); await pg.wait_for_timeout(300)
    await cycle(); h0=await heap()
    for _ in range(6): await cycle()
    h1=await heap(); print('heap MB',round(h0,1),'->',round(h1,1)); print('FAILS',['leak'] if h1>h0*1.5+3 else [])
    await b.close()
asyncio.run(main())
