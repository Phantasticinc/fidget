import asyncio, sys
from playwright.async_api import async_playwright
URL='http://localhost:8766/fidget/'
W=int(sys.argv[1]) if len(sys.argv)>1 else 412
TOYS=['popit','slime','squish','cube','switch']
async def main():
  F=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(); c=await b.new_context(viewport={'width':W,'height':915},is_mobile=True,has_touch=True)
    pg=await c.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    await pg.goto(URL); await pg.wait_for_timeout(1500)
    for t in TOYS:
      await pg.click(f'#dock [data-toy={t}]'); await pg.wait_for_timeout(500)
      on=await pg.evaluate("document.querySelector('#dock .on').dataset.toy")
      lab=await pg.get_attribute('#stage','aria-label')
      if on!=t or not lab.lower().startswith(t[:4].replace('popi','pop ')): F.append(('sel',t,on,lab))
      h0=await pg.evaluate("__fidget.toy.hud()")
      # interactions: taps grid + drags across the middle
      for (x,y) in [(.5,.47),(.35,.35),(.65,.35),(.35,.6),(.65,.6),(.5,.3),(.3,.47),(.7,.47)]:
        X,Y=W*x,915*y; await pg.mouse.move(X,Y); await pg.mouse.down(); await pg.mouse.move(X,Y-40,steps=6); await pg.wait_for_timeout(120); await pg.mouse.up(); await pg.wait_for_timeout(80)
      for (x,y) in [(.42,.44),(.58,.5),(.5,.53)]:
        await pg.mouse.move(W*x,915*y); await pg.mouse.down(); await pg.wait_for_timeout(150); await pg.mouse.up(); await pg.wait_for_timeout(60)
      await pg.mouse.move(W*.2,915*.47); await pg.mouse.down(); await pg.mouse.move(W*.8,915*.47,steps=20); await pg.mouse.up()
      await pg.wait_for_timeout(600)
      h1=await pg.evaluate("__fidget.toy.hud()")
      if h0==h1: F.append(('nointeract',t,h0,h1))
      # physics sanity: no NaN in canvas draw (step many frames)
      ok=await pg.evaluate("(()=>{const t=__fidget.toy;for(let i=0;i<600;i++)t.step(1/120);return JSON.stringify(t.hud()).indexOf('NaN')<0})()")
      if not ok: F.append(('nan',t))
      await pg.screenshot(path=f'/tmp/nt_{t}_{W}.png')
      # upsell chip visible (not premium) and preview works
      vis=await pg.is_visible('#upsell')
      if not vis: F.append(('upsell hidden',t))
    await pg.click('#upsell'); await pg.wait_for_timeout(400)
    txt=await pg.text_content('#upsell')
    if 'Premium look ·' not in txt: F.append(('preview',txt))
    await pg.screenshot(path=f'/tmp/nt_preview_{W}.png')
    await pg.wait_for_timeout(8500); txt=await pg.text_content('#upsell')
    if 'Get the Premium' not in txt: F.append(('afterpreview',txt))
    await pg.click('#upsell'); await pg.wait_for_timeout(500)
    if await pg.is_hidden('#shop'): F.append('shop not opened')
    # premium hidden products not listed
    if await pg.evaluate("!!document.querySelector('[data-id=upgrade_slime]')"): F.append('v2 product visible')
    # calm mode draw
    await pg.evaluate("document.getElementById('optCalm').click()")
    for t in TOYS:
      await pg.evaluate(f"__fidget.select('{t}')"); await pg.wait_for_timeout(300)
    # review card: not in browser
    if await pg.evaluate("__review.eligible()"): F.append('review eligible outside TWA')
    if errs: F.append(('errs',errs[:5]))
    # TWA context: review eligible, shows, rate stops future
    p2=await c.new_page(); await p2.goto(URL+'?x=1'); await p2.evaluate("localStorage.setItem('fidget.review','{}')")
    await p2.evaluate("localStorage.setItem(Object.keys(localStorage).find(k=>k.includes('twa'))||'fidget.twa','1')")
    await p2.reload(); await p2.wait_for_timeout(1000)
    inapp=await p2.evaluate("import('./js/store/ent.js?v=9').then(m=>m.inPlayApp)")
    if inapp:
      s=await p2.evaluate("__review.show()"); s2=await p2.evaluate("__review.show()")
      href=await p2.get_attribute('#rvYes','href')
      if not s or s2 or 'com.phantasticvanguard.fidget' not in href: F.append(('review',s,s2,href))
      await p2.screenshot(path=f'/tmp/nt_review_{W}.png')
    else: print('TWA flag key unknown; review TWA path skipped')
    await b.close()
  print('FAILS',F)
asyncio.run(main())
