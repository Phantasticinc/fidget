# Stats are persisted as soon as the app is backgrounded (Android can kill it without pagehide).
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(); await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(5600)
    await pg.evaluate("import('./js/bus.js').then(B=>{for(let i=0;i<7;i++)B.emit('key')})"); await pg.wait_for_timeout(100)
    await pg.evaluate("Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))")
    v=await pg.evaluate("(JSON.parse(localStorage.getItem('fidget.stats')||'{}').week||{}).keys")
    print('keys',v); print('FAILS',[] if v==7 else ['not saved on hide']); await b.close()
asyncio.run(main())
