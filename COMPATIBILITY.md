# 兼容性说明 · 为什么最低是 1.26.20

> 本文逐项说明：每个功能依赖什么 API、对应哪个最低游戏版本、能不能降、为什么。
> **原则：宁可保持较高的最低版本，也不为了降版本而削弱功能。**

---

## 一、最低版本怎么定的

不是拍脑袋，是看**脚本依赖的模块版本**：引擎必须提供那个版本的 `@minecraft/server`，包才能加载。

| `@minecraft/server` | 随哪个 MC 版本发布 | 依据 |
|---|---|---|
| 2.7.0 | **1.26.20** | 官方 `Update1.26.20.md`：「ships `@minecraft/server` v2.7.0」 |
| 2.8.0 | 1.26.30 | `Update1.26.30.md` |
| 2.9.0 | 1.26.40 | `Update1.26.40.md` |
| 2.10.0 | 1.26.40 时仍是 beta；stable 标签 1.26.44 | npm 版本标签 + `Update1.26.40.md` 原文 |

本 MOD 声明 `@minecraft/server 2.7.0` + `@minecraft/server-ui 2.0.0`（后者只需 1.21.84），
所以**实际最低 = 1.26.20**。

---

## 二、逐功能：依赖什么、能不能降

| 功能 | 依赖的 API | 1.x（1.21.60）有吗 | 能否等价替代 |
|---|---|---|---|
| **战斗伤害增减**（攻击加成 / 防御减伤） | `world.beforeEvents.entityHurt` + 修改 `ev.damage` | ❌ 没有 | ❌ **不能** |
| **闪避**（完全免伤） | `beforeEvents.entityHurt` + `ev.cancel = true` | ❌ 没有 | ❌ **不能** |
| **坠落伤害减免/加成** | `beforeEvents.entityHurt` 改 `ev.damage` | ❌ 没有 | ❌ **不能** |
| 装备词条化（进入背包时注入词条） | `world.afterEvents.playerInventoryItemChange` | ❌ 没有 | ⚠️ 可用轮询近似（有延迟） |
| 掉落物词条化 | `world.afterEvents.entityItemDrop` | ❌ 没有 | ✅ 可用 `entitySpawn`(item) 替代 |
| 启动引导 | `world.afterEvents.worldLoad` | ❌ 没有 | ✅ 可用 `worldInitialize` 替代 |
| 运行时信息展示 | `system.version` | ❌ 没有 | ✅ 代码里已有 `typeof` 兜底 |
| 自定义方块容器交互 | `world.afterEvents.blockContainerOpened` | ❌ 没有 | ⚠️ 无直接替代 |

### 关键结论

**`beforeEvents.entityHurt` 是这套系统的地基。** 它在 1.x 里没有对应物：

- 1.x 只有 **after** 版的 `entityHurt`，伤害已经结算完了；
- 想「减伤」只能「先挨打再回血」——玩家会看到掉血、可能触发死亡、护甲/抗性结算也已经发生；
- 想「闪避」根本做不到——`ev.cancel` 不存在，伤害必然生效。

也就是说：**降到 1.21.60 就必须把「伤害前拦截」改成「伤害后补偿」，
这等于把 RPG 战斗系统换成另一套实现** —— 正是「为了降版本而重构核心功能」，
会造成真实的功能退化，因此**不做**。

---

## 三、真机验证（BDS 1.26.52.3）

### 启动自检：18 项全部 PASS

```
af.runtime.boot / registry(1148 词条) / coverage(21 装备类型) / generate(2000 件)
af.runtime.score / synergy / item_write / item_read / enchant_preserved
af.runtime.container / effects(17 项) / commands(17 个) / resonance
af.runtime.tooltip(23 行) / classifier / damage_calibration / stats_aggregate / speed_tier
```

其中 `damage_calibration` 专门验证了「修改 `beforeEvents.entityHurt.damage` 确实传导到最终掉血」——
这正是上面说的、无法在 1.x 复现的那条链路。

### 无头 Bot 实测：装备真的会被词条化

```
give minecraft:diamond_sword 1
→ /scriptevent af:dumpinv
→ [affix-forge] af:dumpinv {"player":"vtest1",
     "items":[{"slot":0,"type":"minecraft:diamond_sword",
               "nameTag":"§b【稀有】重锤·炽炎·钻石剑§r",
               "lore":19,"rpg":true,...}]}
```

钻石剑在玩家背包里被改写为 **【稀有】重锤·炽炎·钻石剑**，带 19 行 Lore。

---

## 四、如果将来真的需要 1.21.60

只有两条路，都需要**你明确同意**，且都会损失功能：

1. **独立降级版**：另出一个 `-1.21.60-lite` 构建，把战斗系统改成 after 补偿 + 轮询。
   代价：无闪避、减伤有掉血视觉、词条注入有延迟。**主版本不受影响**。
2. **不降**：维持 1.26.20。

当前选择 **方案 2**。
