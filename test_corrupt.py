# Corrupted localStorage must not brick the app.
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.add_init_script("for (const k of ['fidget.ent','fidget.opts','fidget.stats','fidget.equip','fidget.rec','fidget.records','fidget.recWeek']) localStorage.setItem(k,'{bad'); for (let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k.startsWith('fidget.')&&!['fidget.twa','fidget.devunlock','fidget.gift','fidget.shared'].includes(k)) localStorage.setItem(k,'{bad')}")
    await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(1500)
    ok=await pg.evaluate("!!window.__fidget"); print('boot',ok,errs); print('FAILS',[] if ok and not errs else ['corrupt'])
    await b.close()
asyncio.run(main())
