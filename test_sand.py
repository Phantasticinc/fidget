# Real multi-touch (CDP Input.dispatchTouchEvent) sand interaction test: slice, press, pinch-lift-stretch-tear-drop, pull-apart, sticky drag, roll a ball.
import asyncio, sys, math
from playwright.async_api import async_playwright
from PIL import Image
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/fidget/'
OUT = 'preview/sand/'
async def main():
  fails = []
  async with async_playwright() as p:
    b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL + '?toy=sand'); await pg.wait_for_timeout(900)
    cdp = await ctx.new_cdp_session(pg)
    async def T(t, pts): await cdp.send('Input.dispatchTouchEvent', {'type': t, 'touchPoints': [{'x': x, 'y': y, 'id': i, 'radiusX': 8, 'radiusY': 8, 'force': 0.5} for i, (x, y) in pts]})
    async def shot(n): await pg.screenshot(path=OUT + n + '.png')
    mass = "(()=>{const G=__fidget.toy.grid;let s=0;for(const v of G.h)s+=v;for(const L of __fidget.toy.goo.lumps)s+=L.m;return s})()"
    st = lambda: pg.evaluate("(()=>{const T=__fidget.toy,P=T.pin;return {pin:!!P,torn:P&&P.torn,thin:P&&P.thin,m:P&&P.m,lumps:T.goo.lumps.length,balls:T.goo.lumps.filter(l=>l.ball).length}})()")
    m0 = await pg.evaluate(mass)
    # 1 slice
    await T('touchStart', [(1, (90, 360))])
    for i in range(1, 25): await T('touchMove', [(1, (90 + i * 10, 360 + i * 5))]); await pg.wait_for_timeout(8)
    await T('touchEnd', []); await pg.wait_for_timeout(300); await shot('1-slice')
    # 2 press / squish
    await T('touchStart', [(1, (300, 520))]); await pg.wait_for_timeout(900); await shot('2-press-held'); await T('touchEnd', []); await pg.wait_for_timeout(200); await shot('2-press-after')
    # 3 PINCH: two fingers close, grab, lift, stretch, tear, drop
    A, B = (180, 470), (232, 470)
    await T('touchStart', [(1, A)]); await pg.wait_for_timeout(20); await T('touchStart', [(1, A), (2, B)]); await pg.wait_for_timeout(250)
    s = await st(); print('grab', s)
    if not s['pin'] or not s['m'] or s['m'] < 0.3: fails.append(f'pinch did not grab: {s}')
    await shot('3-pinch-a-grab')
    frames = []
    for i in range(1, 31):
      a = (A[0] - i * 3.2, A[1] - i * 2.5); bb = (B[0] + i * 3.2, B[1] - i * 2.5)
      await T('touchMove', [(1, a), (2, bb)]); await pg.wait_for_timeout(33)
      if i in (8, 16, 22, 30): await shot(f'3-pinch-b-stretch{i:02d}'); frames.append(f'3-pinch-b-stretch{i:02d}')
    s = await st(); print('stretched', s)
    if not s['torn']: fails.append(f'pinch stretch did not tear: {s}')
    await T('touchEnd', []); await pg.wait_for_timeout(120); await shot('3-pinch-c-drop'); await pg.wait_for_timeout(700); await shot('3-pinch-d-splat')
    s = await st(); print('after', s)
    # 3b pinch and lift without tearing, release with both = drop whole clump
    await T('touchStart', [(1, (250, 600)), (2, (290, 600))]); await pg.wait_for_timeout(200)
    for i in range(1, 12): await T('touchMove', [(1, (250, 600 - i * 12)), (2, (290, 600 - i * 12))]); await pg.wait_for_timeout(30)
    await shot('3-pinch-e-carry'); s = await st(); print('carry', s)
    if s['torn']: fails.append('carry tore unexpectedly')
    await T('touchEnd', []); await pg.wait_for_timeout(800)
    # 4 pull-apart (fingers start far apart)
    await T('touchStart', [(1, (120, 430)), (2, (320, 430))]); await pg.wait_for_timeout(60)
    for i in range(1, 14): await T('touchMove', [(1, (120 - i * 3, 430)), (2, (320 + i * 3, 430))]); await pg.wait_for_timeout(30)
    await T('touchEnd', []); await pg.wait_for_timeout(250); await shot('4-pull-apart')
    # 5 sticky drag (hold then drag)
    await T('touchStart', [(1, (130, 560))]); await pg.wait_for_timeout(320)
    for i in range(1, 20): await T('touchMove', [(1, (130 + i * 8, 560 + math.sin(i / 3) * 10))]); await pg.wait_for_timeout(20)
    await shot('5-sticky-drag'); await T('touchEnd', []); await pg.wait_for_timeout(500); await shot('5-sticky-after')
    # 6 roll a ball: hold, then circle
    await T('touchStart', [(1, (230, 400))]); await pg.wait_for_timeout(320)
    for i in range(1, 150): a = i / 10; await T('touchMove', [(1, (230 + math.cos(a) * 26 - 26, 400 + math.sin(a) * 26))]); await pg.wait_for_timeout(12)
    for i in range(1, 15): await T('touchMove', [(1, (230 + i * 6, 400 + i * 6))]); await pg.wait_for_timeout(16)
    s = await st(); print('ball', s)
    if not s['balls']: fails.append('ball did not form')
    await shot('6-ball-rolling'); await T('touchEnd', []); await pg.wait_for_timeout(500); await shot('6-ball-rest')
    m1 = await pg.evaluate(mass); print('mass', round(m0, 1), '->', round(m1, 1))
    if abs(m1 - m0) / m0 > 0.12: fails.append(f'mass not conserved {m0}->{m1}')
    fps = await pg.evaluate("new Promise(r=>{let n=0,t=performance.now();const f=()=>{n++;if(performance.now()-t<1000)requestAnimationFrame(f);else r(n)};requestAnimationFrame(f)})"); print('fps', fps)
    if errs: fails.append(errs)
    await b.close()
  # pinch filmstrip
  names = ['3-pinch-a-grab'] + frames + ['3-pinch-c-drop', '3-pinch-d-splat']
  ims = [Image.open(OUT + n + '.png').crop((100, 640, 760, 1120)).resize((330, 240)) for n in names]
  strip = Image.new('RGB', (330 * len(ims), 240)); [strip.paste(im, (i * 330, 0)) for i, im in enumerate(ims)]; strip.save('preview/sand-pinch-sequence.png')
  al = ['1-slice', '2-press-held', '3-pinch-b-stretch16', '3-pinch-e-carry', '4-pull-apart', '5-sticky-drag', '6-ball-rolling', '6-ball-rest']
  ims = [Image.open(OUT + n + '.png').resize((206, 458)) for n in al]
  c = Image.new('RGB', (206 * 4, 458 * 2)); [c.paste(im, ((i % 4) * 206, (i // 4) * 458)) for i, im in enumerate(ims)]; c.save('preview/sand-interactions.png')
  print('FAILS', fails)
asyncio.run(main())
