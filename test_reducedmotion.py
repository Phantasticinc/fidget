# Calm mode defaults on under prefers-reduced-motion; an explicit user choice wins.
from playwright.sync_api import sync_playwright
F=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for rm,exp in [('reduce',True),('no-preference',False)]:
    pg=b.new_context(viewport={'width':412,'height':915},reduced_motion=rm).new_page();E=[];pg.on('pageerror',lambda e:E.append(str(e)))
    pg.goto('http://localhost:8766/fidget/');pg.wait_for_timeout(1500)
    if pg.evaluate("[document.body.classList.contains('calm'),document.getElementById('optCalm').checked]")!=[exp,exp]: F.append(('default',rm))
    pg.evaluate("document.getElementById('optCalm').click()");pg.reload();pg.wait_for_timeout(1200)
    if pg.evaluate("document.getElementById('optCalm').checked")!=(not exp): F.append(('override',rm))
    if E: F.append(E)
print('FAILS',F)
