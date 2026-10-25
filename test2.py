import asyncio, math
from playwright.async_api import async_playwright
URL='http://localhost:8766/fidget/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':915},device_scale_factor=2,is_mobile=True,has_touch=True)
    errs=[];bad=[]
    pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('response',lambda r: r.status>=400 and bad.append((r.status,r.url)))
    m=pg.mouse
    await pg.goto(URL+'?toy=pop&devunlock',wait_until='load'); await pg.wait_for_timeout(500)
    async def eq(t,id): await pg.evaluate(f"__fidget.fx.equip('{t}',{repr(id) if id else 'null'})"); await pg.wait_for_timeout(150)
    async def popr(name):
      await m.move(70,330); await m.down()
      for i in range(40): await m.move(70+i*7,330+i*5); await pg.wait_for_timeout(12)
      await pg.wait_for_timeout(60); await pg.screenshot(path=f'preview/{name}.png'); await m.up()
    async def spin(name):
      await pg.evaluate("__fidget.select('spin')"); await pg.wait_for_timeout(300)
      cx,cy=206,430
      for k in range(2):
        await m.move(cx+120,cy); await m.down()
        for i in range(1,9): a=i*0.4; await m.move(cx+120*math.cos(a),cy+120*math.sin(a)); await pg.wait_for_timeout(8)
        await m.up()
      await pg.wait_for_timeout(450); await pg.screenshot(path=f'preview/{name}.png')
    async def click(name):
      await pg.evaluate("__fidget.select('click')"); await pg.wait_for_timeout(300)
      for (x,y) in [(110,330),(206,430),(300,520),(206,330)]:
        await m.move(x,y); await m.down(); await pg.wait_for_timeout(70); await m.up(); await pg.wait_for_timeout(30)
      await m.move(110,430); await m.down(); await pg.wait_for_timeout(60); await pg.screenshot(path=f'preview/{name}.png'); await m.up()
    async def sand(name):
      await pg.evaluate("__fidget.select('sand')"); await pg.wait_for_timeout(300)
      await m.move(110,320); await m.down()
      for i in range(16): await m.move(110+i*12,320+i*13); await pg.wait_for_timeout(14)
      await m.up(); await m.move(300,330); await m.down()
      for i in range(12): await m.move(300-i*10,330+i*16); await pg.wait_for_timeout(14)
      await pg.screenshot(path=f'preview/{name}.png'); await m.up()
    await pg.evaluate("__fidget.select('pop')"); await pg.wait_for_timeout(300)
    await popr('p1-premium-pop-confetti')
    await spin('p2-premium-spin-sparks')
    await click('p3-premium-click-rgb')
    await eq('sand','premium_rainbow'); await sand('p4-premium-sand-rainbow')
    for t,ids in [('pop',['pop_pack_liquidmetal','pop_pack_neonjelly','pop_pack_lava']),('spin',['spin_plasma','spin_obsidian','spin_aurora']),('click',['click_crystal','click_holo','click_walnut']),('sand',['sand_galaxy','sand_glowtide','sand_goldrush'])]:
      for id in ids:
        await eq(t,id)
        if t=='pop': await pg.evaluate("__fidget.select('pop')"); await pg.wait_for_timeout(250); await popr('u-'+id)
        elif t=='spin': await pg.evaluate("__fidget.select('pop')"); await spin('u-'+id)
        elif t=='click': await pg.evaluate("__fidget.select('pop')"); await click('u-'+id)
        else: await pg.evaluate("__fidget.select('pop')"); await sand('u-'+id)
    fps=await pg.evaluate("""()=>new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2)}requestAnimationFrame(f)})""")
    print('fps unthrottled',fps)
    for t in ['pop','spin','click','sand']:
      await pg.evaluate(f"__fidget.shop.open('{t}')"); await pg.wait_for_timeout(500)
      if t=='pop': await pg.screenshot(path='preview/s0-shop-top.png')
      await pg.evaluate("document.querySelector('.tabs').scrollIntoView()"); await pg.wait_for_timeout(300); await pg.screenshot(path=f'preview/s-shop-{t}.png')
      await pg.evaluate("__fidget.shop.close()")
    await pg.click('#lbBtn'); await pg.wait_for_timeout(500); await pg.screenshot(path='preview/l-leaderboard.png')
    await pg.fill('#nickIn','shithead'); await pg.click('#nickSave'); await pg.wait_for_timeout(100); print('filter msg:', await pg.inner_text('#boardBody .note'))
    await pg.click('[data-close]>>nth=1'); 
    await pg.click('#setBtn'); await pg.wait_for_timeout(200); await pg.screenshot(path='preview/p5-settings-premium.png')
    # free web, no devunlock: shop shows Android note
    pg2=await b.new_page(viewport={'width':412,'height':915},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg2.on('pageerror',lambda e: errs.append(str(e)))
    await pg2.goto(URL+'?toy=pop',wait_until='load'); await pg2.wait_for_timeout(400); await pg2.click('#shopBtn'); await pg2.wait_for_timeout(500)
    await pg2.screenshot(path='preview/s1-shop-free-web.png'); print('web note:', await pg2.inner_text('#shopBody .note'))
    print('errors',errs); print('bad',bad)
    await b.close()
asyncio.run(main())
