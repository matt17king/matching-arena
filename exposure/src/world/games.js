// The casino's tables: blackjack, roulette and a slot machine. Play chips only: nothing here is real money, nothing is
// sent anywhere, and the stack is simply remembered in the browser. A marker with `game: 'blackjack'` (or 'roulette',
// 'slots') in rooms.js opens one of these over the room. This file is only downloaded the first time a table is opened.
import '../styles/games.css';
import { reduced } from '../kit.js';

const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const wait = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));
const fmt = n => Math.round(n).toLocaleString('en-GB'), pick = n => Math.floor(Math.random() * n);
const KEY = 'mk-chips', START = 1000, STAKES = [10, 25, 50, 100];

let chips = START; try { const v = +localStorage.getItem(KEY); if (v > 0) chips = v; } catch { /* private window: the stack just starts fresh */ }
let el, body, sayEl, stake = 25, run = 0, done = null;

function bank(n) {
  chips = Math.max(0, Math.round(n)); try { localStorage.setItem(KEY, chips); } catch { /* not remembered, still playable */ }
  $('[data-chips]', el).textContent = fmt(chips);
}
const say = t => { sayEl.textContent = t; };
// when the stack cannot cover the smallest stake, the house quietly stands you another
function topUp() { if (chips < STAKES[0]) { bank(START); say(`Cleaned out. The house has stood you another ${fmt(START)}.`); return true; } return false; }

function shell() {
  el = document.createElement('div'); el.className = 'gm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.hidden = true;
  el.innerHTML = `<div class="gm-in">
    <header class="gm-hd"><div><p class="mono gm-k">The casino · Las Vegas</p><h2 class="gm-t" id="gm-t"></h2></div>
      <p class="gm-chips"><span class="mono">Your chips</span><b data-chips></b></p>
      <button class="gm-x" type="button" data-x aria-label="Leave the table"><i aria-hidden="true">×</i></button></header>
    <div class="gm-body" data-body></div>
    <p class="gm-say" data-say aria-live="polite"></p>
    <footer class="gm-ft"><div class="gm-stakes" role="group" aria-label="Stake"><span class="mono">Stake</span>${STAKES.map(s => `<button type="button" class="gm-chip" data-stake="${s}">${s}</button>`).join('')}</div>
      <p class="mono gm-note">Play chips only. No real money, nothing to win or lose.</p></footer></div>`;
  el.setAttribute('aria-labelledby', 'gm-t'); document.body.append(el); body = $('[data-body]', el); sayEl = $('[data-say]', el);
  el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('[data-x]')) return close();
    const s = e.target.closest('[data-stake]'); if (s) { stake = +s.dataset.stake; marks(); }
  });
  addEventListener('keydown', e => { if (!el.hidden && e.key === 'Escape') { e.stopPropagation(); close(); } }, true);
}
const marks = () => $$('[data-stake]', el).forEach(b => b.setAttribute('aria-pressed', +b.dataset.stake === stake));

/* ---------- blackjack: you against the dealer. Dealer stands on 17; a natural pays three to two. */
function blackjack() {
  body.innerHTML = `<div class="bj">
    <div class="bj-row"><p class="mono">Dealer <b data-ds></b></p><div class="bj-hand" data-d></div></div>
    <div class="bj-row"><p class="mono">You <b data-ps></b></p><div class="bj-hand" data-p></div></div>
    <div class="gm-acts"><button type="button" class="gm-btn gm-go" data-a="deal">Deal</button><button type="button" class="gm-btn" data-a="hit">Hit</button><button type="button" class="gm-btn" data-a="stand">Stand</button><button type="button" class="gm-btn" data-a="double">Double</button></div></div>`;
  const dEl = $('[data-d]', body), pEl = $('[data-p]', body), me = run; let shoe = [], P = [], D = [], bet = 0, live = false, busy = false;
  const fill = () => { shoe = []; for (let k = 0; k < 4; k++) for (const s of '♠♥♦♣') for (const r of ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K']) shoe.push(r + s); for (let i = shoe.length - 1; i > 0; i--) { const j = pick(i + 1); [shoe[i], shoe[j]] = [shoe[j], shoe[i]]; } };
  const draw = () => { if (shoe.length < 20) fill(); return shoe.pop(); };
  const total = h => { let t = 0, aces = 0; for (const c of h) { const r = c.slice(0, -1); if (r === 'A') { aces++; t += 11; } else t += +r || 10; } while (t > 21 && aces) { t -= 10; aces--; } return t; };
  const face = (c, down) => `<div class="cd${down ? ' down' : ''}${'♥♦'.includes(c.slice(-1)) ? ' red' : ''}"><b>${c.slice(0, -1)}</b><i aria-hidden="true">${c.slice(-1)}</i></div>`;
  const put = (to, c, down) => to.insertAdjacentHTML('beforeend', face(c, down));
  const scores = hide => { $('[data-ps]', body).textContent = P.length ? total(P) : ''; $('[data-ds]', body).textContent = D.length ? (hide ? total([D[0]]) : total(D)) : ''; };
  const set = () => { $$('[data-a]', body).forEach(b => { const a = b.dataset.a; b.disabled = busy || (a === 'deal' ? live : !live || (a === 'double' && (P.length !== 2 || chips < bet))); }); };
  async function finish() {
    live = false; busy = true; set(); const p = total(P), natural = p === 21 && P.length === 2;
    $('.down', dEl)?.classList.remove('down'); scores(false); await wait(450); if (me !== run) return;
    if (p <= 21 && !natural) while (total(D) < 17) { D.push(draw()); put(dEl, D[D.length - 1]); scores(false); await wait(520); if (me !== run) return; }
    const d = total(D), dNatural = d === 21 && D.length === 2;
    if (p > 21) say(`Bust on ${p}. The house takes ${fmt(bet)}.`);
    else if (natural && !dNatural) { bank(chips + bet * 2.5); say(`Blackjack. That pays ${fmt(bet * 1.5)}.`); }
    else if (d > 21) { bank(chips + bet * 2); say(`Dealer busts on ${d}. You win ${fmt(bet)}.`); }
    else if (p > d) { bank(chips + bet * 2); say(`${p} beats ${d}. You win ${fmt(bet)}.`); }
    else if (p === d) { bank(chips + bet); say(`${p} each. A push: your stake comes back.`); }
    else say(`Dealer's ${d} beats your ${p}. The house takes ${fmt(bet)}.`);
    busy = false; topUp(); set();
  }
  body.addEventListener('click', async e => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a || busy) return;
    if (a === 'deal' && !live) {
      if (chips < stake) return say(`You have ${fmt(chips)}. Pick a smaller stake.`);
      bet = stake; bank(chips - bet); P = []; D = []; dEl.innerHTML = pEl.innerHTML = ''; say(`${fmt(bet)} on the table.`); busy = true; set();
      for (const [h, to, down] of [[P, pEl], [D, dEl], [P, pEl], [D, dEl, true]]) { h.push(draw()); put(to, h[h.length - 1], down); scores(true); await wait(260); if (me !== run) return; }
      busy = false; live = true; set(); if (total(P) === 21) finish();
    } else if (a === 'hit' && live) { P.push(draw()); put(pEl, P[P.length - 1]); scores(true); set(); if (total(P) >= 21) finish(); }
    else if (a === 'stand' && live) finish();
    else if (a === 'double' && live && P.length === 2 && chips >= bet) { bank(chips - bet); bet *= 2; P.push(draw()); put(pEl, P[P.length - 1]); scores(true); finish(); }
  });
  set(); say('Pick a stake and deal. Closest to 21 without going over.');
}

/* ---------- roulette: a single-zero wheel. Put chips on numbers or on the outside bets, then spin. */
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const colour = n => (n === 0 ? 'zero' : RED.has(n) ? 'red' : 'black');
// what a bet pays on a number, as a multiple of the stake, or -1 if it loses
const pays = (k, n) => (k[0] === 'n' ? (+k.slice(1) === n ? 35 : -1) : n === 0 ? -1
  : { red: RED.has(n), black: !RED.has(n), odd: n % 2 === 1, even: n % 2 === 0, low: n <= 18, high: n >= 19 }[k] ? 1
  : { d1: n <= 12, d2: n > 12 && n <= 24, d3: n > 24 }[k] ? 2 : -1);
function roulette() {
  const seg = 360 / 37, hue = { zero: '#12805a', red: '#e20b21', black: '#16100f' };
  const cone = WHEEL.map((n, i) => `${hue[colour(n)]} ${(i * seg).toFixed(3)}deg ${((i + 1) * seg).toFixed(3)}deg`).join(',');
  let cells = `<button type="button" class="rl-c zero" data-b="n0" style="grid-row:1 / span 3">0</button>`;
  for (let r = 0; r < 3; r++) for (let c = 1; c <= 12; c++) { const n = c * 3 - r; cells += `<button type="button" class="rl-c ${colour(n)}" data-b="n${n}" style="grid-column:${c + 1};grid-row:${r + 1}">${n}</button>`; }
  [['d1', '1 to 12'], ['d2', '13 to 24'], ['d3', '25 to 36']].forEach(([k, t], i) => (cells += `<button type="button" class="rl-c out" data-b="${k}" style="grid-column:${2 + i * 4} / span 4;grid-row:4">${t}</button>`));
  [['low', '1–18'], ['even', 'Even'], ['red', 'Red'], ['black', 'Black'], ['odd', 'Odd'], ['high', '19–36']].forEach(([k, t], i) => (cells += `<button type="button" class="rl-c out ${k}" data-b="${k}" style="grid-column:${2 + i * 2} / span 2;grid-row:5">${t}</button>`));
  body.innerHTML = `<div class="rl"><div class="rl-wheel"><div class="rl-disc" data-disc style="background:conic-gradient(from ${(-seg / 2).toFixed(3)}deg, ${cone})">${WHEEL.map((n, i) => `<span style="transform:rotate(${(i * seg).toFixed(3)}deg)"><b>${n}</b></span>`).join('')}</div><i class="rl-ball" aria-hidden="true"></i><p class="rl-hit" data-hit aria-hidden="true"></p></div>
    <div class="rl-side"><div class="rl-board" data-board>${cells}</div>
    <div class="gm-acts"><button type="button" class="gm-btn gm-go" data-a="spin">Spin</button><button type="button" class="gm-btn" data-a="clear">Clear bets</button></div></div></div>`;
  const disc = $('[data-disc]', body), hit = $('[data-hit]', body), me = run; let bets = {}, turn = 0, busy = false;
  const staked = () => Object.values(bets).reduce((a, b) => a + b, 0);
  const show = () => $$('[data-b]', body).forEach(b => { const v = bets[b.dataset.b]; b.classList.toggle('on', !!v); if (v) b.dataset.v = v; else delete b.dataset.v; });
  body.addEventListener('click', async e => {
    if (busy) return; const cell = e.target.closest('[data-b]'), a = e.target.closest('[data-a]')?.dataset.a;
    if (cell) { if (chips < stake) return say(`You have ${fmt(chips)} left. Pick a smaller stake, or spin.`); const k = cell.dataset.b; bets[k] = (bets[k] || 0) + stake; bank(chips - stake); $$('.win', body).forEach(x => x.classList.remove('win')); show(); say(`${fmt(staked())} on the table.`); }
    else if (a === 'clear') { bank(chips + staked()); bets = {}; show(); say('Bets cleared.'); }
    else if (a === 'spin') {
      if (!staked()) return say('Put a chip on a number or a colour first.');
      busy = true; $$('button', body).forEach(b => (b.disabled = true)); hit.textContent = ''; hit.className = 'rl-hit'; say('No more bets.');
      const i = pick(37), n = WHEEL[i]; turn = turn - (turn % 360) + 360 * 5 + (360 - i * seg); disc.style.transform = `rotate(${turn.toFixed(3)}deg)`;
      await wait(4300); if (me !== run) return;
      let back = 0; for (const [k, v] of Object.entries(bets)) { const m = pays(k, n); if (m > 0) back += v * (m + 1); }
      const out = staked(); bank(chips + back); hit.textContent = n; hit.className = `rl-hit ${colour(n)} on`; $(`[data-b="n${n}"]`, body).classList.add('win');
      say(`${n}, ${colour(n) === 'zero' ? 'green' : colour(n)}. ${back > out ? `You win ${fmt(back - out)}.` : back === out ? 'You break even.' : back ? `You get ${fmt(back)} back of ${fmt(out)}.` : `The house takes ${fmt(out)}.`}`);
      bets = {}; show(); busy = false; $$('button', body).forEach(b => (b.disabled = false)); topUp();
    }
  });
  say('Tap the board to place chips, then spin. A single number pays 35 to 1.');
}

/* ---------- the slot machine: three reels. Three alike pays; any pair gives the stake back. */
const SYMS = [['7', 100, 1], ['★', 40, 2], ['♛', 20, 3], ['♦', 10, 4], ['♣', 6, 5], ['BAR', 6, 5]]; // symbol, pays for three, how many on each reel
const STRIP = SYMS.flatMap(([s, , n]) => Array(n).fill(s)), PAY = Object.fromEntries(SYMS.map(([s, p]) => [s, p]));
function slots() {
  const cell = s => `<span class="sl-s s-${s === '7' ? 'seven' : s === '★' ? 'star' : s === 'BAR' ? 'bar' : 'plain'}">${s}</span>`;
  body.innerHTML = `<div class="sl"><div class="sl-win"><div class="sl-reels">${[0, 1, 2].map(() => `<div class="sl-reel"><div class="sl-strip" data-strip>${cell(STRIP[pick(STRIP.length)])}</div></div>`).join('')}</div><i class="sl-line" aria-hidden="true"></i></div>
    <div class="gm-acts"><button type="button" class="gm-btn gm-go" data-a="spin">Spin</button></div>
    <ul class="sl-pays mono">${SYMS.slice(0, 4).map(([s, p]) => `<li><b>${s} ${s} ${s}</b>× ${p}</li>`).join('')}<li><b>Any pair</b>stake back</li></ul></div>`;
  const strips = $$('[data-strip]', body), btn = $('[data-a]', body), me = run;
  btn.addEventListener('click', async () => {
    if (chips < stake) return say(`You have ${fmt(chips)}. Pick a smaller stake.`);
    const bet = stake; bank(chips - bet); btn.disabled = true; say('');
    const res = strips.map((strip, i) => {
      const last = strip.lastElementChild.textContent, len = 22 + i * 8, run_ = [last]; for (let k = 1; k < len; k++) run_.push(STRIP[pick(STRIP.length)]);
      strip.style.transition = 'none'; strip.style.transform = 'translateY(0)'; strip.innerHTML = run_.map(cell).join(''); strip.getBoundingClientRect();
      strip.style.transition = reduced ? 'none' : `transform ${1.5 + i * 0.5}s cubic-bezier(.2, .7, .2, 1)`; strip.style.transform = `translateY(${-(len - 1) / len * 100}%)`;
      return run_[len - 1];
    });
    await wait(2700); if (me !== run) return;
    const [a, b, c] = res;
    if (a === b && b === c) { bank(chips + bet * PAY[a]); say(`${a} ${a} ${a}. That pays ${fmt(bet * PAY[a])}.`); el.classList.add('gm-hit'); setTimeout(() => el.classList.remove('gm-hit'), 1200); }
    else if (a === b || b === c || a === c) { bank(chips + bet); say('A pair. Your stake comes back.'); }
    else say('Nothing this time.');
    btn.disabled = false; topUp();
  });
  say('Three alike pays. Pick a stake and spin.');
}

const GAMES = { blackjack: ['Blackjack', blackjack], roulette: ['Roulette', roulette], slots: ['The slots', slots] };
export const has = name => name in GAMES;

function close() { if (!el || el.hidden) return; run++; el.classList.remove('on'); setTimeout(() => { el.hidden = true; body.innerHTML = ''; }, reduced ? 0 : 350); const f = done; done = null; f?.(); }
export function open(name, onClose) {
  if (!has(name)) return onClose?.();
  if (!el) shell(); run++; done = onClose; el.hidden = false; $('.gm-t', el).textContent = GAMES[name][0]; el.dataset.game = name;
  bank(chips); marks(); GAMES[name][1](); el.getBoundingClientRect(); el.classList.add('on'); $('[data-x]', el).focus({ preventScroll: true });
}
