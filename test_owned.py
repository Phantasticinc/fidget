# Buying something Play says you already own -> restore and unlock instead of "Purchase not completed".
import asyncio
from playwright.async_api import async_playwright
STUB="""window.__list=[];window.getDigitalGoodsService=async()=>({getDetails:async ids=>ids.map(i=>({itemId:i,price:{currency:'USD',value:'2.99'}})),listPurchases:async()=>window.__list,acknowledge:async()=>{}});
window.PaymentRequest=class{show(){window.__list=[{itemId:'premium_unlock',purchaseToken:'x',acknowledged:true}];return Promise.reject(new DOMException('already owned','InvalidStateError'))}};"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    await pg.add_init_script(STUB); await pg.goto('http://localhost:8766/fidget/'); await pg.wait_for_timeout(1500)
    await pg.evaluate("import('./js/ui/shop.js?v=10').then(m=>m.open&&m.open())"); await pg.wait_for_timeout(500)
    btn=pg.locator('#shopBody button.buy').first; await btn.click(); await pg.wait_for_timeout(800)
    toast=await pg.evaluate("[...document.querySelectorAll('[id*=toast],.toast')].map(e=>e.textContent).join('|')")
    prem=await pg.evaluate("import('./js/store/ent.js?v=8').then(m=>m.premium())")
    print('toast',toast,'premium',prem,errs); print('FAILS',[] if prem and 'Already' in toast and not errs else ['owned'])
    await b.close()
asyncio.run(main())
