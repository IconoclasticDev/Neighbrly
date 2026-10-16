// Fails the build if any colour in the source text is blue or purple.
// Neighbrly rule: light theme, no blue, no purple. Run: npm run lint:palette
const fs = require('fs'), path = require('path');
function hsl(hex) {
  let h = hex.replace('#', ''); if (h.length === 3) h = [...h].map(x => x + x).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (hh * 60 + 360) % 360, s, l };
}
// cyan -> blue -> indigo -> purple -> magenta-violet, with a visible tint
const bad = ({ h, s, l }) => s > 0.12 && l > 0.08 && l < 0.97 && h >= 185 && h <= 320;
const hits = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (['node_modules', '.git', 'dist', 'android', 'ios', 'build-preview'].includes(f)) continue;
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|js|json)$/.test(f) || /package(-lock)?\.json$/.test(f) || f === 'palette-lint.js') continue;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      (line.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).forEach(hex => { if (bad(hsl(hex))) hits.push(`${p}:${i + 1} ${hex}`); });
      if (/\b(blue|purple|violet|indigo|cyan|navy|magenta)\b/i.test(line) && !/(\/\/|\*)/.test(line)) hits.push(`${p}:${i + 1} colour name`);
    });
  }
})('.');
if (hits.length) { console.error('Blue/purple colours found:\n' + hits.join('\n')); process.exit(1); }
console.log('Palette OK: no blue or purple colours in scanned source text.');
