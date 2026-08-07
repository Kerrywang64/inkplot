# riso-press

程序化生成版画 / riso 孔版质感的拼贴艺术图，并装配成编辑风格的画廊页。**不调用任何生图模型。**

```bash
pip install pillow numpy

python3 scripts/generate.py --count 24 --seed 7 --contact sheet.png
python3 scripts/gallery.py --art art.json --out gallery.html
```

- 10 种图案结构 × 18 色板 × 3 种遮罩
- 标题由「主色 · 主结构」自动推导（赭石 · 涟漪 / Ochre Ripple）
- 每幅最多 2 层，副层必过遮罩，面积受限 —— 这是"不杂"的关键
- 画廊页自包含单文件，三种排布 + 灯箱 + 结构过滤

详见 `SKILL.md`。MIT License.
