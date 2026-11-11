// The five playing surfaces as plain line drawings, one per frame.
// Each is a list of SVG path strings in a 200 × 120 box, ordered the way a groundsman would paint them:
// boundary first, then the lines inside. main.js draws them in that order as you scroll.
const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;
const line = (x1, y1, x2, y2) => `M${x1} ${y1}L${x2} ${y2}`;
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
const CX = 100, CY = 60;
// mirror a left-hand shape to the right-hand end
const both = fn => [fn(1), fn(-1)];
const X = (s, x) => (s === 1 ? x : 200 - x);

const football = (() => {
  const x0 = 12, y0 = 8, w = 176, h = 104;
  return [
    rect(x0, y0, w, h), line(CX, y0, CX, y0 + h), circle(CX, CY, 15),
    ...both(s => `M${X(s, x0)} ${CY - 33}H${X(s, x0 + 27)}V${CY + 33}H${X(s, x0)}`),
    ...both(s => `M${X(s, x0)} ${CY - 15}H${X(s, x0 + 9)}V${CY + 15}H${X(s, x0)}`),
    ...both(s => `M${X(s, x0 + 27)} ${CY - 12}A15 15 0 0 ${s === 1 ? 1 : 0} ${X(s, x0 + 27)} ${CY + 12}`),
  ];
})();

const basketball = (() => {
  const x0 = 10, y0 = 12, w = 180, h = 96;
  return [
    rect(x0, y0, w, h), line(CX, y0, CX, y0 + h), circle(CX, CY, 11.5),
    ...both(s => `M${X(s, x0)} ${CY - 43}H${X(s, x0 + 9)}A43.5 43.5 0 0 ${s === 1 ? 1 : 0} ${X(s, x0 + 9)} ${CY + 43}H${X(s, x0)}`),
    ...both(s => `M${X(s, x0)} ${CY - 15.7}H${X(s, x0 + 37)}V${CY + 15.7}H${X(s, x0)}`),
    ...both(s => `M${X(s, x0 + 37)} ${CY - 11.5}A11.5 11.5 0 0 ${s === 1 ? 1 : 0} ${X(s, x0 + 37)} ${CY + 11.5}`),
    ...both(s => circle(X(s, x0 + 10), CY, 1.8)),
  ];
})();

const gridiron = (() => {
  const x0 = 10, y0 = 20, w = 180, h = 80, yd = 1.5;
  const lines = []; for (let k = 0; k <= 10; k++) lines.push(line(x0 + (10 + k * 10) * yd, y0, x0 + (10 + k * 10) * yd, y0 + h));
  // hash marks, in two rows down the middle of the field
  const hash = []; for (const y of [CY - 9, CY + 9]) { let d = ''; for (let k = 1; k < 20; k++) { const x = x0 + (10 + k * 5) * yd; d += `M${x} ${y - 1.4}v2.8`; } hash.push(d); }
  return [rect(x0, y0, w, h), ...lines, ...hash];
})();

const tennis = (() => {
  const x0 = 20, w = 160, hw = 36.9, hs = 27.7, sv = 43.1;
  return [
    rect(x0, CY - hw, w, hw * 2), line(x0, CY - hs, x0 + w, CY - hs), line(x0, CY + hs, x0 + w, CY + hs),
    line(CX, CY - hw - 4, CX, CY + hw + 4), line(CX - sv, CY - hs, CX - sv, CY + hs), line(CX + sv, CY - hs, CX + sv, CY + hs), line(CX - sv, CY, CX + sv, CY),
  ];
})();

const circuit = [
  'M34 86C22 64 28 32 58 28L118 22C150 18 180 28 174 52C170 68 142 60 132 72C124 84 152 90 142 102C130 113 72 108 52 104C42 102 37 94 34 86Z',
  // the racing line, cutting each corner
  'M40 84C31 65 37 40 60 35L118 29C144 26 168 33 165 50C161 61 136 55 125 70C118 82 141 92 135 98C124 106 74 101 55 98C47 96 43 91 40 84Z',
  'M66 23.5v9', // start line
];

export const PITCHES = { runway: football, 'side-door': basketball, fit: gridiron, format: tennis, story: circuit };
export const pitchSVG = (id, cls = '') => `<svg class="${cls}" viewBox="0 0 200 120" fill="none" aria-hidden="true" focusable="false">${PITCHES[id].map(d => `<path d="${d}" pathLength="1"/>`).join('')}</svg>`;
