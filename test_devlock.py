# ?devunlock must be ignored in the Play app (TWA): launch URL ?src=twa, android-app:// referrer, or Digital Goods API present.
import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'
async def chk(b,init,first,label):
  c=await b.new_context(); 
  if init: await c.add_init_script(init)
  pg=await c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
  await pg.goto(U+'?devunlock'); await pg.wait_for_timeout(300)
  if first: await pg.goto(U+first); await pg.wait_for_timeout(300); await pg.goto(U+'?devunlock')
  await pg.wait_for_timeout(1000); e=await pg.evaluate("import('./js/store/ent.js?v=9').then(m=>[m.isDev,m.premium(),m.inPlayApp])")
  await c.close(); print(label,e,errs); return e,errs
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); F=[]
    e,er=await chk(b,None,None,'web'); F+= [] if e==[True,True,False] else ['web dev should work']
    e,er=await chk(b,None,'?src=twa','twa launch'); F+= [] if e==[False,False,True] else ['twa src']
    e,er=await chk(b,"window.getDigitalGoodsService=async()=>({getDetails:async()=>[],listPurchases:async()=>[]})",None,'dgs'); F+= [] if e==[False,False,True] else ['dgs']
    e,er=await chk(b,"window.getDigitalGoodsService=async()=>{throw new DOMException('unsupported context','OperationError')}",None,'chrome-tab dgs rejects'); F+= [] if e==[True,True,False] else ['plain chrome devunlock']
    print('FAILS',F); await b.close()
asyncio.run(main())
