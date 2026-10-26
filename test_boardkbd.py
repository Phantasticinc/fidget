from playwright.sync_api import sync_playwright
F=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':412,'height':915})
  pg.goto('http://localhost:8766/fidget/');pg.wait_for_timeout(1500);pg.click('#lbBtn');pg.wait_for_timeout(600)
  pg.fill('#nickIn','raccoon_99');pg.press('#nickIn','Enter');pg.wait_for_timeout(400)
  if pg.evaluate("localStorage.getItem('fidget.nick')")!='raccoon_99':F.append('enter')
  if 'Saved' not in pg.text_content('#boardBody .note'):F.append('savedmsg')
  pg.fill('#nickIn','x');pg.click('#nickSave');pg.wait_for_timeout(200)
  if 'Use 3' not in pg.text_content('#boardBody .note'):F.append('err')
  pg.click('.tabs [data-tab="all"]');pg.wait_for_timeout(400)
  if pg.evaluate("document.activeElement.dataset.tab")!='all':F.append('focus')
  if pg.get_attribute('.tabs [data-tab="all"]','aria-pressed')!='true' or pg.get_attribute('.tabs [data-tab="week"]','aria-pressed')!='false':F.append('pressed')
  if pg.locator('.lb-row').count()<1:F.append('rows')
print('FAILS',F)
