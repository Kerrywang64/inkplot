# 纸感编辑风 · 设计决策

这份文件不讲原理，只给**已经做好的判断**。照抄即可，不需要再权衡。

所有对比度数字都是实测的（WCAG 2.1 相对亮度公式），不是估的。

---

## 先判断：这套风格适合什么

**适合**：长文阅读、作品集、文档站、独立出版、研究报告、画廊、品牌故事页、newsletter 落地页。

**不适合**：数据密集的后台（纸色底扛不住高密度表格）、儿童产品、游戏、需要强 CTA 转化的电商促销页（这套的克制会削弱冲动）、深色模式优先的开发者工具。

不适合就别硬套。硬套的结果是"看起来很雅但完全不好用"。

---

## 一 · 色板 token

```css
:root{
  /* 底 */
  --paper:    #F3EEE5;   /* 主底色 */
  --paper-2:  #EBE4D7;   /* 次级块面、表格斑马纹 */
  --paper-3:  #E3DBCB;   /* 输入框底、代码块底 */

  /* 字 */
  --ink:      #1A1815;   /* 正文、标题        15.33:1 */
  --ink-2:    #4A463E;   /* 次要文字、图注     8.12:1 */
  --ink-3:    #6E6A61;   /* 元信息、占位符     4.66:1 */
  --ink-4:    #8A8478;   /* 仅装饰，禁止承载信息 3.21:1 */

  /* 线 */
  --rule:     rgba(26,24,21,.13);   /* 常规分隔 */
  --rule-2:   rgba(26,24,21,.28);   /* 强调分隔、输入框边 */

  /* 强调（一页只用一个） */
  --accent:   #A33F2D;   /* 铁锈 · 链接与正文强调  5.50:1 ✓ */
  --accent-bg:#A33F2D;   /* 做按钮底，配白字      6.35:1 ✓ */
  --decor:    #C66042;   /* 陶土 · 仅装饰         3.53:1 ✗ */
}
```

### 强调色候选（按用途查表）

| 色 | Hex | 纸底上做文字 | 做按钮底配白字 | 结论 |
|---|---|---|---|---|
| 铁锈 rust | `#A33F2D` | 5.50:1 ✓ | 6.35:1 ✓ | **默认强调色**，两种用法都合格 |
| 松林 forest | `#365242` | 7.44:1 ✓ | 8.60:1 ✓ | 冷静、机构感，适合文档与研究 |
| 靛蓝 denim | `#465E84` | 5.69:1 ✓ | 6.57:1 ✓ | 适合金融、法务 |
| 酒红 wine | `#723244` | 8.06:1 ✓ | 9.31:1 ✓ | 对比最强，适合正式出版 |
| 橄榄 olive | `#687648` | 4.25:1 ✗ | 4.91:1 ✓ | 只能做按钮底，**不能做正文链接** |
| 陶土 clay | `#C66042` | 3.53:1 ✗ | 4.08:1 ✗ | **纯装饰**：图版、大标题填色、图标 |

**规则：一页一个强调色。** 需要第二个语义色时用状态色，不要引入第二个品牌色。

### 状态色

```css
--ok:   #3F6B4A;   /* 成功 */
--warn: #8A6410;   /* 警告 */
--bad:  #9B2F28;   /* 错误 */
```

都在纸底上 ≥ 4.5:1。**不要用纯红 `#FF0000` 或纯绿 `#00FF00`**——在纸色底上刺眼，且破坏整套的低饱和逻辑。

---

## 二 · 字体配对

四组，按气质选。全部 Google Fonts，免费商用。

### A · 编辑默认（推荐起点）

展示字 `Newsreader`（衬线，光学尺寸可变）· 界面字 `Inter` · 中文 `Noto Serif SC`

气质：warm、可读、不摆架子。适合长文与作品集。

### B · 高对比出版

展示字 `Playfair Display` · 界面字 `Inter` · 中文 `Noto Serif SC`

Playfair 的粗细反差大，48px 以上才好看，**小于 32px 不要用**。适合封面、大标题、时尚与美妆。

### C · 学术与文档

展示字 `Source Serif 4` · 界面字 `IBM Plex Sans` · 等宽 `IBM Plex Mono` · 中文 `Noto Serif SC`

气质：中性、可信、耐读。适合研究报告、技术文档、白皮书。

### D · 现代无衬线（不想用衬线时）

展示字 `Instrument Sans` · 界面字 `Inter` · 中文 `Noto Sans SC`

保留纸感底色但换掉衬线，气质更当代。适合工具类产品的官网。

具体的 Google Fonts import 串见 `scripts/scaffold.py` 的 `PAIRINGS`，跑 `--list` 可以看全部。

### 硬规则

- **一页最多两个字族**（中文补一个不算）。第三个开始画面就散。
- 展示字只用在 h1/h2 和引言，**正文一律用界面字**——衬线正文在屏幕上长距离阅读会累。
- 中英混排时中文字号比英文大 1–2px，因为中文字面率更高，同字号看起来更小。
- 数字一律 `font-variant-numeric: tabular-nums`。表格里数字跳动是排版事故。

---

## 三 · 字级刻度

以 16px 为基准的模块化刻度（比例 1.25）：

```css
--t-xs:  11px;   /* 元信息、版权、标签      letter-spacing:.16em; uppercase */
--t-sm:  13px;   /* 图注、次要说明 */
--t-base:16px;   /* 正文 —— 不要低于这个数 */
--t-lg:  20px;   /* 引言、导语 */
--t-xl:  25px;   /* h3 */
--t-2xl: 31px;   /* h2 */
--t-3xl: 48px;   /* h1 */
--t-4xl: 76px;   /* 封面级展示字 */
```

行高：正文 `1.7`，标题 `1.15`，展示字 `1.0`。

字重：这套风格用 `200/300/400/500` 四档就够。**不要用 700 以上**——粗体在纸色底上显脏，要强调就换字号或换字族。

---

## 四 · 间距与版心

8px 基准：

```css
--s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px;
--s-6:32px; --s-7:48px; --s-8:64px; --s-9:96px; --s-10:128px;
```

**版心宽度由行长决定，不是屏幕宽度的百分比。**

| 内容 | 版心 | 理由 |
|---|---|---|
| 长文正文 | `max-width: 68ch` | 45–75 字符是眼睛不跳行的区间 |
| 带图文混排 | `max-width: 860px` | |
| 画廊 / 网格 | `max-width: 1320px` | |
| 全宽区块 | 不限，但内部文字仍受上面约束 | |

章节间距：`--s-9`（96px）起。这套风格靠留白建立节奏，**间距吝啬会立刻显得廉价**。

---

## 五 · 动效规格

```css
--ease: cubic-bezier(.22,.9,.24,1);   /* 默认缓动，慢出快进 */
--t-fast:   160ms;   /* hover、focus、颜色变化 */
--t-normal: 240ms;   /* 展开收起、位移 */
--t-slow:   420ms;   /* 页面级转场、遮罩 */
```

**超过 400ms 用户会以为卡住。** 只有整页转场可以到 420ms。

### 该动的

- 元素进场：`opacity` + `translateY(20px)` → 归位，`--t-slow`，同组错开 60–90ms
- hover：`translateY(-2px)` 或边框色变化，`--t-fast`
- 分隔线绘制：`stroke-dashoffset` 归零，适合星座图/流程图

### 不该动的

- 正在阅读的正文
- 正在输入的表单
- 错误提示（出现要即时，不要淡入）
- 表格行、列表项的常驻动画

### 性能

只动 `transform` 和 `opacity`。位移用 `translate` 不用 `top/left`，缩放用 `scale` 不用 `width/height`。进场用 `IntersectionObserver`，不要监听 `scroll`。

### 底线

```css
@media (prefers-reduced-motion: reduce){
  *{ animation:none !important; transition-duration:.01ms !important }
  .reveal{ opacity:1 !important; transform:none !important }
}
```

**这不是可选项。** 前庭功能敏感的用户开了系统开关之后，这一页必须是完全静态的。

---

## 六 · 六种版式骨架

选一个照着搭，不要自己发明。前四种可以用 `python3 scripts/scaffold.py --skeleton <name>` 直接生成起始页。

### 1 · 报头式长文（longform）

细线导航 → 超大衬线标题（48–76px，200 字重）→ 导语 20px ink-2 max 42ch → 元信息行（作者 · 日期 · 时长）→ 分隔线 → 正文 68ch，段间 `--s-5`，每 3–4 段插一张图版 → 署名与更正 → 相关阅读 3 条 → 页脚

首屏必须有：标题 + 导语 + 日期。**没有日期的文章等于没有可信度。**

### 2 · 图集画廊（gallery）

极简顶栏（品牌 + 计数 + 排布切换）→ 开场大标题 + 一句说明 + 元信息行（数量/媒介/年份）→ 过滤条（**由内容自动推导，不硬编码**）→ 瀑布流/双栏/单幅三种排布 → 灯箱（← → 翻页，Esc 关闭，图注带元数据）

### 3 · 索引目录（index）

顶栏 → 标题 + 一句说明 → 条目行（细线分隔）：缩略 20px | 名称（衬线）| 分类 | 编号（tabular-nums 右对齐），行高 `--s-6`，hover 整行底色变 `paper-2` → 分组标题用 11px uppercase ink-3 + 上方 `--s-7` 留白

超过 20 条必须加搜索。**四层以上的层级用搜索替代点击。**

### 4 · 单栏落地页（landing）

顶栏（品牌 + 2–3 项 + 一个主 CTA）→ Hero：大标题 + 副标题 + 主 CTA + **一行可验证的证据**（具体数字或具体名字，不是"业界领先"）→ 问题陈述一段 → 方案 3 条（小标题 + 两行说明 + 一张图版）→ 证据区（真实引述带姓名身份，或可点的数据出处）→ 第二个 CTA（跟第一个同文案）→ 页脚

CTA 文案用**动词开头**：「开始免费报价」优于「了解更多」。

### 5 · 文档 / 参考（docs）

左侧固定目录（当前项高亮，二级缩进 `--s-4`）→ 右侧正文 68ch，h2 上方 `--s-8` 下方细线，代码块底色 `paper-3` 等宽字无圆角或 4px，提示块用左侧 2px 强调色实线（不用图标不用底色）→ 右侧「本页目录」仅桌面显示

### 6 · 作品集（portfolio）

开场：姓名（超大）+ 一句话定位 + 联系方式 → 项目列表，每项：大图版（全宽或 2/3 宽）+ 项目名（衬线 31px）+ 角色 + 年份 + 两行说明（**写解决了什么问题，不要写职责清单**）→ 简历下载 + 联系

---

## 七 · 组件规格

### 按钮

```css
.btn{
  min-height:48px;            /* 触控下限 44px，这里留余量 */
  padding:0 26px;
  border-radius:0;            /* 这套风格用直角或 2px，不用胶囊 */
  font-size:15px; font-weight:500;
  transition:.16s var(--ease);
}
.btn-primary{ background:var(--accent-bg); color:#fff }   /* 6.35:1 */
.btn-ghost{ background:transparent; border:1px solid var(--ink); color:var(--ink) }
.btn-ghost:hover{ background:var(--ink); color:var(--paper) }
```

一屏一个主按钮。第二个操作用 ghost，第三个用纯文字链接。

### 输入

```css
.input{
  min-height:48px; padding:0 16px;
  background:var(--paper-3);
  border:1px solid var(--rule-2);
  border-radius:0;
  font-size:16px;             /* 低于 16px iOS 会自动放大页面 */
}
.input:focus{
  outline:2px solid var(--accent);
  outline-offset:2px;
  border-color:var(--accent);
}
```

**永远不要删 `outline`。** 删掉聚焦轮廓等于把键盘用户赶出门。

标签放在输入框**上方**，不用 placeholder 当标签——一开始输入标签就消失了。

### 卡片

这套风格**不用阴影建立层级**，用边框和留白。需要浮起感时才用一层极淡阴影：`0 14px 34px rgba(26,24,21,.08)`。

### 表格

```css
th{ font-size:11px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--ink-3); font-weight:600; text-align:left }
td{ font-size:14px; padding:var(--s-3) var(--s-4);
    border-bottom:1px solid var(--rule) }
td.num{ font-variant-numeric:tabular-nums; text-align:right }
```

网格线越淡越好，网格线是参照不是主角。斑马纹用 `paper-2`，只在超过 8 行时才加。

### 分隔线

- 实线 `--rule` = 断言，用于结构分区
- 虚线 = 犹豫，**这套风格里基本不用**
- 留白 = 信任，优先用留白，不够再上线

---

## 八 · 交付前自查

```
[ ] 正文对比度 ≥ 4.5:1，大字 ≥ 3:1（实测，不是估）
[ ] 触控目标 ≥ 44px
[ ] focus 轮廓可见，没被 outline:none 干掉
[ ] 正文 ≥ 16px，行长 45–75 字符
[ ] 数字用 tabular-nums
[ ] 一页只有一个强调色、最多两个字族
[ ] 图片有 alt，写的是内容不是关键词
[ ] prefers-reduced-motion 已降级
[ ] 375 / 768 / 1024 / 1440 四个断点都看过
[ ] 打印样式表（@media print）—— 这套风格的内容大概率会被打印
[ ] 没有用 emoji 当图标（用 SVG）
[ ] 所有可点元素有 cursor:pointer 和 hover 态
```

反模式清单见 [`anti-patterns.md`](anti-patterns.md)。
