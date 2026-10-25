# Regenerates the 6 Play phone screenshots (1080x1920) from the current build.
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont, ImageFilter
U='http://localhost:8766/fidget/?devunlock'
HIDE="#app .note,#ver,.toast{visibility:hidden!important}"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,has_touch=True)
    pg=await ctx.new_page(); pg.on('dialog',lambda d: asyncio.ensure_future(d.dismiss()))
    await pg.goto(U); await pg.wait_for_timeout(1200); await pg.add_style_tag(content=HIDE)
    F=lambda js: pg.evaluate(js)
    async def drag(pts,steps=6,hold=True):
      await pg.mouse.move(*pts[0]); await pg.mouse.down()
      for x,y in pts[1:]: await pg.mouse.move(x,y,steps=steps)
      if not hold: await pg.mouse.up()
    # 1 pop
    await F("window.__fidget.select('pop')"); await pg.wait_for_timeout(500); await F("window.__fidget.fx.equip('pop','pop_pack_neonjelly')"); await pg.wait_for_timeout(400)
    for x,y in [(110,380),(160,420),(250,470),(300,380),(200,560),(140,520)]: await pg.mouse.click(x,y); await pg.wait_for_timeout(60)
    await pg.wait_for_timeout(120); await pg.screenshot(path='/tmp/ss/1.png')
    # 2 spin
    await F("window.__fidget.select('spin')"); await pg.wait_for_timeout(500); await F("window.__fidget.fx.equip('spin','spin_plasma')"); await pg.wait_for_timeout(300)
    for _ in range(4): await drag([(320,330),(330,560),(200,640),(90,520)],4,False)
    await pg.wait_for_timeout(500); await pg.screenshot(path='/tmp/ss/2.png')
    # 3 click
    await F("window.__fidget.select('click')"); await pg.wait_for_timeout(500); await F("window.__fidget.fx.equip('click','click_crystal')"); await pg.wait_for_timeout(300)
    for x,y in [(130,430),(210,430),(290,500),(150,560)]: await pg.mouse.click(x,y); await pg.wait_for_timeout(90)
    await pg.mouse.move(210,500); await pg.mouse.down(); await pg.wait_for_timeout(120); await pg.screenshot(path='/tmp/ss/3.png'); await pg.mouse.up()
    # 4 sand
    await F("window.__fidget.select('sand')"); await pg.wait_for_timeout(600); await F("window.__fidget.fx.equip('sand','sand_galaxy')"); await pg.wait_for_timeout(400)
    await drag([(60,420),(350,470)],14,False); await pg.wait_for_timeout(300); await drag([(80,600),(340,560)],14,False); await pg.wait_for_timeout(700)
    await pg.screenshot(path='/tmp/ss/4.png')
    # 5 celebration
    await F("window.__fidget.select('pop')"); await pg.wait_for_timeout(400)
    await F("window.__fidget.record.fake('streak',120,80)"); await pg.wait_for_timeout(2600); await pg.screenshot(path='/tmp/ss/5.png')
    await pg.click('#cbClose'); await pg.wait_for_timeout(300)
    # 6 shop (fresh, non-dev so prices show)
    q=await ctx.new_page(); await q.goto('http://localhost:8766/fidget/?devlock'); await q.wait_for_timeout(1000); await q.add_style_tag(content=HIDE)
    await q.click('#shopBtn'); await q.wait_for_timeout(500); await q.evaluate("document.querySelector('#shopBody').scrollTop=0;document.querySelector('#shop .sh-card').scrollTop=150"); await q.click('#shop .tabs button:nth-child(2)'); await q.wait_for_timeout(300)
    await q.evaluate("document.querySelector('#shop .sh-card').scrollTop=150"); await q.wait_for_timeout(900); await q.screenshot(path='/tmp/ss/6.png')
    await b.close()
asyncio.run(main())
CAP=[("Pop forever.","Upgrade to Neon Jelly, Lava or Liquid Metal"),("Spin with real momentum.","Plasma core throws lightning as it spins"),("Clicks that feel real.","Crystal, Holo and Walnut keys"),("Slice, press & pinch sand.","Galaxy, Glowtide and Gold Rush sand"),("Beat your records.","A big celebration for every new best"),("No ads. Fair upgrades.","Free toys · optional one-time upgrades")]
f1=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',70); f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',38)
for i,(h,s) in enumerate(CAP,1):
  bg=Image.new('RGB',(1080,1920),'#15131d'); d=ImageDraw.Draw(bg)
  for y in range(1920): d.line([(0,y),(1080,y)],fill=(int(32-12*y/1920),int(26-10*y/1920),int(48-24*y/1920)))
  d.text((540,150),h,font=f1,fill='#f4f1ea',anchor='mm'); d.text((540,240),s,font=f2,fill='#bdb6cc',anchor='mm')
  sh=Image.open(f'/tmp/ss/{i}.png').convert('RGB'); W=700; H=int(sh.height*W/sh.width); sh=sh.resize((W,H),Image.LANCZOS)
  m=Image.new('L',(W,H),0); ImageDraw.Draw(m).rounded_rectangle([0,0,W,H],48,fill=255)
  x=(1080-W)//2; y=320; glow=Image.new('L',(1080,1920),0); ImageDraw.Draw(glow).rounded_rectangle([x-6,y-6,x+W+6,y+H+6],54,fill=120); bg.paste((120,100,200),(0,0),glow.filter(ImageFilter.GaussianBlur(30)))
  bg.paste(sh.crop((0,0,W,min(H,1920-y-40))),(x,y),m.crop((0,0,W,min(H,1920-y-40))))
  for dst in ('play-upload/phone','store-assets/phone'): bg.save(f'{dst}/0{i}.png')
im=[Image.open(f'play-upload/phone/0{i}.png').resize((360,640)) for i in range(1,7)]; c=Image.new('RGB',(2160,640))
for i,m_ in enumerate(im): c.paste(m_,(360*i,0))
c.save('preview/store-screens.png')
