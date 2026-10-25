# Moderation tests: (A) SQL behaviour on a throwaway local Postgres (Supabase stubs), (B) client filters,
# (C) Report button in online mode against a mocked Supabase, (D) admin.html against a mocked Supabase.
import asyncio, json, subprocess, os
from playwright.async_api import async_playwright
U='http://localhost:8766/fidget/'; PG=['psql','-h','/tmp','-p','55432','-U','postgres','-v','ON_ERROR_STOP=1','-qtA']
fails=[]
def sql(q, db='modtest'):
  r=subprocess.run(PG+['-d',db,'-c',q],capture_output=True,text=True); return r.returncode, (r.stdout.strip() or r.stderr.strip())
def test_sql():
  if subprocess.run(PG+['-d','postgres','-c','select 1'],capture_output=True).returncode: print('SKIP sql: no local postgres on :55432'); return
  sql('drop database if exists modtest','postgres'); sql('create database modtest','postgres')
  for f in ['backend/test_supabase_stub.sql','backend/supabase.sql']:
    r=subprocess.run(PG+['-d','modtest','-f',f],capture_output=True,text=True)
    if r.returncode: fails.append('load '+f+r.stderr[-300:]); return
  W="to_char(now() at time zone 'utc','IYYY-\"W\"IW')"
  A="set role anon;"
  for d,n,m in [('aaaaaaaa-1111','BadGuy01','gg'),('bbbbbbbb-2222','CalmOtter1',None),('cccccccc-3333','SwiftFox22',None),('dddddddd-4444','ZippyOwl33',None)]:
    c,o=sql(A+f"select submit_score('{d}','{n}','streak',{W},50,{('%r'%m) if m else 'null'})"); 
    if c: fails.append('submit '+n+o)
  for bad,why in [("'eeeeeeee-5','Admin_1'",'reserved'),("'eeeeeeee-5','Sh1tHead'",'profanity'),("'eeeeeeee-5','5551234567'",'phone')]:
    c,o=sql(A+f"select submit_score({bad},'streak',{W},5,null)"); 
    if not c or 'nickname' not in o: fails.append('nick not rejected '+why+o)
  for m in ['visit x.com','dm me','@handle','call 555 123 4567','me at gmail dot com','sh1t']:
    c,o=sql(A+f"select submit_score('ffffffff-6','NiceName','streak',{W},5,'{m}')")
    if not c or 'message' not in o: fails.append('msg not rejected '+m)
  c,o=sql(A+"select count(*) from scores"); 
  if not c: fails.append('anon can read scores table')
  c,o=sql(A+"select report_entry('bbbbbbbb-2222','aaaaaaaa','streak','message')"); print('report1',o)
  c,o=sql(A+"select report_entry('bbbbbbbb-2222','aaaaaaaa','streak','message')"); 
  if o!='duplicate': fails.append('dup report '+o)
  c,o=sql(A+"select report_entry('aaaaaaaa-1111','aaaaaaaa','streak',null)")
  if not c: fails.append('self report allowed')
  sql(A+"select report_entry('cccccccc-3333','aaaaaaaa','streak',null)")
  c,o=sql(A+"select count(*) from lb_week where device='aaaaaaaa'")
  if o!='1': fails.append('hidden after 2 reports '+o)
  sql(A+"select report_entry('dddddddd-4444','aaaaaaaa','streak',null)")
  c,o=sql(A+"select count(*) from lb_week where device='aaaaaaaa'")
  if o!='0': fails.append('not auto-hidden after 3 '+o)
  c,o=sql(A+"select count(*) from lb_all where nick='BadGuy01'")
  if o!='0': fails.append('lb_all not hidden '+o)
  c,o=sql(A+"select full_device from lb_all"); 
  if not c: fails.append('anon sees full device id')
  c,o=sql(A+"select * from admin_queue()"); 
  if not c: fails.append('anon ran admin_queue')
  U1='11111111-1111-1111-1111-111111111111'
  c,o=sql(f"set test.uid='{U1}'; set role authenticated; select admin_act('aaaaaaaa-1111','streak','approve')")
  if not c or 'not admin' not in o: fails.append('non-admin acted '+o)
  sql(f"insert into admins values ('{U1}')")
  AU=f"set test.uid='{U1}'; set role authenticated;"
  c,o=sql(AU+"select nick||':'||reports||':'||state from admin_queue()"); print('queue',o)
  if o!='BadGuy01:3:hidden': fails.append('queue '+o)
  c,o=sql(AU+"select count(*) from reports"); 
  if o!='3': fails.append('admin RLS read '+o)
  sql(AU+"select admin_act('aaaaaaaa-1111','streak','approve')")
  c,o=sql(A+"select count(*) from lb_week where device='aaaaaaaa'")
  if o!='1': fails.append('approve did not restore '+o)
  c,o=sql(AU+"select count(*) from admin_queue()")
  if o!='0': fails.append('queue not cleared '+o)
  sql(AU+"select admin_act('aaaaaaaa-1111','streak','ban_nick')")
  c,o=sql(A+f"select submit_score('zzzzzzzz-9','BadGuy01','rpm',{W},50,null)")
  if not c or 'banned' not in o: fails.append('banned nick submitted '+o)
  sql(AU+"select admin_act('aaaaaaaa-1111','streak','ban_device')")
  c,o=sql(A+f"select submit_score('aaaaaaaa-1111','NewName9','rpm',{W},50,null)")
  if not c or 'banned' not in o: fails.append('banned device submitted '+o)
  sql(AU+"select admin_act('aaaaaaaa-1111','streak','delete')")
  c,o=sql("select count(*) from scores where device='aaaaaaaa-1111'")
  if o!='0': fails.append('delete '+o)
  print('sql done')
CFG="export const LB = { url: 'https://mock.supabase.co', anonKey: 'anon-test' };"
ROWS=[{'nick':'CalmOtter1','value':120,'msg':'Come get me!','device':'bbbbbbbb'},{'nick':'SwiftFox22','value':80,'msg':'','device':'cccccccc'}]
async def mock(ctx, log):
  await ctx.route('**/js/lb/config.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=CFG))
  async def sb(route):
    u=route.request.url; b=route.request.post_data; log.append((u.split('.co')[1], b))
    if '/rpc/report_entry' in u: return await route.fulfill(status=200, content_type='application/json', body='"ok"')
    if '/rpc/submit_score' in u: return await route.fulfill(status=204, body='')
    if '/rest/v1/lb_' in u: return await route.fulfill(status=200, content_type='application/json', body=json.dumps(ROWS))
    if '/auth/v1/token' in u: return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'access_token':'jwt','user':{'email':'info@phantasticvanguard.com'}}))
    if '/rpc/admin_queue' in u: return await route.fulfill(status=200, content_type='application/json', body=json.dumps([{'device':'aaaaaaaa-1111','metric':'streak','nick':'BadGuy01','msg':'gg ez noobs','value':50,'reports':3,'reasons':['message'],'first_at':'2026-10-25T21:00:00Z','state':'hidden','banned':False}]))
    if '/rpc/admin_act' in u: return await route.fulfill(status=200, content_type='application/json', body='"ok"')
    await route.fulfill(status=404, body='')
  await ctx.route('https://mock.supabase.co/**', sb)
async def browser():
  async with async_playwright() as p:
    b=await p.chromium.launch(); errs=[]
    ctx=await b.new_context(viewport={'width':412,'height':915},device_scale_factor=2, service_workers='block'); log=[]; await mock(ctx, log)
    pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d: asyncio.ensure_future(d.accept()))
    await pg.goto(U); await pg.wait_for_timeout(1200)
    r=await pg.evaluate("""async()=>{const m=await import('./js/lb/msg.js'),n=await import('./js/lb/nick.js');
      return {m:['visit x.com','dm me','@bob','555 123 4567','a@b.co','sh1t','Come get me!'].map(x=>m.check(x)),
              n:['Admin','mod','Mod7','huy','Fidget_Pro','Sh1tHead','5551234567','CalmOtter42','Modern1','Devon','Here'].map(x=>n.check(x)), rules:m.RULES}}""")
    print(r)
    if any(x is None for x in r['m'][:6]) or r['m'][6] is not None: fails.append('client msg '+str(r['m']))
    exp=[False,False,False,False,False,False,False,True,True,True,False]
    if [x is None for x in r['n']]!=exp: fails.append('client nick '+str(r['n']))
    await pg.click('#lbBtn'); await pg.wait_for_timeout(1200)
    n=await pg.locator('#boardBody .rep').count(); print('report buttons',n)
    if n!=2: fails.append('report buttons %d'%n)
    await pg.screenshot(path='preview/moderation/1-report-button.png')
    await pg.locator('#boardBody .rep').first.click(); await pg.wait_for_timeout(300)
    await pg.screenshot(path='preview/moderation/2-reported.png'); await pg.wait_for_timeout(900)
    t=await pg.locator('#boardBody .rep[data-dev="bbbbbbbb"]').inner_text(); print('after',t)
    calls=[x for x in log if 'report_entry' in x[0]]; print(calls)
    if len(calls)!=1 or json.loads(calls[0][1])['p_device']!='bbbbbbbb': fails.append('report call')
    if await pg.locator('.lb-msg').count(): fails.append('reported message still shown')
    if 'Reported' not in t: fails.append('label '+t)
    if await pg.locator('#boardBody .rep[data-dev="bbbbbbbb"]').is_enabled(): fails.append('second report allowed')
    # celebration rules line
    await pg.click('#board [data-close]'); await pg.evaluate("window.__fidget.record.fake('streak',120,80)"); await pg.wait_for_timeout(3200)
    rl=await pg.inner_text('#cbRules'); print('rules',rl)
    if 'no links' not in rl: fails.append('rules line')
    await pg.screenshot(path='preview/moderation/3-message-rules.png')
    # local mode: no report buttons
    c2=await b.new_context(viewport={'width':412,'height':915}, service_workers='block'); q=await c2.new_page(); await q.goto(U); await q.wait_for_timeout(1000)
    await q.click('#lbBtn'); await q.wait_for_timeout(800)
    if await q.locator('#boardBody .rep').count(): fails.append('report shown in local mode')
    # admin
    a=await ctx.new_page(); a.on('pageerror',lambda e:errs.append(str(e))); await a.goto(U+'admin.html'); await a.wait_for_timeout(500)
    if not await a.is_visible('#login'): fails.append('admin login hidden')
    await a.fill('#em','info@phantasticvanguard.com'); await a.fill('#pw','x'); await a.click('#go'); await a.wait_for_timeout(800)
    if await a.locator('#list .card').count()!=1: fails.append('admin list')
    await a.screenshot(path='preview/moderation/4-admin.png', full_page=True)
    await a.click('#list [data-act="approve"]'); await a.wait_for_timeout(500)
    acts=[json.loads(x[1]) for x in log if 'admin_act' in x[0]]; print(acts)
    if not acts or acts[0]['p_action']!='approve': fails.append('admin act')
    ix=await (await ctx.request.get(U)).text()
    if 'admin.html' in ix: fails.append('admin linked from app')
    fails.extend(errs); await b.close()
test_sql(); asyncio.run(browser()); print('FAILS',fails)
