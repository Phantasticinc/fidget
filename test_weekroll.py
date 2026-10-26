# App left open across a week boundary: weekly 'keys' record must still fire next week (base was stuck at Infinity).
import asyncio, datetime as D
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); c=await b.new_context(viewport={'width':412,'height':915},timezone_id='America/Chicago'); pg=await c.new_page()
    await pg.clock.install(time=D.datetime(2026,10,18,12,0,tzinfo=D.timezone.utc))  # Sun (week 42)
    await pg.add_init_script("localStorage.setItem('fidget.stats', JSON.stringify({all:{keys:250},wk:'',week:{},hist:{'2026-W41':{keys:250}}}))")
    await pg.goto(U); await pg.clock.run_for(1500)
    k=await pg.evaluate("Object.keys(localStorage)"); print('keys',k)
    await pg.evaluate("window._r=[];import('./js/bus.js').then(B=>{B.on('record',e=>_r.push(e.metric+':'+e.value));window.B=B})"); await pg.clock.run_for(300)
    async def press(n):
      await pg.evaluate(f"for(let i=0;i<{n};i++)B.emit('key')"); await pg.clock.run_for(2500)
    await press(300); r1=await pg.evaluate("_r.slice()")
    await pg.clock.fast_forward('48:00:00'); await pg.clock.run_for(500)   # -> Tue, week 43
    await press(320); r2=await pg.evaluate("_r.slice()")
    print('r1',r1,'r2',r2)
    print('FAILS',[x for x,cnd in [('no first record',not any(s.startswith('keys') for s in r1)),('no record next week',len([s for s in r2 if s.startswith('keys')])<2)] if cnd])
    await b.close()
asyncio.run(main())
