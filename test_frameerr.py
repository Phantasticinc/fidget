# A single exception inside a frame must not freeze rendering.
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915}); E=[]; pg.on('pageerror',lambda e:E.append(str(e)))
    await pg.add_init_script("const d=CanvasRenderingContext2D.prototype.drawImage;let n=0;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(++n===400)throw new Error('boom');return d.apply(this,a)}")
    await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(1500)
    a=await pg.evaluate("document.querySelector('canvas').toDataURL().length")
    await pg.mouse.click(120,300); await pg.wait_for_timeout(800)
    hud1=await pg.evaluate("document.getElementById('hud').textContent")
    await pg.mouse.click(176,300); await pg.wait_for_timeout(600); hud2=await pg.evaluate("document.getElementById('hud').textContent")
    print(hud1,hud2,E,await pg.evaluate('1')); print('FAILS',[] if hud1!=hud2 else ['frozen']); await b.close()
asyncio.run(main())
