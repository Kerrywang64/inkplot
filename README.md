<p align="center">
  <img src="assets/banner.png" width="100%" alt="riso-press">
</p>

<h1 align="center">riso-press</h1>

<p align="center">
  <em>Data, printed.</em><br>
  数据可视化 × 孔版印刷的配图生成器 · 零素材依赖 · 同种子完全可复现
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1A1815?style=flat-square" alt="MIT"></a>
  <img src="https://img.shields.io/badge/deps-0-1A1815?style=flat-square" alt="zero deps">
  <img src="https://img.shields.io/badge/specimens-43-C66042?style=flat-square" alt="43 specimens">
</p>

---

<img src="assets/gallery.png" width="100%" alt="gallery">

---

## 这是什么

一张配图 = **一个底色 + 一个第二色场 + 一个数据图形标本**。三件封顶。

不调生图模型，不依赖素材文件，不联网。图像由 Canvas 逐层绘制：色场分割 → 撕边 → 标本 → 网点叠印 → 干笔 → 纸基噪声。

## 为什么是数据图形

抽象纹样的问题不是不好看，是**抽出任何一张都联想不出意义**。饼图就是饼图，注意力矩阵就是注意力矩阵——图形自带语义，缩到 120px 仍然认得出。

## 用

```html
<script src="scripts/collage.js"></script>
<script>
  COLLAGE.init({ count: 24, seed: 20260808 });
  document.querySelectorAll('[data-plate]').forEach((el, i) => COLLAGE.attach(el, i));
</script>
```

## 自检

```bash
node measure.mjs      # 笔宽 / 墨覆盖
node diversity.mjs    # 两两结构距离，防重复
```

把「看着不对」变成可以对照的数。笔宽用面积/边缘比估计，抗抗锯齿；多样性用 24×24 去均值后的两两 L2 距离——**只优化墨覆盖会把多样性优化没**，两个数必须一起盯。

## 设计理念

七条，写在 [`SKILL.md`](SKILL.md)。最贵的一条：**变化要来自实例，不来自数量**——加母题只降低重复的频率，不解决重复本身。

## 许可

MIT。图案手法与数据可视化语法均属公共领域，生成图像可自由商用。
