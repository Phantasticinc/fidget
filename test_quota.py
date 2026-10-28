# Storage full (setItem throws QuotaExceeded): app must still boot, switch toys, change settings, with no uncaught errors.
import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'
MODES=["Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')}","Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')},configurable:true})"]
async def main(mode):
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); E=[]
    pg.on('pageerror',lambda e:E.append(str(e)))
    await pg.add_init_script(mode)
    await pg.goto(U+'?src=twa'); await pg.wait_for_timeout(1200)
    for t in ['spin','click','cube','pop']:
      await pg.click(f'#dock [data-toy="{t}"]'); await pg.wait_for_timeout(400)
      await pg.mouse.move(150,400); await pg.mouse.down(); await pg.mouse.move(300,500,steps=8); await pg.mouse.up()
      for i in range(5): await pg.touchscreen.tap(120+i*30,450)
    print('E so far',E[:4], await pg.evaluate("[...document.querySelectorAll('.sheet,#celeb')].filter(e=>!e.hidden).map(e=>e.id)"))
    await pg.click('#setBtn'); await pg.wait_for_timeout(300); print(await pg.evaluate("document.getElementById('sheet').hidden")); await pg.evaluate("document.getElementById('optSound').click()")
    await pg.wait_for_timeout(1500); on=await pg.evaluate("document.querySelector('#dock .on')?.dataset.toy")
    print('E',E[:5]); print('FAILS',E[:3]+([] if on=='pop' else ['toy '+str(on)])); await b.close()
for m in MODES: asyncio.run(main(m))
