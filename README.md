# 🧪 词缀熔炉 · AffixForge

> 给原版与第三方装备随机生成「正负词条」，让每一把剑、每一件甲都独一无二。
>
> **当前版本** `v1.0.0` ｜ **最低版本** `1.26.20` ｜ **实测运行** `1.26.52.3`

[← 返回合集总仓库](https://github.com/dfy5535/minecraft-bedrock-addons)

---

## 简介

词缀熔炉会接管玩家获得的装备，为其随机生成一套「正负词条」（affix）。
正向词条给增益，负向词条给代价，形成取舍 —— 而不是单纯堆数值。

**内容规模**

- 词条库 **1148 条**（正向 609 / 负向 496 / 双向 15 / 特殊 15 / 诅咒 7 / 独特）
- 覆盖 **21 种装备类型**
- 品质 **6 档**（破碎 / 普通 / 精良 / 稀有 / 史诗 / 传说 / 神话）
- 共鸣系统（守护共鸣 / 矿工共鸣等）

---

## 两个变体 × 三种语言

| 变体 | 说明 | 中文 | 日文 | 英文 |
|---|---|---|---|---|
| **A 经典版** | 只接管原版装备，**不碰第三方** | `AffixForge-A-Classic-ZH` | `-JA` | `-EN` |
| **B 第三方兼容版** | 自动识别并接管**第三方 Add-on 装备** | `AffixForge-B-ThirdParty-ZH` | `-JA` | `-EN` |

六个包**代码完全相同**（7897 / 8160 行，逐行一致），差异只在文案语言与第三方识别策略。
按需装一个即可，不要同时装 A 和 B。

---

## 版本与兼容性

| 项 | 值 |
|---|---|
| 当前版本 | v1.0.0 |
| 最低引擎版本 | 1.26.20 |
| 脚本 API | `@minecraft/server` 2.7.0 ／ `@minecraft/server-ui` 2.0.0 |
| 实测运行版本 | 1.26.52.3 |
| 引擎格式版本 | 1.26.10 |

---

## 真机自检（BDS 1.26.52.3）

模组自带 16 项运行时自检，实测**全部 PASS**：

| 项目 | 结果 |
|---|---|
| boot | PASS |
| registry | PASS（1148 词条） |
| coverage | PASS（21 装备类型） |
| generate | PASS（生成 2000 件） |
| score | PASS |
| synergy | PASS |
| item_write | PASS（`【神话】连锁闪电·冰冷·钻石剑`，19 行 Lore，243 字节动态属性） |
| item_read | PASS |
| enchant_preserved | PASS（附魔「锋利 V」保留） |
| container | PASS |
| effects | PASS（17 项效果校验） |
| commands | PASS（17 个 scriptevent） |
| resonance | PASS |
| tooltip | PASS |
| classifier | PASS |
| damage_calibration | PASS |

---

## 语言版本（English / 日本語）

每个语言**独立打包**：只带一份语言文件（`en_US.lang` / `ja_JP.lang`），包内**不含任何中文**（连代码注释都翻过），玩法与数值和中文版完全一致。

| 语言 | 文件 |
|---|---|
| 🇨🇳 中文 | `dist/AffixForge-A-Classic-ZH-v1.0.0.mcaddon`<br>`dist/AffixForge-B-ThirdParty-ZH-v1.0.0.mcaddon` |
| 🇬🇧 English | `dist/AffixForge-A-Classic-EN-v1.0.0.mcaddon`<br>`dist/AffixForge-B-ThirdParty-EN-v1.0.0.mcaddon` |
| 🇯🇵 日本語 | `dist/AffixForge-A-Classic-JA-v1.0.0.mcaddon`<br>`dist/AffixForge-B-ThirdParty-JA-v1.0.0.mcaddon` |

> 同一变体只装**一个语言**即可；三种语言的包 UUID 各不相同，可以并存但不建议同时启用。

## 安装

1. 下载 `dist/` 里对应语言与变体的 `.mcaddon`
2. 双击导入（或游戏内「设置 → 存储」导入）
3. 新建世界或进入已有世界，**同时启用行为包与资源包**
4. 游戏内输入 `/scriptevent af:help` 查看全部指令

---

## 兼容性说明

逐项说明「每个功能依赖什么 API、对应哪个最低版本、能不能降、为什么」，以及真机验证证据：

👉 **[COMPATIBILITY.md](./COMPATIBILITY.md)**

## 已知限制

- 最低需要 Minecraft Bedrock **1.26.20**（脚本 API 2.7.0 / server-ui 2.0.0）。
- **尚未做 1.21.60 适配** —— 若要支持 1.21.60，需要把脚本 API 降到 1.17.0 并替换 5 处 2.x 专属事件
  （`world.beforeEvents.entityHurt`、`world.afterEvents.playerInventoryItemChange`、
  `entityItemDrop`、`worldLoad`、`system.version`）。

---

## 源码结构

```
bedrock-affix-forge/
├── README.md
├── CHANGELOG.md
├── LICENSE                  ← MIT（代码 / JSON）
├── LICENSE-ASSETS.md        ← CC-BY-4.0（贴图 / 模型）
├── NOTICE.md
├── dist/                    ← 6 个构建产物
└── source/
    ├── A-classic-zh/        ← 经典版 · 中文（行为包 + 资源包）
    ├── A-classic-ja/
    ├── A-classic-en/
    ├── B-thirdparty-zh/     ← 第三方兼容版 · 中文
    ├── B-thirdparty-ja/
    └── B-thirdparty-en/
```

---

## 许可证

- **代码与 JSON**：MIT — 见 [LICENSE](./LICENSE)
- **贴图与 3D 模型**：CC-BY-4.0 — 见 [LICENSE-ASSETS.md](./LICENSE-ASSETS.md)
