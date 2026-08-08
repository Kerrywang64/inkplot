import { chromium } from 'playwright';
/* 触发 CI 重渲：本文件在 assets.yml 的 paths 列表里 */
import fs from 'fs';
const js = fs.readFileSync('scripts/collage.js','utf8');
const S = [11,22,33,44,55,66,77,88,99,101].map(x=>20260808+x*7919);
/* 用户挑的 16 张，按主色从多候选里定位到的 (种子, 序号) */
const PICKS = [
 [S[9],8],[S[0],4],[S[0],11],[S[1],8],
 [S[1],1],[S[2],3],[S[4],7],[S[3],11],
 [S[4],11],[S[6],10],[S[7],4],[S[7],2],
 [S[8],4],[S[8],0],[S[9],6],[S[6],1]];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const p = await b.newPage({ viewport:{width:1640,height:1200}, deviceScaleFactor:2 });
await p.setContent('<body style="margin:0"></body>');
await p.addScriptTag({ content: js });

const rows = await p.evaluate(picks => {
  const o=[];
  let cur=null;
  for (const [sd,i] of picks) {
    if (cur!==sd) { COLLAGE.init({count:12, seed:sd, scale:1}); cur=sd; }
    const m=COLLAGE.meta(i), cv=COLLAGE.render(i,3);
    o.push({u:cv.toDataURL('image/png'), zh:m.zh, en:COLLAGE.viz.indexOf(m.viz)>=0?m.en:'', sk:m.skeleton, w:cv.width, h:cv.height});
  }
  return o;
}, PICKS);

/* 画廊：四列，自然高度 */
await p.evaluate(rows => {
  document.body.style.background='#EEEAE1';
  document.body.innerHTML =
   '<div style="padding:52px 56px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">'+
     '<div style="font:600 13px/1 ui-monospace;letter-spacing:.34em;color:#8A8377">RISO-PRESS · COLLAGE</div>'+
     '<div style="font:400 46px/1.15 Georgia,\'Songti SC\',serif;color:#1A1815;margin:18px 0 6px;letter-spacing:-.01em">Data, printed.</div>'+
     '<div style="font:400 15px/1.7 Georgia,\'Songti SC\',serif;color:#6C665C;max-width:560px">四十三种数据可视化标本 · 七种色场分割 · 零素材依赖 · 同种子完全可复现</div>'+
   '</div>'+
   '<div style="columns:4;column-gap:20px;padding:40px 56px 56px">'+
   rows.map(r=>'<div style="break-inside:avoid;margin:0 0 20px"><img src="'+r.u+'" style="width:100%;display:block"></div>').join('')+
   '</div>';
}, rows);
await p.waitForTimeout(900);
await p.screenshot({ path:'assets/gallery.png', fullPage:true });

/* 横幅：取其中六张裁成一条 */
await p.setViewportSize({width:1600,height:560});
await p.evaluate(rows => {
  const pickIdx=[8,0,7,11,14,2];
  document.body.style.background='#EEEAE1';
  document.body.innerHTML =
   '<div style="display:flex;height:560px;align-items:stretch">'+
   pickIdx.map(i=>'<div style="flex:1;overflow:hidden;position:relative"><img src="'+rows[i].u+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>').join('')+
   '</div>';
}, rows);
await p.waitForTimeout(600);
await p.screenshot({ path:'assets/banner.png' });
await b.close();
console.log('gallery.png + banner.png');
