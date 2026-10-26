import asyncio
from playwright.async_api import async_playwright
STUB="""localStorage.setItem('fidget.twa','1');window.__ack=[];window.__list=[{itemId:'premium',purchaseToken:'t1',acknowledged:false}];
window.getDigitalGoodsService=async()=>({getDetails:async ids=>ids.map(i=>({itemId:i,price:{currency:'USD',value:'0.99'}})),
listPurchases:async()=>window.__list,acknowledge:async(t)=>window.__ack.push(t)});"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.add_init_script(STUB); await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(2500)
    ack=await pg.evaluate("window.__ack"); own=await pg.evaluate("localStorage.getItem('fidget.ent')")
    print('ack',ack,'owned',own)
    F=[]; 
    if ack!=['t1']: F.append('ack')
    if 'premium' not in (own or ''): F.append('own')
    if errs: F.append(errs)
    print('FAILS',F); await b.close()
asyncio.run(main())
