# Pinch interrupted by touchcancel (system gesture / incoming call) must release the sand and keep mass.
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':412,'height':915},is_mobile=True,has_touch=True)
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.goto('http://localhost:8766/fidget/?toy=sand'); await pg.wait_for_timeout(900); cdp=await ctx.new_cdp_session(pg)
    async def T(t,pts): await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in pts]})
    mass="(()=>{const G=__fidget.toy.grid;let s=0;for(const v of G.h)s+=v;for(const L of __fidget.toy.goo.lumps)s+=L.m;return s})()"
    m0=await pg.evaluate(mass); A,B=(180,470),(232,470)
    await T('touchStart',[(1,A)]); await T('touchStart',[(1,A),(2,B)]); await pg.wait_for_timeout(250)
    for i in range(8): await T('touchMove',[(1,(A[0],A[1]-i*15)),(2,(B[0],B[1]-i*15))]); await pg.wait_for_timeout(20)
    pin1=await pg.evaluate("!!__fidget.toy.pin")
    await T('touchCancel',[]); await pg.wait_for_timeout(1500)
    pin2=await pg.evaluate("!!__fidget.toy.pin"); m1=await pg.evaluate(mass)
    # next single tap must work normally
    await T('touchStart',[(1,(200,400))]); await T('touchEnd',[]); await pg.wait_for_timeout(200)
    print('pinned',pin1,'after cancel',pin2,'mass',round(m0,1),round(m1,1),'errs',errs)
    F=[]
    if pin2: F.append('stuck pin after cancel')
    if abs(m1-m0)>m0*0.02: F.append('mass changed')
    if errs: F.append(errs)
    print('FAILS',F); await b.close()
asyncio.run(main())
