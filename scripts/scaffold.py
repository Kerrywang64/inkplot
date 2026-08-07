#!/usr/bin/env python3
"""
riso-press · 起始页生成器

把 references/design-system.md 里的决策变成可运行的代码。
不是模板引擎，是把已经做好的判断打包成一个能跑的起点。

用法:
  python3 scripts/scaffold.py --list
  python3 scripts/scaffold.py --skeleton longform --out index.html
  python3 scripts/scaffold.py --tokens-only --accent forest --out tokens.css
"""
import argparse, sys

PAIRINGS = {
    "editorial": dict(
        label="编辑默认",
        google="Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,300;0,6..72,400;1,6..72,300&family=Inter:wght@400;500&family=Noto+Serif+SC:wght@300;400",
        display='Newsreader, "Noto Serif SC", Georgia, serif',
        ui='Inter, "Noto Serif SC", -apple-system, "PingFang SC", sans-serif',
        note="warm、可读、不摆架子。长文与作品集的起点。"),
    "publishing": dict(
        label="高对比出版",
        google="Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500&family=Noto+Serif+SC:wght@300;400",
        display='"Playfair Display", "Noto Serif SC", Georgia, serif',
        ui='Inter, "Noto Serif SC", -apple-system, "PingFang SC", sans-serif',
        note="粗细反差大，48px 以上才好看。封面、时尚、美妆。"),
    "docs": dict(
        label="学术与文档",
        google="Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,400&family=IBM+Plex+Sans:wght@400;500&family=Noto+Serif+SC:wght@300;400",
        display='"Source Serif 4", "Noto Serif SC", Georgia, serif',
        ui='"IBM Plex Sans", "Noto Serif SC", -apple-system, sans-serif',
        note="中性、可信、耐读。研究报告与技术文档。"),
    "modern": dict(
        label="现代无衬线",
        google="Instrument+Sans:wght@400;500;600&family=Inter:wght@400;500&family=Noto+Sans+SC:wght@300;400;500",
        display='"Instrument Sans", "Noto Sans SC", -apple-system, sans-serif',
        ui='Inter, "Noto Sans SC", -apple-system, "PingFang SC", sans-serif',
        note="保留纸感底但换掉衬线，气质更当代。工具类官网。"),
}

# 对比度已实测（WCAG 2.1）：纸底做文字 / 白字做按钮底
ACCENTS = {
    "rust":   ("#A33F2D", 5.50, 6.35, "默认。两种用法都合格"),
    "forest": ("#365242", 7.44, 8.60, "冷静、机构感。文档与研究"),
    "denim":  ("#465E84", 5.69, 6.57, "金融、法务"),
    "wine":   ("#723244", 8.06, 9.31, "对比最强。正式出版"),
    "olive":  ("#687648", 4.25, 4.91, "只能做按钮底，不能做正文链接"),
}

TOKENS = """/* riso-press · 纸感编辑风 token
   数值来自 references/design-system.md，不要自己发明新值 */
:root{
  --paper:#F3EEE5; --paper-2:#EBE4D7; --paper-3:#E3DBCB;
  --ink:#1A1815;    /* 15.33:1 正文标题 */
  --ink-2:#4A463E;  /*  8.12:1 次要文字 */
  --ink-3:#6E6A61;  /*  4.66:1 元信息   */
  --ink-4:#8A8478;  /*  3.21:1 仅装饰，禁止承载信息 */
  --rule:rgba(26,24,21,.13); --rule-2:rgba(26,24,21,.28);
  --accent:__ACCENT__;
  --decor:#C66042;  /* 陶土 3.53:1 —— 纯装饰，不可做文字或按钮底 */
  --ok:#3F6B4A; --warn:#8A6410; --bad:#9B2F28;
  --t-xs:11px; --t-sm:13px; --t-base:16px; --t-lg:20px;
  --t-xl:25px; --t-2xl:31px; --t-3xl:48px; --t-4xl:76px;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px;
  --s-6:32px; --s-7:48px; --s-8:64px; --s-9:96px; --s-10:128px;
  --ease:cubic-bezier(.22,.9,.24,1);
  --t-fast:160ms; --t-normal:240ms; --t-slow:420ms;
  --f-display:__DISPLAY__;
  --f-ui:__UI__;
}"""

BASE = """
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--paper);color:var(--ink);font-family:var(--f-ui);
  font-size:var(--t-base);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline;text-underline-offset:3px}
img{display:block;max-width:100%}
::selection{background:var(--accent);color:var(--paper)}

body::before{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.45;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='.05'/%3E%3C/svg%3E")}

.display{font-family:var(--f-display);font-weight:300;letter-spacing:-.03em;line-height:1.15}
.meta{font-size:var(--t-xs);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3)}
.lede{font-size:var(--t-lg);color:var(--ink-2);max-width:42ch;line-height:1.6}
.rule{height:1px;background:var(--rule);border:0}
.wrap{max-width:1320px;margin:0 auto;padding:0 var(--s-5);position:relative;z-index:2}
.prose{max-width:68ch}
.prose p{margin-bottom:var(--s-5)}
.prose h2{font-family:var(--f-display);font-size:var(--t-2xl);font-weight:300;
  margin:var(--s-8) 0 var(--s-4);letter-spacing:-.025em}
.prose blockquote{border-left:2px solid var(--accent);padding-left:var(--s-5);
  margin:var(--s-6) 0;font-style:italic;color:var(--ink-2)}
figcaption{font-size:var(--t-sm);color:var(--ink-3);margin-top:var(--s-2)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--s-2);
  min-height:48px;padding:0 26px;border-radius:0;border:1px solid transparent;
  font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;
  transition:all var(--t-fast) var(--ease)}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{filter:brightness(1.12);text-decoration:none}
.btn-ghost{border-color:var(--ink);color:var(--ink);background:transparent}
.btn-ghost:hover{background:var(--ink);color:var(--paper);text-decoration:none}

.field{display:flex;flex-direction:column;gap:var(--s-2)}
.field label{font-size:var(--t-xs);letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);font-weight:600}
.field input,.field textarea{min-height:48px;padding:12px 16px;font-size:16px;
  font-family:inherit;background:var(--paper-3);border:1px solid var(--rule-2);border-radius:0}
.field input:focus,.field textarea:focus{outline:2px solid var(--accent);outline-offset:2px;
  border-color:var(--accent)}

.card{background:var(--paper);border:1px solid var(--rule);border-radius:0;padding:var(--s-5);
  transition:border-color var(--t-fast) var(--ease)}
.card:hover{border-color:var(--rule-2)}

table{width:100%;border-collapse:collapse}
th{font-size:var(--t-xs);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);
  font-weight:600;text-align:left;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--rule-2)}
td{font-size:14px;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--rule)}
td.num{font-variant-numeric:tabular-nums;text-align:right}

.reveal{opacity:0;transform:translateY(20px);
  transition:opacity var(--t-slow) var(--ease),transform var(--t-slow) var(--ease)}
.reveal.in{opacity:1;transform:none}

@media(max-width:768px){
  :root{--t-3xl:34px;--t-4xl:44px;--s-9:56px;--s-10:72px}
}

/* 底线，不是可选项 */
@media(prefers-reduced-motion:reduce){
  *{animation:none!important;transition-duration:.01ms!important}
  .reveal{opacity:1!important;transform:none!important}
}

/* 这套风格的内容大概率会被打印 */
@media print{
  body::before{display:none}
  body{background:#fff;color:#000;font-size:11pt}
  .btn,nav,footer{display:none}
  .prose{max-width:none}
}
"""

SKELETONS = {
    "longform": ("报头式长文", """
<header class="wrap" style="display:flex;align-items:baseline;gap:var(--s-5);padding-top:var(--s-5)">
  <a href="#" class="display" style="font-size:var(--t-lg)">品牌名</a>
  <span class="meta">第 01 期</span>
  <span style="flex:1"></span>
  <a href="#" class="meta">目录</a><a href="#" class="meta">关于</a>
</header>
<hr class="rule" style="margin-top:var(--s-5)">

<article class="wrap" style="padding-top:var(--s-9);padding-bottom:var(--s-10)">
  <h1 class="display" style="font-size:var(--t-3xl);font-weight:200;max-width:16ch">
    标题写结论，<i>不写主题</i>
  </h1>
  <p class="lede" style="margin-top:var(--s-5)">导语一句话说清楚读者能带走什么。不超过 42 个字符宽。</p>
  <p class="meta" style="margin-top:var(--s-5)">作者姓名 · 2026 年 8 月 7 日 · 约 6 分钟</p>
  <hr class="rule" style="margin:var(--s-7) 0">
  <div class="prose">
    <p>正文版心 68ch。这个宽度不是审美选择，是 45–75 字符区间的下限——超过之后眼睛会跳行。</p>
    <h2>小标题</h2>
    <p>每 3–4 段插一张图版。图注用 13px，颜色 ink-3。</p>
    <figure style="margin:var(--s-6) 0">
      <img src="assets/banner.png" alt="描述图里有什么，不是关键词堆砌">
      <figcaption>图注写图里没有的信息，不要复述标题。</figcaption>
    </figure>
    <blockquote>引用块用左侧 2px 实线，不用引号图形，不用底色。</blockquote>
  </div>
  <hr class="rule" style="margin:var(--s-8) 0 var(--s-5)">
  <p class="meta">最后更新 2026-08-07 · 如有更正请来信</p>
</article>"""),

    "landing": ("单栏落地页", """
<header class="wrap" style="display:flex;align-items:center;gap:var(--s-5);padding:var(--s-4) var(--s-5)">
  <a href="#" class="display" style="font-size:var(--t-lg)">产品名</a>
  <span style="flex:1"></span>
  <a href="#" class="meta">功能</a><a href="#" class="meta">定价</a>
  <a href="#" class="btn btn-primary" style="min-height:40px;padding:0 20px">开始使用</a>
</header>
<hr class="rule">

<section class="wrap" style="padding:var(--s-10) var(--s-5)">
  <h1 class="display" style="font-size:var(--t-3xl);font-weight:200;max-width:18ch">
    一句话说清楚你解决什么问题
  </h1>
  <p class="lede" style="margin-top:var(--s-5)">副标题补充怎么做到的，不要重复标题。</p>
  <div style="display:flex;gap:var(--s-3);margin-top:var(--s-6);flex-wrap:wrap">
    <a href="#" class="btn btn-primary">开始免费试用</a>
    <a href="#" class="btn btn-ghost">看看怎么用的</a>
  </div>
  <p class="meta" style="margin-top:var(--s-5)">已被 340 个团队使用 · 无需信用卡</p>
</section>
<hr class="rule">

<section class="wrap" style="padding:var(--s-9) var(--s-5)">
  <div class="prose">
    <h2 class="display" style="font-size:var(--t-2xl)">问题出在哪</h2>
    <p>一段说清楚痛点。用用户的语言，不用系统的语言。</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--s-5);margin-top:var(--s-7)">
    <div class="card"><h3 class="display" style="font-size:var(--t-xl)">第一条</h3>
      <p style="color:var(--ink-2);margin-top:var(--s-2);font-size:14px">两行说明，说清楚这条解决了什么。</p></div>
    <div class="card"><h3 class="display" style="font-size:var(--t-xl)">第二条</h3>
      <p style="color:var(--ink-2);margin-top:var(--s-2);font-size:14px">不要写功能清单，写结果。</p></div>
    <div class="card"><h3 class="display" style="font-size:var(--t-xl)">第三条</h3>
      <p style="color:var(--ink-2);margin-top:var(--s-2);font-size:14px">三条足够，第四条开始稀释注意力。</p></div>
  </div>
</section>
<hr class="rule">

<section class="wrap" style="padding:var(--s-9) var(--s-5);text-align:center">
  <h2 class="display" style="font-size:var(--t-2xl);max-width:20ch;margin:0 auto">
    第二个 CTA 用跟第一个一样的文案
  </h2>
  <a href="#" class="btn btn-primary" style="margin-top:var(--s-5)">开始免费试用</a>
</section>"""),

    "gallery": ("图集画廊", """
<header class="wrap" style="display:flex;align-items:baseline;gap:var(--s-5);padding:var(--s-5)">
  <a href="#" class="display" style="font-size:var(--t-lg)">作品集</a>
  <span class="meta">Editions No.01</span>
  <span style="flex:1"></span>
</header>

<section class="wrap" style="padding:var(--s-9) var(--s-5) var(--s-7)">
  <h1 class="display" style="font-size:var(--t-4xl);font-weight:200;max-width:12ch">系列<i>标题</i></h1>
  <p class="lede" style="margin-top:var(--s-5)">一句话说明这批作品是什么、怎么来的。</p>
  <p class="meta" style="margin-top:var(--s-6);display:flex;gap:var(--s-5);flex-wrap:wrap">
    <span>12 幅</span><span>双色至三色</span><span>Riso 孔版</span><span>2026</span>
  </p>
</section>

<div class="wrap" style="columns:3;column-gap:var(--s-6);padding-bottom:var(--s-10)">
  <figure class="reveal" style="break-inside:avoid;margin-bottom:var(--s-6)">
    <img src="assets/banner.png" alt="">
    <figcaption style="display:flex;justify-content:space-between;padding-top:var(--s-3)">
      <span class="display" style="font-size:17px">赭石 · 涟漪</span>
      <span class="meta">No.01</span>
    </figcaption>
  </figure>
</div>"""),

    "docs": ("文档 / 参考", """
<div style="display:grid;grid-template-columns:240px 1fr;gap:var(--s-8);max-width:1200px;margin:0 auto;padding:var(--s-7) var(--s-5);position:relative;z-index:2">
  <nav style="position:sticky;top:var(--s-5);align-self:start">
    <p class="display" style="font-size:var(--t-lg);margin-bottom:var(--s-5)">文档</p>
    <p class="meta" style="margin-bottom:var(--s-3)">开始</p>
    <a href="#" style="display:block;padding:6px 0">安装</a>
    <a href="#" style="display:block;padding:6px 0;color:var(--ink-2)">快速上手</a>
    <p class="meta" style="margin:var(--s-5) 0 var(--s-3)">参考</p>
    <a href="#" style="display:block;padding:6px 0 6px var(--s-4);color:var(--ink-2)">参数</a>
  </nav>
  <main class="prose">
    <h1 class="display" style="font-size:var(--t-2xl);font-weight:300">安装</h1>
    <p class="meta" style="margin-top:var(--s-2)">最后更新 2026-08-07</p>
    <p style="margin-top:var(--s-5)">先说前置条件，再给命令。不要让读者装到一半才发现缺依赖。</p>
    <pre style="background:var(--paper-3);padding:var(--s-4);font-family:ui-monospace,monospace;font-size:13px;overflow-x:auto"><code>pip install pillow numpy</code></pre>
    <div style="border-left:2px solid var(--accent);padding-left:var(--s-4);margin:var(--s-5) 0">
      <p style="font-size:14px;color:var(--ink-2);margin:0">提示块用左侧实线，不用图标不用底色。</p>
    </div>
  </main>
</div>"""),
}


def build(skeleton, pairing, accent):
    p = PAIRINGS[pairing]
    hexv = ACCENTS[accent][0]
    css = (TOKENS.replace("__ACCENT__", hexv)
                 .replace("__DISPLAY__", p["display"])
                 .replace("__UI__", p["ui"]) + BASE)
    name, body = SKELETONS[skeleton]
    head = '<!DOCTYPE html>' + chr(10) + '<html lang="zh-CN">' + chr(10) + '<head>' + chr(10)
    head += '<meta charset="UTF-8">' + chr(10)
    head += '<meta name="viewport" content="width=device-width, initial-scale=1">' + chr(10)
    head += '<title>' + name + ' · riso-press scaffold</title>' + chr(10)
    head += '<link rel="preconnect" href="https://fonts.googleapis.com">' + chr(10)
    head += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' + chr(10)
    head += '<link href="https://fonts.googleapis.com/css2?family=' + p["google"] + '&display=swap" rel="stylesheet">' + chr(10)
    head += '<style>' + css + '</style>' + chr(10) + '</head>' + chr(10) + '<body>' + chr(10)
    return head + body + chr(10) + '</body>' + chr(10) + '</html>' + chr(10)


def main():
    ap = argparse.ArgumentParser(description="riso-press 起始页生成器")
    ap.add_argument("--skeleton", choices=list(SKELETONS), default="longform")
    ap.add_argument("--pairing", choices=list(PAIRINGS), default="editorial")
    ap.add_argument("--accent", choices=list(ACCENTS), default="rust")
    ap.add_argument("--tokens-only", action="store_true", help="只输出 CSS token")
    ap.add_argument("--out", default=None)
    ap.add_argument("--list", action="store_true", help="列出全部可选项")
    a = ap.parse_args()

    if a.list:
        print("骨架:")
        for k, (n, _) in SKELETONS.items():
            print("  " + k.ljust(10) + " " + n)
        print("")
        print("字体配对:")
        for k, v in PAIRINGS.items():
            print("  " + k.ljust(10) + " " + v["label"].ljust(6) + " " + v["note"])
        print("")
        print("强调色（纸底做文字 / 白字做按钮底）:")
        for k, (h, t, b, n) in ACCENTS.items():
            print("  " + k.ljust(8) + " " + h + "  " + ("%.2f" % t) + ":1 / " + ("%.2f" % b) + ":1  " + n)
        return

    if a.tokens_only:
        p = PAIRINGS[a.pairing]
        out = (TOKENS.replace("__ACCENT__", ACCENTS[a.accent][0])
                     .replace("__DISPLAY__", p["display"])
                     .replace("__UI__", p["ui"]))
    else:
        out = build(a.skeleton, a.pairing, a.accent)

    if a.out:
        open(a.out, "w", encoding="utf-8").write(out)
        h, t, b, _ = ACCENTS[a.accent]
        print("OK  " + a.out)
        print("  骨架 " + a.skeleton + " · 字体 " + PAIRINGS[a.pairing]["label"] + " · 强调 " + a.accent + " " + h)
        print("  对比度 文字 " + ("%.2f" % t) + ":1 / 白字按钮底 " + ("%.2f" % b) + ":1")
    else:
        sys.stdout.write(out)


if __name__ == "__main__":
    main()
