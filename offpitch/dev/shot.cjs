// node dev/shot.cjs <url> <out.png> [w] [h] [wait ms] [scrollY]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = 1440, h = 900, wait = 2500, sy = 0] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text().slice(0, 900)); });
  p.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 900)));
  await p.goto(url, { waitUntil: 'load' });
  if (+sy) await p.evaluate(y => window.scrollTo(0, y), +sy);
  await p.waitForTimeout(+wait);
  await p.screenshot({ path: out, timeout: 120000 });
  await b.close();
})();
