# Equip every upgrade as a phone user would (shop UI tap), interact, screenshot, pixel-diff vs default; build composites.
import asyncio, sys, json
from playwright.async_api import async_playwright
from PIL import Image, ImageChops, ImageStat, ImageDraw
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/fidget/'
SK = {'pop': ['pop_pack_liquidmetal', 'pop_pack_neonjelly', 'pop_pack_lava'], 'spin': ['spin_plasma', 'spin_obsidian', 'spin_aurora'],
      'click': ['click_crystal', 'click_holo', 'click_walnut'], 'sand': ['sand_galaxy', 'sand_glowtide', 'sand_goldrush', 'premium_rainbow']}
async def interact(pg, toy):
  t = pg.touchscreen; m = pg.mouse
  if toy == 'pop':
    await m.move(90, 330); await m.down()
    for i in range(16): await m.move(90 + i * 16, 330 + (i % 3) * 30, steps=2)
    await m.up(); await pg.wait_for_timeout(250)
  elif toy == 'spin':  # deterministic flick (event timestamps) so every skin gets the identical gesture
    rpm = await pg.evaluate("""(()=>{const T=__fidget.toy,t=performance.now();T.down(1,320,430);for(let i=1;i<=12;i++){const a=-i/12*Math.PI;T.move(1,206+Math.cos(a)*114,430-Math.sin(a)*114,0.5,t+i*6)}T.up(1,90,430);return T.hud()})()""")
    FAIR.append(rpm.split(' ')[0])
    await pg.wait_for_timeout(500); await m.move(330, 700); await m.down(); await pg.wait_for_timeout(250)
    await pg.screenshot(path='/tmp/_s.png'); await m.up(); return
  elif toy == 'click':
    cdp = await pg.context.new_cdp_session(pg)
    for r in range(3):
      pts = [{'x': 130, 'y': 440, 'id': 1}, {'x': 280, 'y': 440, 'id': 2}]
      await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': pts}); await pg.wait_for_timeout(90)
      await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await pg.wait_for_timeout(60)
    await pg.wait_for_timeout(150)
  elif toy == 'sand':
    await m.move(80, 380); await m.down()
    for i in range(20): await m.move(80 + i * 13, 380 + (i % 4) * 25, steps=2)
    await pg.wait_for_timeout(200)
  await pg.screenshot(path='/tmp/_s.png')
  if toy == 'sand': await m.up()
FAIR = []
async def main():
  res = {}; fails = []
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for toy, ids in SK.items():
      shots = []
      for sid in [None] + ids:
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL + '?devunlock'); await pg.wait_for_timeout(500)
        await pg.goto(URL); await pg.wait_for_timeout(500)  # reload WITHOUT the query: unlock must persist
        await pg.evaluate(f"__fidget.select('{toy}')"); await pg.wait_for_timeout(400)
        if sid:
          await pg.tap('#shopBtn'); await pg.wait_for_timeout(300)
          btn = pg.locator(f'#shopBody [data-id="{sid}"] .buy, #shopBody [data-equip="{sid}"]')
          n = await btn.count()
          if n == 0: fails.append(f'{sid}: no equip button'); await ctx.close(); continue
          txt = await btn.first.text_content()
          if 'Equip' not in txt and 'Using' not in txt and 'unlocked' not in txt: fails.append(f'{sid}: shows "{txt}" (not owned)')
          await btn.first.tap()
          await pg.wait_for_timeout(200); await pg.tap('#shop [data-close]')
          if sid != 'premium_rainbow':
            eq = await pg.evaluate(f"__fidget.fx.equippedId('{toy}')")
            if eq != sid: fails.append(f'{sid}: equippedId={eq}')
          await pg.wait_for_timeout(2000)  # let reveal finish
        await interact(pg, toy)
        fn = f'preview/v-{toy}-{sid or "default"}.png'; Image.open('/tmp/_s.png').save(fn); shots.append((sid or 'default', fn))
        if errs: fails.append(f'{sid}: {errs}')
        await ctx.close()
      base = Image.open(shots[0][1]).convert('RGB')
      for sid, fn in shots[1:]:
        d = ImageStat.Stat(ImageChops.difference(base, Image.open(fn).convert('RGB'))).mean; v = sum(d) / 3; res[sid] = round(v, 2)
        if v < 4: fails.append(f'{sid}: diff too small {v:.2f}')
      w, h = 412, 915; im = Image.new('RGB', (w * len(shots), h + 30), '#111'); dr = ImageDraw.Draw(im)
      for i, (sid, fn) in enumerate(shots): im.paste(Image.open(fn).convert('RGB').resize((w, h)), (i * w, 30)); dr.text((i * w + 8, 8), sid + (f'  diff {res[sid]}' if sid in res else ''), fill='#fff')
      im.save(f'preview/compare-{toy}.png')
    await b.close()
  print(json.dumps(res, indent=1)); print('spin rpm per skin (must match):', FAIR); print('FAILS', fails)
asyncio.run(main())
