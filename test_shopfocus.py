from playwright.sync_api import sync_playwright
F=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':412,'height':915})
  pg.goto('http://localhost:8766/fidget/?devunlock');pg.wait_for_timeout(1500)
  pg.click('#shopBtn');pg.wait_for_timeout(600)
  pg.focus('#shopBody .tabs [data-tab="spin"]');pg.keyboard.press('Enter');pg.wait_for_timeout(300)
  if pg.evaluate("document.activeElement.dataset.tab")!='spin':F.append('tabfocus')
  if pg.get_attribute('#shopBody .tabs [data-tab="spin"]','aria-pressed')!='true':F.append('pressed')
  ids=pg.eval_on_selector_all('#shopBody .item','e=>e.map(x=>x.dataset.id)');print(ids)
  tid=ids[-1];pg.focus(f'.item[data-id="{tid}"] button');pg.keyboard.press('Enter');pg.wait_for_timeout(300)
  if pg.evaluate("(document.activeElement.closest('.item')||{}).dataset?.id")!=tid:F.append('itemfocus')
  pg.keyboard.press('Escape');pg.wait_for_timeout(300)
  pg.click('#dock [data-toy="click"]');pg.wait_for_timeout(800)
  if pg.get_attribute('#dock [data-toy="click"]','aria-pressed')!='true' or pg.get_attribute('#dock [data-toy="pop"]','aria-pressed')!='false':F.append('dock')
  pg.click('#setBtn');pg.wait_for_timeout(300)
  ch=pg.locator('#themes .chip');print(ch.count())
  if ch.count()>1:
    ch.nth(1).focus();pg.keyboard.press('Enter');pg.wait_for_timeout(200)
    if pg.evaluate("document.activeElement.getAttribute('aria-pressed')")!='true':F.append('theme')
print('FAILS',F)
