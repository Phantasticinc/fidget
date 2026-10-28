# v2 Play phone screenshots (1080x1920, 8) + feature graphic (1024x500) -> play-upload/v2/
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont, ImageFilter
U='http://localhost:8766/fidget/?devunlock'
HIDE="#app .note,#ver,.toast,#upsell{visibility:hidden!important}"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2,has_touch=True)
    pg=await ctx.new_page(); await pg.goto(U); await pg.wait_for_timeout(1500); await pg.add_style_tag(content=HIDE)
    F=lambda js: pg.evaluate(js)
    async def sel(t): await F(f"__fidget.select('{t}')"); await pg.wait_for_timeout(700)
    async def tap(x,y,h=60): await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(h); await pg.mouse.up(); await pg.wait_for_timeout(40)
    async def drag(a,bb,st=14): await pg.mouse.move(*a); await pg.mouse.down(); await pg.mouse.move(*bb,steps=st); await pg.mouse.up(); await pg.wait_for_timeout(60)
    await sel('pop')
    for x,y in [(110,380),(160,420),(250,470),(300,380),(200,560),(90,640)]: await pg.mouse.click(x,y); await pg.wait_for_timeout(60)
    await pg.wait_for_timeout(100); await pg.screenshot(path='/tmp/ss2/1.png')
    await sel('spin'); await drag((330,330),(330,640),6); await pg.wait_for_timeout(500); await pg.screenshot(path='/tmp/ss2/2.png')
    await sel('click')
    for x,y in [(80,380),(206,380),(330,380),(80,500),(206,620),(330,500)]: await tap(x,y,90)
    await pg.mouse.move(206,500); await pg.mouse.down(); await pg.wait_for_timeout(900); await pg.screenshot(path='/tmp/ss2/3.png'); await pg.mouse.up()
    await sel('cube'); await tap(120,330); await tap(300,330); await pg.mouse.move(296,520); await pg.mouse.down(); await pg.mouse.move(330,560,steps=4); await pg.wait_for_timeout(100); await pg.screenshot(path='/tmp/ss2/4.png'); await pg.mouse.up()
    await F("localStorage.setItem('fidget.cubeLook','cube_frost')"); await sel('pop'); await sel('cube')
    for x,y in [(120,330),(300,330),(206,430)]: await tap(x,y)
    await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/ss2/5.png')
    await sel('pop'); await pg.click('#craveBtn'); await pg.wait_for_timeout(2500); await pg.screenshot(path='/tmp/ss2/6.png'); await pg.click('#craveStop')
    await sel('click'); await F("__fidget.fx.equip('click','click_holo')"); await pg.wait_for_timeout(300)
    for x,y in [(80,380),(206,380),(330,500),(80,620)]: await tap(x,y,90)
    await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/ss2/7.png')
    await sel('pop'); await F("__fidget.fx.equip('pop','pop_pack_neonjelly')"); await pg.wait_for_timeout(300)
    for x,y in [(110,380),(160,420),(250,470),(300,380),(200,560)]: await pg.mouse.click(x,y); await pg.wait_for_timeout(60)
    await pg.wait_for_timeout(100); await pg.screenshot(path='/tmp/ss2/8.png')
    await b.close()
asyncio.run(main())
CAP=[("Pop the bubble wrap","Crisp snaps that spring back forever"),("Spin it. Watch it go.","A weighty spinner with real momentum"),("9 keys, 9 different clicks","Latch, charge, rapid fire, rocker & more"),("A fidget cube, anywhere","Buttons, dial, toggle and joystick"),("New cube looks","RGB, steampunk brass and frost"),("Ride out a craving","3-minute timer with a breathing pacer"),("Upgrade any toy","One-time looks with their own sounds"),("Zero ads. Ever.","4 toys free · works offline")]
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; f1=ImageFont.truetype(B,68); f2=ImageFont.truetype(B,38)
def frame(i,h,s):
  bg=Image.new('RGB',(1080,1920)); d=ImageDraw.Draw(bg)
  for y in range(1920): d.line([(0,y),(1080,y)],fill=(int(32-12*y/1920),int(26-10*y/1920),int(48-24*y/1920)))
  d.text((540,150),h,font=f1,fill='#f4f1ea',anchor='mm'); d.text((540,240),s,font=f2,fill='#bdb6cc',anchor='mm')
  sh=Image.open(f'/tmp/ss2/{i}.png').convert('RGB'); W=700; H=int(sh.height*W/sh.width); sh=sh.resize((W,H),Image.LANCZOS)
  m=Image.new('L',(W,H),0); ImageDraw.Draw(m).rounded_rectangle([0,0,W,H],48,fill=255)
  x=(1080-W)//2; y=320; gl=Image.new('L',(1080,1920),0); ImageDraw.Draw(gl).rounded_rectangle([x-6,y-6,x+W+6,y+H+6],54,fill=120); bg.paste((120,100,200),(0,0),gl.filter(ImageFilter.GaussianBlur(30)))
  hh=min(H,1920-y-40); bg.paste(sh.crop((0,0,W,hh)),(x,y),m.crop((0,0,W,hh))); bg.save(f'play-upload/v2/phone/{i:02d}.png')
for i,(h,s) in enumerate(CAP,1): frame(i,h,s)
# feature graphic: title left, three toy crops right
fg=Image.new('RGB',(1024,500)); d=ImageDraw.Draw(fg)
for x in range(1024): d.line([(x,0),(x,500)],fill=(int(40-14*x/1024),int(24+6*x/1024),int(60-10*x/1024)))
d.text((60,150),'Fidget',font=ImageFont.truetype(B,96),fill='#f4f1ea'); d.text((64,270),'Bubble wrap · Spinner · Clicker · Cube',font=ImageFont.truetype(B,21),fill='#ffd98a'); d.text((64,320),'No ads · Works offline',font=ImageFont.truetype(B,30),fill='#bdb6cc')
for k,(i,box) in enumerate([(1,(20,520,804,1340)),(3,(20,560,804,1400)),(4,(60,520,764,1300))]):
  c=Image.open(f'/tmp/ss2/{i}.png').convert('RGB').crop(box); c.thumbnail((160,180)); m=Image.new('L',c.size,0); ImageDraw.Draw(m).rounded_rectangle([0,0,*c.size],28,fill=255)
  fg.paste(c,(540+k*158,110+(k%2)*120),m)
fg.save('play-upload/v2/feature-graphic-1024x500.png')
