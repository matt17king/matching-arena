// The menu: a two-line button in the header that opens a full-screen list of every page.
// Used by the home page and the reading pages. It adds itself to the header, so no page needs its own markup.
import { $, $$ } from './kit.js';
import { EMAIL, LINKEDIN, INSTAGRAM } from './content.js';

export function createMenu() {
  const root = document.documentElement, B = root.dataset.root || (root.classList.contains('pg') ? '../' : './');
  // [where it goes, name, one line about it, picture shown beside the list on wide screens]
  const ITEMS = [
    ['about/', 'About', 'Who I am', 'photos/portrait.jpg'],
    ['thinking/', 'The thinking', 'Three ideas, and the toolkit', 'photos/foden-couture.jpg'],
    ['writing/', 'Writing', "What's going on, every week", 'photos/f1-miami.jpg'],
    ['work/', 'The work', 'Results, rights, brands', 'photos/man-city-couture.jpg'],
    ['speaking/', 'Speaking', 'Talks, podcasts, panels', 'photos/radio.jpg'],
    ['press/', 'Press', 'In the news', 'photos/press-circle.jpg'],
    ['world/', 'The virtual world', 'Step inside', 'rooms/living.webp'],
  ];
  const here = location.pathname.replace(/index\.html$/, ''), at = ITEMS.findIndex(([k]) => here.includes('/' + k)), first = Math.max(0, at);

  const btn = document.createElement('button');
  btn.className = 'mn-btn'; btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'menu');
  btn.innerHTML = '<span class="mono">Menu</span><i aria-hidden="true"></i>';
  $('.hd-right').append(btn);

  const el = document.createElement('div');
  el.className = 'mn'; el.id = 'menu'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Menu'); el.inert = true;
  el.innerHTML = `<div class="mn-glow" aria-hidden="true"></div>
  <div class="mn-in">
    <nav class="mn-list" aria-label="All pages">${ITEMS.map(([k, n, s], i) => `<a href="${B}${k}" style="--n:${i}" data-i="${i}"${i === at ? ' aria-current="page"' : ''}><span class="mono">0${i + 1}</span><b>${n}</b><em class="mono">${s}</em><i aria-hidden="true">→</i></a>`).join('')}</nav>
    <div class="mn-pic" aria-hidden="true">${ITEMS.map(([, , , p], i) => `<img src="${B}${p}" alt="" loading="lazy" decoding="async" data-i="${i}"${i === first ? ' class="on"' : ''}>`).join('')}</div>
    <div class="mn-foot" style="--n:${ITEMS.length}">
      <a class="btn" href="${B}book/"><span>Book Matt</span><i aria-hidden="true">→</i></a>
      <p><a href="mailto:${EMAIL}">${EMAIL}</a><a href="${LINKEDIN}" rel="noopener">LinkedIn ↗</a><a href="${INSTAGRAM}" rel="noopener">Instagram ↗</a></p>
    </div>
  </div>`;
  document.body.append(el);

  const pics = $$('.mn-pic img', el), show = i => pics.forEach(p => p.classList.toggle('on', +p.dataset.i === +i));
  $$('.mn-list a', el).forEach(a => { a.addEventListener('pointerenter', () => show(a.dataset.i)); a.addEventListener('focus', () => show(a.dataset.i)); });
  $('.mn-list', el).addEventListener('pointerleave', () => show(first));

  let open = false;
  function set(on) {
    if (on === open) return; open = on;
    root.classList.toggle('mn-open', on); el.inert = !on; btn.setAttribute('aria-expanded', String(on)); $('span', btn).textContent = on ? 'Close' : 'Menu';
    if (on) $('.mn-list a', el).focus({ preventScroll: true }); else btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', () => set(!open));
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  // a link to the page we are already on (or to a place on it) should just close the menu
  el.addEventListener('click', e => { if (e.target.closest('a')) { root.classList.remove('mn-open'); open = false; el.inert = true; btn.setAttribute('aria-expanded', 'false'); $('span', btn).textContent = 'Menu'; } });
  addEventListener('pageshow', () => set(false));
}
