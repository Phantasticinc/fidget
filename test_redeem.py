import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); fails=[]
    pg=await b.new_page(viewport={'width':412,'height':915},device_scale_factor=2)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    prompts=[]; opened=[]
    async def dlg(d):
      prompts.append(d.default_value); await d.accept('abcd-1234 efgh')
    pg.on('dialog',lambda d: asyncio.ensure_future(dlg(d)))
    pg.context.on('page',lambda np: opened.append(np.url) or None)
    await pg.goto('http://localhost:8766/fidget/?redeem=promo42xy'); await pg.wait_for_timeout(1500)
    print('url after',pg.url, 'prompt default',prompts)
    if prompts!=['PROMO42XY']: fails.append('deeplink prefill')
    if 'redeem=' in pg.url: fails.append('url not cleaned')
    await pg.wait_for_timeout(1500)
    for q in pg.context.pages[1:]: opened.append(q.url)
    print('opened',opened)
    if 'localhost' not in pg.url: fails.append('app navigated away')
    if not any('code=ABCD1234EFGH' in u for u in opened): fails.append('open url')
    await pg.bring_to_front()
    await pg.click('#shopBtn'); await pg.wait_for_timeout(600)
    await pg.locator('#redeemShop').scroll_into_view_if_needed(); await pg.screenshot(path='preview/redeem-shop.png')
    await pg.click('#shop [data-close]'); await pg.click('#setBtn'); await pg.wait_for_timeout(300)
    await pg.screenshot(path='preview/redeem-settings.png')
    if not await pg.is_visible('#redeemSet'): fails.append('settings btn')
    print('errs',errs); fails+=errs; print('FAILS',fails); await b.close()
asyncio.run(main())
