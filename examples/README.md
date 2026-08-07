# 配方

每条都可直接复制运行。`--seed` 固定，产出可复现。

## 杂志内页 · 极简

大量留白，多为单层构成，适合长文的章节配图。

```bash
python3 scripts/generate.py --count 12 --seed 108 \
  --density 2 --contrast 4 --texture 3 \
  --palette cool --size 480 --colors 24 \
  --out zine.json --contact zine-sheet.png

python3 scripts/gallery.py --art zine.json --out zine.html \
  --title '安静的<i>十二</i>页' --layout quad
```

## 复古海报 · 做旧

错位与颗粒拉满，层次密集，像压箱底的丝网印。

```bash
python3 scripts/generate.py --count 18 --seed 1930 \
  --density 8 --contrast 9 --texture 10 \
  --palette warm --size 560 \
  --out poster.json --contact poster-sheet.png

python3 scripts/gallery.py --art poster.json --out poster.html \
  --brand 'Press No.9' --edition 'Series 1930' --layout mosaic
```

## 同结构系列 · 涟漪

锁定单一图案，只让颜色变化。做一组有明确主题的封面时用。

```bash
python3 scripts/generate.py --count 9 --seed 3 \
  --pattern rings --density 3 --contrast 7 \
  --out ripples.json --contact ripples-sheet.png

python3 scripts/gallery.py --art ripples.json --out ripples.html \
  --title '涟漪<i>九</i>则' --layout solo
```

## 界面占位图 · 轻量

小尺寸、低色数，直接内嵌进原型页面。

```bash
python3 scripts/generate.py --count 40 --seed 2026 \
  --size 320 --colors 16 --density 3 \
  --out placeholders.json
```

产出的 `art.json` 每项都带 `src`（data-URI）、`cn`/`en` 标题与 `pattern` 结构名，可直接喂给前端：

```js
const art = await fetch('placeholders.json').then(r => r.json());
document.querySelector('img').src = art[0].src;
document.querySelector('figcaption').textContent = art[0].cn;  // 赭石 · 涟漪
```

## 换色板

改 `scripts/generate.py` 顶部的 `PAL`：

```python
PAL["indigo"] = ((58, 74, 122), "藏靛", "Indigo", "cool")
```

命名系统与画廊过滤条会自动接上，不需要改别的地方。
