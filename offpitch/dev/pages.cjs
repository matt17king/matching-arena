// node dev/pages.cjs <out-prefix> <w> <h> <query> <selector[+offset]> ...   screenshots at each stop
const { chromium } = require('playwright');
(async () => {
  const [out, w, h, query, ...stops] = process.argv.slice(2);
  const gl = !query.includes('nogl');
  const b = await chromium.launch({ args: gl ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 600, hasTouch: +w < 600 });
  p.on('pageerror', e => console.log('[pageerror]', (e.stack || e.message).slice(0, 900)));
  p.on('console', m => { if (m.type() === 'error') console.log('[error]', m.text().slice(0, 500)); });
  await p.goto('http://localhost:5199/?' + query, { waitUntil: 'load' }); await p.waitForTimeout(gl ? 16000 : 2500);
  for (let i = 0; i < stops.length; i++) {
    const [sel, off, act] = stops[i].split('+');
    await p.evaluate(([sel, off]) => { const r = document.querySelector(sel).getBoundingClientRect(); scrollTo(0, r.top + scrollY + (+off || 0)); }, [sel, off]);
    if (act) { await p.click(act).catch(e => console.log('click failed', act)); }
    await p.waitForTimeout(gl ? 7000 : 2600); await p.screenshot({ path: `${out}_${i}.jpg`, quality: 86, type: 'jpeg', timeout: 150000 });
  }
  await b.close();
})();
