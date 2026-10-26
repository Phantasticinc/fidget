# modulepreload block in index.html must match the live import graph (else bumps would double-download), and no module path loads twice.
import subprocess,re,shutil
from playwright.sync_api import sync_playwright
F=[]
h=open('index.html').read()
shutil.copy('index.html','/tmp/_idx');subprocess.run(['python3','tools_modgraph.py','--write'],check=True)
if open('index.html').read()!=h:F.append('stale preload block: run python3 tools_modgraph.py --write');shutil.copy('/tmp/_idx','index.html')
with sync_playwright() as p:
  b=p.chromium.launch();c=b.new_context(service_workers='block');pg=c.new_page();R=[]
  pg.on('request',lambda r:R.append(r.url.split('/fidget/')[1]) if '/js/' in r.url else None)
  pg.goto('http://localhost:8766/fidget/');pg.wait_for_timeout(2500)
  paths=[u.split('?')[0] for u in R];d=sorted({x for x in paths if paths.count(x)>1})
  if d:F.append('dup '+str(d))
print('FAILS',F)
