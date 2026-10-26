# SW upgrade where one asset fails to download: the old cached copy is carried into the new cache, so offline still boots.
import re, shutil, subprocess, time, os
from playwright.sync_api import sync_playwright
R='/tmp/swcarry'; shutil.rmtree(R, ignore_errors=True); shutil.copytree('/workspace/fidget-fresh', R+'/fidget', ignore=shutil.ignore_patterns('.git','preview','*.py','*.md'))
srv=subprocess.Popen(['python3','-m','http.server','8777','--directory',R],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U='http://localhost:8777/fidget/'; F=[]
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(viewport={'width':412,'height':915}); pg=c.new_page()
    pg.goto(U); pg.wait_for_timeout(2500); pg.reload(); pg.wait_for_timeout(1500)
    sw=open(R+'/fidget/sw.js').read(); open(R+'/fidget/sw.js','w').write(re.sub(r"fidget-v\d+",'fidget-vTEST',sw,count=1))
    os.remove(R+'/fidget/js/feel.js')
    pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update())"); pg.wait_for_timeout(4000)
    keys=pg.evaluate("caches.keys()")
    if keys!=['fidget-vTEST']: F.append(('keys',keys))
    if not pg.evaluate("caches.open('fidget-vTEST').then(c=>c.keys()).then(k=>k.some(r=>r.url.includes('js/feel.js')))"): F.append('feel.js not carried')
    c.set_offline(True); E=[]; pg.on('pageerror',lambda e:E.append(str(e)))
    pg.reload(); pg.wait_for_timeout(3000)
    if not pg.evaluate("document.querySelector('#stage').width>0 && !!document.querySelector('#dock [aria-pressed=true]')"): F.append('offline boot')
    if E: F.append(E)
finally: srv.kill()
print('FAILS',F)
