# Android back closes open sheets (TWA) instead of leaving the page; with nothing open, back still leaves.
import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); errs=[]; F=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto(U+'privacy.html'); await pg.goto(U); await pg.wait_for_timeout(1200)
    vis=lambda i: pg.evaluate(f"!document.getElementById('{i}').hidden")
    for btn,sid in [('#setBtn','sheet'),('#shopBtn','shop'),('#lbBtn','board')]:
      await pg.click(btn); await pg.wait_for_timeout(300)
      if not await vis(sid): F.append(sid+' not open'); continue
      await pg.go_back(); await pg.wait_for_timeout(400)
      if await vis(sid): F.append(sid+' still open after back')
      if 'privacy' in pg.url: F.append(sid+' back left the app')
    # close via UI must not leave a dangling history entry
    await pg.click('#setBtn'); await pg.wait_for_timeout(200); await pg.click('#sheetClose'); await pg.wait_for_timeout(400)
    if 'privacy' in pg.url: F.append('UI close navigated away')
    await pg.go_back(); await pg.wait_for_timeout(600)
    if 'privacy' not in pg.url: F.append('back with nothing open should leave: '+pg.url)
    print('errs',errs); print('FAILS',F+errs); await b.close()
asyncio.run(main())
