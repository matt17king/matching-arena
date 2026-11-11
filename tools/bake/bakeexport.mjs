// usage: node bakeexport.mjs OUT.json venue quality
import { chromium } from 'playwright-core';
import fs from 'fs';
const [,, out, venue = 'football', quality = 'high'] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 640, height: 360 } }); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:4173/?start=walkout&debug=1&nodegrade=1&nobake=1&quality=${quality}`);
await pg.waitForFunction(() => !!window.__mkSeg && !!window.__mkBakeExport, null, { timeout: 300000 });
await pg.evaluate(() => window.__mkSeg('rights', 0.5)); await pg.waitForTimeout(6000);
const data = await pg.evaluate(v => JSON.stringify(window.__mkBakeExport(v)), venue);
fs.writeFileSync(out, data); const j = JSON.parse(data);
console.log('objects', j.length, 'meshes', j.filter(e => e.kind === 'mesh').length, 'keyed', j.filter(e => e.key).length, 'inst', j.filter(e => e.kind === 'inst').length, 'bytes', data.length);
const mats = {}; j.forEach(e => { mats[e.kind + ':' + e.mat] = (mats[e.kind + ':' + e.mat] || 0) + 1; }); console.log(JSON.stringify(mats));
await b.close();
