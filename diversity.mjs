/* 多样性自检：把每张降到 24×24 去均值，算两两 L2 距离。
   墨覆盖是标量，可以单独优化到达标而画面全长一个样 —— 必须同时盯这个数。
   用法: node diversity.mjs */
import { chromium } from 'playwright';
import fs from 'fs';
const js = fs.readFileSync('scripts/collage.js', 'utf8');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 900, height: 700 } });
await p.setContent('<body></body>');
await p.addScriptTag({ content: js });

const out = await p.evaluate(seeds => {
  const N = 24;
  function sig(cv) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(cv, 0, 0, N, N);
    const d = g.getImageData(0, 0, N, N).data, v = [];
    for (let i = 0; i < d.length; i += 4) v.push((0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2]) / 255);
    const m = v.reduce((a, b) => a + b, 0) / v.length;   /* 去掉底色亮度，只比结构 */
    return v.map(x => x - m);
  }
  function pair(S) {
    let sum = 0, n = 0, mn = 1e9, at = '';
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      let s = 0; for (let k = 0; k < S[i].v.length; k++) { const t = S[i].v[k] - S[j].v[k]; s += t * t; }
      const d = Math.sqrt(s / S[i].v.length); sum += d; n++;
      if (d < mn) { mn = d; at = S[i].n + ' ≈ ' + S[j].n; }
    }
    return { mean: +(sum / n).toFixed(4), min: +mn.toFixed(4), closest: at };
  }
  const res = { sheets: [], same: {} };
  for (const sd of seeds) {
    COLLAGE.init({ count: 12, seed: sd, scale: 1 });
    const S = [];
    for (let i = 0; i < 12; i++) S.push({ v: sig(COLLAGE.render(i, 1.4)), n: COLLAGE.meta(i).en || COLLAGE.meta(i).viz });
    res.sheets.push({ seed: sd, ...pair(S) });
  }
  /* 同一标本的重复实例 —— 「每张都不一样」真正的指标 */
  for (const target of ['gauge', 'pie', 'tree', 'network']) {
    COLLAGE.init({ count: 220, seed: seeds[0], scale: 1 });
    const S = [];
    for (let i = 0; i < 220 && S.length < 10; i++)
      if (COLLAGE.meta(i).viz === target) S.push({ v: sig(COLLAGE.render(i, 1.4)), n: target + '#' + S.length });
    if (S.length > 2) res.same[target] = pair(S);
  }
  return res;
}, [20260808, 20260815, 20260822, 20260829]);

await b.close();
console.log('一屏之内（12 张，不同标本）：');
for (const s of out.sheets) console.log(`  seed ${s.seed}   平均 ${s.mean}   最近 ${s.min}   ${s.closest}`);
console.log('\n同一标本的重复实例：');
for (const k in out.same) console.log(`  ${k.padEnd(9)} 平均 ${out.same[k].mean}   最近 ${out.same[k].min}`);
console.log('\n判据：同标本重复实例的平均距离，应当不低于一屏之内不同标本的平均距离。');
