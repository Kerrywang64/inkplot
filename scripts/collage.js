/* ============================================================
   riso-press · COLLAGE  v1
   拼贴排版引擎。

   为什么是拼贴而不是"生成插画"：
   把 anthropic.com 首页 28 张插图全部放大看过之后，结论是这套风格的主体
   材料是**找来的实物图** —— 19 世纪铜版画扫描件、实物摄影、真实印刷网点。
   线描只占一小部分，而且是干笔（炭笔/蜡笔），不是钢笔勾线。

   素材是输入，不是算法能生成的东西。所以这个引擎只做算法能做对的那一半：

     色场分割 · 撕边 · 干笔笔触 · 网点叠印 · 单色化 · 构图骨架

   图片槽位（slot）由外部素材填充。没有素材时用程序化占位，占位一眼看得出
   是占位，不冒充成品。

   用法:
     COLLAGE.materials([{src:'engraving-01.png', kind:'engraving'}, ...]);
     COLLAGE.init({ count:24, seed:20260808 });
     COLLAGE.attach(el, 0);
   ============================================================ */
(function (root) {
'use strict';

/* ───────── 随机 ───────── */
var SEED = 1;
function srnd(s) { SEED = s >>> 0; }
function rnd() { SEED = (SEED * 1664525 + 1013904223) >>> 0; return SEED / 4294967296; }
function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function rf(a, b) { return a + rnd() * (b - a); }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }

function mkNoise(seed) {
  var p = new Float32Array(256), s = seed >>> 0;
  for (var i = 0; i < 256; i++) { s = (s * 1664525 + 1013904223) >>> 0; p[i] = s / 4294967296; }
  function g(a, b) { return p[((a * 73 + b * 151) & 255)]; }
  return function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
    var t = a + (b - a) * u;
    return t + ((c + (d - c) * u) - t) * v;
  };
}
function fbm(n, x, y, o) { var v = 0, a = 0.5, f = 1; for (var i = 0; i < (o || 4); i++) { v += a * n(x * f, y * f); f *= 2; a *= 0.5; } return v; }

/* ───────── 色 ─────────
   取自首页 28 张实测：中饱和、偏土、偶有一个高饱和度的跳色 */
var FIELDS = [
  /* 土系（原来只有这一族，太保守） */
  [204, 120,  92], [217, 119,  87], [201, 163, 138], [232, 168,  64], [166,  92,  44],
  /* 绿系 */
  [124, 144, 104], [ 98, 116,  86], [ 68, 150,  72], [ 32, 104,  76], [176, 200,  92],
  /* 青蓝系 */
  [ 74, 160, 152], [ 44, 122, 140], [104, 158, 214], [ 38,  70, 148], [140, 200, 208],
  /* 紫粉红系 */
  [155, 147, 224], [112,  84, 188], [196,  84, 122], [230, 128, 160], [ 92,  38,  52],
  /* 高饱和跳色 —— 每张最多用一个，靠 contrastPick 保证不撞 */
  [232,  60,  52], [248, 120,  32], [252, 208,  60], [ 24, 176, 128], [236,  84, 148],
  /* 中性 */
  [237, 228, 211], [227, 225, 220], [206, 200, 188], [ 26,  26,  24], [ 58,  56,  52]
];
/* 色调族：一张画面从同一族里取两个色，不同族之间大胆跳
   —— 这样既敢用高饱和，又不会两个艳色平分画面 */
var FAMILIES = [[0,5],[5,10],[10,15],[15,20],[20,25],[25,30]];
var PAPER = [244, 240, 230];
var INK   = [ 24,  24,  22];
function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')'; }
function lum(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; }
/* 第二色场：明度差必须 ≥ 62，否则两个色平分画面会互相打架。
   在合格的候选里随机取，而不是取最大差 —— 取最大会永远选到黑白。 */
function contrastPick(bg, pool) {
  var ok = [];
  for (var i = 0; i < pool.length; i++) if (Math.abs(lum(pool[i]) - lum(bg)) >= 62) ok.push(pool[i]);
  if (!ok.length) {
    var best = pool[0], bd = -1;
    for (var k = 0; k < pool.length; k++) { var d = Math.abs(lum(pool[k]) - lum(bg)); if (d > bd) { bd = d; best = pool[k]; } }
    return best;
  }
  return ok[Math.floor(rnd() * ok.length)];
}

/* ───────── 撕边 ───────── */
var EN = null;
function tornPath(g, pts, amp) {
  amp = amp === undefined ? 1 : amp;
  g.beginPath();
  var acc = 0;
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i], q = pts[(i + 1) % pts.length];
    var L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    var seg = Math.max(3, Math.round(L / 6));
    var ux = (q[0] - p[0]) / (L || 1), uy = (q[1] - p[1]) / (L || 1);
    for (var k = 0; k < seg; k++) {
      var t = k / seg, d = acc + L * t;
      var e = EN ? ((fbm(EN, d / 22, i * 3.7, 3) - 0.5) * 5.2 + (EN(d / 2.4, i * 11.3) - 0.5) * 2.4) * amp : 0;
      var x = p[0] + (q[0] - p[0]) * t - uy * e, y = p[1] + (q[1] - p[1]) * t + ux * e;
      (i === 0 && k === 0) ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    acc += L;
  }
  g.closePath();
}
/* 扇贝边：首页那张粉/酒红的分界就是这个 */
function scallopPath(g, x, y, w, h, n, up) {
  var r = w / (2 * n);
  g.beginPath();
  g.moveTo(x, y + (up ? h : 0));
  for (var i = 0; i < n; i++) {
    var cx = x + r * (2 * i + 1);
    g.arc(cx, y, r, Math.PI, 0, !up);
  }
  g.lineTo(x + w, y + (up ? h : h));
  g.lineTo(x, y + h);
  g.closePath();
}

/* ───────── 干笔笔触 ─────────
   炭笔/蜡笔：宽度不匀、边缘发毛、中段有断墨。不是等宽矢量线。 */
function dryStroke(g, P, w, col) {
  var pass = 3;
  for (var p = 0; p < pass; p++) {
    g.globalAlpha = p === 0 ? 0.95 : 0.45;
    g.strokeStyle = col;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = w * (p === 0 ? 1 : rf(0.35, 0.7));
    g.beginPath();
    for (var i = 0; i < P.length; i++) {
      var j = w * (p === 0 ? 0.16 : 0.42);
      var x = P[i][0] + (rnd() - 0.5) * j, y = P[i][1] + (rnd() - 0.5) * j;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  /* 断墨：沿路径随机剜掉几段 */
  g.save();
  g.globalCompositeOperation = 'destination-out';
  for (var k = 0; k < P.length; k += ri(4, 9)) {
    if (rnd() < 0.34) {
      g.beginPath();
      g.arc(P[k][0] + (rnd() - 0.5) * w, P[k][1] + (rnd() - 0.5) * w, w * rf(0.16, 0.42), 0, 6.2832);
      g.fill();
    }
  }
  g.restore();
}
function segPts(x1, y1, x2, y2, n) {
  var P = []; n = n || 26;
  for (var i = 0; i <= n; i++) { var t = i / n; P.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); }
  return P;
}

/* ───────── 网点叠印 ─────────
   把一块区域按亮度打成网点。真印刷网点是不匀的，所以点心也带抖动。 */
function screenRegion(cv, x, y, w, h, step, col, N) {
  var g = cv.getContext('2d');
  var src = g.getImageData(x, y, w, h), d = src.data;
  g.clearRect(x, y, w, h);
  g.fillStyle = col;
  for (var j = 0; j * step < h + step; j++) {
    for (var i = 0; i * step < w + step; i++) {
      var px = Math.min(w - 1, Math.round(i * step + (j % 2) * step * 0.5));
      var py = Math.min(h - 1, Math.round(j * step));
      var o = (py * w + px) * 4;
      var L = (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) / 255;
      var a = d[o + 3] / 255;
      var r = step * 0.62 * Math.sqrt(Math.max(0, 1 - L)) * a;
      r *= 0.8 + 0.4 * fbm(N, i * 0.4, j * 0.4, 2);         /* 点心不匀 */
      if (r > 0.25) {
        g.beginPath();
        g.arc(x + px + (rnd() - 0.5) * step * 0.16, y + py + (rnd() - 0.5) * step * 0.16, r, 0, 6.2832);
        g.fill();
      }
    }
  }
}

/* ───────── 数据可视化标本库 ─────────
   槽位里放的不是照片，是**数据图形**。理由：可算法生成、可复现、零素材依赖，
   而且它自带含义 —— 饼图就是饼图，抽出任何一张都认得出在说什么。

   三条硬约束（上一轮翻车的教训全在这）：
     1. 一个槽位只放一个标本，不叠加
     2. 元素数量封顶（饼 3–5 瓣、柱 5–9 根、散点 ≤ 34），宁少不多
     3. 标本占槽位 55%–75%，四周留白，不铺满
   ============================================================ */

var LW = 2;                                    /* 标本笔宽，由槽位尺寸推出 */
/* 笔法模式：同一个标本，画法不同就是两张图。
   0 常规 · 1 偏实心 · 2 全空心细线 · 3 虚线 · 4 全实心 */
var STYLE = 0;
function lineTo(g, P) { g.beginPath(); for (var i = 0; i < P.length; i++) i ? g.lineTo(P[i][0], P[i][1]) : g.moveTo(P[i][0], P[i][1]); }
function disc(g, x, y, r) {
  if (STYLE === 2) return ring(g, x, y, r);
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
}
function ring(g, x, y, r) {
  if (STYLE === 1 || STYLE === 4) { g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); return; }
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke();
}

/* 每个标本函数拿到一个已经留好边的方框 R = {x,y,w,h,cx,cy,s} */
var VIZ = {

  pie: ['饼图', 'Pie', function (g, R) {
    var n = ri(3, 5), r = R.s * 0.42, a = -1.5708, parts = [];
    for (var i = 0; i < n; i++) parts.push(rf(0.6, 2.2));
    var tot = parts.reduce(function (x, y) { return x + y; }, 0);
    for (var i2 = 0; i2 < n; i2++) {
      var d = parts[i2] / tot * 6.2832, off = i2 === 0 ? r * 0.10 : 0;   /* 只有一瓣拉出来 */
      var mid = a + d / 2;
      g.beginPath();
      g.moveTo(R.cx + Math.cos(mid) * off, R.cy + Math.sin(mid) * off);
      g.arc(R.cx + Math.cos(mid) * off, R.cy + Math.sin(mid) * off, r, a, a + d);
      g.closePath();
      if (i2 === 0) g.fill(); else g.stroke();
      a += d;
    }
  }],

  donut: ['环图', 'Donut', function (g, R) {
    var r = R.s * 0.40, t = r * 0.34, n = ri(3, 4), a = -1.5708;
    for (var i = 0; i < n; i++) {
      var d = 6.2832 / n * rf(0.6, 1.4);
      g.lineWidth = t;
      g.beginPath(); g.arc(R.cx, R.cy, r, a + 0.04, a + d - 0.04); g.stroke();
      a += d; if (a > 4.9) break;
    }
    g.lineWidth = LW;
  }],

  venn: ['文氏图', 'Venn', function (g, R) {
    var n = rnd() < 0.55 ? 2 : 3, r = R.s * (n === 2 ? 0.28 : 0.24);
    var C = n === 2 ? [[-r * 0.62, 0], [r * 0.62, 0]]
                    : [[0, -r * 0.66], [-r * 0.60, r * 0.40], [r * 0.60, r * 0.40]];
    var hit = ri(0, n - 1);
    for (var i = 0; i < n; i++) {
      g.beginPath(); g.arc(R.cx + C[i][0], R.cy + C[i][1], r, 0, 6.2832);
      if (i === hit) { g.globalAlpha = 0.22; g.fill(); g.globalAlpha = 1; }
      g.stroke();
    }
  }],

  bars: ['直方图', 'Histogram', function (g, R) {
    var n = ri(5, 9), gw = R.w / n, base = R.y + R.h * 0.90;
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n;
      var h = R.h * 0.76 * (0.18 + 0.82 * Math.exp(-Math.pow((t - 0.45) * 2.6, 2)));
      var x = R.x + gw * i + gw * 0.18, w = gw * 0.64;
      if (i === ((n / 2) | 0)) g.fillRect(x, base - h, w, h);
      else g.strokeRect(x, base - h, w, h);
    }
    lineTo(g, [[R.x, base], [R.x + R.w, base]]); g.stroke();
  }],

  lollipop: ['点棒图', 'Lollipop', function (g, R) {
    var n = ri(4, 7), gw = R.w / n, base = R.y + R.h * 0.90;
    for (var i = 0; i < n; i++) {
      var x = R.x + gw * (i + 0.5), h = R.h * rf(0.22, 0.78);
      lineTo(g, [[x, base], [x, base - h]]); g.stroke();
      disc(g, x, base - h, LW * 2.1);
    }
    lineTo(g, [[R.x, base], [R.x + R.w, base]]); g.stroke();
  }],

  line: ['折线', 'Line', function (g, R) {
    var n = ri(6, 10), P = [], y = R.cy;
    for (var i = 0; i <= n; i++) {
      y += rf(-1, 1) * R.h * 0.16;
      y = Math.max(R.y + R.h * 0.12, Math.min(R.y + R.h * 0.88, y));
      P.push([R.x + R.w * i / n, y]);
    }
    g.lineWidth = LW * 1.3; lineTo(g, P); g.stroke(); g.lineWidth = LW;
    disc(g, P[P.length - 1][0], P[P.length - 1][1], LW * 2.0);
    lineTo(g, [[R.x, R.y + R.h * 0.96], [R.x + R.w, R.y + R.h * 0.96]]); g.stroke();
  }],

  area: ['面积图', 'Area', function (g, R) {
    var n = 9, P = [], y = R.cy;
    for (var i = 0; i <= n; i++) {
      y += rf(-1, 1) * R.h * 0.14;
      y = Math.max(R.y + R.h * 0.16, Math.min(R.y + R.h * 0.80, y));
      P.push([R.x + R.w * i / n, y]);
    }
    g.beginPath(); g.moveTo(P[0][0], R.y + R.h * 0.92);
    for (var k = 0; k < P.length; k++) g.lineTo(P[k][0], P[k][1]);
    g.lineTo(P[P.length - 1][0], R.y + R.h * 0.92); g.closePath();
    g.globalAlpha = 0.26; g.fill(); g.globalAlpha = 1;
    lineTo(g, P); g.stroke();
  }],

  scatter: ['散点', 'Scatter', function (g, R) {
    var n = ri(16, 30);
    for (var i = 0; i < n; i++) {
      var t = rnd();
      var x = R.x + R.w * (0.08 + t * 0.84 + rf(-0.06, 0.06));
      var y = R.y + R.h * (0.88 - t * 0.70 + rf(-0.12, 0.12));
      if (rnd() < 0.30) disc(g, x, y, LW * 1.5); else { ring(g, x, y, LW * 1.5); }
    }
    lineTo(g, [[R.x + R.w * 0.06, R.y + R.h * 0.84], [R.x + R.w * 0.94, R.y + R.h * 0.20]]); g.stroke();
  }],

  nebula: ['星云图', 'Nebula', function (g, R) {
    var n = ri(120, 220), N2 = mkNoise(ri(1, 1e9));
    for (var i = 0; i < n; i++) {
      var a = rnd() * 6.2832, rr = Math.pow(rnd(), 0.6) * R.s * 0.44;
      var x = R.cx + Math.cos(a) * rr * rf(0.9, 1.5), y = R.cy + Math.sin(a) * rr;
      var v = fbm(N2, (x - R.x) / (R.w * 0.24), (y - R.y) / (R.h * 0.24), 3);
      if (v < 0.42) continue;
      disc(g, x, y, LW * (0.28 + Math.pow(rnd(), 3) * 1.5));
    }
    ring(g, R.cx, R.cy, R.s * 0.46);
  }],

  contour: ['等值线', 'Contour', function (g, R) {
    var N2 = mkNoise(ri(1, 1e9)), lv = ri(3, 5);
    for (var L = 1; L <= lv; L++) {
      var P = [];
      for (var a = 0; a <= 64; a++) {
        var t = a / 64 * 6.2832;
        var rr = R.s * (0.10 + 0.30 * L / lv) * (0.72 + 0.5 * fbm(N2, Math.cos(t) * 1.4 + 3, Math.sin(t) * 1.4 + 3, 3));
        P.push([R.cx + Math.cos(t) * rr * 1.15, R.cy + Math.sin(t) * rr]);
      }
      P.push(P[0]); lineTo(g, P); g.stroke();
    }
  }],

  tree: ['树图', 'Tree', function (g, R) {
    var lv = 3, prev = [{ x: R.cx, y: R.y + R.h * 0.12 }], all = [prev[0]], r = R.s * 0.036;
    for (var L = 1; L < lv; L++) {
      var y = R.y + R.h * (0.12 + 0.72 * L / (lv - 1)), cur = [], plan = [], cnt = 0, idx = 0;
      for (var i = 0; i < prev.length; i++) { var k = ri(2, 3); plan.push(k); cnt += k; }
      for (var i2 = 0; i2 < prev.length; i2++) for (var k2 = 0; k2 < plan[i2]; k2++) {
        var nd = { x: R.x + R.w * (idx + 0.5) / cnt, y: y };
        lineTo(g, [[prev[i2].x, prev[i2].y + r], [nd.x, nd.y - r]]); g.stroke();
        cur.push(nd); all.push(nd); idx++;
      }
      prev = cur;
    }
    for (var i3 = 0; i3 < all.length; i3++)
      (rnd() < 0.34) ? disc(g, all[i3].x, all[i3].y, r) : ring(g, all[i3].x, all[i3].y, r);
  }],

  dendro: ['聚类树', 'Dendrogram', function (g, R) {
    var n = 6, xs = [], base = R.y + R.h * 0.90;
    for (var i = 0; i < n; i++) xs.push({ x: R.x + R.w * (i + 0.5) / n, y: base });
    var lvl = 0;
    while (xs.length > 1 && lvl < 4) {
      var nx = [];
      for (var i2 = 0; i2 + 1 < xs.length; i2 += 2) {
        var a = xs[i2], b = xs[i2 + 1];
        var top = base - R.h * 0.20 * (lvl + 1) - R.h * 0.04;
        lineTo(g, [[a.x, a.y], [a.x, top], [b.x, top], [b.x, b.y]]); g.stroke();
        nx.push({ x: (a.x + b.x) / 2, y: top });
      }
      if (xs.length % 2) nx.push(xs[xs.length - 1]);
      xs = nx; lvl++;
    }
    for (var i3 = 0; i3 < n; i3++) disc(g, R.x + R.w * (i3 + 0.5) / n, base, LW * 1.4);
  }],

  network: ['网络图', 'Network', function (g, R) {
    var n = ri(6, 9), P = [], tries = 0, minD = R.s * 0.22;
    while (P.length < n && tries++ < 700) {
      var p = { x: R.x + rf(0.08, 0.92) * R.w, y: R.y + rf(0.08, 0.92) * R.h }, ok = true;
      for (var i = 0; i < P.length; i++) if (Math.hypot(P[i].x - p.x, P[i].y - p.y) < minD) { ok = false; break; }
      if (ok) P.push(p);
    }
    var inT = [0], out = []; for (var i2 = 1; i2 < P.length; i2++) out.push(i2);
    while (out.length) {                       /* 最小生成树：连线数最少，画面不糊 */
      var bi = 0, bj = 0, bd = 1e9;
      for (var a = 0; a < inT.length; a++) for (var b = 0; b < out.length; b++) {
        var d = Math.hypot(P[inT[a]].x - P[out[b]].x, P[inT[a]].y - P[out[b]].y);
        if (d < bd) { bd = d; bi = inT[a]; bj = b; }
      }
      lineTo(g, [[P[bi].x, P[bi].y], [P[out[bj]].x, P[out[bj]].y]]); g.stroke();
      inT.push(out[bj]); out.splice(bj, 1);
    }
    var r2 = R.s * 0.040;
    for (var i3 = 0; i3 < P.length; i3++)
      (rnd() < 0.32) ? disc(g, P[i3].x, P[i3].y, r2) : ring(g, P[i3].x, P[i3].y, r2);
  }],

  sankey: ['桑基图', 'Sankey', function (g, R) {
    var n = ri(2, 3), lx = R.x + R.w * 0.10, rx = R.x + R.w * 0.90;
    var ys = [], tot = 0, wts = [];
    for (var i = 0; i < n; i++) { wts.push(rf(0.6, 1.8)); tot += wts[i]; }
    var acc = R.y + R.h * 0.14, span = R.h * 0.72;
    for (var i2 = 0; i2 < n; i2++) {
      var th = span * wts[i2] / tot * 0.82;
      var y0 = acc + th / 2, y1 = R.y + R.h * (0.20 + 0.60 * (i2 + 0.5) / n);
      g.globalAlpha = 0.24; g.lineWidth = th;
      g.beginPath(); g.moveTo(lx, y0);
      g.bezierCurveTo(R.cx, y0, R.cx, y1, rx, y1); g.stroke();
      g.globalAlpha = 1; g.lineWidth = LW;
      acc += th + span * 0.06;
    }
    g.fillRect(lx - LW * 2.4, R.y + R.h * 0.14, LW * 2.4, R.h * 0.72);
    g.fillRect(rx, R.y + R.h * 0.18, LW * 2.4, R.h * 0.64);
  }],

  chord: ['弦图', 'Chord', function (g, R) {
    var r = R.s * 0.40, n = ri(3, 5), pts = [];
    ring(g, R.cx, R.cy, r);
    for (var i = 0; i < n; i++) { var a = rnd() * 6.2832; pts.push([R.cx + Math.cos(a) * r, R.cy + Math.sin(a) * r]); }
    for (var i2 = 0; i2 < n; i2++) {
      var a2 = pts[i2], b2 = pts[(i2 + 1) % n];
      g.beginPath(); g.moveTo(a2[0], a2[1]);
      g.quadraticCurveTo(R.cx, R.cy, b2[0], b2[1]); g.stroke();
    }
    for (var i3 = 0; i3 < n; i3++) disc(g, pts[i3][0], pts[i3][1], LW * 1.6);
  }],

  radar: ['雷达图', 'Radar', function (g, R) {
    var n = ri(5, 6), r = R.s * 0.40, P = [];
    for (var k = 1; k <= 2; k++) {                /* 只画两圈网格 */
      var G = [];
      for (var i = 0; i <= n; i++) { var a = -1.5708 + i / n * 6.2832; G.push([R.cx + Math.cos(a) * r * k / 2, R.cy + Math.sin(a) * r * k / 2]); }
      lineTo(g, G); g.stroke();
    }
    for (var i2 = 0; i2 < n; i2++) {
      var a2 = -1.5708 + i2 / n * 6.2832;
      lineTo(g, [[R.cx, R.cy], [R.cx + Math.cos(a2) * r, R.cy + Math.sin(a2) * r]]); g.stroke();
      P.push([R.cx + Math.cos(a2) * r * rf(0.35, 0.95), R.cy + Math.sin(a2) * r * rf(0.35, 0.95)]);
    }
    P.push(P[0]);
    lineTo(g, P); g.globalAlpha = 0.28; g.fill(); g.globalAlpha = 1; g.stroke();
  }],

  rose: ['玫瑰图', 'Rose', function (g, R) {
    var n = ri(6, 9), r = R.s * 0.42;
    for (var i = 0; i < n; i++) {
      var a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832 - 0.03;
      var rr = r * (0.34 + 0.66 * Math.abs(Math.sin(i * 1.7)));
      g.beginPath(); g.moveTo(R.cx, R.cy);
      g.arc(R.cx, R.cy, rr, a0, a1); g.closePath();
      (i % 3 === 0) ? g.fill() : g.stroke();
    }
  }],

  matrix: ['矩阵图', 'Matrix', function (g, R) {
    var n = ri(4, 6), c = Math.min(R.w, R.h) / n * 0.92, ox = R.cx - c * n / 2, oy = R.cy - c * n / 2;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var v = Math.abs(Math.sin(i * 1.9 + j * 2.7));
      var x = ox + i * c, y = oy + j * c;
      if (v > 0.66) g.fillRect(x + c * 0.08, y + c * 0.08, c * 0.84, c * 0.84);
      else if (v > 0.33) { g.globalAlpha = 0.34; g.fillRect(x + c * 0.08, y + c * 0.08, c * 0.84, c * 0.84); g.globalAlpha = 1; }
      else g.strokeRect(x + c * 0.08, y + c * 0.08, c * 0.84, c * 0.84);
    }
  }],

  waffle: ['单位图', 'Waffle', function (g, R) {
    var n = 5, c = Math.min(R.w, R.h) / n * 0.90, ox = R.cx - c * n / 2, oy = R.cy - c * n / 2;
    var fill = ri(7, 17);
    for (var i = 0; i < n * n; i++) {
      var x = ox + (i % n) * c, y = oy + ((i / n) | 0) * c, r = c * 0.32;
      if (i < fill) disc(g, x + c / 2, y + c / 2, r); else ring(g, x + c / 2, y + c / 2, r);
    }
  }],

  box: ['箱线图', 'Box Plot', function (g, R) {
    var n = ri(3, 4), gw = R.w / n;
    for (var i = 0; i < n; i++) {
      var x = R.x + gw * (i + 0.5), w = gw * 0.34;
      var m = R.y + R.h * rf(0.35, 0.65), q = R.h * rf(0.10, 0.18), wsk = q * rf(1.5, 2.2);
      lineTo(g, [[x, m - wsk], [x, m + wsk]]); g.stroke();
      lineTo(g, [[x - w * 0.5, m - wsk], [x + w * 0.5, m - wsk]]); g.stroke();
      lineTo(g, [[x - w * 0.5, m + wsk], [x + w * 0.5, m + wsk]]); g.stroke();
      g.strokeRect(x - w, m - q, w * 2, q * 2);
      lineTo(g, [[x - w, m + rf(-0.3, 0.3) * q], [x + w, m + rf(-0.3, 0.3) * q]]); g.stroke();
    }
  }],

  gauge: ['仪表', 'Gauge', function (g, R) {
    var r = R.s * 0.40, cy = R.cy + R.s * 0.14;
    g.lineWidth = LW * 1.1;
    g.beginPath(); g.arc(R.cx, cy, r, Math.PI, 6.2832); g.stroke();
    var v = rf(0.18, 0.86);
    g.lineWidth = LW * 3.4;
    g.beginPath(); g.arc(R.cx, cy, r, Math.PI, Math.PI + Math.PI * v); g.stroke();
    g.lineWidth = LW;
    for (var i = 0; i <= 6; i++) {
      var a = Math.PI + i / 6 * Math.PI;
      lineTo(g, [[R.cx + Math.cos(a) * r * 1.10, cy + Math.sin(a) * r * 1.10],
                 [R.cx + Math.cos(a) * r * 1.22, cy + Math.sin(a) * r * 1.22]]); g.stroke();
    }
    var av = Math.PI + Math.PI * v;
    lineTo(g, [[R.cx, cy], [R.cx + Math.cos(av) * r * 0.80, cy + Math.sin(av) * r * 0.80]]); g.stroke();
    disc(g, R.cx, cy, LW * 2.0);
  }],

  timeline: ['时间轴', 'Timeline', function (g, R) {
    var y = R.cy, n = ri(4, 6);
    g.lineWidth = LW * 1.2; lineTo(g, [[R.x, y], [R.x + R.w, y]]); g.stroke(); g.lineWidth = LW;
    for (var i = 0; i < n; i++) {
      var x = R.x + R.w * (i + 0.5) / n, up = i % 2 === 0, h = R.h * rf(0.14, 0.30);
      lineTo(g, [[x, y], [x, y + (up ? -h : h)]]); g.stroke();
      (i === ((n / 2) | 0)) ? disc(g, x, y + (up ? -h : h), LW * 2.2) : ring(g, x, y + (up ? -h : h), LW * 2.0);
    }
  }],

  stream: ['流图', 'Stream', function (g, R) {
    var lanes = ri(2, 3), N2 = mkNoise(ri(1, 1e9));
    for (var L = 0; L < lanes; L++) {
      var top = [], bot = [];
      for (var i = 0; i <= 20; i++) {
        var t = i / 20, x = R.x + R.w * t;
        var mid = R.y + R.h * (0.30 + 0.40 * (L + 0.5) / lanes);
        var th = R.h * 0.09 * (0.4 + 1.2 * fbm(N2, t * 2.2 + L * 5, L * 3, 3)) * Math.sin(Math.max(0.02, t) * Math.PI);
        top.push([x, mid - th]); bot.push([x, mid + th]);
      }
      g.beginPath(); g.moveTo(top[0][0], top[0][1]);
      for (var k = 1; k < top.length; k++) g.lineTo(top[k][0], top[k][1]);
      for (var k2 = bot.length - 1; k2 >= 0; k2--) g.lineTo(bot[k2][0], bot[k2][1]);
      g.closePath();
      if (L === 0) { g.globalAlpha = 0.30; g.fill(); g.globalAlpha = 1; }
      g.stroke();
    }
  }],

  /* ── 以下是较新的形式：嵌入投影、注意力、拓扑、密度族 ── */

  umap: ['嵌入投影', 'Embedding', function (g, R) {
    var k = ri(3, 4), C = [];
    for (var i = 0; i < k; i++) C.push([R.cx + rf(-0.30, 0.30) * R.w, R.cy + rf(-0.30, 0.30) * R.h, R.s * rf(0.09, 0.15)]);
    for (var c = 0; c < k; c++) {
      var n = ri(14, 26);
      for (var i2 = 0; i2 < n; i2++) {
        var a = rnd() * 6.2832, rr = Math.pow(rnd(), 0.55) * C[c][2];
        var x = C[c][0] + Math.cos(a) * rr * rf(0.8, 1.3), y = C[c][1] + Math.sin(a) * rr;
        (c === 0) ? disc(g, x, y, LW * 1.25) : ring(g, x, y, LW * 1.15);
      }
    }
  }],

  attention: ['注意力矩阵', 'Attention', function (g, R) {
    var n = ri(7, 10), c = Math.min(R.w, R.h) / n, ox = R.cx - c * n / 2, oy = R.cy - c * n / 2;
    for (var i = 0; i < n; i++) for (var j = 0; j <= i; j++) {      /* 因果掩码：只有下三角 */
      var v = Math.abs(Math.sin(i * 1.7 + j * 2.3)) * (0.35 + 0.65 * (j + 1) / (i + 1));
      g.globalAlpha = 0.10 + v * 0.85;
      g.fillRect(ox + j * c + c * 0.06, oy + i * c + c * 0.06, c * 0.88, c * 0.88);
    }
    g.globalAlpha = 1;
    g.strokeRect(ox, oy, c * n, c * n);
  }],

  tokens: ['候选分布', 'Top-k', function (g, R) {
    var n = ri(4, 6), gh = R.h / (n + 0.6);
    for (var i = 0; i < n; i++) {
      var y = R.y + gh * (i + 0.3), w = R.w * (0.90 * Math.pow(0.56, i) + 0.06);
      (i === 0) ? g.fillRect(R.x, y, w, gh * 0.56) : g.strokeRect(R.x, y, w, gh * 0.56);
    }
  }],

  beeswarm: ['蜂群图', 'Beeswarm', function (g, R) {
    var n = ri(26, 40), y0 = R.cy, used = [];
    for (var i = 0; i < n; i++) {
      var t = 0.5 + (rnd() + rnd() + rnd() - 1.5) * 0.30;
      var x = R.x + R.w * Math.max(0.03, Math.min(0.97, t));
      var lvl = 0;
      while (used.some(function (u) { return Math.abs(u[0] - x) < LW * 2.6 && u[1] === lvl; }) && lvl < 9) lvl++;
      used.push([x, lvl]);
      var y = y0 + (lvl % 2 ? 1 : -1) * Math.ceil(lvl / 2) * LW * 2.5;
      disc(g, x, y, LW * 1.05);
    }
    lineTo(g, [[R.x, R.y + R.h * 0.94], [R.x + R.w, R.y + R.h * 0.94]]); g.stroke();
  }],

  ridgeline: ['山脊图', 'Ridgeline', function (g, R) {
    var lanes = ri(4, 6), N2 = mkNoise(ri(1, 1e9));
    for (var L = lanes - 1; L >= 0; L--) {
      var base = R.y + R.h * (0.20 + 0.72 * L / (lanes - 1)), P = [];
      for (var i = 0; i <= 34; i++) {
        var t = i / 34;
        var h = R.h * 0.30 * Math.exp(-Math.pow((t - (0.30 + 0.4 * fbm(N2, L * 3.1, 1, 2))) * 3.4, 2))
              * (0.5 + fbm(N2, t * 3 + L * 7, 2, 3));
        P.push([R.x + R.w * t, base - h]);
      }
      g.beginPath(); g.moveTo(P[0][0], base);
      for (var k = 0; k < P.length; k++) g.lineTo(P[k][0], P[k][1]);
      g.lineTo(P[P.length - 1][0], base); g.closePath();
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore();
      g.stroke();
    }
  }],

  violin: ['小提琴图', 'Violin', function (g, R) {
    var n = ri(2, 3), gw = R.w / n, N2 = mkNoise(ri(1, 1e9));
    for (var i = 0; i < n; i++) {
      var cx = R.x + gw * (i + 0.5), P = [], Q = [];
      for (var k = 0; k <= 26; k++) {
        var t = k / 26, y = R.y + R.h * (0.08 + 0.84 * t);
        var w = gw * 0.36 * Math.exp(-Math.pow((t - 0.5) * 2.6, 2)) * (0.55 + fbm(N2, t * 3 + i * 5, 1, 3));
        P.push([cx - w, y]); Q.push([cx + w, y]);
      }
      g.beginPath(); g.moveTo(P[0][0], P[0][1]);
      for (var a = 1; a < P.length; a++) g.lineTo(P[a][0], P[a][1]);
      for (var b = Q.length - 1; b >= 0; b--) g.lineTo(Q[b][0], Q[b][1]);
      g.closePath();
      if (i === 0) { g.globalAlpha = 0.26; g.fill(); g.globalAlpha = 1; }
      g.stroke();
      lineTo(g, [[cx, R.y + R.h * 0.36], [cx, R.y + R.h * 0.64]]); g.lineWidth = LW * 2.2; g.stroke(); g.lineWidth = LW;
    }
  }],

  hexbin: ['六角分箱', 'Hexbin', function (g, R) {
    var rr = R.s * 0.085, N2 = mkNoise(ri(1, 1e9));
    var dx = rr * 1.732, dy = rr * 1.5;
    for (var j = -2; j < R.h / dy + 1; j++) for (var i = -1; i < R.w / dx + 1; i++) {
      var cx = R.x + i * dx + (j % 2 ? dx / 2 : 0), cy = R.y + j * dy;
      if (cx < R.x - rr || cx > R.x + R.w + rr || cy < R.y - rr || cy > R.y + R.h + rr) continue;
      var v = fbm(N2, (cx - R.x) / (R.w * 0.30), (cy - R.y) / (R.h * 0.30), 3);
      if (v < 0.40) continue;
      var k = rr * (0.36 + 0.60 * (v - 0.40) / 0.6), P = [];
      for (var a = 0; a < 6; a++) { var t = -1.5708 + a * 1.0472; P.push([cx + Math.cos(t) * k, cy + Math.sin(t) * k]); }
      P.push(P[0]); lineTo(g, P);
      (v > 0.62) ? g.fill() : g.stroke();
    }
  }],

  voronoi: ['沃罗诺伊', 'Voronoi', function (g, R) {
    var n = ri(7, 11), S = [];
    for (var i = 0; i < n; i++) S.push([R.x + rf(0.06, 0.94) * R.w, R.y + rf(0.06, 0.94) * R.h]);
    var step = Math.max(2, R.s / 90);
    g.save(); g.beginPath(); g.rect(R.x, R.y, R.w, R.h); g.clip();
    for (var y = R.y; y < R.y + R.h; y += step) for (var x = R.x; x < R.x + R.w; x += step) {
      var b1 = 1e9, b2 = 1e9;
      for (var k = 0; k < n; k++) {
        var d = (S[k][0] - x) * (S[k][0] - x) + (S[k][1] - y) * (S[k][1] - y);
        if (d < b1) { b2 = b1; b1 = d; } else if (d < b2) b2 = d;
      }
      if (Math.sqrt(b2) - Math.sqrt(b1) < step * 0.9) g.fillRect(x, y, LW * 0.9, LW * 0.9);
    }
    g.restore();
    for (var i2 = 0; i2 < n; i2++) disc(g, S[i2][0], S[i2][1], LW * 1.5);
  }],

  treemap: ['矩形树图', 'Treemap', function (g, R) {
    function split(x, y, w, h, d) {
      if (d === 0 || w < R.s * 0.14 || h < R.s * 0.14) {
        (rnd() < 0.25) ? g.fillRect(x + LW, y + LW, w - LW * 2, h - LW * 2)
                       : g.strokeRect(x + LW, y + LW, w - LW * 2, h - LW * 2);
        return;
      }
      var t = rf(0.34, 0.66);
      if (w > h) { split(x, y, w * t, h, d - 1); split(x + w * t, y, w * (1 - t), h, d - 1); }
      else       { split(x, y, w, h * t, d - 1); split(x, y + h * t, w, h * (1 - t), d - 1); }
    }
    split(R.x, R.y, R.w, R.h, ri(2, 3));
  }],

  circlepack: ['圆填充', 'Circle Pack', function (g, R) {
    var C = [], tries = 0;
    while (C.length < 16 && tries++ < 900) {
      var r = R.s * rf(0.035, 0.13);
      var x = R.cx + rf(-1, 1) * (R.s * 0.42 - r), y = R.cy + rf(-1, 1) * (R.s * 0.42 - r);
      if (Math.hypot(x - R.cx, y - R.cy) + r > R.s * 0.44) continue;
      var ok = true;
      for (var i = 0; i < C.length; i++) if (Math.hypot(C[i][0] - x, C[i][1] - y) < C[i][2] + r + LW) { ok = false; break; }
      if (ok) C.push([x, y, r]);
    }
    ring(g, R.cx, R.cy, R.s * 0.45);
    for (var k = 0; k < C.length; k++) (k % 5 === 0) ? disc(g, C[k][0], C[k][1], C[k][2]) : ring(g, C[k][0], C[k][1], C[k][2]);
  }],

  arcdiag: ['弧连接图', 'Arc Diagram', function (g, R) {
    var n = ri(6, 9), y = R.y + R.h * 0.74, xs = [];
    for (var i = 0; i < n; i++) xs.push(R.x + R.w * (i + 0.5) / n);
    lineTo(g, [[R.x, y], [R.x + R.w, y]]); g.stroke();
    for (var k = 0; k < ri(4, 7); k++) {
      var a = ri(0, n - 2), b = Math.min(n - 1, a + ri(1, 3));
      var mid = (xs[a] + xs[b]) / 2, rr = (xs[b] - xs[a]) / 2;
      g.beginPath(); g.arc(mid, y, rr, Math.PI, 0); g.stroke();
    }
    for (var i2 = 0; i2 < n; i2++) disc(g, xs[i2], y, LW * 1.5);
  }],

  parallel: ['平行坐标', 'Parallel Coords', function (g, R) {
    var ax = ri(3, 5), n = ri(5, 8);
    for (var i = 0; i < ax; i++) {
      var x = R.x + R.w * i / (ax - 1);
      lineTo(g, [[x, R.y], [x, R.y + R.h]]); g.globalAlpha = 0.45; g.stroke(); g.globalAlpha = 1;
    }
    for (var k = 0; k < n; k++) {
      var P = [];
      for (var i2 = 0; i2 < ax; i2++) P.push([R.x + R.w * i2 / (ax - 1), R.y + R.h * rf(0.08, 0.92)]);
      lineTo(g, P);
      g.lineWidth = k === 0 ? LW * 1.9 : LW * 0.8; g.stroke(); g.lineWidth = LW;
    }
  }],

  bump: ['名次流', 'Bump Chart', function (g, R) {
    var n = ri(3, 4), t = ri(4, 5), rank = [];
    for (var i = 0; i < n; i++) rank.push(i);
    var series = [];
    for (var i2 = 0; i2 < n; i2++) series.push([]);
    for (var c = 0; c < t; c++) {
      var a = ri(0, n - 1), b = ri(0, n - 1), tmp = rank[a]; rank[a] = rank[b]; rank[b] = tmp;
      for (var i3 = 0; i3 < n; i3++) series[i3].push([R.x + R.w * c / (t - 1), R.y + R.h * (0.12 + 0.76 * rank.indexOf(i3) / (n - 1))]);
    }
    for (var i4 = 0; i4 < n; i4++) {
      lineTo(g, series[i4]); g.lineWidth = i4 === 0 ? LW * 2.0 : LW * 0.9; g.stroke(); g.lineWidth = LW;
      for (var k2 = 0; k2 < series[i4].length; k2++) disc(g, series[i4][k2][0], series[i4][k2][1], LW * 1.3);
    }
  }],

  slope: ['斜率图', 'Slope', function (g, R) {
    var n = ri(4, 6), x0 = R.x + R.w * 0.12, x1 = R.x + R.w * 0.88;
    lineTo(g, [[x0, R.y], [x0, R.y + R.h]]); g.globalAlpha = 0.4; g.stroke();
    lineTo(g, [[x1, R.y], [x1, R.y + R.h]]); g.stroke(); g.globalAlpha = 1;
    for (var i = 0; i < n; i++) {
      var a = R.y + R.h * (0.10 + 0.80 * i / (n - 1)), b = R.y + R.h * rf(0.08, 0.92);
      lineTo(g, [[x0, a], [x1, b]]); g.lineWidth = i === 0 ? LW * 1.9 : LW * 0.85; g.stroke(); g.lineWidth = LW;
      disc(g, x0, a, LW * 1.3); disc(g, x1, b, LW * 1.3);
    }
  }],

  loss: ['训练曲线', 'Loss Curve', function (g, R) {
    var P = [], U = [], D = [], N2 = mkNoise(ri(1, 1e9));
    for (var i = 0; i <= 40; i++) {
      var t = i / 40;
      var v = R.y + R.h * (0.14 + 0.72 * Math.exp(-t * 3.2) + 0.03 * (fbm(N2, t * 8, 1, 2) - 0.5));
      var band = R.h * 0.06 * (1 - t * 0.6);
      P.push([R.x + R.w * t, v]); U.push([R.x + R.w * t, v - band]); D.push([R.x + R.w * t, v + band]);
    }
    g.beginPath(); g.moveTo(U[0][0], U[0][1]);
    for (var a = 1; a < U.length; a++) g.lineTo(U[a][0], U[a][1]);
    for (var b = D.length - 1; b >= 0; b--) g.lineTo(D[b][0], D[b][1]);
    g.closePath(); g.globalAlpha = 0.22; g.fill(); g.globalAlpha = 1;
    g.lineWidth = LW * 1.3; lineTo(g, P); g.stroke(); g.lineWidth = LW;
    lineTo(g, [[R.x, R.y + R.h * 0.94], [R.x + R.w, R.y + R.h * 0.94]]); g.stroke();
  }],

  phase: ['向量场', 'Vector Field', function (g, R) {
    var n = ri(5, 7), N2 = mkNoise(ri(1, 1e9));
    var cw = R.w / n, ch = R.h / n;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var x = R.x + cw * (i + 0.5), y = R.y + ch * (j + 0.5);
      var a = fbm(N2, i * 0.42, j * 0.42, 3) * 9.4;
      var L2 = Math.min(cw, ch) * 0.38;
      lineTo(g, [[x - Math.cos(a) * L2, y - Math.sin(a) * L2], [x + Math.cos(a) * L2, y + Math.sin(a) * L2]]); g.stroke();
      disc(g, x + Math.cos(a) * L2, y + Math.sin(a) * L2, LW * 0.9);
    }
  }],

  persist: ['持久图', 'Persistence', function (g, R) {
    var r = Math.min(R.w, R.h);
    var ox = R.cx - r / 2, oy = R.cy - r / 2;
    g.strokeRect(ox, oy, r, r);
    g.globalAlpha = 0.5;
    lineTo(g, [[ox, oy + r], [ox + r, oy]]); g.stroke();
    g.globalAlpha = 1;
    for (var i = 0; i < ri(9, 16); i++) {
      var b = rnd() * 0.8, d = b + rf(0.05, 0.55);
      if (d > 0.96) continue;
      var x = ox + r * b, y = oy + r * (1 - d);
      (d - b > 0.34) ? disc(g, x, y, LW * 1.7) : ring(g, x, y, LW * 1.2);
    }
  }],

  spiral: ['螺线', 'Spiral', function (g, R) {
    var turns = rf(2.6, 4.0), P = [];
    for (var i = 0; i <= 240; i++) {
      var t = i / 240, a = t * turns * 6.2832, rr = R.s * 0.46 * t;
      P.push([R.cx + Math.cos(a) * rr, R.cy + Math.sin(a) * rr]);
    }
    g.lineWidth = LW * 1.2; lineTo(g, P); g.stroke(); g.lineWidth = LW;
    for (var k = 0; k < ri(4, 7); k++) {
      var t2 = rf(0.25, 1.0), a2 = t2 * turns * 6.2832, rr2 = R.s * 0.46 * t2;
      disc(g, R.cx + Math.cos(a2) * rr2, R.cy + Math.sin(a2) * rr2, LW * 1.7);
    }
  }],

  calendar: ['日历热图', 'Calendar', function (g, R) {
    var cols = 12, rows = 7, c = Math.min(R.w / cols, R.h / rows) * 0.94;
    var ox = R.cx - c * cols / 2, oy = R.cy - c * rows / 2, N2 = mkNoise(ri(1, 1e9));
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
      var v = fbm(N2, i * 0.32, j * 0.32, 3);
      var x = ox + i * c, y = oy + j * c;
      if (v > 0.60) g.fillRect(x + c * 0.10, y + c * 0.10, c * 0.80, c * 0.80);
      else if (v > 0.46) { g.globalAlpha = 0.42; g.fillRect(x + c * 0.10, y + c * 0.10, c * 0.80, c * 0.80); g.globalAlpha = 1; }
      else g.strokeRect(x + c * 0.10, y + c * 0.10, c * 0.80, c * 0.80);
    }
  }],

  ternary: ['三元图', 'Ternary', function (g, R) {
    var r = R.s * 0.44, V = [];
    for (var i = 0; i < 3; i++) { var a = -1.5708 + i * 2.0944; V.push([R.cx + Math.cos(a) * r, R.cy + Math.sin(a) * r]); }
    lineTo(g, [V[0], V[1], V[2], V[0]]); g.stroke();
    for (var k = 1; k <= 2; k++) for (var e = 0; e < 3; e++) {
      var A = V[e], B = V[(e + 1) % 3], C = V[(e + 2) % 3], t = k / 3;
      lineTo(g, [[A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t],
                 [A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t]]);
      g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1;
    }
    for (var p = 0; p < ri(3, 6); p++) {
      var w1 = rnd(), w2 = rnd() * (1 - w1), w3 = 1 - w1 - w2;
      disc(g, V[0][0] * w1 + V[1][0] * w2 + V[2][0] * w3, V[0][1] * w1 + V[1][1] * w2 + V[2][1] * w3, LW * 1.5);
    }
  }]
};
var VIZ_KEYS = Object.keys(VIZ);
/* 只有这几种是「调子型」—— 过网点仍然认得出。线稿型过网点就糊了。 */
/* 能过网点的只有「本来就是色块」的那几种 —— 网点是拿来替代实心填充的。
   线型和点型标本（contour / voronoi / scatter / beeswarm / phase / umap）一过网，
   线就断成虚线、点就糊成一团，图本身先没了。宁可不加质感也不能吃掉主体。 */
var TONAL = { nebula: 1, stream: 1, area: 1 };

/* 外部素材仍然支持（可选），但默认走标本库 */
var MATS = [];
function materials(list) { MATS = list || []; return COLLAGE; }

function drawSlot(g, x, y, w, h, spec, N) {
  var m = MATS.length ? MATS[spec.mat % MATS.length] : null;
  if (m && m.img && m.img.complete && m.img.naturalWidth) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    var ar = m.img.naturalWidth / m.img.naturalHeight, br = w / h, dw, dh;
    if (ar > br) { dh = h; dw = h * ar; } else { dw = w; dh = w / ar; }
    g.drawImage(m.img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    g.restore();
    return;
  }
  /* 卡纸：约一半的图把标本放在奶白卡上，另一半直接画在色场上 */
  if (spec.card) { g.fillStyle = rgba(PAPER); tornPath(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 0.9); g.fill(); }
  var pad = Math.min(w, h) * 0.11;                      /* 标本四周留白，不铺满 */
  var R = { x: x + pad, y: y + pad, w: w - pad * 2, h: h - pad * 2 };
  R.cx = R.x + R.w / 2; R.cy = R.y + R.h / 2; R.s = Math.min(R.w, R.h);
  LW = Math.max(1, R.s / 62) * spec.lw;
  var col = spec.card ? rgba(INK) : rgba(spec.col);

  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();          /* 放大过头的部分被裁掉 —— 局部视图 */
  g.translate(R.cx, R.cy);
  g.rotate(spec.rot);
  g.scale(spec.zoom * (spec.mirror ? -1 : 1), spec.zoom);
  g.translate(-R.cx, -R.cy);

  STYLE = spec.style;
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = LW;
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (STYLE === 3) g.setLineDash([LW * 2.6, LW * 2.2]);
  VIZ[spec.viz][2](g, R);
  g.setLineDash([]);
  g.restore();
}

/* ───────── 构图骨架 ─────────
   从 28 张原图里归纳出来的分割方式，一张只用一种。 */
var SKELETONS = ['diagonal', 'vsplit', 'hsplit', 'quad', 'inset', 'scallop', 'band'];

/* ───────── 质感：挂在位置上，不是铺在全图上 ─────────
   真印刷里质感是有地址的。四种质感，四个落点：

     A 交界带  堆墨（内侧压暗）      带宽 1.2% 画幅        每张
     B 套印    重影错位露第三色      位移 1.2% × 档位      每张有第二色场的
     C 质感区  粗颗粒，照片感        一个色场 ≈ 40% 画幅   只有 38% 的图
     D 墨层    密度不匀（加性，不打洞）仅标本墨迹           每张
     E 纸基    纤维                  全图                  振幅 ≤ 3/255

   C 是唯一会被一眼看见的那层，所以它必须**只占一块**：
   平涂和颗粒并置才有材质对比，全图都上颗粒等于没上。
   D 用加性不用抠 alpha —— 抠 alpha 会在色块上开出云斑，那是发霉不是印刷。

   档位 0 关 / 1 轻 / 2 中 / 3 重（默认） */
var TEXTURE = 3;
var TEX = [
  /*  fiber 纸基  build 堆墨  ghost 重影  ink 墨不匀  patch 质感区概率  grit 质感区强度  screen 网点概率 */
  { fiber: 0.0, build: 0.00, ghost: 0.00, ink: 0.00, patch: 0.00, grit: 0.00, screen: 0.00 },
  { fiber: 1.3, build: 0.16, ghost: 0.45, ink: 0.05, patch: 0.26, grit: 0.20, screen: 0.28 },
  { fiber: 2.4, build: 0.30, ghost: 0.90, ink: 0.10, patch: 0.42, grit: 0.36, screen: 0.46 },
  { fiber: 4.2, build: 0.48, ghost: 1.60, ink: 0.19, patch: 0.66, grit: 0.50, screen: 0.62 }
];

var FORCEKIT = null;
var CFG = { count: 24, seed: 20260808 };
var SPECS = [], CACHE = [], SCALE = 1.4;
var SHAPES = [[320, 320], [320, 400], [400, 320], [360, 240]];

function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function makeSpecs() {
  srnd(CFG.seed);
  SPECS = [];
  /* 按种子洗牌再轮转：一屏之内不重复，换种子整批母题也换 */
  var order = shuf(VIZ_KEYS.slice());
  for (var i = 0; i < CFG.count; i++) {
    /* 配色策略：先选一个色调族做主，再从族内或中性里取第二色；
       约 1/3 的图允许第二色跨族跳出去（大胆的那部分）。 */
    var fam = pick(FAMILIES);
    var pool = FIELDS.slice(fam[0], fam[1]);
    var a = pick(pool);
    var jump = rnd() < 0.34;
    var b = contrastPick(a, jump ? FIELDS : pool.concat(FIELDS.slice(25)));
    var sh = pick(SHAPES);
    SPECS.push({
      w: sh[0], h: sh[1],
      skeleton: SKELETONS[i % SKELETONS.length],
      A: a, B: b,
      mat: ri(0, 99),
      viz: order[i % order.length],            /* 洗牌后轮转 */
      card: false,
      col: lum(a) > 128 ? INK : PAPER,
      screen: false,                      /* 见下：只有调子型标本才过网点 */
      strokes: rnd() < 0.62 ? 0 : (rnd() < 0.78 ? 1 : 2),   /* 多数不画线 —— 上一版满屏乱砍 */
      grain: rf(3, 7),
      seed: ri(1, 1e9)
    });
    var sp = SPECS[SPECS.length - 1];
    /* 实例变换：保证同一个标本两次出现长得不一样 */
    var rr = rnd();
    sp.rot    = rr < 0.42 ? 0 : (rr < 0.62 ? 1.5708 : (rr < 0.74 ? -1.5708 : (rr < 0.84 ? 3.1416 : rf(-0.42, 0.42))));
    sp.mirror = rnd() < 0.42;
    sp.zoom   = rnd() < 0.30 ? rf(1.35, 2.30) : rf(0.72, 1.12);   /* 30% 放大到出血，只看局部 */
    sp.lw     = rf(0.72, 1.55);
    sp.style  = pick([0, 0, 0, 1, 2, 3, 4]);
    sp.card = rnd() < 0.62;                                  /* 多数放在奶白卡上，保证可读 */
    sp.screen = !sp.card && TONAL[sp.viz] === 1 && rnd() < TEX[TEXTURE].screen;
    sp.kit = FORCEKIT || pick(KITS);                         /* 这张用哪种材质 */
  }
  CACHE = new Array(CFG.count);
}

/* D · 墨层密度不匀 —— 只碰有墨的像素，且只加减亮度，不动 alpha。
   抠 alpha 会在实心色块上开出云斑，读起来是发霉不是印刷。
   两个频率：慢的是上墨量漂移，快的是纸纤维吃墨。 */
function inkGrain(cv, N, amt, sc) {
  if (amt <= 0) return;
  var g = cv.getContext('2d'), W = cv.width, H = cv.height;
  var d = g.getImageData(0, 0, W, H), p = d.data, i = 0;
  var A = amt * 150;
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++, i += 4) {
    if (!p[i + 3]) continue;
    var v = (fbm(N, x / sc, y / sc, 3) - 0.5) * 0.65 + (N(x / 1.7, y / 1.7) - 0.5) * 0.35;
    var dv = v * A;
    p[i] += dv; p[i + 1] += dv; p[i + 2] += dv;
  }
  g.putImageData(d, 0, 0);
}

/* ═══════════ C · 材质库 ═══════════
   一种质感 = 两张场：kd 压暗（走 multiply），kl 提亮（走 lighter，可以没有）。
   分开是必须的 —— 金属没有高光就只是灰噪，哑光有了高光就不叫哑光。
   全部按位置生成，不用贴图，不用外部素材。 */
var KITS = ['grit', 'grit', 'matte', 'matte', 'plaster', 'linen', 'roller', 'vein', 'brushed', 'foil', 'crease'];
var KITNAME = {
  grit:    ['颗粒',   'film grit'],
  matte:   ['哑光',   'matte'],
  plaster: ['石膏',   'plaster'],
  linen:   ['布纹',   'linen'],
  roller:  ['滚筒',   'ink roller'],
  vein:    ['木纹',   'wood vein'],
  brushed: ['拉丝金属', 'brushed metal'],
  foil:    ['烫金箔', 'foil'],
  crease:  ['折痕',   'crease']
};

function texField(kind, W, H, N, amt, f) {
  var n = W * H, kd = new Float32Array(n), kl = null, i = 0, x, y;
  var S = W > H ? W : H, lo = Math.max(10, W / 22) * f;

  if (kind === 'matte') {
    /* 哑光：极细、极匀、低反差。粉体涂层的样子 —— 一给高光就不哑了，所以没有 kl。 */
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var m1 = N(x / 1.05, y / 1.05), m2 = fbm(N, x / (lo * 2.2), y / (lo * 2.2), 2);
      kd[i] = amt * (0.34 + 0.52 * (1 - m1) + 0.30 * (0.6 - m2));
    }
  } else if (kind === 'brushed') {
    /* 拉丝金属：沿一个方向拉得极长、垂直方向极密的各向异性噪声，加一道宽高光带。 */
    kl = new Float32Array(n);
    var vert = f > 1.25;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var u = vert ? y : x, v = vert ? x : y;
      var st = N(u / (95 * f), v / 1.15) * 0.70 + N(u / (14 * f) + 9, v / 2.6 + 9) * 0.30;
      var sh = 0.5 + 0.5 * Math.cos((v / (vert ? W : H)) * 3.1416 * 1.35 + 1.1);
      kd[i] = amt * ((1 - st) * 1.15 + (1 - sh) * 0.28);
      kl[i] = amt * sh * sh * 0.62 * (0.35 + 0.65 * st);
    }
  } else if (kind === 'foil') {
    /* 烫金箔：两三道平滑的斜向反光带，几乎不带颗粒。压暗和提亮同时存在才有金属味。 */
    kl = new Float32Array(n);
    var ang = 0.55 + f * 0.55, ca = Math.cos(ang), sa = Math.sin(ang), bands = 1.9 + f * 0.8;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var t = ((x * ca + y * sa) / S) * bands + fbm(N, x / (lo * 3), y / (lo * 3), 2) * 0.32;
      var w = Math.sin(t * 6.2832), fg2 = N(x / 1.25, y / 1.25);
      /* 箔压在纸上仍然有纤维。纯平滑渐变会滑成 3D 高光，那就不是印刷了。 */
      kd[i] = amt * ((w < 0 ? -w : 0) * 0.92 + (1 - fg2) * 0.22);
      kl[i] = amt * (w > 0 ? w : 0) * 0.62;
    }
  } else if (kind === 'linen') {
    /* 布纹：两个方向的细棱，不是点阵。低频调制打散规则性，免得像屏幕摩尔纹。 */
    var px = 2.0 + 2.6 * f, py = px * 1.28;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var wx = 0.5 + 0.5 * Math.sin(x * 6.2832 / px), wy = 0.5 + 0.5 * Math.sin(y * 6.2832 / py);
      var md = fbm(N, x / (lo * 1.6), y / (lo * 1.6), 2);
      kd[i] = amt * (wx * 0.5 + wy * 0.5) * 0.95 * (0.5 + 0.95 * md);
    }
  } else if (kind === 'plaster') {
    /* 石膏／水泥：大块软斑打底，再撒一层细麻点。 */
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var b = fbm(N, x / (lo * 2.6), y / (lo * 2.6), 4), pit = N(x / 1.6, y / 1.6);
      kd[i] = amt * ((0.62 - b) * 1.65 + (1 - pit) * 0.28);
    }
  } else if (kind === 'roller') {
    /* 油墨滚筒：横向拖影，外加沿滚筒周长的一圈圈密度带。丝网／riso 的典型毛病。 */
    var rows = 2.2 + f * 1.7;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var sm = N(x / (30 * f), y / (2.4 * f));      /* 拖影必须横着走，才跟拉丝分得开 */
      var bd = 0.5 + 0.5 * Math.sin(y / H * 3.1416 * rows + 0.8);
      kd[i] = amt * ((1 - sm) * 0.55 + bd * 0.60);
    }
  } else if (kind === 'vein') {
    /* 木纹／大理石：拿 fbm 去扭曲坐标，扭出长条纹。 */
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var q = fbm(N, x / (lo * 1.8), y / (lo * 4.5), 3);
      var s2 = 0.5 + 0.5 * Math.sin((x / (lo * 1.1) + q * 3.4) * 3.1416);
      kd[i] = amt * s2 * 1.05 * (0.45 + 0.85 * fbm(N, x / (lo * 3), y / (lo * 3), 2));
    }
  } else if (kind === 'crease') {
    /* 折痕：几条软棱，一侧压暗一侧提亮 —— 折过的纸就是这样。 */
    kl = new Float32Array(n);
    var L = [], cnt = 2 + (((f * 7) | 0) % 3);
    for (var q2 = 0; q2 < cnt; q2++) {
      var a0 = q2 * 1.73 + f * 2.31;
      L.push([W * ((q2 * 0.37 + f * 0.61) % 1), H * ((q2 * 0.53 + f * 0.29) % 1),
              Math.cos(a0), Math.sin(a0)]);
    }
    var wdt = S * 0.045;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var best = 1e9, side = 0;
      for (var q3 = 0; q3 < L.length; q3++) {
        var sd = (x - L[q3][0]) * (-L[q3][3]) + (y - L[q3][1]) * L[q3][2];
        var ad = sd < 0 ? -sd : sd;
        if (ad < best) { best = ad; side = sd; }
      }
      var fa = 1 - best / wdt; fa = fa < 0 ? 0 : fa * fa;
      var fn = N(x / 1.3, y / 1.3);
      kd[i] = amt * (fa * (side < 0 ? 1.15 : 0.12) + (1 - fn) * 0.16);
      kl[i] = amt * fa * (side > 0 ? 0.52 : 0);
    }
  } else {                                   /* grit —— 照片颗粒 */
    for (y = 0; y < H; y++) for (x = 0; x < W; x++, i++) {
      var lw = fbm(N, x / lo, y / lo, 3);
      var hi = N(x / (1.35 * f), y / (1.35 * f)) * 0.62 + N(x / (3.1 * f) + 17, y / (3.1 * f) + 17) * 0.38;
      /* 低频负责结块，高频负责颗粒本身。全高频只是噪点，不是颗粒。 */
      kd[i] = amt * ((1 - hi) * 0.72 + (0.68 - lw) * 0.85);
    }
  }
  return { kd: kd, kl: kl };
}

/* 把场变成两张可以直接 composite 的画布。
   压暗那张从白插值到 tint —— 灰噪 multiply 会把色场洗成脏灰，同色的深版不会。 */
function texTile(kind, W, H, N, amt, tint, f) {
  var F = texField(kind, W, H, N, amt, f), n = W * H;
  var c = mkCanvas(W, H), g = c.getContext('2d'), d = g.createImageData(W, H), p = d.data;
  for (var i = 0, j = 0; i < n; i++, j += 4) {
    var k = F.kd[i]; k = k < 0 ? 0 : k > 1 ? 1 : k;
    p[j] = 255 - (255 - tint[0]) * k;
    p[j + 1] = 255 - (255 - tint[1]) * k;
    p[j + 2] = 255 - (255 - tint[2]) * k;
    p[j + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  var a = null;
  if (F.kl) {
    a = mkCanvas(W, H);
    var ag = a.getContext('2d'), ad = ag.createImageData(W, H), q = ad.data;
    for (var i2 = 0, j2 = 0; i2 < n; i2++, j2 += 4) {
      var v = F.kl[i2]; v = v < 0 ? 0 : v > 1 ? 1 : v;
      q[j2] = q[j2 + 1] = q[j2 + 2] = 255; q[j2 + 3] = v * 255;
    }
    ag.putImageData(ad, 0, 0);
  }
  return { mul: c, add: a };
}
/* 拿 mask 画布当模具：inv=false 只留 mask 覆盖处，inv=true 只留 mask 之外。
   keep 是必须让开的矩形（标本槽）—— 质感可以铺在主体旁边，不能铺在主体身上。 */
function maskedGrit(tile, mask, inv, keep) {
  var c = mkCanvas(tile.width, tile.height), g = c.getContext('2d');
  g.drawImage(tile, 0, 0);
  g.globalCompositeOperation = inv ? 'destination-out' : 'destination-in';
  g.drawImage(mask, 0, 0);
  if (keep) {
    g.globalCompositeOperation = 'destination-out';
    g.filter = 'blur(' + Math.max(6, tile.width * 0.055) + 'px)';  /* 软边要够软，否则擦出个可读的方块，像水渍 */
    g.fillStyle = '#000';
    g.fillRect(keep[0], keep[1], keep[2], keep[3]);
    g.filter = 'none';
  }
  return c;
}
/* 槽位有多少落在 mask 里 —— 用来决定质感该去场内还是场外 */
function slotCover(mask, x, y, w, h) {
  var g = mask.getContext('2d'), n = 0, hit = 0;
  var d = g.getImageData(Math.max(0, x | 0), Math.max(0, y | 0),
                         Math.max(1, Math.min(mask.width - (x | 0), w | 0)),
                         Math.max(1, Math.min(mask.height - (y | 0), h | 0))).data;
  for (var i = 3; i < d.length; i += 40) { n++; if (d[i] > 40) hit++; }
  return n ? hit / n : 0;
}

var mkCanvas = function (W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

function render(i, scale) {
  var s = SPECS[i]; if (!s) return null;
  var sc = scale || SCALE;
  var W = Math.round(s.w * sc), H = Math.round(s.h * sc);
  var cv = mkCanvas(W, H), g = cv.getContext('2d');
  srnd(s.seed);
  var N = mkNoise(s.seed); EN = mkNoise(s.seed ^ 0x5bf03);

  g.fillStyle = rgba(s.A); g.fillRect(0, 0, W, H);

  /* 第二色场画在自己的图层上 —— 有了这张图层，套印重影（错位再叠一次）和
     质感区（拿它当模具）才有得依托。直接画在底上就什么都做不了。 */
  var T = TEX[TEXTURE];
  var band = Math.max(1, Math.min(W, H) * 0.012);
  var fl = mkCanvas(W, H), fg = fl.getContext('2d');
  fg.fillStyle = rgba(s.B);
  /* 无论档位开不开，这三个随机数都先抽掉 —— 否则关掉质感会挪动整条随机流，
     四个档位就不再是同一批图，对照也就无从谈起。 */
  var rollGhost = rnd(), rollPatch = rnd(), rollInv = rnd(), rollGrain = rnd();

  /* A · 堆墨：沿边描一圈压暗的同色，再裁回填充区内。
     裁是必要的 —— 不裁就成了描边框，那是 UI 不是印刷。 */
  function inkBuild() {
    if (T.build <= 0) return;
    fg.save();
    fg.clip();
    fg.globalAlpha = T.build;
    fg.strokeStyle = rgba(mix(s.B, INK, 0.55));
    fg.lineWidth = band * 2;
    fg.stroke();
    fg.restore();
  }
  var K = s.skeleton, slot = null, hasField = true;
  if (K === 'diagonal') {
    var d0 = rf(0.25, 0.65);
    tornPath(fg, [[0, H * d0], [W, H * rf(0.05, 0.45)], [W, H], [0, H]], 1.1); fg.fill(); inkBuild();
    slot = [W * 0.12, H * 0.10, W * 0.60, H * 0.50];
  } else if (K === 'vsplit') {
    var vx = W * rf(0.34, 0.62);
    tornPath(fg, [[vx, 0], [W, 0], [W, H], [vx, H]], 1.0); fg.fill(); inkBuild();
    slot = [vx - W * 0.30, H * 0.18, W * 0.62, H * 0.64];
  } else if (K === 'hsplit') {
    var hy = H * rf(0.34, 0.64);
    tornPath(fg, [[0, hy], [W, hy], [W, H], [0, H]], 1.0); fg.fill(); inkBuild();
    slot = [W * 0.16, hy - H * 0.34, W * 0.68, H * 0.60];
  } else if (K === 'quad') {
    fg.beginPath();
    fg.rect(0, 0, W * 0.5, H * 0.5); fg.rect(W * 0.5, H * 0.5, W * 0.5, H * 0.5);
    fg.fill(); inkBuild();
    slot = [W * 0.5, 0, W * 0.5, H * 0.5];
  } else if (K === 'inset') {
    /* 没有第二色场。给质感区一块随机半幅当模具，否则这类图永远没材质。 */
    hasField = false;
    var vert = rnd() < 0.5, frac = rf(0.40, 0.58), far = rnd() < 0.5;
    fg.fillStyle = '#000';
    tornPath(fg, vert
      ? (far ? [[W * (1 - frac), 0], [W, 0], [W, H], [W * (1 - frac), H]] : [[0, 0], [W * frac, 0], [W * frac, H], [0, H]])
      : (far ? [[0, H * (1 - frac)], [W, H * (1 - frac)], [W, H], [0, H]] : [[0, 0], [W, 0], [W, H * frac], [0, H * frac]]), 1.0);
    fg.fill();
    slot = [W * rf(0.14, 0.24), H * rf(0.14, 0.24), W * rf(0.56, 0.68), H * rf(0.50, 0.62)];
  } else if (K === 'scallop') {
    scallopPath(fg, 0, H * rf(0.42, 0.62), W, H, ri(3, 6), false); fg.fill(); inkBuild();
    slot = [W * 0.18, H * 0.08, W * 0.64, H * 0.42];
  } else {                                  /* band */
    var by = H * rf(0.30, 0.52), bh = H * rf(0.20, 0.34);
    tornPath(fg, [[0, by], [W, by], [W, by + bh], [0, by + bh]], 1.0); fg.fill(); inkBuild();
    slot = [W * 0.14, by - H * 0.18, W * 0.52, bh + H * 0.34];
  }

  if (hasField) {
    /* B · 套印不准：先把同一版错位叠一次，用 multiply 压在底色上。
       正版盖住大部分，只在两侧漏出一条第三色 —— 那条才是印刷味。 */
    if (T.ghost > 0) {
      var ga = rollGhost * 6.2832, gd = Math.min(W, H) * 0.012 * T.ghost;
      g.save();
      g.globalAlpha = 0.55;
      g.globalCompositeOperation = 'multiply';
      g.drawImage(fl, Math.cos(ga) * gd, Math.sin(ga) * gd);
      g.restore();
    }
    g.drawImage(fl, 0, 0);
  }

  /* 素材槽 */
  var sx = Math.round(slot[0]), sy = Math.round(slot[1]),
      sw = Math.round(slot[2]), sh = Math.round(slot[3]);

  /* C · 质感区：只压一块，而且必须给主体让路。
     先比一下槽位落在场内还是场外更少，往少的那边放；不放心的部分再软擦掉。
     标本压在奶白卡上时卡是不透明的，质感本来就被盖住，不用让。 */
  if (T.grit > 0 && rollPatch < T.patch) {
    var inv;
    if (!hasField) inv = false;
    else if (s.card) inv = rollInv < 0.45;
    else {
      var covIn = slotCover(fl, sx, sy, sw, sh);
      inv = covIn > 0.34;                      /* 主体在场里 → 质感去场外 */
    }
    var base = (hasField && !inv) ? s.B : s.A;
    var tint = mix(base, INK, 0.5), NG = mkNoise(s.seed ^ 0x2f19);
    var gsc = 0.70 + rollGrain * 0.9;          /* 同一种材质的粗细逐张变 */
    var keep = s.card ? null : [sx - W * 0.02, sy - H * 0.02, sw + W * 0.04, sh + H * 0.04];
    var tl = texTile(s.kit, W, H, NG, T.grit, tint, gsc);
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.drawImage(maskedGrit(tl.mul, fl, inv, keep), 0, 0);
    g.restore();
    if (tl.add) {                              /* 金属和折痕才有高光 */
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.8;
      g.drawImage(maskedGrit(tl.add, fl, inv, keep), 0, 0);
      g.restore();
    }
  }

  /* 采一下槽位中心底下到底是什么色 —— 槽位常常压在第二色场上，
     只看 A 会导致深色场上画深色标本，直接消失。 */
  var probe = g.getImageData(Math.min(W - 1, sx + (sw >> 1)), Math.min(H - 1, sy + (sh >> 1)), 1, 1).data;
  s.col = (0.2126 * probe[0] + 0.7152 * probe[1] + 0.0722 * probe[2]) > 128 ? INK : PAPER;

  var lay = mkCanvas(W, H), lg = lay.getContext('2d');
  drawSlot(lg, sx, sy, sw, sh, s, N);
  inkGrain(lay, N, T.ink, Math.max(9, W / 26));           /* D · 只碰标本的墨，不碰底色 */
  if (s.screen) screenRegion(lay, sx, sy, sw, sh, Math.max(2.2, sw / 62), rgba(s.col), N);
  g.drawImage(lay, rf(-1.5, 1.5) * sc, rf(-1.5, 1.5) * sc);

  /* 干笔线 */
  /* 干笔线：贴着画面走横或竖，不斜砍；而且避开槽位，别糊住标本 */
  for (var k = 0; k < s.strokes; k++) {
    var horiz = rnd() < 0.5, P;
    if (horiz) {
      var ly = rnd() < 0.5 ? rf(0.06, 0.16) : rf(0.84, 0.94);
      P = segPts(W * rf(-0.04, 0.06), H * ly, W * rf(0.94, 1.04), H * (ly + rf(-0.02, 0.02)));
    } else {
      var lx = rnd() < 0.5 ? rf(0.06, 0.16) : rf(0.84, 0.94);
      P = segPts(W * lx, H * rf(-0.04, 0.06), W * (lx + rf(-0.02, 0.02)), H * rf(0.94, 1.04));
    }
    dryStroke(g, P, Math.max(2, W / rf(95, 150)), rgba(s.col));
  }

  /* E · 纸基：唯一的全局质感，且必须几乎不可见。
     振幅随底色明度 —— 深底上颗粒显，浅底上颗粒藏，跟真纸一致。 */
  if (T.fiber > 0) {
    var amp = T.fiber * (0.6 + 0.8 * (1 - lum(s.A) / 255));
    var d = g.getImageData(0, 0, W, H), p = d.data, gi = 0;
    for (var gy = 0; gy < H; gy++) for (var gx = 0; gx < W; gx++, gi += 4) {
      var v = (N(gx / 2.2, gy / 2.2) - 0.5) * amp + (rnd() - 0.5) * amp * 0.5;
      p[gi] += v; p[gi + 1] += v; p[gi + 2] += v;
    }
    g.putImageData(d, 0, 0);
  }
  return cv;
}

function init(o) {
  o = o || {};
  if (o.count) CFG.count = o.count;
  if (o.seed !== undefined) CFG.seed = o.seed;
  if (o.scale) SCALE = o.scale;
  if (o.texture !== undefined) TEXTURE = Math.max(0, Math.min(3, o.texture | 0));
  FORCEKIT = o.kit || null;                    /* 只给调试用：把整批锁成同一种材质 */
  makeSpecs();
  return COLLAGE;
}
function attach(el, i) {
  var cv = CACHE[i] || (CACHE[i] = render(i));
  if (el.tagName === 'IMG') el.src = cv.toDataURL('image/png');
  else { el.innerHTML = ''; cv.style.width = '100%'; cv.style.height = 'auto'; cv.style.display = 'block'; el.appendChild(cv); }
}
function meta(i) {
  var s = SPECS[i]; if (!s) return null;
  return { skeleton: s.skeleton, viz: s.viz, zh: VIZ[s.viz][0], en: VIZ[s.viz][1],
           screened: s.screen, kit: s.kit, kitZh: KITNAME[s.kit][0], kitEn: KITNAME[s.kit][1] };
}

var COLLAGE = {
  init: init, attach: attach, meta: meta, render: render, materials: materials, kits: function () { return KITS.filter(function (v, i, a) { return a.indexOf(v) === i; }); },
  skeletons: SKELETONS, viz: VIZ_KEYS,
  count: function () { return SPECS.length; },
  _setCanvasFactory: function (f) { mkCanvas = f; }
};
root.COLLAGE = COLLAGE;
})(typeof window !== 'undefined' ? window : this);
