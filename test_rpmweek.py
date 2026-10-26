# Weekly RPM must record even when it is below the all-time best.
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True)
    await pg.add_init_script("localStorage.setItem('fidget.stats',JSON.stringify({all:{rpm:900},wk:'2000-W01',week:{},hist:{}}))")
    await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(1000)
    w=await pg.evaluate("import('./js/bus.js').then(b=>{b.emit('rpm',300);b.emit('rpm',320);return import('./js/lb/stats.js')}).then(s=>[s.get().week.rpm,s.get().all.rpm])")
    print('week,all',w); print('FAILS',[] if w==[320,900] else ['rpm week'])
    await b.close()
asyncio.run(main())
