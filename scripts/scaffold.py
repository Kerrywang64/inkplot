#!/usr/bin/env python3
"""
riso-press · starter page generator

Turns the decisions in references/design-system.md into code you can run.
This is not a template engine; it packages judgements that have already been
made into a starting point that works.

Usage:
  python3 scripts/scaffold.py --list
  python3 scripts/scaffold.py --skeleton longform --out index.html
  python3 scripts/scaffold.py --tokens-only --accent forest --out tokens.css
"""
import argparse, sys

PAIRINGS = {
    "editorial": dict(
        label="Editorial default",
        google="Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,300;0,6..72,400;1,6..72,300&family=Inter:wght@400;500&family=Noto+Serif+SC:wght@300;400",
        display='Newsreader, "Noto Serif SC", Georgia, serif',
        ui='Inter, "Noto Serif SC", -apple-system, "PingFang SC", sans-serif',
        note="Warm, readable, unpretentious. The starting point for longform and portfolios."),
    "publishing": dict(
        label="High-contrast publishing",
        google="Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500&family=Noto+Serif+SC:wght@300;400",
        display='"Playfair Display", "Noto Serif SC", Georgia, serif',
        ui='Inter, "Noto Serif SC", -apple-system, "PingFang SC", sans-serif',
        note="Extreme thick-thin contrast; only looks right above 48px. Covers, fashion, beauty."),
    "docs": dict(
        label="Academic and documentation",
        google="Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;1,8..60,400&family=IBM+Plex+Sans:wght@400;500&family=Noto+Serif+SC:wght@300;400",
        display='"Source Serif 4", "Noto Serif SC", Georgia, serif',
        ui='"IBM Plex Sans", "Noto Serif SC", -apple-system, sans-serif',
        note="Neutral, credible, durable to read. Research reports and technical docs."),
    "modern": dict(
        label="Modern sans",
        google="Instrument+Sans:wght@400;500;600&family=Inter:wght@400;500&family=Noto+Sans+SC:wght@300;400;500",
        display='"Instrument Sans", "Noto Sans SC", -apple-system, sans-serif',
        ui='Inter, "Noto Sans SC", -apple-system, "PingFang SC", sans-serif',
        note="Keeps the paper ground but drops the serif; reads more contemporary. Marketing sites for tools."),
}

# Contrast is measured (WCAG 2.1): as text on paper / as a button fill with white text
ACCENTS = {
    "rust":   ("#A33F2D", 5.50, 6.35, "Default. Passes for both uses"),
    "forest": ("#365242", 7.44, 8.60, "Calm, institutional. Docs and research"),
    "denim":  ("#465E84", 5.69, 6.57, "Finance and legal"),
    "wine":   ("#723244", 8.06, 9.31, "Highest contrast. Formal publishing"),
    "olive":  ("#687648", 4.25, 4.91, "Button fill only, never a body link"),
}

TOKENS = """/* riso-press · paper-editorial tokens
   Values come from references/design-system.md. Do not invent new ones. */
:root{
  --paper:#F3EEE5; --paper-2:#EBE4D7; --paper-3:#E3DBCB;
  --ink:#1A1815;    /* 15.33:1 body and headings */
  --ink-2:#4A463E;  /*  8.12:1 secondary text */
  --ink-3:#6E6A61;  /*  4.66:1 meta */
  --ink-4:#8A8478;  /*  3.21:1 decorative only, must never carry information */
  --rule:rgba(26,24,21,.13); --rule-2:rgba(26,24,21,.28);
  --accent:__ACCENT__;
  --decor:#C66042;  /* clay 3.53:1 — decorative only, never text or a button fill */
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

/* The floor. Not optional. */
@media(prefers-reduced-motion:reduce){
  *{animation:none!important;transition-duration:.01ms!important}
  .reveal{opacity:1!important;transform:none!important}
}

/* Content in this style is very likely to be printed */
@media print{
  body::before{display:none}
  body{background:#fff;color:#000;font-size:11pt}
  .btn,nav,footer{display:none}
  .prose{max-width:none}
}
"""

SKELETONS = {
    "longform": ("Masthead longform", """
<header class="wrap" style="display:flex;align-items:baseline;gap:var(--s-5);padding-top:var(--s-5)">
  <a href="#" class="display" style="font-size:var(--t-lg)">Brand</a>
  <span class="meta">Issue 01</span>
  <span style="flex:1"></span>
  <a href="#" class="meta">Contents</a><a href="#" class="meta">About</a>
</header>
<hr class="rule" style="margin-top:var(--s-5)">

<article class="wrap" style="padding-top:var(--s-9);padding-bottom:var(--s-10)">
  <h1 class="display" style="font-size:var(--t-3xl);font-weight:200;max-width:16ch">
    A headline states the conclusion, <i>not the topic</i>
  </h1>
  <p class="lede" style="margin-top:var(--s-5)">One line of standfirst saying what the reader takes away. No wider than 42 characters.</p>
  <p class="meta" style="margin-top:var(--s-5)">Author Name · 7 August 2026 · about 6 min</p>
  <hr class="rule" style="margin:var(--s-7) 0">
  <div class="prose">
    <p>The body measure is 68ch. That width is not a taste decision: it is the top of the 45–75 character band, past which the eye starts losing its line.</p>
    <h2>Subhead</h2>
    <p>A plate every 3–4 paragraphs. Captions at 13px in ink-3.</p>
    <figure style="margin:var(--s-6) 0">
      <img src="assets/banner.png" alt="Describe what is in the image, not a pile of keywords">
      <figcaption>A caption carries what the image does not; it never repeats the headline.</figcaption>
    </figure>
    <blockquote>Pull quotes use a 2px solid rule on the left. No quotation-mark graphic, no fill.</blockquote>
  </div>
  <hr class="rule" style="margin:var(--s-8) 0 var(--s-5)">
  <p class="meta">Last updated 2026-08-07 · corrections welcome by email</p>
</article>"""),

    "landing": ("Single-column landing", """
<header class="wrap" style="display:flex;align-items:center;gap:var(--s-5);padding:var(--s-4) var(--s-5)">
  <a href="#" class="display" style="font-size:var(--t-lg)">Product</a>
  <span style="flex:1"></span>
  <a href="#" class="meta">Features</a><a href="#" class="meta">Pricing</a>
  <a href="#" class="btn btn-primary" style="min-height:40px;padding:0 20px">Get started</a>
</header>
<hr class="rule">

<section class="wrap" style="padding:var(--s-10) var(--s-5)">
  <h1 class="display" style="font-size:var(--t-3xl);font-weight:200;max-width:18ch">
    One line saying what problem you solve
  </h1>
  <p class="lede" style="margin-top:var(--s-5)">The subhead adds how it is done. It never repeats the headline.</p>
  <div style="display:flex;gap:var(--s-3);margin-top:var(--s-6);flex-wrap:wrap">
    <a href="#" class="btn btn-primary">Start a free trial</a>
    <a href="#" class="btn btn-ghost">See how it works</a>
  </div>
  <p class="meta" style="margin-top:var(--s-5)">Used by 340 teams · no credit card needed</p>
</section>
<hr class="rule">

<section class="wrap" style="padding:var(--s-9) var(--s-5)">
  <div class="prose">
    <h2 class="display" style="font-size:var(--t-2xl)">Where it goes wrong</h2>
    <p>One paragraph naming the pain. In the user’s language, not the system’s.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:var(--s-5);margin-top:var(--s-7)">
    <div class="card"><h3 class="display" style="font-size:var(--t-xl)">One</h3>
      <p style="color:var(--ink-2);margin-top:var(--s-2);font-size:14px">Two lines saying what this one solves.</p></div>
    <div class="card"><h3 class="display" style="font-size:var(--t-xl)">Two</h3>
      <p style="color:var(--ink-2);margin-top:var(--s-2);font-size:14px">Write the outcome, not a feature list.</p></div>
    <div class="card"><h3 class="display" style="font-size:var(--t-xl)">Three</h3>
      <p style="color:var(--ink-2);margin-top:var(--s-2);font-size:14px">Three is enough; a fourth starts diluting attention.</p></div>
  </div>
</section>
<hr class="rule">

<section class="wrap" style="padding:var(--s-9) var(--s-5);text-align:center">
  <h2 class="display" style="font-size:var(--t-2xl);max-width:20ch;margin:0 auto">
    The second CTA uses the same copy as the first
  </h2>
  <a href="#" class="btn btn-primary" style="margin-top:var(--s-5)">Start a free trial</a>
</section>"""),

    "gallery": ("Image gallery", """
<header class="wrap" style="display:flex;align-items:baseline;gap:var(--s-5);padding:var(--s-5)">
  <a href="#" class="display" style="font-size:var(--t-lg)">Portfolio</a>
  <span class="meta">Editions No.01</span>
  <span style="flex:1"></span>
</header>

<section class="wrap" style="padding:var(--s-9) var(--s-5) var(--s-7)">
  <h1 class="display" style="font-size:var(--t-4xl);font-weight:200;max-width:12ch">Series <i>Title</i></h1>
  <p class="lede" style="margin-top:var(--s-5)">One line on what this set is and where it came from.</p>
  <p class="meta" style="margin-top:var(--s-6);display:flex;gap:var(--s-5);flex-wrap:wrap">
    <span>12 plates</span><span>two to three inks</span><span>Riso</span><span>2026</span>
  </p>
</section>

<div class="wrap" style="columns:3;column-gap:var(--s-6);padding-bottom:var(--s-10)">
  <figure class="reveal" style="break-inside:avoid;margin-bottom:var(--s-6)">
    <img src="assets/banner.png" alt="">
    <figcaption style="display:flex;justify-content:space-between;padding-top:var(--s-3)">
      <span class="display" style="font-size:17px">Ochre Ripple</span>
      <span class="meta">No.01</span>
    </figcaption>
  </figure>
</div>"""),

    "docs": ("Docs / reference", """
<div style="display:grid;grid-template-columns:240px 1fr;gap:var(--s-8);max-width:1200px;margin:0 auto;padding:var(--s-7) var(--s-5);position:relative;z-index:2">
  <nav style="position:sticky;top:var(--s-5);align-self:start">
    <p class="display" style="font-size:var(--t-lg);margin-bottom:var(--s-5)">Docs</p>
    <p class="meta" style="margin-bottom:var(--s-3)">Getting started</p>
    <a href="#" style="display:block;padding:6px 0">Install</a>
    <a href="#" style="display:block;padding:6px 0;color:var(--ink-2)">Quick start</a>
    <p class="meta" style="margin:var(--s-5) 0 var(--s-3)">Reference</p>
    <a href="#" style="display:block;padding:6px 0 6px var(--s-4);color:var(--ink-2)">Parameters</a>
  </nav>
  <main class="prose">
    <h1 class="display" style="font-size:var(--t-2xl);font-weight:300">Install</h1>
    <p class="meta" style="margin-top:var(--s-2)">Last updated 2026-08-07</p>
    <p style="margin-top:var(--s-5)">State the prerequisites first, then give the command. Do not let the reader get halfway through and discover a missing dependency.</p>
    <pre style="background:var(--paper-3);padding:var(--s-4);font-family:ui-monospace,monospace;font-size:13px;overflow-x:auto"><code>pip install pillow numpy</code></pre>
    <div style="border-left:2px solid var(--accent);padding-left:var(--s-4);margin:var(--s-5) 0">
      <p style="font-size:14px;color:var(--ink-2);margin:0">Callouts use a solid rule on the left. No icon, no fill.</p>
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
    head = '<!DOCTYPE html>' + chr(10) + '<html lang="en">' + chr(10) + '<head>' + chr(10)
    head += '<meta charset="UTF-8">' + chr(10)
    head += '<meta name="viewport" content="width=device-width, initial-scale=1">' + chr(10)
    head += '<title>' + name + ' · riso-press scaffold</title>' + chr(10)
    head += '<link rel="preconnect" href="https://fonts.googleapis.com">' + chr(10)
    head += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' + chr(10)
    head += '<link href="https://fonts.googleapis.com/css2?family=' + p["google"] + '&display=swap" rel="stylesheet">' + chr(10)
    head += '<style>' + css + '</style>' + chr(10) + '</head>' + chr(10) + '<body>' + chr(10)
    return head + body + chr(10) + '</body>' + chr(10) + '</html>' + chr(10)


def main():
    ap = argparse.ArgumentParser(description="riso-press starter page generator")
    ap.add_argument("--skeleton", choices=list(SKELETONS), default="longform")
    ap.add_argument("--pairing", choices=list(PAIRINGS), default="editorial")
    ap.add_argument("--accent", choices=list(ACCENTS), default="rust")
    ap.add_argument("--tokens-only", action="store_true", help="output the CSS tokens only")
    ap.add_argument("--out", default=None)
    ap.add_argument("--list", action="store_true", help="list every available option")
    a = ap.parse_args()

    if a.list:
        print("Skeletons:")
        for k, (n, _) in SKELETONS.items():
            print("  " + k.ljust(10) + " " + n)
        print("")
        print("Font pairings:")
        for k, v in PAIRINGS.items():
            print("  " + k.ljust(10) + " " + v["label"].ljust(6) + " " + v["note"])
        print("")
        print("Accents (as text on paper / as a button fill with white text):")
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
        print("  skeleton " + a.skeleton + " · fonts " + PAIRINGS[a.pairing]["label"] + " · accent " + a.accent + " " + h)
        print("  contrast — text " + ("%.2f" % t) + ":1 / white on fill " + ("%.2f" % b) + ":1")
    else:
        sys.stdout.write(out)


if __name__ == "__main__":
    main()
