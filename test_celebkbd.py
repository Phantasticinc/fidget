# Enter posts the victory message and closes the celebration.
from playwright.sync_api import sync_playwright
F=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':412,'height':915})
  pg.goto('http://localhost:8766/fidget/');pg.wait_for_timeout(700)
  pg.evaluate("__fidget.record.fake('streak', 152, 97)");pg.wait_for_timeout(3200)
  pg.fill('#cbIn','gg');pg.press('#cbIn','Enter');pg.wait_for_timeout(200)
  if 'Posted' not in pg.text_content('#cbErr'):F.append('enter')
  pg.wait_for_timeout(900)
  if not pg.evaluate("document.getElementById('celeb').hidden"):F.append('close')
print('FAILS',F)
