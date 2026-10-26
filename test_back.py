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
async def esc():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915}); await pg.goto(U); await pg.wait_for_timeout(1000)
    await pg.click('#shopBtn'); await pg.wait_for_timeout(200)
    r=await pg.evaluate("document.getElementById('shop').getAttribute('role')")
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    print('ESC FAILS',[x for x,c in [('role',r!='dialog'),('esc',not await pg.evaluate("document.getElementById('shop').hidden"))] if c]); await b.close()
asyncio.run(esc())
async def focus():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915}); await pg.goto(U); await pg.wait_for_timeout(1000)
    await pg.focus('#shopBtn'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
    a=await pg.evaluate("document.getElementById('shop').contains(document.activeElement)")
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    r=await pg.evaluate("document.activeElement.id")
    print('FOCUS FAILS',[x for x,c in [('not moved in',not a),('not restored '+r,r!='shopBtn')] if c]); await b.close()
asyncio.run(focus())
async def crave():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); await pg.goto(U+'privacy.html'); await pg.goto(U); await pg.wait_for_timeout(1000)
    await pg.click('#craveBtn'); await pg.wait_for_timeout(300); r=await pg.evaluate("document.getElementById('crave').getAttribute('role')")
    await pg.go_back(); await pg.wait_for_timeout(400)
    F=[x for x,c in [('role set on crave',r is not None),('crave still running',not await pg.evaluate("document.getElementById('crave').hidden")),('left app','privacy' in pg.url)] if c]
    print('CRAVE FAILS',F); await b.close()
asyncio.run(crave())
