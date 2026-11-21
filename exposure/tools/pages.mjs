// Writes the reading pages (about, thinking and each idea, writing and each article, work, speaking, press) as plain HTML, from the words in src/content.js.
// They are real pages, not drawn by script, so search engines and AI crawlers read everything on them.
// Run with `node tools/pages.mjs` (the build does it first). Edit the words in src/content.js, src/writing.js and posts/, not in the pages.
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as C from '../src/content.js';
import * as W from '../src/writing.js';

const SITE = 'https://www.bymattking.com', root = fileURLToPath(new URL('..', import.meta.url));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0'), plain = s => s.replace(/<[^>]+>/g, '');
const PAGES = [['about', 'About'], ['thinking', 'The thinking'], ['writing', 'Writing'], ['work', 'The work'], ['speaking', 'Speaking'], ['press', 'Press']];
// The weekly writing: one file per article in posts/ (see posts/README.md), newest first
// Articles live at /writing/<slug>/. topic is Sport, Marketing or Culture; idea is optional.
const POSTS = (await Promise.all(readdirSync(`${root}posts`).filter(f => /^\d{4}-\d\d-\d\d-.+\.js$/.test(f)).sort().reverse()
  .map(async f => ({ file: f, ...(await import(pathToFileURL(`${root}posts/${f}`).href)).default })))).sort((a, b) => `${b.date} ${b.time || '00:00'}`.localeCompare(`${a.date} ${a.time || '00:00'}`) || b.file.localeCompare(a.file));
const TOPICS = ['Sport', 'Marketing', 'Culture'];
for (const w of POSTS) {
  if (!TOPICS.includes(w.topic)) throw new Error(`posts/${w.file}: topic must be one of ${TOPICS.join(', ')}`);
}
const ALL = W.IDEAS, ideaName = id => ALL.find(a => a.id === id).name;

// Structured data: tells search engines and AI tools, in their own language, who Matt is and what each page is.
const ME = `${SITE}/#matt`;
const day = (d, o = { day: 'numeric', month: 'long', year: 'numeric' }) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', o);
const person = () => ({ '@type': 'Person', '@id': ME, name: C.PERSON.name, url: `${SITE}/`, image: `${SITE}/photos/portrait.jpg`, description: C.DESCRIPTOR,
  jobTitle: C.PERSON.jobTitle, worksFor: { '@type': 'Organization', name: C.PERSON.employer[0], url: C.PERSON.employer[1] },
  alumniOf: { '@type': 'CollegeOrUniversity', name: C.PERSON.alumni }, workLocation: C.PERSON.based.map(name => ({ '@type': 'Place', name: `${name}, UK` })), knowsAbout: C.PERSON.knowsAbout, sameAs: [C.LINKEDIN, C.INSTAGRAM] });
// The companies on Matt's route, with their real logos, so search engines and AI tools don't guess (80 Four's is often confused).
const ORGS = [
  { '@type': 'Organization', '@id': `${SITE}/#80-four`, name: '80 Four', description: 'A sport, health and lifestyle marketing agency, co-founded in 2025 by Matt King, James Parker-Aiken and Emily Martin. Finalist, Circle Networks Start Up of the Year 2025.',
    logo: `${SITE}/logos/80-four.png`, image: `${SITE}/logos/80-four.png`, foundingDate: '2025', sameAs: ['https://www.linkedin.com/company/80four'], founder: [{ '@id': ME }, { '@type': 'Person', name: 'James Parker-Aiken' }, { '@type': 'Person', name: 'Emily Martin' }] },
];
const ld = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [...graph, ...ORGS] }).replace(/</g, '\\u003c')}</script>`;
const pageLd = (path, title, desc, extra = [], type) => ld([person(), { '@type': type || (path === 'about' ? 'ProfilePage' : 'WebPage'), '@id': `${SITE}/${path}/`, url: `${SITE}/${path}/`, name: title, description: desc,
  isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': ME }, ...(path === 'about' ? { mainEntity: { '@id': ME } } : {}) }, ...extra]);
const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}/${path ? path + '/' : ''}` })) });
export const SITE_LD = (title, desc, path = '') => ld([person(), { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'Matt King', publisher: { '@id': ME } },
  { '@type': 'WebPage', '@id': `${SITE}/${path}`, url: `${SITE}/${path}`, name: title, description: desc, isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': ME } }]);

const top = (h2, count, note) => `<header class="v-top mono" data-r="fade"><h2>${h2}</h2><span>${count || ''}</span><span>${note || ''}</span></header>`;
const lg = (name, file) => `<span class="lg" role="img" aria-label="${esc(name)}" style="-webkit-mask-image:url(../logos/${file});mask-image:url(../logos/${file})"></span>`;

const deepen = (s, n) => n < 2 ? s : s.replace(/(href|src|data-root)="\.\.\//g, `$1="${'../'.repeat(n)}`).replace(/url\(\.\.\//g, `url(${'../'.repeat(n)}`);
function shell({ id, path = id, crumb, title, desc, h1, lead, body, next, ldExtra, ldType, image, cls = '' }) {
  const url = `${SITE}/${path}/`, at = PAGES.findIndex(p => p[0] === id);
  const depth = path.split('/').length;
  return deepen(`<!DOCTYPE html>
<html lang="en" data-look="walnut" class="v2 pg${cls ? ' ' + cls : ''}" data-root="../">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f0a07">
<title>${esc(title)} | Matt King, sports marketing</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ldType === 'Article' ? 'article' : 'website'}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)} | Matt King">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="Matt King">
<meta property="og:image" content="${image ? `${SITE}/photos/${image}` : `${SITE}/og.jpg`}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="Matt King: writing" href="${SITE}/feed.xml">
${pageLd(path, title, desc, ldExtra, ldType === 'Article' ? 'WebPage' : ldType)}
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<!-- Written by tools/pages.mjs from src/content.js. Edit the words there, then run the build. -->
<canvas class="field" data-field aria-hidden="true"></canvas>
<div class="grain" data-grain aria-hidden="true"></div>
<svg class="defs" width="0" height="0" aria-hidden="true"><defs data-defs></defs></svg>

<header class="hd">
  <a class="hd-name" href="../" aria-label="Matt King — home">Matt King</a>
  <nav class="hd-label hd-nav mono" aria-label="Pages">${PAGES.map(([k, n]) => `<a href="../${k}/"${k === id ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav>
  <div class="hd-right">
    <a class="hd-cta hd-world" href="https://world.bymattking.com/">The world</a>
    <a class="hd-cta v-cta-red" href="../book/">Book Matt</a>
  </div>
  <div class="hd-bar" aria-hidden="true"><i data-bar></i></div>
</header>

<main>
<section class="pg-hero" data-theme="raven" data-blob=".28,.9,1,.12" data-energy=".8">
  <p class="mono pg-crumb" data-r="fade">${crumb || `<span><a href="../">Matt King</a> / ${esc(PAGES[at][1])}</span><span>${pad(at + 1)} / ${pad(PAGES.length)}</span>`}</p>
  <h1 class="pg-h1" data-r="smear" data-split data-smear="50" style="--d:.1s">${h1}</h1>
  <p class="pg-lead" data-r="fade" style="--d:.4s">${lead}</p>
</section>
%%BODY%%
<section class="pg-next" data-theme="poppy" data-blob=".5,.5,.5,.5" data-energy=".9">
  <p class="mono" data-r="fade">Next</p>
  <a class="pg-next-a" href="../${next[0]}/" data-r="fade"><span>${next[1]}</span><i aria-hidden="true">→</i></a>
  <div class="pg-next-foot" data-r="fade">
    <a class="btn" href="../book/"><span>Book Matt</span><i aria-hidden="true">→</i></a>
    <nav class="pg-all" aria-label="All pages"><a href="../">Home</a>${PAGES.map(([k, n]) => `<a href="../${k}/">${n}</a>`).join('')}<a href="https://world.bymattking.com/">The virtual world</a></nav>
    <p class="pg-contact"><a href="mailto:${C.EMAIL}">${C.EMAIL}</a><a href="${C.LINKEDIN}" rel="noopener">LinkedIn ↗</a><a href="${C.INSTAGRAM}" rel="noopener">Instagram ↗</a></p>
  </div>
</section>
</main>
<script type="module" src="/src/page.js"></script>
<!-- visitor counts: Vercel Web Analytics, no cookies -->
<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`, depth).replace('%%BODY%%', () => body);
}


/* ---------- writing: blocks, idea cards, the sign-up */
// a credit for an image that isn't Matt's: [who, link]
const credit = c => c ? ` <span class="ar-credit">Image: ${c[1] ? `<a href="${c[1]}" target="_blank" rel="noopener">${esc(c[0])}</a>` : esc(c[0])}</span>` : '';
const slug = t => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const toc = list => `<nav class="ar-toc" aria-label="In this piece"><p class="mono">In this piece</p><ol>${list.filter(([k]) => k === 'h').map(([, v]) => `<li><a href="#${slug(v)}">${v}</a></li>`).join('')}</ol></nav>`;
const blocks = (list, R = '../../') => list.map(([k, v]) => k === 'h' ? `<h2 class="ar-h" id="${slug(v)}" data-r="fade">${v}</h2>`
  : k === 'stat' ? `<figure class="ar-stat" data-r="fade"><b>${esc(v[0])}</b><figcaption>${v[1]}${v[2] ? `<span class="mono">${esc(v[2])}</span>` : ''}</figcaption></figure>`
  : k === 'callout' ? `<aside class="ar-call" data-r="fade"><p class="mono">${esc(v[0])}</p><p>${v[1]}</p></aside>`
  : k === 'img' ? `<figure class="ar-ph ar-in" data-r="fade"><img src="${R}photos/${v[0]}" alt="${esc(v[2] || '')}" loading="lazy" decoding="async"><figcaption>${v[1]}${credit(v[3])}</figcaption></figure>`
  : k === 'p' ? `<p data-r="fade">${v}</p>`
  : k === 'q' ? `<blockquote class="ar-q" data-r="fade"><p>${v}</p></blockquote>`
  : k === 'list' ? `<ul class="ar-list" data-r="fade">${v.map(x => `<li>${x}</li>`).join('')}</ul>`
  : `<ol class="ar-steps">${v.map(([t, d], i) => `<li data-r="fade"><span class="mono">${pad(i + 1)}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ol>`).join('\n');
const minutes = a => Math.max(2, Math.round(words(a) / 220));
const words = a => (String(a.intro || '') + ' ' + blocks(a.body)).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
for (const a of ALL) a.read = minutes(a); // idea pages: reading time from the words, like the articles
// a card for one idea or column. R is how far up the site root is from the page the card sits on.
const card = (a, R, i = 0) => `<a class="pg-feat${a.photo ? '' : ' no-ph'}" href="${R}thinking/${a.id}/" data-r="fade" style="--d:${i * 0.08}s">
  ${a.photo ? `<figure><img src="${R}photos/${a.photo[0]}" alt="${esc(a.photo[3])}" loading="lazy" decoding="async"${a.photo[4] ? ` style="object-position:${a.photo[4]}"` : ''}></figure>` : ''}
  <div><p class="mono">${a.n ? `${a.n} · ` : ''}${esc(a.kind)}</p><h3>${a.title.join(' ')}</h3><p>${esc(a.define)}</p><span class="mono pg-feat-go">Read · ${a.read} min <i aria-hidden="true">→</i></span></div></a>`;
// a card for one piece of writing
const pcard = (w, R, i = 0) => `<a class="pg-feat" href="${R}writing/${w.slug}/" data-topic="${w.topic}" data-r="fade" style="--d:${i * 0.08}s">
  ${w.photo ? `<figure><img src="${R}photos/${w.photo[0]}" alt="${esc(w.photo[3])}" loading="lazy" decoding="async"${w.photo[4] ? ` style="object-position:${w.photo[4]}"` : ''}></figure>` : ''}
  <div><p class="mono">${day(w.date, { day: 'numeric', month: 'short', year: 'numeric' })} · ${esc(w.topic)}</p><h3>${w.h1}</h3><p>${esc(w.dek)}</p><span class="mono pg-feat-go">Read · ${minutes(w)} min <i aria-hidden="true">→</i></span></div></a>`;
const signup = R => W.SUBSTACK ? `<section class="v-sec pg-sign" data-theme="sky" data-blob=".8,.3,.2,.8" data-energy=".6">
  ${top('The newsletter', '', 'One idea a month')}
  <div class="pg-split"><div><h2 class="pg-h3" data-r="fade">New ideas, <em>first.</em></h2><p class="pg-p" data-r="fade">One essay a month on how sport finds its next fans. Free, and easy to leave.</p></div>
  <iframe class="pg-sub" src="${W.SUBSTACK}/embed" title="Sign up to the newsletter" loading="lazy" frameborder="0" scrolling="no"></iframe></div>
</section>` : '';

/* ---------- each idea: its own page */
const articles = ALL.map((a, i) => {
  const path = `thinking/${a.id}`, nx = ALL[i + 1], title = `${a.name}${a.kind === 'Column' ? '' : ': ' + a.kind.toLowerCase()}`;
  const others = ALL.filter(x => x !== a), feeds = POSTS.filter(w => w.idea === a.id).slice(0, 3);
  return [path, shell({
    id: 'thinking', path, title: a.name, desc: a.desc, image: a.photo?.[0], ldType: 'Article', cls: 'ar-page',
    crumb: `<span><a href="../">Matt King</a> / <a href="../thinking/">The thinking</a> / ${esc(a.kind)}</span><span>${a.read} min read</span>`,
    h1: a.title.join(' '), lead: esc(a.define), next: nx ? [`thinking/${nx.id}`, nx.name] : ['thinking', 'The thinking'],
    ldExtra: [{ '@type': 'Article', '@id': `${SITE}/${path}/#article`, headline: a.name, description: a.desc, author: { '@id': ME }, publisher: { '@id': ME },
      datePublished: W.PUBLISHED, dateModified: W.PUBLISHED, image: a.photo ? `${SITE}/photos/${a.photo[0]}` : undefined, mainEntityOfPage: `${SITE}/${path}/`, wordCount: words(a),
      about: { '@type': 'DefinedTerm', name: a.name, description: a.define, inDefinedTermSet: `${SITE}/thinking/` } },
      crumbs([['Matt King', ''], ['The thinking', 'thinking'], [a.name, path]])],
    body: `
<section class="v-sec ar" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".5">
  <div class="ar-wrap">
    <aside class="ar-side" data-r="fade">
      ${toc(a.body)}
      <p class="mono ar-meta"><span>By <a href="../../about/">Matt King</a></span><span>${new Date(W.PUBLISHED).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span><span>${a.read} min read</span></p>
    </aside>
    <article class="ar-body">
      ${a.photo ? `<figure class="ar-ph" data-r="fade"><img src="../../photos/${a.photo[0]}" alt="${esc(a.photo[3])}" decoding="async"${a.photo[4] ? ` style="object-position:${a.photo[4]}"` : ''}><figcaption><b>${esc(a.photo[1])}</b> ${esc(a.photo[2])}${credit(a.credit)}</figcaption></figure>` : ''}
      <p class="ar-intro" data-r="fade">${esc(a.intro)}</p>
      ${blocks(a.body)}
      <footer class="ar-by" data-r="fade"><img src="../../photos/portrait.jpg" alt="" loading="lazy"><div><b>Matt King</b><p>${esc(C.DESCRIPTOR)} <a href="../../about/">More about Matt</a> · <a href="../../speaking/">Talks</a></p></div></footer>
    </article>
  </div>
</section>
${feeds.length ? `<section class="v-sec" data-theme="raven" data-blob=".85,.8,.1,.3" data-energy=".6">
  ${top('Writing on this idea', pad(feeds.length), '<a href="../../writing/">All writing</a>')}
  <div class="pg-feats">${feeds.map((w, k) => pcard(w, '../../', k)).join('')}</div>
</section>` : ''}
${signup('../../')}
<section class="v-sec" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".6">
  ${top('The other ideas', '', '<a href="../">All the thinking</a>')}
  <div class="pg-feats">${others.map((o, k) => card(o, '../../', k)).join('')}</div>
</section>`,
  })];
});

/* ---------- writing: the hub */
const [lead, ...rest] = POSTS, shown = TOPICS.filter(t => rest.some(w => w.topic === t));
const writingHub = shell({
  id: 'writing', title: "Writing: what's going on in sport, marketing and culture",
  desc: "Weekly writing by Matt King on what's going on in sport, marketing and culture, and the plays worth stealing from it.",
  h1: 'The <em class="hi">writing.</em>', lead: "What's going on in sport, marketing and culture, and what's worth stealing from it. A new piece every week.", next: ['work', 'The work'],
  ldExtra: [{ '@type': 'Blog', '@id': `${SITE}/writing/#blog`, name: 'Matt King: writing', url: `${SITE}/writing/`, author: { '@id': ME }, publisher: { '@id': ME },
    blogPost: POSTS.map(w => ({ '@type': 'BlogPosting', headline: w.title, url: `${SITE}/writing/${w.slug}/`, datePublished: w.date, author: { '@id': ME } })) }],
  body: `
${lead ? `<section class="v-sec" id="latest" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".6">
  ${top('Latest', day(lead.date, { day: 'numeric', month: 'short', year: 'numeric' }), esc(lead.topic))}
  <a class="wr-lead" href="../writing/${lead.slug}/" data-r="fade">
    ${lead.photo ? `<figure><img src="../photos/${lead.photo[0]}" alt="${esc(lead.photo[3])}" decoding="async"${lead.photo[4] ? ` style="object-position:${lead.photo[4]}"` : ''}></figure>` : ''}
    <div><p class="mono">${day(lead.date)} · ${esc(lead.topic)} · ${minutes(lead)} min read</p><h2>${lead.h1}</h2><p>${esc(lead.dek)}</p><span class="btn"><span>Read it</span><i aria-hidden="true">→</i></span></div>
  </a>
</section>` : ''}
${rest.length ? `<section class="v-sec" id="all" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".6">
  ${top('More writing', pad(rest.length), 'Newest first')}
  ${shown.length > 1 ? `<div class="wr-filter" role="group" aria-label="Show" data-r="fade"><button type="button" class="mono on" data-filter="all">All</button>${shown.map(t => `<button type="button" class="mono" data-filter="${t}">${t}</button>`).join('')}</div>` : ''}
  <div class="pg-feats" data-feed>${rest.map((w, i) => pcard(w, '../', i % 3)).join('')}</div>
</section>` : ''}
${signup('../')}`,
});

/* ---------- each article: its own page */
const postPages = POSTS.map((w, i) => {
  const path = `writing/${w.slug}`, older = POSTS[i + 1], idea = w.idea && ALL.find(a => a.id === w.idea), url = `${SITE}/${path}/`;
  const more = POSTS.filter(x => x !== w).slice(0, 3), fill = more.length < 3 ? ALL.filter(a => a !== idea).slice(0, 3 - more.length) : [];
  const share = [['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`], ['X', `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(w.title)}`]];
  return [path, shell({
    id: 'writing', path, title: w.title, desc: w.dek, image: w.photo?.[0], ldType: 'Article', cls: 'ar-page',
    crumb: `<span><a href="../">Matt King</a> / <a href="../writing/">Writing</a> / ${esc(w.topic)}</span><span>${day(w.date)}</span>`,
    h1: w.h1, lead: esc(w.dek), next: older ? [`writing/${older.slug}`, plain(older.h1).replace(/\.$/, '')] : ['writing', 'All the writing'],
    ldExtra: [{ '@type': 'BlogPosting', '@id': `${url}#article`, headline: w.title, description: w.dek, author: { '@id': ME }, publisher: { '@id': ME }, datePublished: w.date, dateModified: w.updated || w.date,
      image: w.photo ? `${SITE}/photos/${w.photo[0]}` : undefined, mainEntityOfPage: url, wordCount: words(w), isPartOf: { '@id': `${SITE}/writing/#blog` }, articleSection: w.topic,
      about: idea ? { '@type': 'DefinedTerm', name: idea.name, description: idea.define, url: `${SITE}/thinking/${idea.id}/` } : undefined },
      crumbs([['Matt King', ''], ['Writing', 'writing'], [w.title, path]])],
    body: `
<section class="v-sec ar" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".5">
  <div class="ar-wrap">
    <aside class="ar-side" data-r="fade">
      <p class="mono ar-meta"><span>By <a href="../../about/">Matt King</a></span><span>${day(w.date)}</span><span>${minutes(w)} min read</span></p>
      ${idea ? `<a class="ar-part" href="../../thinking/${idea.id}/"><span class="mono">Connects to the idea</span><b>${esc(idea.name)}</b><i aria-hidden="true">→</i></a>` : ''}
      ${toc(w.body)}
      <p class="mono ar-share"><span>Share</span>${share.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join('')}<button type="button" class="mono" data-copy-link="${url}">Copy link</button></p>
    </aside>
    <article class="ar-body">
      ${w.photo ? `<figure class="ar-ph" data-r="fade"><img src="../../photos/${w.photo[0]}" alt="${esc(w.photo[3])}" decoding="async" style="${w.coverRatio ? `aspect-ratio:${w.coverRatio};` : ''}${w.photo[4] ? `object-position:${w.photo[4]}` : ''}"><figcaption><b>${esc(w.photo[1])}</b> ${esc(w.photo[2])}${credit(w.credit)}</figcaption></figure>` : ''}
      ${w.intro ? `<p class="ar-intro" data-r="fade">${w.intro}</p>` : ''}
      ${blocks(w.body)}
      ${idea ? `<a class="ar-idea" href="../../thinking/${idea.id}/" data-r="fade"><span class="mono">${idea.n} · The idea behind it</span><b>${idea.title.join(' ')}</b><span>${esc(idea.define)}</span><span class="mono pg-feat-go">Read the idea <i aria-hidden="true">→</i></span></a>` : ''}
      <footer class="ar-by" data-r="fade"><img src="../../photos/portrait.jpg" alt="" loading="lazy"><div><b>Matt King</b><p>${esc(C.DESCRIPTOR)} <a href="../../about/">More about Matt</a> · <a href="../../speaking/">Talks</a></p></div></footer>
    </article>
  </div>
</section>
${signup('../../')}
<section class="v-sec" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".6">
  ${top('Keep reading', '', '<a href="../">All writing</a>')}
  <div class="pg-feats">${more.map((x, k) => pcard(x, '../../', k)).join('')}${fill.map((a, k) => card(a, '../../', more.length + k)).join('')}</div>
</section>`,
  })];
});

/* ---------- speaking */
const speaking = shell({
  id: 'speaking', title: 'Speaking: talks, podcasts and panels',
  desc: 'Book Matt King to speak. Three talks on how sport finds its next fans: dormant demand, culture as the side door, and idols sell, influencers inform. For keynotes, panels, podcasts and guest lectures.',
  h1: 'Talks, podcasts and <em class="hi">panels.</em>', lead: 'I talk about how sport finds its next fans. Three talks, each built on one idea, for stages, podcasts, panels and classrooms.', next: ['press', 'Press'],
  body: `
<section class="v-sec" id="talks" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".6">
  ${top('Three talks', '01', 'One idea each')}
  <div class="pg-talks">${W.TALKS.map((t, i) => `<article data-r="fade" style="--d:${i * 0.08}s"><span class="mono">${t.n} · ${esc(ideaName(t.idea))}</span><h3>${esc(t.h)}</h3><p>${esc(t.p)}</p><p class="mono pg-for">For: ${esc(t.for)}</p>
    <div class="pg-talk-go"><a class="btn" href="../book/?for=talk"><span>Book this talk</span><i aria-hidden="true">→</i></a><a class="v-more" href="../thinking/${t.idea}/"><span>Read the idea</span><i aria-hidden="true">→</i></a></div></article>`).join('')}</div>
  <div class="pg-also" data-r="fade"><p class="mono">Also happy to talk about</p><p class="pg-chips">${W.ALSO.map(a => `<i>${esc(a)}</i>`).join('')}</p></div>
</section>

<section class="v-sec" id="heard" data-theme="sky" data-blob=".8,.3,.2,.8" data-energy=".6">
  ${top('Heard on', pad(W.HEARD.length), 'Radio and podcasts')}
  ${W.HEARD.map(([w, y, what, ph]) => `<article class="pg-story"><figure data-r="fade"><img src="../photos/${ph}" alt="Matt King on air at ${esc(w)}" loading="lazy" decoding="async" style="aspect-ratio:4/3"></figure>
    <div><p class="mono" data-r="fade"><b>${esc(w)}</b><span>${esc(y)}</span></p><h3 class="pg-h3" data-r="fade">${esc(w)}</h3><p class="pg-p" data-r="fade">${esc(what)}</p>
    <a class="btn btn-line" href="../book/?for=podcast" data-r="fade"><span>Invite me on your show</span><i aria-hidden="true">→</i></a></div></article>`).join('')}
</section>

<section class="v-sec" id="formats" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".6">
  ${top('Formats', '03', 'Where I can help')}
  <div class="pg-split"><div><h2 class="pg-h3" data-r="fade">For organisers.</h2><p class="pg-p" data-r="fade">Bios in three lengths are ready to copy on the <a href="../about/#bios">About page</a>, and the press photo is below. Four quick questions on the booking page build the brief and send it straight to me.</p>
  <p data-r="fade"><a class="btn btn-line" href="../photos/radio.jpg" download="matt-king-press-photo.jpg"><span>Download the press photo</span><i aria-hidden="true">↓</i></a></p></div>
  <ol class="pg-rows">${W.FORMATS_SPEAK.map(([h, d], i) => `<li data-r="fade"><span class="mono">${pad(i + 1)}</span><h4>${esc(h)}</h4><p>${esc(d)}</p></li>`).join('')}</ol></div>
</section>`,
});

/* ---------- about */
const about = shell({
  id: 'about', title: 'About',
  desc: `${C.DESCRIPTOR} Matt King leads marketing across eight football rights portfolios at DAZN, and takes sport off the pitch and into culture.`,
  h1: 'Matt <em class="hi">King.</em>', lead: esc(C.DESCRIPTOR), next: ['thinking', 'The thinking'],
  ldExtra: [{ '@type': 'FAQPage', mainEntity: C.FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  body: `
<section class="v-sec" id="short" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".6">
  ${top('In short', '01', 'Who I am')}
  <div class="pg-split pg-about"><figure class="pg-ph" data-r="fade"><img src="../photos/portrait.jpg" alt="Matt King" loading="lazy" decoding="async"></figure>
  <div><p class="pg-big pg-about-q" data-r="fade">I help sport find <em class="hi">new fans.</em></p>
  <p class="pg-p" data-r="fade" style="--d:.1s">I'm Global Marketing Manager for Football at DAZN. I lead marketing across eight football rights portfolios, from the FIFA World Cup and the UEFA Champions League to Serie A, LaLiga and the Bundesliga, in seven market zones.</p>
  <p class="pg-p" data-r="fade" style="--d:.15s">My work is about the people who don't watch yet. I reach them through what they already love, the music, the fashion, the creators, and then put the sport in that world.</p></div></div>
</section>

<section class="v-sec" id="route" data-theme="sky" data-blob=".8,.3,.2,.8" data-energy=".6">
  ${top('The route', '02', 'Newest first')}
  <ol class="pg-steps pg-career">${C.CAREER.map(([y, n, d]) => `<li data-r="fade"><span class="mono">${esc(y)}</span><h4>${esc(n)}</h4><p>${esc(d)}</p></li>`).join('')}</ol>
</section>

<section class="v-sec" id="bios" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".7">
  ${top('Bios to copy', '03', 'For organisers, hosts and press')}
  <div class="pg-bios">${C.BIOS.map(([k, b]) => `<article data-r="fade"><header><span class="mono">${esc(k)} · ${b.split(/\s+/).length} words</span><button class="mono pg-copy" type="button" data-copy>Copy</button></header><p>${esc(b)}</p></article>`).join('')}</div>
</section>

<section class="v-sec" id="faq" data-theme="raven" data-blob=".85,.8,.1,.3" data-energy=".6">
  ${top('Questions people ask', '04', '')}
  <dl class="pg-faq">${C.FAQ.map(([q, a]) => `<div data-r="fade"><dt>${esc(q)}</dt><dd>${esc(a)}</dd></div>`).join('')}</dl>
</section>`,
});

/* ---------- the thinking */
const thinking = shell({
  id: 'thinking', title: "The thinking: sport's next fans already exist",
  desc: "Matt King's thinking on sports marketing: sport's next fans already exist, they're just not watching yet. Three ideas (dormant demand, the side door, idols sell, influencers inform) and the toolkit behind them.",
  h1: W.CLAIM.h, lead: `${esc(W.CLAIM.sub)} ${esc(W.CLAIM.p)}`, next: [`thinking/${W.IDEAS[0].id}`, W.IDEAS[0].name],
  ldExtra: [{ '@type': 'DefinedTermSet', '@id': `${SITE}/thinking/`, name: "Matt King's ideas", hasDefinedTerm: ALL.map(a => ({ '@type': 'DefinedTerm', name: a.name, description: a.define, url: `${SITE}/thinking/${a.id}/` })) }],
  body: `
<section class="v-sec" id="ideas" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".6">
  ${top('Three ideas', '01', 'The problem, the way in, who carries it')}
  <div class="pg-feats pg-feats-big">${W.IDEAS.map((a, i) => card(a, '../', i)).join('')}</div>
</section>

${signup('../')}
<section class="v-sec pg-journey" id="journey" data-theme="sky" data-blob=".8,.3,.2,.8" data-energy=".6">
  ${top('The toolkit · How a fan is made', '02', 'Seven steps')}
  <h3 class="pg-big" data-r="smear" data-split>From a stranger to <em class="hi">a fan.</em></h3>
  <ol class="pg-steps">${C.JOURNEY.map((j, i) => `<li data-r="fade" style="--d:${(i % 4) * 0.05}s"><span class="mono">${pad(i + 1)}</span><h4>${esc(j.name)}</h4><p class="pg-role">${esc(j.role)}</p><p>${esc(j.detail)}</p></li>`).join('')}</ol>
</section>

<section class="v-sec pg-rules" id="rules" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".7">
  ${top('The toolkit · Working with talent', '03', 'Eleven rules')}
  <h3 class="pg-big" data-r="smear" data-split>Fit beats <em class="hi">size.</em></h3>
  <ol class="pg-cards">${C.RULES.map(([t, d], i) => `<li data-r="fade" style="--d:${(i % 3) * 0.06}s"><span class="mono">${pad(i + 1)}</span><h4>${esc(t)}</h4><p>${esc(d)}</p></li>`).join('')}</ol>
</section>

<section class="v-sec pg-brief" id="brief" data-theme="raven" data-blob=".85,.8,.1,.3" data-energy=".6">
  ${top('The toolkit · The brief', '04', 'Four questions')}
  <div class="pg-split"><div><h3 class="pg-h3" data-r="fade">${esc(C.BRIEF.h)}</h3><p class="pg-p" data-r="fade" style="--d:.1s">${esc(C.BRIEF.p)}</p></div>
  <ol class="pg-rows">${C.BRIEF.steps.map(([n, label, chips, hot]) => `<li${hot ? ' class="hot"' : ''} data-r="fade"><span class="mono">${n}</span><h4>${esc(label)}</h4><p class="pg-chips">${chips.map(c => `<i>${esc(c)}</i>`).join('')}</p></li>`).join('')}</ol></div>
</section>

<section class="v-sec pg-formats" id="formats" data-theme="raven" data-blob=".2,.8,.8,.2" data-energy=".6">
  ${top('The toolkit · Formats', '05', 'The format is the product')}
  <div class="pg-trio">${C.FORMATS.map((f, i) => `<article data-r="fade" style="--d:${i * 0.08}s"><b>${esc(f.stat)}</b><span class="mono">${esc(f.unit)}</span><h4>${esc(f.h)}</h4><p>${esc(f.p)}</p></article>`).join('')}</div>
</section>`,
});

/* ---------- the work */
const work = shell({
  id: 'work', title: 'The work: results, rights, brands and talent',
  desc: 'Matt King\'s record in sports marketing: 3M+ fans brought onto DAZN, eight football rights portfolios, seven market zones, and work with Manchester City, FC Barcelona, adidas, Phil Foden and more.',
  h1: 'A track <em class="hi">record.</em>', lead: 'The numbers, the rights, the brands and the people. Where the thinking has been put to work.', next: ['speaking', 'Speaking'],
  body: `
<section class="v-sec" id="record" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".7">
  ${top('The record', '01', 'Eight numbers')}
  <div class="pg-stats">${C.RECORD.map(([v, what, where], i) => `<div class="v-stat" data-r="fade" style="--d:${(i % 4) * 0.07}s"><b>${esc(v)}</b><p>${esc(what)}</p><span class="mono">${esc(where)}</span></div>`).join('')}</div>
</section>

<section class="v-sec" id="rights" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".6">
  ${top('At DAZN', '02', 'Football rights')}
  <p class="pg-names" data-r="fade">${C.RIGHTS.map(esc).join('<i aria-hidden="true"> · </i>')}</p>
  <div class="pg-split pg-markets"><div><h3 class="pg-h3" data-r="fade">${esc(C.MARKETS.h)}</h3><p class="pg-p" data-r="fade" style="--d:.1s">${esc(C.MARKETS.p)}</p></div>
  <ol class="pg-list">${C.MARKETS.list.map((m, i) => `<li data-r="fade" style="--d:${i * 0.04}s"><span class="mono">${pad(i + 1)}</span>${esc(m)}</li>`).join('')}</ol></div>
</section>

<section class="v-sec" id="company" data-theme="raven" data-blob=".5,.5,.5,.5" data-energy=".5">
  ${top('The company I keep', '03', 'Clubs, leagues, brands, people')}
  <ul class="pg-logos">${C.WORKED_WITH.map(([n, f]) => `<li data-r="fade">${lg(n, f)}<span class="mono">${esc(n)}</span></li>`).join('')}</ul>
  <ul class="pg-talent">${C.TALENT.map(([n, w]) => `<li data-r="fade"><b>${esc(n)}</b><span class="mono">${esc(w)}</span></li>`).join('')}</ul>
</section>

<section class="v-sec" id="route" data-theme="sky" data-blob=".8,.3,.2,.8" data-energy=".6">
  ${top('The route here', '04', '2021 to now')}
  <ol class="pg-route">${C.ROUTE.map(([y, n, f], i) => `<li data-r="fade" style="--d:${i * 0.06}s"><span class="mono">${y}</span>${lg(n, f)}<h4>${esc(n)}</h4></li>`).join('')}</ol>
  <article class="pg-case" data-r="fade"><p class="mono">${esc(C.RUNWAY.stat[2])}</p><b>${esc(C.RUNWAY.stat[0])}</b><div><h4>${esc(C.RUNWAY.h)}</h4><p>${esc(C.RUNWAY.p)}</p></div></article>
</section>

<section class="v-sec" id="kit" data-theme="raven" data-blob=".1,.2,.92,.85" data-energy=".7">
  ${top('How I work', '05', 'AI is the pit crew, not the driver')}
  <div class="pg-trio pg-kit">${C.KIT.map((k, i) => `<article data-r="fade" style="--d:${i * 0.08}s"><span class="mono">${esc(k.tag)}</span><h4>${esc(k.title)}</h4><p>${esc(k.detail)}</p><span class="mono pg-tools">${esc(k.tools)}</span></article>`).join('')}</div>
</section>`,
});

/* ---------- press */
const press = shell({
  id: 'press', title: 'Press: Matt King in the news',
  desc: 'Press coverage of Matt King and 80 Four, the sport, health and lifestyle marketing agency he co-founded.',
  h1: 'In the <em class="hi">press.</em>', lead: 'What has been written, and where.', next: ['about', 'About'],
  body: `
<section class="v-sec pg-press" data-theme="raven" data-blob=".9,.6,.1,.1" data-energy=".6">
  ${top('On the record', pad(C.PRESS.length), 'Newest first')}
  ${C.PRESS.map((p, i) => `<article class="pg-story${i % 2 ? ' flip' : ''}">
    <figure data-r="fade"><img src="../photos/${p.img}" alt="${esc(p.alt)}" loading="lazy" decoding="async" style="aspect-ratio:${p.ar}"></figure>
    <div><p class="mono" data-r="fade"><b>${esc(p.source)}</b><span>${esc(p.date)}</span></p><h3 class="pg-h3" data-r="fade">${esc(p.headline)}</h3><p class="pg-p" data-r="fade" style="--d:.1s">${esc(p.line)}</p>${p.url ? `<a class="btn btn-line" href="${p.url}" target="_blank" rel="noopener" data-r="fade"><span>Read the article</span><i aria-hidden="true">↗</i></a>` : ''}</div>
  </article>`).join('')}
</section>`,
});

const OUT = [['about', about], ['thinking', thinking], ['writing', writingHub], ['work', work], ['speaking', speaking], ['press', press], ...articles, ...postPages];
for (const [path, html] of OUT) { mkdirSync(`${root}${path}`, { recursive: true }); writeFileSync(`${root}${path}/index.html`, html); }
writeFileSync(`${root}tools/pages.json`, JSON.stringify(OUT.map(([path]) => `${path}/index.html`), null, 1) + '\n');
writeFileSync(`${root}public/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', ...OUT.map(([path]) => path + '/'), 'book/'].map(u => `  <url><loc>${SITE}/${u}</loc><lastmod>${POSTS.find(w => u === `writing/${w.slug}/`)?.date || (['', 'writing/'].includes(u) && POSTS[0]?.date > W.PUBLISHED ? POSTS[0].date : W.PUBLISHED)}</lastmod></url>`).join('\n')}\n  <url><loc>https://world.bymattking.com/</loc></url>\n</urlset>\n`);
const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
writeFileSync(`${root}public/feed.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Matt King: writing</title><link>${SITE}/writing/</link><atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
<description>Weekly writing on what is going on in sport, marketing and culture.</description><language>en-gb</language>
${POSTS.map(w => `<item><title>${xml(w.title)}</title><link>${SITE}/writing/${w.slug}/</link><guid>${SITE}/writing/${w.slug}/</guid><category>${w.topic}</category><pubDate>${new Date(w.date + 'T09:00:00Z').toUTCString()}</pubDate><description>${xml(w.dek)}</description></item>`).join('\n')}
</channel></rss>
`);
// the home page shows the three newest pieces, written into its HTML so they can be crawled
{
  let s = readFileSync(`${root}index.html`, 'utf8');
  const block = `<!-- writing: written by tools/pages.mjs -->
<section class="v-sec v-writing" id="writing" data-theme="raven" data-blob=".85,.8,.1,.3" data-energy=".6">
  <header class="v-top mono" data-r="fade"><h2>Latest writing</h2><span>Every week</span><a class="v-more" href="./writing/"><span>All writing</span><i aria-hidden="true">→</i></a></header>
  <div class="pg-feats">${POSTS.slice(0, 3).map((w, i) => pcard(w, './', i)).join('')}</div>
</section>
<!-- /writing -->`;
  s = s.includes('<!-- writing: written') ? s.replace(/<!-- writing: written[\s\S]*?<!-- \/writing -->/, () => block) : s.replace('<!-- 7. press -->', () => `${block}\n\n<!-- 7. press -->`);
  s = s.includes('application/rss+xml') ? s : s.replace('<link rel="icon"', `<link rel="alternate" type="application/rss+xml" title="Matt King: writing" href="${SITE}/feed.xml">\n<link rel="icon"`);
  writeFileSync(`${root}index.html`, s);
}

// llms.txt: a plain-language summary of who Matt is and what's on the site, for AI tools to read (llmstxt.org)
writeFileSync(`${root}public/llms.txt`, `# Matt King

> ${C.BIOS[1][1]}

${C.BIOS[2][1]}

## About
- [About Matt King](${SITE}/about/): bio, career, bios to copy, and common questions
- [The work](${SITE}/work/): results, football rights, brands and talent
- [Speaking](${SITE}/speaking/): talks, podcasts and panels
- [Press](${SITE}/press/): press coverage
- [Book Matt](${SITE}/book/): podcasts, talks, panels, brand work and press comment

## Ideas
${ALL.map(a => `- [${a.name}](${SITE}/thinking/${a.id}/): ${a.define}`).join('\n')}

## Writing
${POSTS.map(w => `- [${w.title}](${SITE}/writing/${w.slug}/) (${w.date}, ${w.topic}): ${w.dek}`).join('\n')}

## Contact
- Email: ${C.EMAIL}
- LinkedIn: ${C.LINKEDIN}
- Instagram: ${C.INSTAGRAM}
`);
writeFileSync(`${root}public/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
for (const [f, title, desc, path] of [['index.html', 'Matt King | Global sports marketing leader', '', ''], ['book/index.html', 'Book Matt King', '', 'book/'], ['world/index.html', 'Matt King — The virtual world', '', 'world/']]) {
  let s = readFileSync(`${root}${f}`, 'utf8'); const d = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const block = `<!-- ld -->${SITE_LD(title, d, path)}<!-- /ld -->`;
  s = s.includes('<!-- ld -->') ? s.replace(/<!-- ld -->[\s\S]*?<!-- \/ld -->/, block) : s.replace('</head>', `${block}\n</head>`);
  writeFileSync(`${root}${f}`, s);
}
console.log('pages written:', OUT.length);
