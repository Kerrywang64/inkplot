/* 笔宽与墨覆盖的量化自检。
   笔宽用「面积/边缘比」估计：一条长 l 宽 w 的笔画，面积 = w·l，边缘像素 ≈ 2l
   => w ≈ 2×面积 ÷ 边缘数。抗抗锯齿、抗压缩噪点，比游程众数可靠得多。
   用法: node measure.mjs */
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
    /* 背景取众数色 —— 出血构图会让边缘落在前景上，采样点不可靠 */
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
/* 只统计线稿型的图：深色场占主导的那些，"墨"会把整块色场算进去，
   和参考基线不是同一类对象，剔除。 */
const line = res.filter(r => r.inkPct < 20);
const sw = line.map(r => r.oneOver).sort((a, b) => a - b);
const ik = line.map(r => r.inkPct).sort((a, b) => a - b);
console.log(`n=${line.length}/${res.length}（剔除深色场主导的 ${res.length - line.length} 张）`);
console.log(`  笔宽 1/N   q25=${q(sw,.25)}  中位=${q(sw,.5)}  q75=${q(sw,.75)}`);
console.log(`  墨覆盖 %   q25=${q(ik,.25)}  中位=${q(ik,.5)}  q75=${q(ik,.75)}`);
console.log(`\n参考基线（编辑插画实测）：笔宽 80/106/122 · 墨覆盖 1.3/4.3/8.6`);
