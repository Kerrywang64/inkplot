/* Quantitative self-check: line weight and ink coverage.
   Line weight is estimated from area divided by edge length: a stroke l long and w wide covers
   w*l pixels and has roughly 2l edge pixels, so w = 2 * area / edge. Robust against anti-aliasing
   and compression noise, unlike run-length mode.
   Usage: node measure.mjs */
import { chromium } from 'playwright';
import fs from 'fs';
const js = fs.readFileSync('scripts/collage.js', 'utf8');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const p = await b.newPage({ viewport: { width: 900, height: 700 } });
await p.setContent('<body></body>');
await p.addScriptTag({ content: js });

const res = await p.evaluate(seeds => {
  function measure(cv) {
    const W = cv.width, H = cv.height;
    const d = cv.getContext('2d').getImageData(0, 0, W, H).data;
    const L = i => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    /* Take the modal colour as background -- bleed compositions put the frame edge on the
       foreground, so a fixed sample point is unreliable */
    const h = {};
    for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 4) + ',' + (d[i+1] >> 4) + ',' + (d[i+2] >> 4); h[k] = (h[k] || 0) + 1; }
    const bk = Object.entries(h).sort((a, b) => b[1] - a[1])[0][0].split(',').map(n => n * 16 + 8);
    const bgL = 0.2126 * bk[0] + 0.7152 * bk[1] + 0.0722 * bk[2], light = bgL > 128;
    const th = light ? Math.min(100, bgL * 0.42) : bgL + 80;
    const ink = new Uint8Array(W * H); let n = 0;
    for (let q = 0; q < W * H; q++) { const v = L(q * 4); if (light ? v < th : v > th) { ink[q] = 1; n++; } }
    if (n < 200) return null;
    let edge = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const q = y * W + x; if (!ink[q]) continue;
      if (!ink[q-1] || !ink[q+1] || !ink[q-W] || !ink[q+W]) edge++;
    }
    return { inkPct: +(100 * n / (W * H)).toFixed(2), oneOver: Math.round(W / (2 * n / edge)) };
  }
  const rows = [];
  for (const sd of seeds) {
    COLLAGE.init({ count: 12, seed: sd, scale: 1 });
    for (let i = 0; i < 12; i++) { const m = measure(COLLAGE.render(i, 2.6)); if (m) rows.push(m); }
  }
  return rows;
}, [20260808, 20260815, 20260822, 20260829]);

await b.close();
const q = (A, t) => A[Math.floor(A.length * t)];
/* Count line-art plates only. On plates dominated by a dark field, "ink" would include the
   whole colour field, which is not the same kind of object as the reference baseline. Drop them. */
const line = res.filter(r => r.inkPct < 20);
const sw = line.map(r => r.oneOver).sort((a, b) => a - b);
const ik = line.map(r => r.inkPct).sort((a, b) => a - b);
console.log(`n=${line.length}/${res.length} (dropped ${res.length - line.length} dark-field-dominated plates)`);
console.log(`  line weight 1/N   q25=${q(sw,.25)}  median=${q(sw,.5)}  q75=${q(sw,.75)}`);
console.log(`  ink coverage %    q25=${q(ik,.25)}  median=${q(ik,.5)}  q75=${q(ik,.75)}`);
console.log(`\nReference baseline (measured on editorial illustrations): line weight 80/106/122 · ink coverage 1.3/4.3/8.6`);
