from playwright.sync_api import sync_playwright
F=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':412,'height':915})
  pg.clock.install();pg.goto('http://localhost:8766/fidget/');pg.clock.run_for(1500)
  pg.click('#craveBtn');pg.clock.run_for(181000)
  t=pg.text_content('#craveBtn');print(t)
  if 'rode' not in t:F.append('done')
  pg.clock.run_for(2000);pg.click('#craveBtn');pg.clock.run_for(5000)
  t=pg.text_content('#craveBtn');al=pg.get_attribute('#craveBtn','aria-label');print(t,'|',al)
  if t!='Fidget while it passes':F.append('restart-label')
  if not al.startswith(t):F.append('label-in-name')
  pg.click('#craveStop');t=pg.text_content('#craveBtn');al=pg.get_attribute('#craveBtn','aria-label')
  if t!='Ride it out · 3:00' or 'craving timer' not in al:F.append('idle')
print('FAILS',F)
