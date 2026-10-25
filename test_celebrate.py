# Record celebration (normal + Calm), victory message filter + post, leaderboard with messages (mocked online board), report hides.
import asyncio, json, sys
from playwright.async_api import async_playwright
from PIL import Image
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/fidget/'
O = 'preview/celebrate/'
ROWS = [{'nick': 'ZippyOtter42', 'device': 'aaaaaaaa', 'metric': 'streak', 'value': 410, 'msg': 'Come get me!'},
        {'nick': 'CosmicFox17', 'device': 'bbbbbbbb', 'metric': 'streak', 'value': 388, 'msg': 'Bubble wrap legend'},
        {'nick': 'MellowLynx', 'device': 'cccccccc', 'metric': 'streak', 'value': 301, 'msg': 'gg, practice pays off'},
        {'nick': 'LuckyOwl88', 'device': 'dddddddd', 'metric': 'streak', 'value': 250, 'msg': None}]
async def main():
  fails = []
  async with async_playwright() as p:
    b = await p.chromium.launch()
    ctx = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(700)
    await pg.evaluate("__fidget.record.fake('streak', 152, 97)"); await pg.wait_for_timeout(500); await pg.screenshot(path=O + '1-fireworks.png')
    await pg.wait_for_timeout(1300); await pg.screenshot(path=O + '2-trophy-rank.png')
    await pg.wait_for_timeout(1200); await pg.screenshot(path=O + '3-message.png')
    for bad, want in [('visit www.spam.com', 'link'), ('add me on snap', 'contact'), ('call 555 123 4567', 'contact'), ('you are a b1tch', 'friendly'), ('a' * 41, None)]:
      await pg.fill('#cbIn', bad); await pg.click('#cbSave'); e = await pg.text_content('#cbErr'); v = await pg.input_value('#cbIn')
      print('filter', repr(bad[:20]), '->', e, len(v))
      if want and want not in e.lower(): fails.append('filter ' + bad)
      if len(v) > 40: fails.append('maxlength')
    await pg.click('#cbChips .chip >> nth=2'); await pg.click('#cbSave'); await pg.wait_for_timeout(900)
    if not await pg.evaluate("document.getElementById('celeb').hidden"): fails.append('not closed after post')
    print('mine', await pg.evaluate("localStorage.getItem('fidget.msgs')"))
    await pg.click('#lbBtn'); await pg.wait_for_timeout(500); await pg.screenshot(path=O + '4-board-local.png')
    # calm
    await pg.evaluate("document.querySelector('#board').hidden=true;(()=>{const c=document.getElementById('optCalm');c.checked=true;c.dispatchEvent(new Event('change'))})()")
    await pg.evaluate("__fidget.record.fake('rpm', 512, 401)"); await pg.wait_for_timeout(2200); await pg.screenshot(path=O + '5-calm.png')
    print('errors', errs); fails += errs
    # mocked online board with other players' messages
    c2 = await b.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
    await c2.route('**/js/lb/config.js*', lambda r: r.fulfill(content_type='text/javascript', body="export const LB = { url: 'https://example.supabase.co', anonKey: 'test' };"))
    await c2.route('https://example.supabase.co/**', lambda r: r.fulfill(content_type='application/json', body=json.dumps(ROWS) if 'lb_' in r.request.url else ''))
    p2 = await c2.new_page(); e2 = []; p2.on('pageerror', lambda e: e2.append(str(e)))
    await p2.goto(URL); await p2.wait_for_timeout(700)
    await p2.evaluate("localStorage.setItem('fidget.toy','pop')")
    await p2.evaluate("__fidget.record.fake('streak', 420, 300)"); await p2.wait_for_timeout(2600); await p2.screenshot(path=O + '6-online-rank1.png')
    print('title online', await p2.text_content('#cbTitle'), '|', await p2.text_content('#cbRank'))
    await p2.click('#cbClose'); await p2.click('#lbBtn'); await p2.wait_for_timeout(600); await p2.screenshot(path=O + '7-board-messages.png')
    n0 = await p2.locator('.lb-msg').count(); p2.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    await p2.click('.lb-msg .rep >> nth=0'); await p2.wait_for_timeout(1500); n1 = await p2.locator('.lb-msg').count()
    print('messages', n0, '-> after report', n1); await p2.screenshot(path=O + '8-after-report.png')
    if n1 != n0 - 1: fails.append('report did not hide')
    fails += e2
    ims = [Image.open(O + f) for f in ['2-trophy-rank.png', '3-message.png', '5-calm.png', '7-board-messages.png']]
    W = sum(i.width for i in ims); comp = Image.new('RGB', (W, ims[0].height)); x = 0
    for i in ims: comp.paste(i, (x, 0)); x += i.width
    comp.save('preview/celebration.png')
  print('FAILS', fails)
asyncio.run(main())
