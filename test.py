import asyncio, time, math
from playwright.async_api import async_playwright
URL='http://localhost:8766/fidget/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':412,'height':915},device_scale_factor=2,is_mobile=True,has_touch=True)
    errs=[];bad=[];size=[0]
    pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.on('pageerror',lambda e: errs.append(str(e)))
    async def resp(r):
      if r.status>=400: bad.append((r.status,r.url))
    pg.on('response',resp)
    cdp=await pg.context.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
    await cdp.send('Network.enable')
    cdp.on('Network.loadingFinished',lambda e: size.__setitem__(0,size[0]+e['encodedDataLength']))
    t=time.time(); await pg.goto(URL+'?toy=pop',wait_until='load'); await pg.wait_for_timeout(300); print('load s',round(time.time()-t,2))
    fps=await pg.evaluate("""()=>new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2)}requestAnimationFrame(f)})""")
    print('fps(4x throttle, swiftshader)',fps)
    print('early',errs,bad)
    m=pg.mouse
    # POP: roll finger across bubbles
    await m.move(90,380); await m.down()
    for i in range(30): await m.move(90+i*8,380+i*3); await pg.wait_for_timeout(15)
    await m.up(); await m.move(200,520); await m.down(); await pg.wait_for_timeout(30)
    await pg.screenshot(path='preview/1-pop.png'); await m.up()
    # SPIN
    await pg.evaluate("__fidget.select('spin')"); await pg.wait_for_timeout(300)
    cx,cy=206,430; await m.move(cx+120,cy); await m.down()
    for i in range(1,8): a=i*0.35; await m.move(cx+120*math.cos(a),cy+120*math.sin(a)); await pg.wait_for_timeout(8)
    await m.up(); await pg.wait_for_timeout(500); await pg.screenshot(path='preview/2-spin.png')
    # CLICK
    await pg.evaluate("__fidget.select('click')"); await pg.wait_for_timeout(300)
    await m.move(206,430); await m.down(); await pg.wait_for_timeout(120); await pg.screenshot(path='preview/3-click.png'); await m.up()
    # SAND: slice, then pinch-crumble, then press
    await pg.evaluate("__fidget.select('sand')"); await pg.wait_for_timeout(300)
    await m.move(120,330); await m.down()
    for i in range(14): await m.move(120+i*12,330+i*14); await pg.wait_for_timeout(16)
    await pg.screenshot(path='preview/4-sand-slice.png'); await m.up()
    await m.move(290,520); await m.down()
    for i in range(10): await m.move(290-i*10,520-i*4); await pg.wait_for_timeout(16)
    await m.up(); await m.move(260,400); await m.down(); await pg.wait_for_timeout(600); await m.up()
    await pg.wait_for_timeout(700); await pg.screenshot(path='preview/4b-sand-crumble.png')
    ev="(t,id,x,y)=>document.getElementById('stage').dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true,pointerType:'touch'}))"
    await pg.evaluate(f"(({ev})('pointerdown',11,150,450),({ev})('pointerdown',12,260,450))")
    for i in range(14):
      await pg.evaluate(f"(({ev})('pointermove',11,{150+i*4},450),({ev})('pointermove',12,{260-i*4},450))"); await pg.wait_for_timeout(16)
    await pg.screenshot(path='preview/4c-sand-pinch.png')
    await pg.evaluate(f"(({ev})('pointerup',11,200,450),({ev})('pointerup',12,210,450))")
    fps2=await pg.evaluate("""()=>new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2)}requestAnimationFrame(f)})""")
    print('sand fps',fps2)
    # craving + settings
    await pg.click('#craveBtn'); await pg.wait_for_timeout(1500); await pg.screenshot(path='preview/5-crave.png')
    await pg.click('#setBtn'); await pg.wait_for_timeout(200); await pg.screenshot(path='preview/6-settings.png')
    print('errors',errs); print('bad',bad); print('transferred KB',round(size[0]/1024,1))
    await b.close()
asyncio.run(main())
