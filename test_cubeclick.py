# Cube + Click: every Click key does its own thing; Cube looks gate/switch; legacy Sand owners get the matching cube look; dock has 4 toys.
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/fidget/'
W = int(sys.argv[2]) if len(sys.argv) > 2 else 412
async def main():
  F = []
  async with async_playwright() as p:
    b = await p.chromium.launch(); c = await b.new_context(viewport={'width': W, 'height': 915}, is_mobile=True, has_touch=True)
    pg = await c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.goto(URL); await pg.wait_for_timeout(1500)
    dock = await pg.evaluate("[...document.querySelectorAll('#dock [data-toy]')].map(b=>b.dataset.toy)")
    if dock != ['pop', 'spin', 'click', 'cube']: F.append(('dock', dock))
    # ---- Click: drive each key through the toy API
    await pg.evaluate("__fidget.select('click')"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("""(()=>{const T=__fidget.toy, ev=[]; const off=[]; const B=window.__fidget; 
      const ks=()=>T.__keys; return 1})()""")
    res = await pg.evaluate("""(async()=>{const T=__fidget.toy; const st=s=>{for(let i=0;i<s;i++)T.step(1/120)};
      const box=document.getElementById('stage').getBoundingClientRect(); const W=box.width,H=box.height;
      const size=Math.min((W*0.74)/3,112),gap=size*0.1,tot=size*3+gap*2,x0=(W-tot)/2,y0=H*0.47-tot/2;
      const P=i=>[x0+(i%3)*(size+gap)+size/2, y0+Math.floor(i/3)*(size+gap)+size/2];
      const tap=(i,id=1,hold=30,dx=0)=>{const [x,y]=P(i);T.down(id,x+dx,y);st(hold);T.up(id,x+dx,y);st(60)};
      const h=()=>+T.hud().match(/(\\d+) clicks/)[1]; const o={};
      for(let i=0;i<3;i++){const a=h();tap(i);o['k'+i]=h()-a}
      let a=h(); tap(3); o.latchOn=T.hud(); tap(3); o.latch=h()-a;
      a=h(); tap(4,1,150); o.charge=h()-a;
      a=h(); tap(5,1,20); tap(5,1,20); o.double=h()-a;
      a=h(); tap(6,1,240); o.rapid=h()-a;
      a=h(); tap(7,1,30,-size*0.3); tap(7,1,30,size*0.3); o.rocker=h()-a;
      a=h(); for(let i=0;i<10;i++) tap(8,1,25); o.type=h()-a;
      return o})()""")
    print('click', res)
    for i in range(3):
      if res['k%d' % i] != 1: F.append(('key', i, res))
    if res['latch'] != 2 or res['charge'] != 1 or res['double'] < 2 or res['rapid'] < 5 or res['rocker'] != 2 or res['type'] < 10: F.append(('fn', res))
    await pg.screenshot(path=f'/tmp/cc_click_{W}.png')
    # ---- Cube: free, upsell chip visible, preview, no hidden products in shop
    await pg.evaluate("__fidget.select('cube')"); await pg.wait_for_timeout(400)
    lab = await pg.get_attribute('#stage', 'aria-label')
    if 'musical' not in lab: F.append(('cubelabel', lab))
    for (x, y) in [(.35, .35), (.65, .35), (.35, .6), (.65, .6)]:
      await pg.mouse.click(W * x, 915 * y); await pg.wait_for_timeout(80)
    if not await pg.is_visible('#upsell'): F.append('upsell hidden')
    await pg.click('#upsell'); await pg.wait_for_timeout(400)
    if 'Premium look ·' not in await pg.text_content('#upsell'): F.append('preview')
    await pg.screenshot(path=f'/tmp/cc_cube_prev_{W}.png')
    # ---- legacy: a Sand Gold Rush owner gets the Brass cube look, listed in the shop, switchable
    await pg.evaluate("localStorage.setItem('fidget.ent', JSON.stringify(['sand_goldrush']))"); await pg.reload(); await pg.wait_for_timeout(1200)
    await pg.evaluate("__fidget.select('cube')"); await pg.wait_for_timeout(300)
    lk = await pg.evaluate("import('./js/toys/kit2.js?v=2').then(m=>[m.lookId(), m.owns('cube'), m.ownedLooks()])")
    if lk != ['cube_brass', True, ['cube_brass']]: F.append(('legacy', lk))
    if await pg.is_visible('#upsell'): F.append('upsell shown to owner')
    await pg.mouse.click(W * .35, 915 * .35); await pg.wait_for_timeout(200)
    await pg.screenshot(path=f'/tmp/cc_cube_brass_{W}.png')
    await pg.mouse.click(W * .5, 915 * .9 if False else 30); await pg.wait_for_timeout(100)
    for look in ['upgrade_cube', 'cube_frost']:
      await pg.evaluate(f"localStorage.setItem('fidget.ent', JSON.stringify(['{look}'])); localStorage.removeItem('fidget.cubeLook')"); await pg.reload(); await pg.wait_for_timeout(1000)
      await pg.evaluate("__fidget.select('cube')"); await pg.wait_for_timeout(300)
      await pg.mouse.click(W * .35, 915 * .35); await pg.wait_for_timeout(200); await pg.screenshot(path=f'/tmp/cc_cube_{look}_{W}.png')
    await pg.evaluate("localStorage.setItem('fidget.ent', JSON.stringify(['sand_galaxy','sand_glowtide']))"); await pg.reload(); await pg.wait_for_timeout(1000)
    await pg.evaluate("__fidget.shop ? 0 : 0")
    sh = await pg.evaluate("import('./js/ui/shop.js?v=22').then(m=>{m.open(); return new Promise(r=>setTimeout(()=>r([...document.querySelectorAll('#shop [data-id]')].map(e=>e.dataset.id)),400))})")
    if 'upgrade_cube' not in sh or 'cube_frost' not in sh or 'cube_brass' in sh or any(s.startswith('sand_') for s in sh): F.append(('shop', sh))
    if errs: F.append(('errs', errs[:5]))
    await b.close()
  print('FAILS', F)
asyncio.run(main())
