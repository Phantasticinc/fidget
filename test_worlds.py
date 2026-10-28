# Every upgrade world: interact, screenshot normal / milestone / Calm; pixel-check Calm is dimmer; composite grid.
import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageStat, ImageDraw
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/fidget/'
SK = [('pop', 'pop_pack_liquidmetal'), ('pop', 'pop_pack_neonjelly'), ('pop', 'pop_pack_lava'), ('spin', 'spin_plasma'), ('spin', 'spin_obsidian'), ('spin', 'spin_aurora'),
      ('click', 'click_crystal'), ('click', 'click_holo'), ('click', 'click_walnut')]
OUT = 'preview/worlds/'
async def act(pg, toy):
  T = "__fidget.toy"
  if toy == 'pop': await pg.evaluate(f"(()=>{{const T={T};for(let i=0;i<14;i++){{T.down(1,80+i*18,330+(i%3)*30);T.up(1,80+i*18,330+(i%3)*30)}}}})()")
  elif toy == 'spin': await pg.evaluate(f"(()=>{{const T={T},t=performance.now();T.down(1,320,430);for(let i=1;i<=12;i++){{const a=-i/12*Math.PI;T.move(1,206+Math.cos(a)*114,430-Math.sin(a)*114,0.5,t+i*6)}}T.up(1,90,430)}})()")
  elif toy == 'click':
    for i in range(6): await pg.evaluate(f"(()=>{{const T={T};T.down({i},130+({i}%3)*70,440);}})()"); await pg.wait_for_timeout(60); await pg.evaluate(f"__fidget.toy.up({i},0,0)")
  else:
    await pg.evaluate(f"(()=>{{const T={T},t=performance.now();T.down(1,80,380);for(let i=1;i<20;i++)T.move(1,80+i*13,380+(i%4)*25,0.5,t+i*16);T.up(1,0,0)}})()")
async def main():
  fails = []; rows = []
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for toy, sid in SK:
      ctx = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
      pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(URL + '?devunlock'); await pg.wait_for_timeout(500)
      await pg.evaluate(f"__fidget.select('{toy}')"); await pg.wait_for_timeout(300)
      await pg.evaluate(f"__fidget.fx.equip('{toy}','{sid}')"); await pg.wait_for_timeout(1900)
      if toy == 'sand' and sid == 'sand_goldrush':  # pinch a clump high to pry out nuggets
        await pg.evaluate("(()=>{const T=__fidget.toy;Math.random=(r=>()=>0.1)(Math.random);T.down(1,180,470);T.down(2,230,470)})()"); await pg.wait_for_timeout(100)
        for i in range(1, 25): await pg.evaluate(f"(()=>{{const T=__fidget.toy;T.move(1,180,{470 - i*6},0.5);T.move(2,230,{470 - i*6},0.5)}})()"); await pg.wait_for_timeout(30)
      for _ in range(3): await act(pg, toy); await pg.wait_for_timeout(120)
      n = f'{OUT}{sid}'; await pg.screenshot(path=n + '-a.png')
      if sid == 'sand_goldrush': await pg.evaluate("(()=>{const T=__fidget.toy;T.up(1,0,0);T.up(2,0,0)})()")
      await pg.evaluate("__world.milestone(1)"); await pg.wait_for_timeout(500); await pg.screenshot(path=n + '-b.png')
      if sid == 'sand_galaxy': await pg.wait_for_timeout(1500); await pg.screenshot(path=n + '-b.png')
      await pg.wait_for_timeout(3500)
      await pg.evaluate("(()=>{const c=document.getElementById('optCalm');c.checked=true;c.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(300)
      await act(pg, toy); await pg.wait_for_timeout(200); await pg.screenshot(path=n + '-c.png')
      la, lc = [(lambda im: (ImageStat.Stat(im.crop((0, 60, 16, 880))).mean[0] + ImageStat.Stat(im.crop((396, 60, 412, 880))).mean[0]) / 2)(Image.open(n + x + '.png').convert('L')) for x in ('-a', '-c')]  # background margins only
      ws = await pg.evaluate("__world.active() && __world.active().name")
      print(sid, ws, 'lum', round(la, 1), '->calm', round(lc, 1), errs[:2])
      if not ws: fails.append(f'{sid}: no world')
      if lc > la + 2: fails.append(f'{sid}: calm not dimmer')
      if errs: fails.append(f'{sid}: {errs[:2]}')
      rows.append(sid); await ctx.close()
    await b.close()
  w, h = 206, 458
  for part, names in (('1', rows[:7]), ('2', rows[7:])):
    c = Image.new('RGB', (w * 3, h * len(names)), '#000'); d = ImageDraw.Draw(c)
    for j, sid in enumerate(names):
      for i, x in enumerate('abc'): c.paste(Image.open(f'{OUT}{sid}-{x}.png').resize((w, h)), (i * w, j * h))
      d.text((6, j * h + 50), sid + '  (live / milestone / calm)', fill='#fff')
    c.save(f'preview/worlds-{part}.png')
  print('FAILS', fails)
asyncio.run(main())
