// scripts/main.ts
import { system as system10, world as world14 } from "@minecraft/server";

// scripts/core/Players.ts
import { world } from "@minecraft/server";
var DIMENSIONS = ["overworld", "nether", "the_end"];
function onlinePlayers() {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (p) => {
    if (!p) return;
    const player = p;
    try {
      const id = player.id;
      if (!id || seen.has(id)) return;
      seen.add(id);
      out.push(player);
    } catch {
    }
  };
  try {
    for (const p of world.getAllPlayers()) push(p);
  } catch {
  }
  if (out.length === 0) {
    for (const dimId of DIMENSIONS) {
      try {
        const dim = world.getDimension(dimId);
        for (const e of dim.getEntities()) {
          try {
            if (e.typeId === "minecraft:player") push(e);
          } catch {
          }
        }
      } catch {
      }
    }
  }
  return out;
}
function firstPlayer() {
  return onlinePlayers()[0];
}

// scripts/core/Log.ts
import { world as world2 } from "@minecraft/server";
var RESULT_PREFIX = "KIRA_TEST_RESULT ";
function emit(id, status, extra = {}) {
  const payload = { id, status, ...extra };
  console.warn(RESULT_PREFIX + JSON.stringify(payload));
}
function pass(id, extra = {}) {
  emit(id, "PASS", extra);
}
function fail(id, error, extra = {}) {
  emit(id, "FAIL", { error, ...extra });
}
function zlog(message, extra) {
  const tail = extra ? " " + JSON.stringify(extra) : "";
  console.warn("[affix-forge] " + message + tail);
}

// scripts/systems/CombatSystem.ts
import {
  EntityDamageCause,
  system,
  world as world3
} from "@minecraft/server";

// scripts/data/Stats.ts
var META = {};
function M(key2, label, unit, score, channel, condition, extra) {
  META[key2] = { label, unit, score, channel, condition, ...extra ?? {} };
}
M("attackPct", "攻撃ダメージ", "pct", 3, "offMult");
M("meleePct", "近接ダメージ", "pct", 2.8, "offMult");
M("chargedBonusPct", "チャージ初撃ダメージ", "pct", 1.4, "offMult");
M("armorPenPct", "アーマー無視", "pct", 2.6, "offMult");
M("sunderPct", "敵防御弱体", "pct", 2, "offMult");
M("bleedDps", "出血ダメージ毎秒", "flat", 9, "proc", void 0, { effect: "bleed" });
M("executePct", "処刑増傷", "pct", 1.6, "offMult", "targetLowHp");
M("killStackPct", "撃破で攻撃上昇", "pct", 1.8, "offMult", "killStack");
M("rampagePct", "同敵連撃増傷", "pct", 2, "offMult", "combo");
M("berserkPct", "低体力増傷", "pct", 2.2, "offMult", "selfLowHp");
M("vengeancePct", "被弾後増傷", "pct", 2, "offMult", "hurtRecent");
M("chasePct", "移動標的追跡", "pct", 1.8, "offMult", "targetMoving");
M("snipePct", "遠距離増傷", "pct", 1.6, "offMult", "far");
M("weakspotPct", "弱点増傷", "pct", 2.4, "offMult");
M("dancePct", "連撃追加ダメージ", "pct", 1.8, "offMult", "combo");
M("burstSpeedPct", "バースト攻速", "pct", 1.6, "offMult", "hurtRecent");
M("bloodRagePct", "与ダメ後攻撃上昇", "pct", 1.8, "offMult", "hurtRecent");
M("assaultPct", "強襲増傷", "pct", 1.5, "offMult");
M("staggerChance", "ひるみ確率", "pct", 8, "proc", void 0, { effect: "stagger" });
M("elitePct", "エリート増傷", "pct", 2, "offMult", "elite");
M("giantPct", "巨大モブ増傷", "pct", 1.8, "offMult", "giant");
M("undeadPct", "アンデッド増傷", "pct", 2, "offMult", "undead");
M("arthropodPct", "節足動物増傷", "pct", 2, "offMult", "arthropod");
M("illagerPct", "邪悪増傷", "pct", 2, "offMult", "illager");
M("aquaticPct", "水生増傷", "pct", 2, "offMult", "aquatic");
M("nethermobPct", "ネザーモブ増傷", "pct", 2, "offMult", "nethermob");
M("bossPct", "Boss 増傷", "pct", 1.8, "offMult", "boss");
M("crowdPct", "敵多数増傷", "pct", 1.6, "offMult", "crowd");
M("soloPct", "単独増傷", "pct", 1.8, "offMult", "solo");
M("allInPct", "一か八か増傷", "pct", 1.4, "offMult", "crowd");
M("nightPct", "夜間増傷", "pct", 1.6, "offMult", "night");
M("dayPct", "昼間増傷", "pct", 1.6, "offMult", "day");
M("netherPct", "ネザー増傷", "pct", 1.5, "offMult", "nether");
M("waterPct", "水中増傷", "pct", 1.5, "offMult", "water");
M("burningTargetPct", "炎上標的増傷", "pct", 1.8, "offMult", "burning");
M("frozenTargetPct", "凍結標的増傷", "pct", 1.8, "offMult", "frozen");
M("poisonedTargetPct", "毒標的増傷", "pct", 1.8, "offMult", "poisoned");
M("backstabPct", "背後襲撃増傷", "pct", 2.2, "offMult", "behind");
M("unwoundedPct", "満体力標的増傷", "pct", 2, "offMult", "unwounded");
M("critFollowPct", "クリティカル追加", "pct", 2.2, "offMult", "crit");
M("flatDamage", "固定追加ダメージ", "flat", 14, "flat");
M("firstStrikePct", "先制増傷", "pct", 1.8, "offMult", "unwounded");
M("critChance", "クリティカル率", "pct", 7, "critChance");
M("critDamage", "クリティカルダメージ", "pct", 2.4, "critDamage");
M("killCritPct", "撃破後クリ率", "pct", 3, "critChance", "killStack");
M("lowHpCrit", "低体力クリ率", "pct", 3.2, "critChance", "targetLowHp");
M("luckyChance", "ラッキーヒット率", "pct", 12, "proc", void 0, { effect: "lucky" });
M("doubleStrikeChance", "追撃発生確率", "pct", 6, "proc", void 0, { effect: "doubleStrike" });
M("finisherChance", "終結追加重撃", "pct", 5, "proc", void 0, { effect: "finisher" });
M("hunterHeartCrit", "満体力クリ率", "pct", 3, "critChance", "unwounded");
M("gambleCrit", "賭博師クリ率", "pct", 5, "critChance");
M("gambleLossPct", "賭博師ダメ変動", "pct", 2, "proc", void 0, { negative: true });
M("attackSpeedPct", "攻撃速度", "pct", 4.2, "effect", void 0, { effect: "haste" });
M("comboAtkSpeed", "連撃攻速", "pct", 3.2, "effect", "combo", { effect: "haste" });
M("followUpSpeedPct", "追撃攻速", "pct", 3, "effect", "hurtRecent", { effect: "haste" });
M("attackCooldownPct", "攻撃クールダウン", "pct", 3, "effect", void 0, { negative: true, effect: "mining_fatigue" });
M("lifesteal", "ライフスティール", "pct", 9, "lifesteal");
M("killHeal", "撃破回復", "flat", 10, "killHeal");
M("bloodPowerPct", "吸血後攻撃上昇", "pct", 1.8, "offMult", "hurtRecent");
M("maxHealthPct", "最大体力", "pct", 3.4, "effect", void 0, { effect: "health_boost" });
M("regenPct", "体力回復効率", "pct", 2.6, "effect", void 0, { effect: "regeneration" });
M("regenFlat", "毎秒回復", "flat", 18, "effect", void 0, { effect: "regeneration", per: 0.4 });
M("lowHpDefense", "低体力防御", "pct", 3, "defense", "selfLowHp");
M("bloodPool", "撃破で臨時体力", "flat", 9, "killHeal");
M("highHpShield", "高体力シールド", "flat", 8, "effect", void 0, { effect: "absorption", per: 1.5 });
M("outOfCombatRegen", "戦闘外回復", "pct", 3, "effect", void 0, { effect: "regeneration" });
M("defensePct", "全体ダメ軽減", "pct", 5, "defense");
M("resistPct", "耐性上昇", "pct", 3.6, "defense");
M("flatReduce", "固定ダメ軽減", "flat", 16, "flatReduce");
M("shieldChance", "シールド発動", "pct", 6, "proc", void 0, { effect: "shield" });
M("absorbFlat", "吸収量", "flat", 9, "effect", void 0, { effect: "absorption" });
M("deflectPct", "遠距離軽減", "pct", 2.6, "defense", "ranged");
M("blockPct", "ガード強度", "pct", 3, "defense", "blocking");
M("guardReducePct", "ガード後軽減", "pct", 3.4, "defense", "blocking");
M("standStillDefense", "静止防御", "pct", 3, "defense", "standing");
M("counterPct", "反撃増傷", "pct", 2.2, "offMult", "blocking");
M("watchDefense", "周囲敵防御", "pct", 3, "defense", "crowd");
M("lastStandChance", "致死耐え", "pct", 14, "proc", void 0, { effect: "lastStand" });
M("thornsPct", "棘の反撃", "pct", 3.2, "thorns");
M("reflectChance", "負効果反射", "pct", 5, "proc", void 0, { effect: "reflect" });
M("elementBarrierPct", "元素ダメ軽減", "pct", 3, "defense");
M("damageTakenPct", "被ダメージ", "pct", 3.6, "defense", void 0, { negative: true });
M("healingReducePct", "治療効果", "pct", 2.6, "effect", void 0, { negative: true, effect: "wither" });
M("moveSpeedPct", "移動速度", "pct", 4, "effect", void 0, { effect: "speed" });
M("sprintSpeedPct", "ダッシュ速度", "pct", 2.6, "effect", void 0, { effect: "speed" });
M("jumpPct", "ジャンプ高", "pct", 2, "effect", void 0, { effect: "jump_boost" });
M("fallReducePct", "落下ダメ軽減", "pct", 2, "flag", void 0, { effect: "fallReduce" });
M("waterSpeedPct", "水中移動", "pct", 1.6, "effect", void 0, { effect: "conduit_power" });
M("swimPct", "泳ぎ速度", "pct", 1.6, "effect", void 0, { effect: "conduit_power" });
M("fireResistPct", "火炎耐性", "pct", 2.4, "effect", void 0, { effect: "fire_resistance" });
M("iceWalkPct", "氷上制御", "pct", 1.2, "flag", void 0, { effect: "iceWalk" });
M("dodgeChance", "回避確率", "pct", 12, "dodge");
M("hurtSpeedPct", "被弾後加速", "pct", 2.2, "effect", "hurtRecent", { effect: "speed" });
M("turnAgilityPct", "旋回性能", "pct", 1.2, "flag");
M("landingPct", "着地緩和", "pct", 1.4, "flag", void 0, { effect: "fallReduce" });
M("slowResistPct", "鈍足耐性", "pct", 2, "flag", void 0, { effect: "slowResist" });
M("nightSpeedPct", "夜間移速", "pct", 2.2, "effect", "night", { effect: "speed" });
M("daySpeedPct", "昼間移速", "pct", 2.2, "effect", "day", { effect: "speed" });
M("wildAdaptPct", "荒野適応", "pct", 2, "defense");
M("caveAdaptPct", "洞窟適応", "pct", 2.2, "effect", "underground", { effect: "haste" });
M("desertAdaptPct", "砂漠適応", "pct", 1.6, "effect", void 0, { effect: "speed" });
M("snowAdaptPct", "雪原適応", "pct", 1.6, "effect", void 0, { effect: "speed" });
M("netherAdaptPct", "ネザー適応", "pct", 2.4, "defense", "nether");
M("waterAdaptPct", "水域適応", "pct", 2.4, "effect", "water", { effect: "water_breathing" });
M("highAltAdaptPct", "高空適応", "pct", 1.6, "defense");
M("fireChance", "着火確率", "pct", 2.4, "proc", void 0, { effect: "fire" });
M("fireDuration", "延焼延長", "sec", 8, "proc", void 0, { effect: "fireDuration" });
M("fireBurst", "爆燃ダメージ", "flat", 3, "proc", void 0, { effect: "fireBurst" });
M("fireGround", "地面残火", "flag", 22, "proc", void 0, { effect: "fireGround" });
M("fireSeaPct", "火海範囲", "pct", 2, "proc", void 0, { effect: "fireSea" });
M("moltenPct", "溶火貫通", "pct", 1.8, "offMult", "burning");
M("iceChance", "鈍足確率", "pct", 2.2, "proc", void 0, { effect: "ice" });
M("slowAmp", "鈍足強度", "amp", 16, "proc", void 0, { effect: "slowAmp" });
M("freezeChance", "凍結確率", "pct", 9, "proc", void 0, { effect: "freeze" });
M("iceBurst", "氷爆ダメージ", "flat", 3, "proc", void 0, { effect: "iceBurst" });
M("chillAura", "冷気オーラ", "flag", 20, "proc", void 0, { effect: "chillAura" });
M("iceArmorPct", "氷鎧防御", "pct", 3, "defense");
M("frostExtendPct", "鈍足延長", "pct", 1.8, "proc", void 0, { effect: "frostExtend" });
M("lightningChance", "落雷誘導率", "pct", 11, "proc", void 0, { effect: "lightning" });
M("shockAmp", "感電強度", "amp", 12, "proc", void 0, { effect: "shock" });
M("chainChance", "連鎖雷確率", "pct", 5, "proc", void 0, { effect: "chain" });
M("stormCharge", "雷暴チャージ", "flat", 5, "proc", void 0, { effect: "storm" });
M("thunderMarkPct", "雷痕増傷", "pct", 2, "offMult", "poisoned");
M("overloadPct", "過負荷雷撃", "pct", 2.4, "offMult", "combo");
M("judgmentPct", "天罰高体力増傷", "pct", 2.2, "offMult", "targetFullHp");
M("poisonChance", "毒付与確率", "pct", 2.2, "proc", void 0, { effect: "poison" });
M("corrodeAmp", "腐食強度", "amp", 9, "proc", void 0, { effect: "corrode" });
M("poisonAmp", "毒強度", "amp", 11, "proc", void 0, { effect: "poisonAmp" });
M("poisonBurst", "毒爆ダメージ", "flat", 3, "proc", void 0, { effect: "poisonBurst" });
M("poisonCloud", "毒霧", "flag", 18, "proc", void 0, { effect: "poisonCloud" });
M("snakeBitePct", "蛇吻の重毒", "pct", 2, "proc", void 0, { effect: "snakeBite" });
M("knockbackPct", "ノックバック", "pct", 1.2, "proc", void 0, { effect: "knockback" });
M("stunChance", "スタン確率", "pct", 10, "proc", void 0, { effect: "stun" });
M("slowOnHit", "命中で鈍足", "amp", 10, "proc", void 0, { effect: "slowOnHit" });
M("weakenOnHit", "命中で弱体化", "amp", 12, "proc", void 0, { effect: "weaken" });
M("sunderOnHit", "命中で破甲", "amp", 12, "proc", void 0, { effect: "sunder" });
M("fearChance", "恐怖確率", "pct", 6, "proc", void 0, { effect: "fear" });
M("rootChance", "束縛確率", "pct", 9, "proc", void 0, { effect: "root" });
M("silenceChance", "沈黙確率", "pct", 7, "proc", void 0, { effect: "silence" });
M("dispelChance", "解除確率", "pct", 8, "proc", void 0, { effect: "dispel" });
M("sweepPct", "薙ぎ払いダメ", "pct", 1.8, "proc", void 0, { effect: "sweep" });
M("quakePct", "震地ダメージ", "pct", 1.8, "proc", void 0, { effect: "quake" });
M("fissurePct", "地割れダメージ", "pct", 1.6, "proc", void 0, { effect: "fissure" });
M("stormAoePct", "嵐ダメージ", "pct", 1.6, "proc", void 0, { effect: "stormAoe" });
M("explodePct", "爆裂ダメージ", "pct", 2, "proc", void 0, { effect: "explode" });
M("whirlwindChance", "旋風確率", "pct", 6, "proc", void 0, { effect: "whirlwind" });
M("chainHitPct", "ダメージ跳躍", "pct", 2, "proc", void 0, { effect: "chainHit" });
M("earthSplitPct", "地裂ダメージ", "pct", 1.8, "proc", void 0, { effect: "earthSplit" });
M("swordIntentPct", "剣気増傷", "pct", 2.2, "offMult", "combo");
M("quickBladePct", "快速剣攻速", "pct", 3, "effect", void 0, { effect: "haste" });
M("breakerPct", "破軍エリート特効", "pct", 2.2, "offMult", "elite");
M("beheadPct", "首斬り処刑", "pct", 2.4, "offMult", "targetLowHp");
M("doubleSlashChance", "連斬確率", "pct", 5, "proc", void 0, { effect: "doubleStrike" });
M("spinBladeChance", "旋刃確率", "pct", 4, "proc", void 0, { effect: "whirlwind" });
M("swordQiPct", "剣気ダメージ", "pct", 2, "proc", void 0, { effect: "swordQi" });
M("flyingBladePct", "飛刃ダメージ", "pct", 1.8, "proc", void 0, { effect: "flyingBlade" });
M("bloodBladeHeal", "血刃回復", "flat", 8, "lifesteal");
M("soulStackPct", "魂狩り重ね", "pct", 2, "offMult", "killStack");
M("frenzyPct", "狂剣の狂乱", "pct", 2.2, "offMult", "combo");
M("peerlessPct", "無双連撃", "pct", 2.4, "offMult", "combo");
M("boneBreakChance", "骨砕き鈍足", "pct", 5, "proc", void 0, { effect: "boneBreak" });
M("shieldBreakPct", "盾破り増傷", "pct", 2, "offMult", "elite");
M("cleavePct", "劈裂範囲", "pct", 1.8, "proc", void 0, { effect: "cleave" });
M("mightyChopPct", "猛劈ダメージ", "pct", 2.4, "offMult", "unwounded");
M("woodMasterPct", "木材追加ドロップ", "pct", 3, "drop");
M("frenzyChopPct", "乱伐提速", "pct", 2.4, "mining", "combo");
M("miningSpeedPct", "採掘速度", "pct", 2.6, "mining");
M("extraDropPct", "追加ドロップ", "pct", 4, "drop");
M("oreDropPct", "鉱物ドロップ", "pct", 4.4, "drop");
M("smeltChance", "自動精錬", "pct", 6, "proc", void 0, { effect: "smelt" });
M("chainMine", "連鎖採掘", "flag", 45, "flag", void 0, { effect: "chainMine" });
M("treeFeller", "連鎖伐採", "flag", 48, "flag", void 0, { effect: "treeFeller" });
M("aoeBreak", "範囲破壊", "flag", 36, "flag", void 0, { effect: "aoeBreak" });
M("aoeMine", "範囲採掘", "flag", 40, "flag", void 0, { effect: "aoeMine" });
M("deepMinePct", "地下効率", "pct", 2.2, "mining", "underground");
M("minerEye", "鉱夫の眼", "flag", 18, "flag", void 0, { effect: "minerEye" });
M("treasureChance", "宝物確率", "pct", 7, "proc", void 0, { effect: "treasure" });
M("durabilitySave", "耐久節約", "pct", 3.2, "durability");
M("rapidMinePct", "超速採掘", "pct", 2.4, "mining", "combo");
M("earthVeinChance", "地脈発動", "pct", 5, "proc", void 0, { effect: "earthVein" });
M("sandMasterPct", "砂地効率", "pct", 2.4, "mining");
M("soilMasterPct", "土地効率", "pct", 2.4, "mining");
M("tillPct", "耕土提速", "pct", 2.2, "mining");
M("geologistChance", "地質学者", "pct", 5, "proc", void 0, { effect: "geologist" });
M("harvestPct", "農作物収量", "pct", 3.4, "drop");
M("autoReplant", "自動植え直し", "flag", 30, "flag", void 0, { effect: "autoReplant" });
M("growthPct", "作物成長", "pct", 2.6, "flag", void 0, { effect: "growth" });
M("farmlandRange", "耕作範囲", "flag", 22, "flag", void 0, { effect: "farmlandRange" });
M("fastTillPct", "耕作速度", "pct", 2.2, "mining");
M("seedMasterPct", "種ドロップ", "pct", 2.6, "drop");
M("abundantChance", "豊穣追加ドロップ", "pct", 3.6, "drop");
M("eternalFarm", "永続耕作", "flag", 20, "flag", void 0, { effect: "eternalFarm" });
M("archaeologyChance", "考古学確率", "pct", 6, "proc", void 0, { effect: "archaeology" });
M("qualityArmorPct", "品質アーマー補正", "pct", 0, "defense");
M("qualityArmorVulnPct", "品質脆弱", "pct", 0, "defense");
M("soulPct", "ソウルダメージ", "pct", 2.6, "offMult");
M("accuracyPct", "命中精度", "pct", 2.2, "offMult");
M("comboPct", "連撃ダメージ", "pct", 2.8, "offMult", "combo");
M("aoePct", "範囲ダメージ", "pct", 2.4, "offMult");
M("projectilePct", "遠距離ダメージ", "pct", 2.6, "offMult");
M("piercePct", "貫通", "pct", 2.6, "offMult");
M("multishotPct", "多重射撃", "pct", 3, "offMult");
M("explosivePct", "爆裂", "pct", 3, "proc");
M("ammoPct", "弾薬回収", "pct", 2.6, "drop");
M("fishingLuckPct", "釣り追加報酬", "pct", 3.4, "drop");
M("treasurePct", "宝物確率", "pct", 3.8, "drop");
M("reelSpeedPct", "収束速度", "pct", 2.8, "drop");
M("fishingCooldownPct", "釣りクールダウン", "pct", 2.6, "drop", void 0, { negative: true });
M("shearYieldPct", "剪取量", "pct", 3.2, "drop");
M("shearSpeedPct", "剪取効率", "pct", 2.8, "mining");
M("brushLuckPct", "ブラシ報酬", "pct", 3.6, "drop");
M("brushSpeedPct", "ブラシ効率", "pct", 2.8, "mining");
M("igniteChancePct", "点火成功率", "pct", 3, "proc");
M("igniteCooldownPct", "点火クールダウン", "pct", 2.6, "drop", void 0, { negative: true });
M("fireDurationPct", "延焼時間", "pct", 3.2, "proc");
M("cooldownReducePct", "クールダウン短縮", "pct", 3.4, "drop");
M("varianceReducePct", "収益安定性", "pct", 2.4, "drop");
M("shearLossPct", "剪取ロス", "pct", 2.6, "drop", void 0, { negative: true });
M("brushLossPct", "ブラシロス", "pct", 2.6, "drop", void 0, { negative: true });
M("igniteRiskPct", "点火反動", "pct", 3, "proc", void 0, { negative: true });
M("bowDamagePct", "弓ダメージ", "pct", 3, "offMult", "ranged");
M("sniperPct", "狙撃遠距離増傷", "pct", 2.4, "offMult", "far");
M("arrowPierce", "矢の貫通", "flag", 26, "proc", void 0, { effect: "arrowPierce" });
M("splitArrowChance", "矢の分裂", "pct", 5, "proc", void 0, { effect: "splitArrow" });
M("multiShot", "多重矢", "flag", 34, "proc", void 0, { effect: "multiShot" });
M("explosiveArrowPct", "爆裂矢", "pct", 2.6, "proc", void 0, { effect: "explosiveArrow" });
M("flameArrowChance", "火矢", "pct", 3, "proc", void 0, { effect: "flameArrow" });
M("iceArrowChance", "氷矢", "pct", 3, "proc", void 0, { effect: "iceArrow" });
M("thunderArrowChance", "雷矢", "pct", 4, "proc", void 0, { effect: "thunderArrow" });
M("homingArrow", "追尾", "flag", 30, "proc", void 0, { effect: "homing" });
M("drawSpeedPct", "弓引き速度", "pct", 2.4, "effect", void 0, { effect: "haste" });
M("steadyAimPct", "安定照準", "pct", 2, "offMult", "ranged");
M("deadlyArrowPct", "致命矢クリティカル", "pct", 3, "critChance", "ranged");
M("hunterPct", "狩人遠距離増傷", "pct", 2.2, "offMult", "ranged");
M("heavyCrossbowPct", "重クロスボウダメージ", "pct", 3.2, "offMult", "ranged");
M("armorPierceArrowPct", "アーマー貫通矢", "pct", 2.6, "offMult", "ranged");
M("reloadSpeedPct", "装填速度", "pct", 2.6, "effect", void 0, { effect: "haste" });
M("multiBolt", "多矢", "flag", 32, "proc", void 0, { effect: "multiShot" });
M("blastBoltPct", "クロスボウ爆破", "pct", 2.6, "proc", void 0, { effect: "explosiveArrow" });
M("formationBreakPct", "陣形破壊", "pct", 2, "offMult", "crowd");
M("snipeKillPct", "狙撃殺", "pct", 2.8, "offMult", "far");
M("rapidFirePct", "連射", "pct", 3, "effect", void 0, { effect: "haste" });
M("stabilityPct", "安定", "pct", 2, "offMult", "ranged");
M("seaGodPct", "海神水中増傷", "pct", 3, "offMult", "water");
M("tidePct", "潮汐衝撃", "pct", 2.2, "proc", void 0, { effect: "tide" });
M("stormEnvPct", "雷雨強化", "pct", 2.6, "offMult", "water");
M("thunderPct", "雷霆誘導", "pct", 4, "proc", void 0, { effect: "lightning" });
M("returnSpeedPct", "回帰速度", "pct", 1.6, "meta", void 0, { wired: false });
M("seaPiercePct", "海貫通投擲", "pct", 2.2, "offMult", "water");
M("deepHunterPct", "深海の狩人", "pct", 2.4, "offMult", "aquatic");
M("stormBurstPct", "嵐の爆発", "pct", 2.4, "proc", void 0, { effect: "stormAoe" });
M("surgeKnockback", "波濤ノックバック", "pct", 1.4, "proc", void 0, { effect: "knockback" });
M("ironShieldPct", "盾防御", "pct", 3.6, "defense");
M("shieldSavePct", "盾耐久節約", "pct", 3, "durability");
M("reboundPct", "ガード反撃", "pct", 3, "thorns", "blocking");
M("thornShieldPct", "棘盾反撃", "pct", 3.2, "thorns");
M("shieldBashPct", "盾打増傷", "pct", 2.4, "offMult", "blocking");
M("chargeKnockback", "突進ノックバック", "pct", 1.6, "proc", void 0, { effect: "knockback" });
M("guardFieldPct", "守護領域", "pct", 2.6, "defense", "crowd");
M("perfectBlockChance", "完璧ガード", "pct", 12, "proc", void 0, { effect: "perfectBlock" });
M("damageReduceHead", "頭部軽減", "pct", 4, "defense");
M("insightFlat", "知覚範囲", "flat", 4, "flag", void 0, { effect: "insight" });
M("nightVision", "暗視", "flag", 30, "effect", void 0, { effect: "night_vision" });
M("waterBreathing", "水中呼吸", "flag", 26, "effect", void 0, { effect: "water_breathing" });
M("deepVision", "深海視界", "flag", 18, "effect", void 0, { effect: "night_vision" });
M("debuffReduce", "負効果時間減少", "pct", 3, "flag", void 0, { effect: "debuffReduce" });
M("controlResist", "制御耐性", "pct", 3, "flag", void 0, { effect: "controlResist" });
M("dangerSense", "危険感知", "flag", 18, "flag", void 0, { effect: "dangerSense" });
M("undeadSense", "アンデッド感知", "flag", 14, "flag", void 0, { effect: "undeadSense" });
M("monsterLorePct", "モブ知識増傷", "pct", 2.2, "offMult");
M("soulEye", "魂の眼", "flag", 16, "flag", void 0, { effect: "soulEye" });
M("heavyArmorPct", "重装防御", "pct", 4, "defense");
M("lifeCorePct", "体力核", "pct", 3.4, "effect", void 0, { effect: "health_boost" });
M("shieldCore", "シールド核", "pct", 3, "proc", void 0, { effect: "shield" });
M("regenCorePct", "再生核", "pct", 2.8, "effect", void 0, { effect: "regeneration" });
M("guardHeartPct", "守護の心", "pct", 3.2, "defense", "selfLowHp");
M("vengeanceHeartPct", "復讐の心", "pct", 2.2, "offMult", "hurtRecent");
M("unyieldingCoreChance", "不屈核", "pct", 12, "proc", void 0, { effect: "lastStand" });
M("endurancePct", "スタミナ", "pct", 2, "flag", void 0, { effect: "sprintCost" });
M("warWillPct", "戦争の意志", "pct", 2.2, "offMult", "combo");
M("persistencePct", "忍耐軽減", "pct", 3, "defense", "hurtRecent");
M("feralPct", "野生加速", "pct", 2.2, "effect", "hurtRecent", { effect: "speed" });
M("damageSpreadPct", "ダメージ分散", "pct", 3, "defense");
M("bodyPct", "体格ノックバック耐性", "pct", 1.6, "flag", void 0, { effect: "knockbackResist" });
M("warriorLegsPct", "戦士の脚", "pct", 2.4, "offMult");
M("gatherPct", "採取量", "pct", 3, "drop");
M("frugalPct", "耐久節約", "pct", 3, "durability");
M("indestructiblePct", "不壊", "pct", 3.6, "durability");
M("xpPct", "経験値獲得", "pct", 2.6, "drop");
M("greedyMinerPct", "鉱石強欲", "pct", 3.4, "drop");
M("huntDropPct", "狩猟ドロップ", "pct", 2.6, "drop");
M("farmDropPct", "農夫収量", "pct", 2.8, "drop");
M("artisanChance", "工匠追加産物", "pct", 4, "proc", void 0, { effect: "artisan" });
M("durabilityMult", "耐久消耗", "pct", 2.2, "durability", void 0, { negative: true });
M("durabilityDrain", "耐久自然消耗", "flat", 6, "durability", void 0, { negative: true });
M("fractureChance", "低耐久破断", "pct", 4, "durability", "lowDurability", { negative: true });
M("skillDurabilityCost", "スキル追加耐久", "flat", 5, "durability", void 0, { negative: true });
M("attackDurabilityCost", "攻撃追加耐久", "flat", 5, "durability", void 0, { negative: true });
M("moveDurabilityCost", "移動耐久消耗", "flat", 4, "durability", void 0, { negative: true });
M("agingPct", "老化加速", "pct", 2.4, "durability", void 0, { negative: true });
M("unstablePct", "不安定消耗", "pct", 2.6, "durability", "combo", { negative: true });
M("hungerDrain", "空腹消耗", "pct", 2, "effect", void 0, { negative: true, effect: "hunger" });
M("sprintHungerDrain", "ダッシュ空腹消耗", "pct", 2, "effect", void 0, { negative: true, effect: "hunger" });
M("selfDamageChance", "反動確率", "pct", 5, "proc", void 0, { negative: true, effect: "selfDamage" });
M("hurtSlowSelf", "被弾後鈍足", "pct", 2.4, "effect", "hurtRecent", { negative: true, effect: "slowness" });
M("idleDecayPct", "待機攻撃低下", "pct", 2.4, "offMult", void 0, { negative: true });
M("comboDecayPct", "連撃攻撃速度低下", "pct", 2.4, "effect", "combo", { negative: true, effect: "mining_fatigue" });
M("firstHitDelay", "初撃準備時間", "pct", 2, "effect", void 0, { negative: true, effect: "mining_fatigue" });
M("aggroPct", "ヘイト範囲", "pct", 1.6, "flag", void 0, { negative: true, effect: "aggro" });
M("erraticChance", "制御不能確率", "pct", 2, "proc", void 0, { negative: true, effect: "erratic" });
M("critTakenPct", "被クリティカル脆弱", "pct", 2.6, "defense", "crit", { negative: true });
M("critDefenseBreak", "クリティカル後防御低下", "pct", 2.4, "defense", "crit", { negative: true });
M("critDurabilityCost", "クリティカル追加耐久", "flat", 5, "durability", "crit", { negative: true });
M("bluntCritPct", "クリティカル率低下", "pct", 3, "critChance", void 0, { negative: true });
M("lostCritDamagePct", "クリティカルダメージ低下", "pct", 2.4, "critDamage", void 0, { negative: true });
M("visionPct", "視界阻害", "pct", 1.6, "flag", void 0, { negative: true });
M("senseReduce", "知覚低下", "pct", 1.6, "flag", void 0, { negative: true, effect: "senseReduce" });
M("falseAlert", "幻聴妨害", "pct", 1.4, "flag", void 0, { negative: true });
M("waterBreathingNeg", "水中行動低下", "flag", 16, "flag", void 0, { negative: true, effect: "waterNeg" });
M("fireVulnPct", "火炎脆弱", "pct", 2.2, "defense", void 0, { negative: true });
M("iceSlip", "氷面滑り", "pct", 1.2, "flag", void 0, { negative: true });
M("fallDamagePct", "落下ダメージ", "pct", 2.4, "flag", void 0, { negative: true });
M("miningSpeedDecay", "採掘効率減衰", "pct", 2, "mining", void 0, { negative: true });
M("mineSlowSelf", "採掘後鈍足", "pct", 2, "effect", void 0, { negative: true, effect: "slowness" });
M("farmlandSlow", "耕地速度", "pct", 1.8, "mining", void 0, { negative: true });
M("turnSlow", "旋回遅滞", "pct", 1.4, "flag", void 0, { negative: true });
M("runDecayPct", "走行減速", "pct", 1.8, "effect", void 0, { negative: true, effect: "slowness" });
M("sprintStartup", "ダッシュ開始遅延", "pct", 1.8, "flag", void 0, { negative: true });
M("luckBreakChance", "幸運失敗で耐久消耗", "pct", 3, "durability", void 0, { negative: true });
M("critSelfDamage", "クリティカル反撃", "flat", 6, "proc", "crit", { negative: true, effect: "selfDamage" });
M("curseDamagePerMin", "継続体力流失", "flat", 8, "proc", void 0, { negative: true, effect: "curseDrain" });
M("maxHealthNegPct", "最大体力低下", "pct", 3.4, "effect", void 0, { negative: true, effect: "healthNeg" });
M("naturalRegenPct", "自然回復", "pct", 2.4, "effect", void 0, { negative: true, effect: "regenNeg" });
M("bloodLossPct", "失血", "pct", 3, "proc", void 0, { negative: true, effect: "bloodLoss" });
M("frailtyPct", "致命的脆弱", "pct", 3, "defense", "selfLowHp", { negative: true });
M("armorBreakVulnPct", "アーマー破壊脆弱", "pct", 2.6, "defense", void 0, { negative: true });
M("armorCrackPct", "アーマー亀裂", "pct", 2.8, "defense", "hurtRecent", { negative: true });
M("exposedPct", "背部露出", "pct", 2.6, "defense", "behind", { negative: true });
M("lostGuardPct", "失守", "pct", 2.6, "defense", "combo", { negative: true });
M("openGuardPct", "隙", "pct", 2.4, "defense", void 0, { negative: true });
M("magicFragilePct", "魔法脆弱", "pct", 2.4, "defense", void 0, { negative: true });
M("shockImmobilePct", "震動で移動不能", "pct", 2, "flag", void 0, { negative: true });
M("mentalFatiguePct", "精神疲労", "pct", 2, "flag", void 0, { negative: true, effect: "debuffUp" });
M("heavyLowerBodyPct", "重い下半身", "pct", 1.6, "effect", void 0, { negative: true, effect: "slowness" });
M("actionSlowPct", "行動遅滞", "pct", 1.8, "effect", "combo", { negative: true, effect: "slowness" });
M("soilDependencyPct", "土壌依存", "pct", 1.8, "mining", void 0, { negative: true });
M("toolJamPct", "行動阻害", "pct", 1.8, "mining", void 0, { negative: true });
M("latePlantPct", "遅植", "pct", 1.8, "mining", void 0, { negative: true });
M("unstableVeinPct", "不安定鉱脈", "pct", 2.2, "durability", void 0, { negative: true });
M("gluttonyGreedPct", "成長欲の副作用", "pct", 1.8, "flag", void 0, { negative: true });
M("deathPenaltyPct", "死亡ペナルティ", "pct", 3, "flag", void 0, { negative: true, effect: "deathPenalty" });
M("bindingCurse", "束縛の呪い", "flag", 20, "flag", void 0, { negative: true, effect: "binding" });
M("uniqueImmortal", "不滅", "flag", 90, "flag", void 0, { hidden: true, effect: "immortal" });
M("uniqueSoulbound", "魂縛", "flag", 70, "flag", void 0, { hidden: true, effect: "soulbound" });
M("uniqueGluttony", "貪食", "flag", 60, "flag", void 0, { hidden: true, effect: "gluttony" });
M("uniqueTime", "時間", "flag", 75, "proc", void 0, { hidden: true, effect: "time" });
M("uniqueSpace", "空間", "flag", 75, "flag", void 0, { hidden: true, effect: "space" });
M("uniqueEternalNight", "永夜", "flag", 80, "offMult", "night", { hidden: true });
M("uniqueSunHeart", "太陽の心", "flag", 80, "offMult", "day", { hidden: true });
M("uniqueAbyssHeart", "深淵の心", "flag", 80, "offMult", "nether", { hidden: true });
M("specialWorldTree", "世界樹", "flag", 85, "effect", void 0, { hidden: true, effect: "worldTree" });
M("specialHeavenlyThunder", "天雷", "flag", 88, "proc", void 0, { hidden: true, effect: "lightning" });
M("specialBloodMoon", "血月", "flag", 82, "offMult", "night", { hidden: true });
M("specialSunGlory", "日耀", "flag", 82, "offMult", "day", { hidden: true });
M("specialAbyss", "深淵", "flag", 82, "offMult", "nether", { hidden: true });
M("specialSeaGod", "海神", "flag", 82, "offMult", "water", { hidden: true });
M("specialSpacetime", "時空", "flag", 78, "flag", void 0, { hidden: true, effect: "space" });
M("specialVoidWalker", "虚空行者", "flag", 76, "flag", void 0, { hidden: true, effect: "voidWalk" });
M("specialDestiny", "天命", "flag", 84, "proc", void 0, { hidden: true, effect: "destiny" });
M("specialMiracle", "奇跡", "flag", 92, "proc", void 0, { hidden: true, effect: "miracle" });
M("specialReversal", "反転", "flag", 80, "offMult", "selfLowHp", { hidden: true });
M("specialEndless", "無限", "flag", 86, "offMult", "killStack", { hidden: true });
M("curseBloodThirst", "嗜血の呪い", "flag", 40, "offMult", "combo", { hidden: true, effect: "curseBloodThirst" });
M("curseFury", "狂怒の呪い", "flag", 30, "flag", void 0, { hidden: true, effect: "curseFury" });
M("curseFrail", "脆命の呪い", "flag", 35, "effect", void 0, { hidden: true, effect: "healthNeg" });
M("hiddenSpeciesUndead", "隠し\xB7対アンデッド", "pct", 1.6, "offMult", "undead", { hidden: true });
M("hiddenSpeciesArthropod", "隠し\xB7対節足動物", "pct", 1.6, "offMult", "arthropod", { hidden: true });
M("hiddenSpeciesIllager", "隠し\xB7対邪悪", "pct", 1.6, "offMult", "illager", { hidden: true });
M("hiddenSpeciesAquatic", "隠し\xB7対水生", "pct", 1.6, "offMult", "aquatic", { hidden: true });
M("hiddenSpeciesNether", "隠し\xB7対ネザー", "pct", 1.6, "offMult", "nethermob", { hidden: true });
M("hiddenLuck", "隠し\xB7幸運", "pct", 2.4, "drop", void 0, { hidden: true });
M("hiddenGreed", "隠し\xB7強欲", "pct", 2, "drop", void 0, { hidden: true });
M("hiddenAwakenNight", "隠し\xB7夜間覚醒", "flag", 60, "offMult", "night", { hidden: true });
M("hiddenAwakenBlood", "隠し\xB7血の記憶", "flag", 55, "lifesteal", void 0, { hidden: true });
M("hiddenAwakenAbyss", "隠し\xB7深淵の囁き", "flag", 58, "offMult", "nether", { hidden: true });
M("hiddenAwakenHunt", "隠し\xB7狩猟本能", "flag", 56, "offMult", "far", { hidden: true });
M("hiddenAwakenEarth", "隠し\xB7大地共鳴", "flag", 54, "mining", void 0, { hidden: true });
M("hiddenAwakenStar", "隠し\xB7星辰の導き", "flag", 57, "drop", void 0, { hidden: true });
M("hiddenAwakenFate", "隠し\xB7運命の糸", "flag", 62, "proc", void 0, { hidden: true, effect: "destiny" });
var STAT_META = META;
var ALL_STATS = Object.keys(META);
function emptyStats() {
  const out = {};
  for (const k of ALL_STATS) out[k] = 0;
  return out;
}
function aggregate(target, delta) {
  for (const k of Object.keys(delta)) {
    const v = delta[k];
    if (!v) continue;
    target[k] = (target[k] ?? 0) + v;
  }
}
function round(v) {
  return Math.round(v * 100) / 100;
}
function statsByChannel() {
  const out = {};
  for (const k of ALL_STATS) {
    const c = STAT_META[k].channel;
    out[c] = (out[c] ?? 0) + 1;
  }
  return out;
}

// scripts/data/Affixes.ts
var SW = ["sword"];
var AX = ["axe"];
var PK = ["pickaxe"];
var SH = ["shovel"];
var HO = ["hoe"];
var BW = ["bow"];
var CB = ["crossbow"];
var TR = ["trident"];
var SD = ["shield"];
var HE = ["head"];
var CH = ["chest"];
var LE = ["legs"];
var FE = ["feet"];
var MELEE = ["sword", "axe", "spear", "mace"];
var TOOLS = ["pickaxe", "axe", "shovel", "hoe"];
var ARMOR = ["head", "chest", "legs", "feet", "horse"];
var MELEE_TOOLS = ["sword", "axe", "pickaxe", "shovel", "hoe"];
var ALL = ["sword", "axe", "pickaxe", "shovel", "hoe", "spear", "mace", "fishing", "shears", "brush", "flint", "horse", "steering", "bow", "crossbow", "trident", "shield", "head", "chest", "legs", "feet"];
var SWORD = ["sword"];
var AXE = ["axe"];
var PICK = ["pickaxe"];
var SHOVEL = ["shovel"];
var HOE = ["hoe"];
var BOW = ["bow"];
var CROSSBOW = ["crossbow"];
var TRIDENT = ["trident"];
var SHIELD = ["shield"];
var HEAD = ["head"];
var CHEST = ["chest"];
var LEGS = ["legs"];
var FEET = ["feet"];
var MACE = ["mace"];
var SPEAR = ["spear"];
var ELYTRA = ["chest"];
var HORSE = ["horse"];
var STEERING = ["steering"];
var FISHING = ["fishing"];
var SHEARS = ["shears"];
var BRUSH = ["brush"];
var FLINT = ["flint"];
var r2 = (v) => Math.round(v * 100) / 100;
function L(base, step) {
  return [0, 1, 2, 3, 4].map((i) => r2(base + step * i));
}
function F(v = 1) {
  return [v, v, v, v, v];
}
var m = (stat, levels) => ({ stat, levels });
function row(kind) {
  return (id, name, groups, mods, weight = 100, rarity = "common", variance = 0.12, exclusive = [], minQuality, note) => ({ id, name, kind, groups, mods, weight, rarity, variance, exclusive, minQuality, note });
}
var P = row("positive");
var N = row("negative");
var D = row("dual");
var SP = row("special");
var CU = row("curse");
var U = row("unique");
var POSITIVE = [
  // ---------------- 1. 攻击类 ----------------
  P("sharpness", "鋭鋒", MELEE, [m("attackPct", L(12, 8))], 100, "common"),
  P("smash", "強打", MELEE, [m("flatDamage", L(1, 1))], 100, "common"),
  P("strong_attack", "強攻", MELEE, [m("meleePct", L(8, 6))], 100, "common"),
  P("heavy_blow", "重撃", MELEE, [m("chargedBonusPct", L(15, 11))], 90, "fine"),
  P("pierce", "穿刺", MELEE, [m("armorPenPct", L(8, 5))], 90, "fine"),
  P("sunder", "アーマー破壊", MELEE, [m("sunderPct", L(6, 4))], 90, "fine"),
  P("tear", "裂傷", MELEE, [m("bleedDps", L(1, 1))], 80, "fine"),
  P("execute", "処刑", MELEE, [m("executePct", L(20, 12))], 70, "rare"),
  P("hunt_move", "狩猟", MELEE, [m("chasePct", L(10, 7))], 80, "fine"),
  P("slaughter", "虐殺", MELEE, [m("killStackPct", L(4, 3))], 70, "rare"),
  P("fighting_spirit", "戦意", MELEE, [m("rampagePct", L(3, 2.5))], 80, "fine"),
  P("berserk", "狂乱", MELEE, [m("berserkPct", L(20, 14))], 60, "epic"),
  P("vengeance", "復讐", MELEE, [m("vengeancePct", L(10, 7))], 80, "fine"),
  P("wild_hunt", "狂狩", MELEE, [m("killCritPct", L(10, 7))], 70, "rare"),
  P("assault", "強襲", MELEE, [m("knockbackPct", L(20, 15))], 90, "common"),
  P("stagger", "震撃", MELEE, [m("staggerChance", L(4, 3))], 70, "rare"),
  P("shockwave", "震盪", MELEE, [m("slowOnHit", L(1, 0.5))], 90, "common"),
  P("break_momentum", "勢い破壊", MELEE, [m("weakenOnHit", L(1, 0.5))], 90, "common"),
  P("suppress", "鎮圧", MELEE, [m("elitePct", L(10, 8))], 70, "rare"),
  P("giant_hunter", "巨獣の狩人", MELEE, [m("giantPct", L(10, 8))], 70, "rare"),
  // ---------------- 2. 暴击类 ----------------
  P("crit", "クリティカル", MELEE, [m("critChance", L(4, 3))], 100, "common"),
  P("lethal", "致命", MELEE, [m("critDamage", L(12, 8))], 100, "common"),
  P("precise", "精密", MELEE, [m("critChance", L(3, 2.5)), m("critDamage", L(5, 4))], 90, "fine"),
  P("weakspot_insight", "弱点洞察", MELEE, [m("lowHpCrit", L(6, 4))], 80, "fine"),
  P("lethal_pursuit", "致命追撃", MELEE, [m("lowHpCrit", L(8, 5))], 70, "rare"),
  P("combo", "コンボ", MELEE, [m("doubleStrikeChance", L(5, 4))], 80, "fine"),
  P("double_blade", "二重打撃", MELEE, [m("doubleStrikeChance", L(8, 5))], 60, "epic"),
  P("lucky_strike", "ラッキーヒット", MELEE, [m("luckyChance", L(1, 1))], 40, "epic"),
  P("hunter_heart", "心臓狩り", MELEE, [m("hunterHeartCrit", L(6, 4))], 70, "rare"),
  P("backstab", "背後襲撃", MELEE, [m("backstabPct", L(12, 9))], 70, "rare"),
  P("finisher", "フィニッシュ", MELEE, [m("finisherChance", L(5, 3))], 50, "epic"),
  // ---------------- 3. 攻击速度类 ----------------
  P("swift", "迅速", MELEE_TOOLS, [m("attackSpeedPct", L(8, 5))], 100, "common", 0.12, ["heavy", "dull", "sluggish"]),
  P("gale", "疾風", MELEE, [m("comboAtkSpeed", L(4, 3))], 90, "fine"),
  P("chain_slash", "連斬", MELEE, [m("comboAtkSpeed", L(5, 3.5))], 90, "fine"),
  P("agile", "軽快", MELEE, [m("attackSpeedPct", L(6, 4))], 100, "common", 0.12, ["heavy", "dull", "sluggish"]),
  P("extreme_speed", "極速", MELEE, [m("burstSpeedPct", L(15, 9))], 70, "rare", 0.15, ["heavy", "dull", "sluggish"]),
  P("wild_dance", "狂舞", MELEE, [m("dancePct", L(8, 5))], 80, "fine"),
  P("first_strike", "先制", MELEE, [m("firstStrikePct", L(12, 9))], 80, "fine"),
  P("follow_up", "追撃", MELEE, [m("followUpSpeedPct", L(6, 4))], 80, "fine"),
  // ---------------- 4. 生命与吸血类 ----------------
  P("lifesteal", "吸血", MELEE, [m("lifesteal", L(3, 2))], 90, "fine"),
  P("strong_lifesteal", "強力吸血", MELEE, [m("lifesteal", L(5, 3))], 60, "epic"),
  P("soul_drain", "魂吸収", MELEE, [m("killHeal", L(1, 1))], 80, "fine"),
  P("hunt_recovery", "狩猟回復", MELEE, [m("killHeal", L(1, 0.5))], 90, "common"),
  P("blood_power", "鮮血の力", MELEE, [m("bloodPowerPct", L(5, 4))], 70, "rare"),
  P("life", "体力", ARMOR, [m("maxHealthPct", L(5, 4))], 100, "common"),
  P("vitality", "活力", ["chest", "legs"], [m("regenPct", L(10, 8))], 90, "fine"),
  P("regeneration", "再生", ["chest", "legs", "head"], [m("regenFlat", L(0.2, 0.2))], 80, "fine"),
  P("unyielding", "不屈", ["chest", "legs"], [m("lowHpDefense", L(8, 6))], 80, "fine"),
  P("blood_pool", "血の池", MELEE, [m("bloodPool", L(1, 1))], 60, "epic"),
  P("life_shield", "体力シールド", ARMOR, [m("highHpShield", L(2, 1.5))], 70, "rare"),
  P("rejuvenate", "回春", ARMOR, [m("outOfCombatRegen", L(10, 8))], 80, "fine"),
  // ---------------- 5. 防御类 ----------------
  P("bulwark", "堅壁", CH, [m("defensePct", L(8, 6))], 100, "common"),
  P("iron_wall", "鉄壁", CH, [m("flatReduce", L(1, 1))], 80, "fine"),
  P("tough", "堅忍", ["chest", "legs"], [m("resistPct", L(4, 3))], 100, "common"),
  P("shield", "シールド", CH, [m("shieldChance", L(6, 4))], 80, "fine"),
  P("absorb", "吸収", CH, [m("absorbFlat", L(2, 2))], 80, "fine"),
  P("deflect", "偏向", ["chest", "head"], [m("deflectPct", L(8, 6))], 80, "fine"),
  P("block", "ガード", SD, [m("blockPct", L(8, 6))], 100, "common"),
  P("guard", "守護", SD, [m("guardReducePct", L(6, 4))], 90, "fine"),
  P("immovable", "不動如山", CH, [m("standStillDefense", L(6, 4))], 70, "rare"),
  P("counter", "反撃", SD, [m("counterPct", L(8, 6))], 80, "fine"),
  P("guard_heart", "守護の心", CH, [m("lastStandChance", L(6, 4))], 50, "epic"),
  P("watch", "見張り", ARMOR, [m("watchDefense", L(5, 4))], 80, "fine"),
  // ---------------- 6. 移动类 ----------------
  P("swift_step", "速歩", FE, [m("moveSpeedPct", L(5, 3))], 100, "common", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  P("dash", "疾走", FE, [m("sprintSpeedPct", L(6, 4))], 100, "common"),
  P("light_feather", "軽羽", FE, [m("fallReducePct", L(15, 9))], 90, "fine"),
  P("leap", "転移", FE, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, ["clumsy", "bind_chest", "bulky"]),
  P("wind_walk", "風行", FE, [m("sprintSpeedPct", L(5, 3.5))], 90, "fine"),
  P("chase_wind", "追風", FE, [m("hurtSpeedPct", L(8, 6))], 80, "fine"),
  P("flash_raid", "閃襲", FE, [m("hurtSpeedPct", L(6, 4))], 90, "common"),
  P("escape", "脱出", FE, [m("hurtSpeedPct", L(10, 7))], 80, "fine"),
  P("agility", "軽妙", FE, [m("turnAgilityPct", L(10, 7))], 90, "common"),
  P("swim_swift", "迅泳", FE, [m("waterSpeedPct", L(10, 7))], 90, "common"),
  P("deep_dive", "深潜", FE, [m("swimPct", L(12, 8))], 90, "common"),
  P("fire_walk", "火渡り", FE, [m("fireResistPct", L(10, 7))], 90, "common"),
  // ---------------- 7. 元素 · 火 ----------------
  P("scorch", "灼熱", MELEE, [m("fireChance", L(10, 7))], 90, "fine"),
  P("flame", "烈火", MELEE, [m("fireDuration", L(1, 1))], 90, "fine"),
  P("blazing", "熾炎", MELEE, [m("burningTargetPct", L(8, 6))], 80, "fine"),
  P("fire_seed", "火種", MELEE, [m("fireGround", L(1, 0.5))], 60, "epic"),
  P("deflagrate", "爆燃", MELEE, [m("fireBurst", L(6, 4))], 80, "fine"),
  P("fire_sea", "火海", MELEE, [m("fireSeaPct", L(10, 7))], 60, "epic"),
  P("molten", "溶岩火", MELEE, [m("moltenPct", L(8, 6))], 70, "rare"),
  // ---------------- 8. 元素 · 冰霜 ----------------
  P("chill", "氷冷", MELEE, [m("iceChance", L(12, 8))], 90, "fine"),
  P("extreme_cold", "極寒", MELEE, [m("slowAmp", L(1, 0.5))], 80, "fine"),
  P("freeze", "凍結", MELEE, [m("freezeChance", L(3, 3))], 50, "epic"),
  P("ice_burst", "氷爆", MELEE, [m("frozenTargetPct", L(10, 8))], 80, "fine"),
  P("chill_aura", "冷気", ARMOR, [m("chillAura", L(1, 0.5))], 60, "epic"),
  P("ice_armor", "氷の鎧", ARMOR, [m("iceArmorPct", L(6, 4))], 80, "fine"),
  P("eternal_frost", "永霜", MELEE, [m("frostExtendPct", L(10, 8))], 70, "rare"),
  // ---------------- 9. 元素 · 雷电 ----------------
  P("thunder", "雷鳴", MELEE, [m("lightningChance", L(4, 3))], 60, "epic"),
  P("shock", "感電", MELEE, [m("shockAmp", L(1, 0.5))], 80, "fine"),
  P("chain_lightning", "連鎖稲妻", MELEE, [m("chainChance", L(6, 4))], 70, "rare"),
  P("thunderstorm", "雷嵐", MELEE, [m("stormCharge", L(3, 2))], 60, "epic"),
  P("thunder_mark", "雷痕", MELEE, [m("thunderMarkPct", L(8, 6))], 70, "rare"),
  P("overload_thunder", "過負荷", MELEE, [m("overloadPct", L(10, 8))], 70, "rare"),
  P("judgment", "天罰", MELEE, [m("judgmentPct", L(10, 8))], 60, "epic"),
  // ---------------- 10. 元素 · 毒素 ----------------
  P("poison_blade", "毒刃", MELEE, [m("poisonChance", L(12, 8))], 90, "fine"),
  P("corrode", "腐食", MELEE, [m("corrodeAmp", L(1, 0.5))], 80, "fine"),
  P("strong_poison", "強毒", MELEE, [m("poisonAmp", L(1, 0.5))], 80, "fine"),
  P("poison_burst", "毒爆", MELEE, [m("poisonBurst", L(8, 6))], 80, "fine"),
  P("poison_cloud", "毒霧", MELEE, [m("poisonCloud", L(1, 0.5))], 60, "epic"),
  P("snake_bite", "蛇の牙", MELEE, [m("snakeBitePct", L(8, 6))], 70, "rare"),
  // ---------------- 11. 控制类 ----------------
  P("slow", "鈍足", MELEE, [m("slowOnHit", L(1, 0.5))], 100, "common"),
  P("weaken", "弱体化", MELEE, [m("weakenOnHit", L(1, 0.5))], 100, "common"),
  P("stun", "スタン", MELEE, [m("stunChance", L(3, 2))], 60, "epic"),
  P("bind", "束縛", MELEE, [m("rootChance", L(4, 3))], 60, "epic"),
  P("fear", "恐怖", MELEE, [m("fearChance", L(3, 2))], 70, "rare"),
  P("silence", "沈黙", MELEE, [m("silenceChance", L(4, 3))], 60, "epic"),
  P("break_stance", "勢い破壊", MELEE, [m("sunderOnHit", L(1, 0.5))], 90, "common"),
  P("dispel", "解除", MELEE, [m("dispelChance", L(5, 3))], 60, "epic"),
  // ---------------- 12. 范围类 ----------------
  P("sweep", "薙ぎ払い", MELEE, [m("sweepPct", L(20, 12))], 80, "fine"),
  P("quake", "震地", MELEE, [m("quakePct", L(15, 10))], 80, "fine"),
  P("fissure", "地割れ", MELEE, [m("fissurePct", L(20, 12))], 70, "rare"),
  P("whirlwind", "旋風", MELEE, [m("whirlwindChance", L(5, 3))], 70, "rare"),
  P("explode", "爆裂", MELEE, [m("explodePct", L(10, 7))], 80, "fine"),
  P("chain_hit", "連鎖撃", MELEE, [m("chainHitPct", L(12, 8))], 80, "fine"),
  P("storm", "嵐", MELEE, [m("stormAoePct", L(18, 10))], 70, "rare"),
  P("earth_split", "地裂", MELEE, [m("earthSplitPct", L(15, 10))], 70, "rare"),
  /* ====================== 第二部分：剑专属 ====================== */
  P("sword_intent", "剣意", SW, [m("swordIntentPct", L(8, 6))], 100, "common"),
  P("quick_blade", "速剣", SW, [m("quickBladePct", L(8, 5))], 90, "fine"),
  P("breaker", "破軍", SW, [m("breakerPct", L(10, 8))], 70, "rare"),
  P("behead", "斬首", SW, [m("beheadPct", L(15, 12))], 60, "epic"),
  P("double_slash", "連環斬", SW, [m("doubleSlashChance", L(5, 4))], 70, "rare"),
  P("spin_blade", "旋刃", SW, [m("spinBladeChance", L(4, 3))], 70, "rare"),
  P("sword_qi", "剣気", SW, [m("swordQiPct", L(10, 7))], 60, "epic"),
  P("flying_blade", "飛刃", SW, [m("flyingBladePct", L(8, 6))], 60, "epic"),
  P("blood_blade", "血刃", SW, [m("bloodBladeHeal", L(1, 1))], 70, "rare"),
  P("soul_hunt", "魂狩り", SW, [m("soulStackPct", L(4, 3))], 50, "epic"),
  P("mad_sword", "狂剣", SW, [m("frenzyPct", L(6, 4))], 70, "rare"),
  P("peerless", "無双", SW, [m("peerlessPct", L(8, 5))], 40, "legendary"),
  /* ====================== 第三部分：斧专属 ====================== */
  P("heavy_axe", "重斧", AX, [m("attackPct", L(10, 7)), m("knockbackPct", L(15, 10))], 100, "common"),
  P("swift_chop", "迅斬", AX, [m("miningSpeedPct", L(8, 6))], 100, "common"),
  P("lumber", "伐採", AX, [m("woodMasterPct", L(10, 7))], 100, "common", 0.12, ["blunt"]),
  P("tree_feller", "倒木", AX, [m("treeFeller", L(1, 0.5))], 60, "epic"),
  P("reclaim", "開拓", AX, [m("aoeBreak", L(1, 0.5))], 70, "rare"),
  P("bone_break", "骨砕き", AX, [m("boneBreakChance", L(5, 4))], 80, "fine"),
  P("shield_break", "盾破壊", AX, [m("shieldBreakPct", L(8, 6))], 70, "rare"),
  P("cleave", "劈裂", AX, [m("cleavePct", L(8, 6))], 70, "rare"),
  P("mighty_chop", "猛劈", AX, [m("mightyChopPct", L(20, 14))], 50, "epic"),
  P("wood_master", "木工の達人", AX, [m("extraDropPct", L(8, 6))], 80, "fine"),
  P("frenzy_chop", "狂伐", AX, [m("frenzyChopPct", L(8, 6))], 70, "rare"),
  /* ====================== 第四部分：镐专属 ====================== */
  P("swift_dig", "速掘", PK, [m("miningSpeedPct", L(10, 7))], 100, "common", 0.12, ["dull_pick"]),
  P("ore_vein", "鉱脈", PK, [m("oreDropPct", L(8, 6))], 90, "fine"),
  P("lucky_miner", "幸運の鉱夫", PK, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("refine", "精錬", PK, [m("smeltChance", L(5, 3))], 70, "rare"),
  P("chain_mine", "連鎖採掘", PK, [m("chainMine", L(1, 0.5))], 60, "epic"),
  P("aoe_mine", "範囲採掘", PK, [m("aoeMine", L(1, 0.5))], 70, "rare"),
  P("deep_dig", "深掘り", PK, [m("deepMinePct", L(10, 7))], 90, "fine"),
  P("miner_eye", "鉱夫の眼", PK, [m("minerEye", L(1, 0.5))], 60, "epic"),
  P("treasure", "宝の狩人", PK, [m("treasureChance", L(3, 2))], 60, "epic"),
  P("solid", "堅固", MELEE_TOOLS.concat(ARMOR), [m("durabilitySave", L(10, 8))], 100, "common", 0.12, ["fragile", "brittle", "fragile_pick"]),
  P("rapid_mine", "超速採掘", PK, [m("rapidMinePct", L(8, 6))], 70, "rare"),
  P("earth_vein", "地脈", PK, [m("earthVeinChance", L(5, 4))], 50, "epic"),
  /* ====================== 第五部分：锹专属 ====================== */
  P("swift_shovel", "迅掘", SH, [m("miningSpeedPct", L(10, 7))], 100, "common"),
  P("shovel_aoe", "範囲シャベル", SH, [m("aoeMine", L(1, 0.5))], 70, "rare"),
  P("sand_master", "砂地の達人", SH, [m("sandMasterPct", L(10, 7))], 90, "fine"),
  P("soil_master", "大地の達人", SH, [m("soilMasterPct", L(10, 7))], 90, "fine"),
  P("treasure_hunter", "宝探し", SH, [m("treasureChance", L(3, 2))], 70, "rare"),
  P("archaeology", "考古学", SH, [m("archaeologyChance", L(3, 2))], 70, "rare"),
  P("loosen_soil", "耕耘", SH, [m("tillPct", L(8, 6))], 90, "fine"),
  P("geologist", "地質学者", SH, [m("geologistChance", L(5, 4))], 50, "epic"),
  /* ====================== 第六部分：锄专属 ====================== */
  P("harvest", "豊作", HO, [m("harvestPct", L(10, 7))], 100, "common", 0.12, ["barren"]),
  P("lucky_farmer", "幸運の農夫", HO, [m("extraDropPct", L(8, 6))], 90, "fine"),
  P("auto_replant", "自動植え直し", HO, [m("autoReplant", L(1, 0))], 70, "rare"),
  P("shennong", "神農", HO, [m("harvestPct", L(15, 9))], 60, "epic"),
  P("lush", "繁茂", HO, [m("growthPct", L(10, 8))], 90, "fine", 0.12, ["greedy_grow"]),
  P("earth_gift", "大地の恵み", HO, [m("farmlandRange", L(1, 0.5))], 70, "rare"),
  P("fast_till", "迅速耕作", HO, [m("fastTillPct", L(8, 6))], 90, "fine"),
  P("seed_master", "種の達人", HO, [m("seedMasterPct", L(8, 6))], 90, "fine"),
  P("abundant", "豊穣", HO, [m("abundantChance", L(8, 6))], 70, "rare"),
  P("eternal_farm", "永続耕作", HO, [m("eternalFarm", L(1, 0))], 50, "epic"),
  /* ====================== 第七部分：弓专属 ====================== */
  P("strong_bow", "強弓", BW, [m("bowDamagePct", L(10, 7))], 100, "common"),
  P("sniper", "狙撃", BW, [m("sniperPct", L(10, 7))], 90, "fine"),
  P("pierce_arrow", "貫通", BW, [m("arrowPierce", L(1, 0.5))], 70, "rare"),
  P("split_arrow", "分裂", BW, [m("splitArrowChance", L(5, 4))], 60, "epic"),
  P("multi_shot", "多重矢", BW, [m("multiShot", L(1, 0.5))], 50, "epic"),
  P("explosive_arrow", "爆裂矢", BW, [m("explosiveArrowPct", L(10, 7))], 60, "epic"),
  P("flame_arrow", "火矢", BW, [m("flameArrowChance", L(8, 6))], 80, "fine"),
  P("ice_arrow", "氷矢", BW, [m("iceArrowChance", L(8, 6))], 80, "fine"),
  P("thunder_arrow", "雷矢", BW, [m("thunderArrowChance", L(5, 4))], 60, "epic"),
  P("homing_arrow", "追尾", BW, [m("homingArrow", L(1, 0.5))], 40, "legendary"),
  P("fast_string", "速弦", BW, [m("drawSpeedPct", L(8, 6))], 90, "fine"),
  P("steady_string", "安定弦", BW, [m("steadyAimPct", L(8, 6))], 90, "fine"),
  P("deadly_arrow", "致命の矢", BW, [m("deadlyArrowPct", L(6, 4))], 80, "fine"),
  P("hunter", "狩人", BW, [m("hunterPct", L(8, 6))], 90, "fine"),
  /* ====================== 第八部分：弩专属 ====================== */
  P("heavy_crossbow", "重クロスボウ", CB, [m("heavyCrossbowPct", L(12, 8))], 100, "common"),
  P("armor_pierce", "装甲貫通", CB, [m("armorPierceArrowPct", L(10, 7))], 90, "fine"),
  P("fast_reload", "速装填", CB, [m("reloadSpeedPct", L(10, 7))], 90, "fine"),
  P("multi_bolt", "多矢", CB, [m("multiBolt", L(1, 0.5))], 50, "epic"),
  P("blast_bolt", "爆破", CB, [m("blastBoltPct", L(10, 7))], 60, "epic"),
  P("formation_break", "陣形破壊", CB, [m("formationBreakPct", L(8, 6))], 70, "rare"),
  P("snipe_kill", "狙撃殺", CB, [m("snipeKillPct", L(12, 9))], 60, "epic"),
  P("rapid_fire", "連射", CB, [m("rapidFirePct", L(10, 7))], 70, "rare"),
  P("stability", "安定", CB, [m("stabilityPct", L(8, 6))], 90, "fine"),
  /* ====================== 第九部分：三叉戟专属 ====================== */
  P("sea_god", "海神", TR, [m("seaGodPct", L(10, 8))], 100, "common"),
  P("tide", "潮汐", TR, [m("tidePct", L(8, 6))], 90, "fine"),
  P("storm_env", "雷嵐", TR, [m("stormEnvPct", L(10, 7))], 80, "fine"),
  P("thunder_trident", "雷霆", TR, [m("thunderPct", L(5, 4))], 60, "epic"),
  P("return_flow", "還流", TR, [m("returnSpeedPct", L(10, 8))], 90, "fine"),
  P("sea_pierce", "海貫き", TR, [m("seaPiercePct", L(8, 6))], 90, "fine"),
  P("deep_hunter", "深海の狩人", TR, [m("deepHunterPct", L(10, 7))], 90, "fine"),
  P("storm_trident", "嵐", TR, [m("stormBurstPct", L(10, 7))], 70, "rare"),
  P("surge", "波濤", TR, [m("surgeKnockback", L(15, 10))], 90, "fine"),
  /* ====================== 第十部分：盾牌专属 ====================== */
  P("iron_shield", "鉄盾", SD, [m("ironShieldPct", L(8, 6))], 100, "common"),
  P("sturdy_shield", "堅盾", SD, [m("shieldSavePct", L(10, 7))], 90, "fine"),
  P("rebound", "反震", SD, [m("reboundPct", L(10, 7))], 80, "fine"),
  P("thorn_shield", "棘の盾", SD, [m("thornShieldPct", L(10, 7))], 80, "fine"),
  P("shield_bash", "盾撃", SD, [m("shieldBashPct", L(10, 8))], 80, "fine"),
  P("charge", "突進", SD, [m("chargeKnockback", L(20, 15))], 90, "common"),
  P("guard_field", "守護領域", SD, [m("guardFieldPct", L(8, 6))], 60, "epic"),
  P("perfect_block", "完璧ガード", SD, [m("perfectBlockChance", L(4, 3))], 40, "legendary"),
  /* ====================== 第十一部分：头盔 ====================== */
  P("steadfast", "剛毅", HE, [m("damageReduceHead", L(8, 6))], 100, "common"),
  P("insight", "洞察", HE, [m("insightFlat", L(2, 2))], 90, "fine"),
  P("night_vision", "暗視", HE, [m("nightVision", F(1))], 70, "rare"),
  P("water_breathing", "水中呼吸", HE, [m("waterBreathing", F(1))], 70, "rare"),
  P("deep_vision", "深海視界", HE, [m("deepVision", F(1))], 70, "rare"),
  P("spirit", "精神", HE, [m("debuffReduce", L(10, 8))], 90, "fine"),
  P("will", "意志", HE, [m("controlResist", L(10, 8))], 80, "fine"),
  P("danger_sense", "危険感知", HE, [m("dangerSense", F(1))], 80, "fine"),
  P("undead_sense", "アンデッド感知", HE, [m("undeadSense", F(1))], 80, "fine"),
  P("monster_lore", "モブ知識", HE, [m("monsterLorePct", L(8, 6))], 70, "rare"),
  P("soul_eye", "魂の眼", HE, [m("soulEye", F(1))], 50, "epic"),
  /* ====================== 第十二部分：胸甲 ====================== */
  P("chest_bulwark", "堅壁", CH, [m("defensePct", L(8, 6))], 100, "common"),
  P("chest_iron_wall", "鉄壁", CH, [m("flatReduce", L(1, 1))], 90, "fine"),
  P("heavy_armor", "重装", CH, [m("heavyArmorPct", L(10, 7))], 80, "fine"),
  P("life_core", "体力核", CH, [m("lifeCorePct", L(8, 6))], 90, "fine"),
  P("shield_core", "シールド核", CH, [m("shieldCore", L(6, 4))], 70, "rare"),
  P("chest_absorb", "吸収", CH, [m("absorbFlat", L(2, 2))], 90, "fine"),
  P("thorns", "棘", CH, [m("thornsPct", L(10, 8))], 90, "fine"),
  P("regen_core", "再生核", CH, [m("regenCorePct", L(8, 6))], 90, "fine"),
  P("guard_heart_chest", "守護の心", CH, [m("guardHeartPct", L(8, 6))], 80, "fine"),
  P("vengeance_heart", "復讐の心", CH, [m("vengeanceHeartPct", L(6, 4))], 80, "fine"),
  P("unyielding_core", "不屈核", CH, [m("unyieldingCoreChance", L(6, 4))], 50, "epic"),
  P("element_barrier", "元素障壁", CH, [m("elementBarrierPct", L(8, 6))], 70, "rare"),
  /* ====================== 第十三部分：护腿 ====================== */
  P("legs_tough", "堅忍", LE, [m("maxHealthPct", L(4, 3))], 100, "common"),
  P("legs_vitality", "活力", LE, [m("regenPct", L(8, 6))], 90, "fine"),
  P("stamina", "スタミナ", LE, [m("endurancePct", L(10, 7))], 90, "fine"),
  P("war_will", "戦争の意志", LE, [m("warWillPct", L(3, 2.5))], 80, "fine"),
  P("recovery", "回復", LE, [m("outOfCombatRegen", L(10, 7))], 90, "fine"),
  P("persistence", "持続", LE, [m("persistencePct", L(8, 6))], 80, "fine"),
  P("feral", "野性", LE, [m("feralPct", L(8, 6))], 80, "fine"),
  P("life_link", "体力リンク", LE, [m("damageSpreadPct", L(10, 7))], 70, "rare"),
  P("body", "体魄", LE, [m("bodyPct", L(10, 7))], 90, "fine"),
  P("warrior_legs", "戦士の脚", LE, [m("warriorLegsPct", L(8, 6))], 80, "fine"),
  /* ====================== 第十四部分：靴子 ====================== */
  P("boots_swift", "速歩", FE, [m("moveSpeedPct", L(5, 3.5))], 100, "common", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  P("boots_dash", "疾走", FE, [m("sprintSpeedPct", L(6, 4))], 100, "common"),
  P("boots_feather", "軽羽", FE, [m("fallReducePct", L(15, 9))], 90, "fine"),
  P("boots_leap", "転移", FE, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, ["clumsy", "bind_chest", "bulky"]),
  P("boots_wind", "風行", FE, [m("sprintSpeedPct", L(5, 3.5))], 90, "fine"),
  P("boots_water", "水渡り", FE, [m("waterSpeedPct", L(10, 7))], 90, "fine"),
  P("boots_dive", "深潜", FE, [m("swimPct", L(12, 8))], 90, "fine"),
  P("boots_fire", "火渡り", FE, [m("fireResistPct", L(10, 7))], 90, "fine"),
  P("boots_ice", "氷渡り", FE, [m("iceWalkPct", L(15, 9))], 90, "fine"),
  P("dodge", "回避", FE, [m("dodgeChance", L(4, 3))], 50, "epic"),
  P("boots_escape", "脱出", FE, [m("hurtSpeedPct", L(10, 7))], 80, "fine"),
  P("light_foot", "霊足", FE, [m("slowResistPct", L(10, 8))], 90, "fine"),
  P("soft_landing", "迅速着地", FE, [m("landingPct", L(10, 8))], 90, "fine"),
  P("light", "軽やか", FE, [m("moveSpeedPct", L(6, 4))], 80, "fine", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  /* ============ 第十五部分：通用资源 / 生存 ============ */
  P("fortune", "幸運", MELEE_TOOLS, [m("extraDropPct", L(10, 7))], 100, "common"),
  P("gather", "採取", TOOLS, [m("gatherPct", L(8, 6))], 90, "fine"),
  P("frugal", "節約", MELEE_TOOLS, [m("frugalPct", L(10, 7))], 90, "fine"),
  P("indestructible", "不壊", MELEE_TOOLS, [m("indestructiblePct", L(12, 8))], 60, "epic"),
  P("abundance", "豊穣", MELEE_TOOLS, [m("abundantChance", L(8, 6))], 80, "fine"),
  P("xp_hunter", "経験の狩人", MELEE_TOOLS, [m("xpPct", L(10, 8))], 80, "fine"),
  P("greedy_miner", "鉱石強欲", PK, [m("greedyMinerPct", L(8, 6))], 80, "fine"),
  P("hunter_drop", "狩猟者", MELEE, [m("huntDropPct", L(8, 6))], 80, "fine"),
  P("farmer", "農夫", HO, [m("farmDropPct", L(8, 6))], 80, "fine"),
  P("artisan", "工匠", TOOLS, [m("artisanChance", L(4, 3))], 50, "epic"),
  /* ---------- 第十六部分：通用移动与生存 ---------- */
  P("night_walk", "夜行", ARMOR, [m("nightSpeedPct", L(6, 4))], 80, "fine"),
  P("day_walk", "昼行", ARMOR, [m("daySpeedPct", L(6, 4))], 80, "fine"),
  P("wild_adapt", "荒野適応", ARMOR, [m("wildAdaptPct", L(6, 4))], 80, "fine"),
  P("cave_walker", "洞窟行者", ARMOR, [m("caveAdaptPct", L(6, 4))], 80, "fine"),
  P("desert_walker", "砂漠行者", FE, [m("desertAdaptPct", L(6, 4))], 80, "fine"),
  P("snow_walker", "雪原行者", FE, [m("snowAdaptPct", L(6, 4))], 80, "fine"),
  P("abyss_adapt", "深海適応", ARMOR, [m("netherAdaptPct", L(8, 6))], 70, "rare"),
  P("water_adapt", "水域適応", ARMOR, [m("waterAdaptPct", L(8, 6))], 70, "rare"),
  P("high_altitude", "高空適応", FE, [m("highAltAdaptPct", L(6, 4))], 80, "fine"),
  /* ======================================================================
   * 钓鱼竿正面（§8.15 · 12 条）
   * ====================================================================*/
  P("fish_bait", "良餌", FISHING, [m("fishingLuckPct", L(12, 8))], 100, "common", 0.12, ["fish_float_fail"]),
  P("fish_stable_line", "安定糸", FISHING, [m("varianceReducePct", L(15, 10))], 90, "fine"),
  P("fish_long_cast", "遠投", FISHING, [m("treasurePct", L(8, 5))], 90, "fine", 0.12, ["fish_short_cast"]),
  P("fish_fast_reel", "速巻き", FISHING, [m("reelSpeedPct", L(12, 8))], 100, "common", 0.12, ["fish_spool_jam", "fish_slow_reel"]),
  P("fish_deep_hunter", "深海の狩人", FISHING, [m("fishingLuckPct", L(10, 7)), m("waterBreathing", F(1))], 70, "rare"),
  P("fish_treasure_hook", "宝の針", FISHING, [m("treasurePct", L(10, 7))], 70, "rare"),
  P("fish_durable_spool", "耐久リール", FISHING, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["fish_line_break", "fish_line_wear"]),
  P("fish_aroma", "誘魚の香り", FISHING, [m("fishingLuckPct", L(9, 6)), m("cooldownReducePct", L(6, 4))], 80, "fine"),
  P("fish_bycatch", "副漁獲", FISHING, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("fish_quick_unhook", "迅速外し", FISHING, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("fish_sonar_float", "探知ウキ", FISHING, [m("treasurePct", L(6, 4)), m("insightFlat", F(1))], 60, "epic"),
  P("fish_lucky_angler", "幸運の釣り人", FISHING, [m("fishingLuckPct", L(14, 9))], 60, "epic"),
  /* ======================================================================
   * 剪刀正面（§8.16 · 12 条）
   * ====================================================================*/
  P("shear_sharp_blade", "鋭利な刃", SHEARS, [m("shearSpeedPct", L(15, 10))], 100, "common", 0.12, ["shear_blunt"]),
  P("shear_fine_cut", "精密裁断", SHEARS, [m("shearYieldPct", L(12, 8))], 100, "common"),
  P("shear_wool_master", "羊毛の達人", SHEARS, [m("shearYieldPct", L(14, 9))], 90, "fine", 0.12, ["shear_wool_waste"]),
  P("shear_leaf_collect", "葉の収集", SHEARS, [m("shearYieldPct", L(10, 7))], 90, "fine"),
  P("shear_vine_reap", "ツタ収穫", SHEARS, [m("shearSpeedPct", L(12, 8))], 90, "fine"),
  P("shear_durable_joint", "耐久関節", SHEARS, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["shear_nick"]),
  P("shear_silent", "静音裁断", SHEARS, [m("cooldownReducePct", L(8, 5))], 80, "fine"),
  P("shear_quick_prune", "高速剪定", SHEARS, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("shear_fiber_sense", "繊維識別", SHEARS, [m("insightFlat", F(1))], 60, "epic"),
  P("shear_precise", "精密採取", SHEARS, [m("shearYieldPct", L(11, 7))], 70, "rare"),
  P("shear_lossless", "無損失裁断", SHEARS, [m("varianceReducePct", L(12, 8))], 80, "fine"),
  P("shear_gardener", "園芸の達人", SHEARS, [m("harvestPct", L(10, 7))], 70, "rare"),
  /* ======================================================================
   * 刷子正面（§8.17 · 12 条）
   * ====================================================================*/
  P("brush_fine", "細筆", BRUSH, [m("brushLuckPct", L(12, 8))], 100, "common", 0.12, ["brush_force_loss"]),
  P("brush_antiquarian", "古物学者", BRUSH, [m("brushLuckPct", L(14, 9))], 90, "fine"),
  P("brush_steady_hand", "安定した筆遣い", BRUSH, [m("varianceReducePct", L(15, 10))], 90, "fine"),
  P("brush_bristle", "筆先の耐久", BRUSH, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["brush_bristle_wear"]),
  P("brush_relic_id", "遺物鑑識", BRUSH, [m("archaeologyChance", L(6, 4))], 70, "rare"),
  P("brush_dust_recover", "塵の回収", BRUSH, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("brush_precise_arch", "精密考古学", BRUSH, [m("brushLuckPct", L(10, 7))], 90, "fine"),
  P("brush_civ_resonance", "古代文明の共鳴", BRUSH, [m("brushLuckPct", L(13, 9))], 60, "epic"),
  P("brush_light_touch", "軽い筆遣い", BRUSH, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("brush_sediment", "堆積の専門家", BRUSH, [m("brushSpeedPct", L(12, 8))], 90, "fine"),
  P("brush_relic_luck", "遺跡の幸運", BRUSH, [m("brushLuckPct", L(15, 10))], 60, "epic"),
  P("brush_detail", "細部の観察", BRUSH, [m("insightFlat", F(1))], 60, "epic"),
  /* ======================================================================
   * 打火石正面（§8.18 · 12 条）
   * ====================================================================*/
  P("flint_precise", "精密点火", FLINT, [m("igniteChancePct", L(12, 8))], 100, "common", 0.12, ["flint_blunt", "flint_spark_deflect"]),
  P("flint_long_burn", "長持ちの火種", FLINT, [m("fireDurationPct", L(15, 10))], 100, "common"),
  P("flint_master", "火起こしの達人", FLINT, [m("igniteChancePct", L(14, 9))], 90, "fine"),
  P("flint_spark_recover", "火花の回収", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("flint_blaze", "烈火の啓示", FLINT, [m("fireChance", L(8, 5))], 80, "fine"),
  P("flint_damp_proof", "耐湿の火打ち石", FLINT, [m("igniteChancePct", L(10, 7))], 80, "fine"),
  P("flint_reserve", "火種の備蓄", FLINT, [m("fireDurationPct", L(12, 8))], 80, "fine"),
  P("flint_molten_res", "溶火の共鳴", FLINT, [m("moltenPct", L(10, 7))], 70, "rare"),
  P("flint_quick_ignite", "迅速点火", FLINT, [m("cooldownReducePct", L(12, 8))], 90, "fine"),
  P("flint_ember_mark", "残り火の印", FLINT, [m("fireGround", F(1))], 60, "epic"),
  P("flint_heat_grip", "耐火グリップ", FLINT, [m("fireResistPct", L(10, 7))], 90, "fine", 0.12, ["flint_fragile"]),
  P("flint_campfire", "焚き火の匠", FLINT, [m("igniteChancePct", L(9, 6))], 80, "fine"),
  /* ==== 《扩展词条库》正面 274 条（§3） ==== */
  P("xp001", "精密打撃", MELEE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-001"),
  P("xp002", "勢い破壊", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-002"),
  P("xp003", "先制", MELEE, [m("firstStrikePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-003"),
  P("xp004", "追撃", MELEE, [m("chasePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-004"),
  P("xp005", "戦意", MELEE, [m("killStackPct", L(4, 3))], 90, "common", 0.12, [], void 0, "P-005"),
  P("xp006", "処刑", MELEE, [m("critChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-006"),
  P("xp007", "復讐", MELEE, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-007"),
  P("xp008", "狩猟", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-008"),
  P("xp009", "重撃", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-009"),
  P("xp010", "魂の残響", MELEE, [m("soulPct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-010"),
  P("xp011", "震盪", MELEE, [m("attackCooldownPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-011"),
  P("xp012", "安定した手", MELEE, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-012"),
  P("xp013", "剣意", SWORD, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-013"),
  P("xp014", "連環斬", SWORD, [m("comboPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-014"),
  P("xp015", "旋刃", SWORD, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-015"),
  P("xp016", "血刃", SWORD, [m("lifesteal", L(2, 1.2))], 90, "fine", 0.12, [], void 0, "P-016"),
  P("xp017", "剣気", SWORD, [m("aoePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-017"),
  P("xp018", "斬首", SWORD, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-018"),
  P("xp019", "破軍", SWORD, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-019"),
  P("xp020", "心臓狩り", SWORD, [m("critChance", L(4, 2.5))], 90, "common", 0.12, [], void 0, "P-020"),
  P("xp021", "無双", SWORD, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-021"),
  P("xp022", "速剣", SWORD, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-022"),
  P("xp023", "鍔返し", SWORD, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-023"),
  P("xp024", "元素の共鳴", SWORD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-024"),
  P("xp025", "重斧", AXE, [m("knockbackPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-025"),
  P("xp026", "伐採の達人", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-026"),
  P("xp027", "倒木", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-027"),
  P("xp028", "迅斬", AXE, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-028"),
  P("xp029", "盾破壊", AXE, [m("shieldBreakPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-029"),
  P("xp030", "骨砕き", AXE, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-030"),
  P("xp031", "劈裂", AXE, [m("aoePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-031"),
  P("xp032", "開拓", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-032"),
  P("xp033", "木工の達人", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-033"),
  P("xp034", "猛劈", AXE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-034"),
  P("xp035", "狂伐", AXE, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-035"),
  P("xp036", "森の守り", AXE, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-036"),
  P("xp037", "速掘", PICK, [m("miningSpeedPct", L(15, 10))], 90, "rare", 0.12, [], void 0, "P-037"),
  P("xp038", "鉱脈", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-038"),
  P("xp039", "幸運の鉱夫", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-039"),
  P("xp040", "精錬", PICK, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-040"),
  P("xp041", "連鎖採掘", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-041"),
  P("xp042", "範囲採掘", PICK, [m("aoeBreak", F(1))], 90, "rare", 0.12, [], void 0, "P-042"),
  P("xp043", "堅固", PICK, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-043"),
  P("xp044", "鉱夫の眼", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-044"),
  P("xp045", "宝の狩人", PICK, [m("treasurePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-045"),
  P("xp046", "深掘り", PICK, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-046"),
  P("xp047", "地脈の共鳴", PICK, [m("oreDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-047"),
  P("xp048", "採掘集中", PICK, [m("miningSpeedPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-048"),
  P("xp049", "迅掘", SHOVEL, [m("miningSpeedPct", L(15, 10))], 90, "rare", 0.12, [], void 0, "P-049"),
  P("xp050", "範囲シャベル", SHOVEL, [m("aoeBreak", F(1))], 90, "common", 0.12, [], void 0, "P-050"),
  P("xp051", "砂地の達人", SHOVEL, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-051"),
  P("xp052", "宝探し", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-052"),
  P("xp053", "考古学者", SHOVEL, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-053"),
  P("xp054", "耕耘", SHOVEL, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-054"),
  P("xp055", "地質学者", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-055"),
  P("xp056", "シャベル面の堅さ", SHOVEL, [m("attackDurabilityCost", L(1, 0.6))], 90, "common", 0.12, [], void 0, "P-056"),
  P("xp057", "高速整地", SHOVEL, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-057"),
  P("xp058", "繊細な掘削", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-058"),
  P("xp059", "土盛りの達人", SHOVEL, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-059"),
  P("xp060", "地表の宝探し", SHOVEL, [m("treasurePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-060"),
  P("xp061", "豊作", HOE, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-061"),
  P("xp062", "幸運の農夫", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-062"),
  P("xp063", "自動植え直し", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-063"),
  P("xp064", "神農", HOE, [m("harvestPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-064"),
  P("xp065", "繁茂", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-065"),
  P("xp066", "大地の恵み", HOE, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-066"),
  P("xp067", "迅速耕作", HOE, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-067"),
  P("xp068", "種の達人", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-068"),
  P("xp069", "豊穣", HOE, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-069"),
  P("xp070", "永続耕作", HOE, [m("harvestPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-070"),
  P("xp071", "輪作", HOE, [m("harvestPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-071"),
  P("xp072", "農園の守り", HOE, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-072"),
  P("xp073", "強弓", BOW, [m("projectilePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-073"),
  P("xp074", "狙撃", BOW, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-074"),
  P("xp075", "貫通", BOW, [m("piercePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-075"),
  P("xp076", "多重矢", BOW, [m("multishotPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-076"),
  P("xp077", "爆裂矢", BOW, [m("aoePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-077"),
  P("xp078", "火矢", BOW, [m("fireChance", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-078"),
  P("xp079", "氷矢", BOW, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-079"),
  P("xp080", "雷矢", BOW, [m("lightningChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-080"),
  P("xp081", "追跡の矢", BOW, [m("chasePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-081"),
  P("xp082", "速弦", BOW, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-082"),
  P("xp083", "安定弦", BOW, [m("varianceReducePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-083"),
  P("xp084", "致命の矢", BOW, [m("critChance", L(4, 2.5))], 90, "common", 0.12, [], void 0, "P-084"),
  P("xp085", "重クロスボウ", CROSSBOW, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-085"),
  P("xp086", "装甲貫通", CROSSBOW, [m("armorPenPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-086"),
  P("xp087", "速装填", CROSSBOW, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-087"),
  P("xp088", "多矢", CROSSBOW, [m("multishotPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-088"),
  P("xp089", "爆破", CROSSBOW, [m("explosivePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-089"),
  P("xp090", "陣形破壊", CROSSBOW, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-090"),
  P("xp091", "狙撃殺", CROSSBOW, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-091"),
  P("xp092", "連射", CROSSBOW, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-092"),
  P("xp093", "安定", CROSSBOW, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-093"),
  P("xp094", "機構の達人", CROSSBOW, [m("attackDurabilityCost", L(1, 0.6))], 90, "fine", 0.12, [], void 0, "P-094"),
  P("xp095", "雲貫き", CROSSBOW, [m("snipePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-095"),
  P("xp096", "弾薬回収", CROSSBOW, [m("ammoPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-096"),
  P("xp097", "海神", TRIDENT, [m("waterBreathing", F(1))], 90, "rare", 0.12, [], void 0, "P-097"),
  P("xp098", "潮汐", TRIDENT, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-098"),
  P("xp099", "雷霆", TRIDENT, [m("lightningChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-099"),
  P("xp100", "還流", TRIDENT, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-100"),
  P("xp101", "海貫き", TRIDENT, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-101"),
  P("xp102", "深海の狩人", TRIDENT, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-102"),
  P("xp103", "波濤", TRIDENT, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-103"),
  P("xp104", "嵐", TRIDENT, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-104"),
  P("xp105", "投擲の達人", TRIDENT, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-105"),
  P("xp106", "回収の安定", TRIDENT, [m("accuracyPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-106"),
  P("xp107", "潮汐回復", TRIDENT, [m("waterBreathing", F(1))], 90, "rare", 0.12, [], void 0, "P-107"),
  P("xp108", "海流感知", TRIDENT, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-108"),
  P("xp109", "鉄盾", SHIELD, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-109"),
  P("xp110", "堅盾", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 90, "common", 0.12, [], void 0, "P-110"),
  P("xp112", "棘の盾", SHIELD, [m("vengeancePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-112"),
  P("xp113", "盾撃", SHIELD, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-113"),
  P("xp114", "突進", SHIELD, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-114"),
  P("xp115", "守護", SHIELD, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-115"),
  P("xp116", "守護領域", SHIELD, [m("defensePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-116"),
  P("xp117", "完璧ガード", SHIELD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-117"),
  P("xp118", "盾壁", SHIELD, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-118"),
  P("xp119", "反射障壁", SHIELD, [m("thornsPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-119"),
  P("xp120", "堅守", SHIELD, [m("resistPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-120"),
  P("xp121", "剛毅", HEAD, [m("maxHealthPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-121"),
  P("xp122", "洞察", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-122"),
  P("xp123", "暗視", HEAD, [m("nightVision", F(1))], 90, "common", 0.12, [], void 0, "P-123"),
  P("xp124", "水中呼吸", HEAD, [m("waterBreathing", F(1))], 90, "fine", 0.12, [], void 0, "P-124"),
  P("xp125", "深海視界", HEAD, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-125"),
  P("xp126", "精神", HEAD, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-126"),
  P("xp127", "意志", HEAD, [m("resistPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-127"),
  P("xp128", "危険感知", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-128"),
  P("xp129", "アンデッド感知", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-129"),
  P("xp130", "モブ知識", HEAD, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-130"),
  P("xp131", "魂の眼", HEAD, [m("soulPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-131"),
  P("xp132", "清明", HEAD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-132"),
  P("xp133", "堅壁", CHEST, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-133"),
  P("xp134", "鉄壁", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-134"),
  P("xp135", "重装", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-135"),
  P("xp136", "体力核", CHEST, [m("defensePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-136"),
  P("xp137", "シールド核", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-137"),
  P("xp138", "吸収", CHEST, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-138"),
  P("xp139", "棘", CHEST, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-139"),
  P("xp140", "再生核", CHEST, [m("regenPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-140"),
  P("xp141", "守護の心", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-141"),
  P("xp142", "復讐の心", CHEST, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-142"),
  P("xp143", "不屈核", CHEST, [m("critChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-143"),
  P("xp144", "元素障壁", CHEST, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-144"),
  P("xp145", "堅忍", LEGS, [m("maxHealthPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-145"),
  P("xp146", "活力", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-146"),
  P("xp147", "スタミナ", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-147"),
  P("xp148", "戦争の意志", LEGS, [m("killStackPct", L(4, 3))], 90, "fine", 0.12, [], void 0, "P-148"),
  P("xp149", "回復", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-149"),
  P("xp150", "持続", LEGS, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-150"),
  P("xp151", "野性", LEGS, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-151"),
  P("xp152", "体力リンク", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-152"),
  P("xp153", "体魄", LEGS, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-153"),
  P("xp154", "戦士の脚", LEGS, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-154"),
  P("xp155", "長距離行軍", LEGS, [m("attackCooldownPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-155"),
  P("xp156", "安定歩行", LEGS, [m("attackCooldownPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-156"),
  P("xp157", "速歩", FEET, [m("moveSpeedPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-157"),
  P("xp158", "疾走", FEET, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-158"),
  P("xp159", "軽羽", FEET, [m("fallReducePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-159"),
  P("xp160", "転移", FEET, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-160"),
  P("xp161", "風行", FEET, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-161"),
  P("xp162", "水渡り", FEET, [m("moveSpeedPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-162"),
  P("xp163", "深潜", FEET, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-163"),
  P("xp164", "火渡り", FEET, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-164"),
  P("xp165", "氷渡り", FEET, [m("iceSlip", F(1))], 90, "common", 0.12, [], void 0, "P-165"),
  P("xp166", "回避", FEET, [m("dodgeChance", L(4, 2.5))], 90, "fine", 0.12, [], void 0, "P-166"),
  P("xp167", "脱出", FEET, [m("dodgeChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-167"),
  P("xp168", "霊足", FEET, [m("attackCooldownPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-168"),
  P("xp169", "元素耐性", ARMOR, [m("resistPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-169"),
  P("xp171", "反撃の構え", ARMOR, [m("vengeancePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-171"),
  P("xp172", "耐久の守り", ARMOR, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-172"),
  P("xp173", "体力回復", ARMOR, [m("maxHealthPct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-173"),
  P("xp174", "ノックバック耐性", ARMOR, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-174"),
  P("xp175", "状態異常耐性", ARMOR, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-175"),
  P("xp176", "戦闘適応", ARMOR, [m("resistPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-176"),
  P("xp177", "環境適応", ARMOR, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-177"),
  P("xp178", "緊急シールド", ARMOR, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-178"),
  P("xp179", "復元", ARMOR, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-179"),
  P("xp180", "セット共鳴", ARMOR, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-180"),
  P("xp181", "節約", TOOLS, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-181"),
  P("xp182", "経験の狩人", TOOLS, [m("xpPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-182"),
  P("xp183", "狩猟者", TOOLS, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-183"),
  P("xp184", "採取の達人", TOOLS, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-184"),
  P("xp185", "高速操作", TOOLS, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-185"),
  P("xp186", "安定グリップ", TOOLS, [m("accuracyPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-186"),
  P("xp187", "精密作業", TOOLS, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-187"),
  P("xp188", "資源識別", TOOLS, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-188"),
  P("xp189", "耐久調整", TOOLS, [m("durabilitySave", L(12, 8))], 90, "common", 0.12, [], void 0, "P-189"),
  P("xp190", "連鎖制御", TOOLS, [m("aoeBreak", F(1))], 90, "fine", 0.12, [], void 0, "P-190"),
  P("xp191", "副産物", TOOLS, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-191"),
  P("xp192", "道具集中", TOOLS, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-192"),
  P("xp193", "砕甲の重撃", MACE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-193"),
  P("xp194", "墜撃熟練", MACE, [m("durabilitySave", L(10, 7))], 90, "common", 0.12, [], void 0, "P-194"),
  P("xp195", "衝撃波", MACE, [m("aoePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-195"),
  P("xp196", "震地", MACE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-196"),
  P("xp197", "槌勢の蓄積", MACE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-197"),
  P("xp198", "破盾の重圧", MACE, [m("shieldBreakPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-198"),
  P("xp199", "重鎚の残響", MACE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-199"),
  P("xp200", "落星", MACE, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-200"),
  P("xp201", "巨力ノックバック", MACE, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-201"),
  P("xp202", "精密着弾", MACE, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-202"),
  P("xp203", "戦場の威圧", MACE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-203"),
  P("xp204", "鎚の魂", MACE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-204"),
  P("xp205", "精密突き", SPEAR, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-205"),
  P("xp206", "突撃貫通", SPEAR, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-206"),
  P("xp207", "騎槍の達人", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-207"),
  P("xp208", "戦陣の長槍", SPEAR, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-208"),
  P("xp209", "長距離制圧", SPEAR, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-209"),
  P("xp210", "安定した柄", SPEAR, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-210"),
  P("xp211", "突進の回収", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-211"),
  P("xp212", "連続刺突", SPEAR, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-212"),
  P("xp213", "騎乗突撃", SPEAR, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-213"),
  P("xp214", "破陣突進", SPEAR, [m("knockbackPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-214"),
  P("xp215", "穂先の共鳴", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-215"),
  P("xp216", "先制の長刺し", SPEAR, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-216"),
  P("xp217", "良餌", FISHING, [m("treasurePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-217"),
  P("xp218", "安定糸", FISHING, [m("varianceReducePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-218"),
  P("xp219", "遠投", FISHING, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-219"),
  P("xp220", "速巻き", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-220"),
  P("xp221", "深海の狩人", FISHING, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-221"),
  P("xp222", "宝の針", FISHING, [m("treasurePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-222"),
  P("xp223", "耐久リール", FISHING, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-223"),
  P("xp224", "誘魚の香り", FISHING, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-224"),
  P("xp225", "副漁獲", FISHING, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-225"),
  P("xp226", "迅速外し", FISHING, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-226"),
  P("xp227", "探知ウキ", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-227"),
  P("xp228", "幸運の釣り人", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-228"),
  P("xp229", "鋭利な刃", SHEARS, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-229"),
  P("xp230", "精密裁断", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-230"),
  P("xp231", "羊毛の達人", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-231"),
  P("xp232", "葉の収集", SHEARS, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-232"),
  P("xp233", "ツタ収穫", SHEARS, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-233"),
  P("xp234", "耐久関節", SHEARS, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-234"),
  P("xp235", "静音裁断", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-235"),
  P("xp236", "高速剪定", SHEARS, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-236"),
  P("xp237", "繊維識別", SHEARS, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-237"),
  P("xp238", "精密採取", SHEARS, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-238"),
  P("xp239", "無損失裁断", SHEARS, [m("varianceReducePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-239"),
  P("xp240", "園芸の達人", SHEARS, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-240"),
  P("xp241", "細筆", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-241"),
  P("xp242", "古物学者", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-242"),
  P("xp243", "安定した筆遣い", BRUSH, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-243"),
  P("xp244", "筆先の耐久", BRUSH, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-244"),
  P("xp245", "遺物鑑識", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-245"),
  P("xp246", "塵の回収", BRUSH, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-246"),
  P("xp247", "精密考古学", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-247"),
  P("xp248", "古代文明の共鳴", BRUSH, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-248"),
  P("xp249", "軽い筆遣い", BRUSH, [m("cooldownReducePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-249"),
  P("xp250", "堆積の専門家", BRUSH, [m("brushLuckPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-250"),
  P("xp251", "遺跡の幸運", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-251"),
  P("xp252", "細部の観察", BRUSH, [m("brushLuckPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-252"),
  P("xp253", "精密点火", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-253"),
  P("xp254", "長持ちの火種", FLINT, [m("igniteChancePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-254"),
  P("xp255", "火起こしの達人", FLINT, [m("igniteChancePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-255"),
  P("xp256", "火花の回収", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-256"),
  P("xp257", "烈火の啓示", FLINT, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-257"),
  P("xp258", "耐湿の火打ち石", FLINT, [m("igniteChancePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-258"),
  P("xp259", "火種の備蓄", FLINT, [m("igniteChancePct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-259"),
  P("xp260", "溶火の共鳴", FLINT, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-260"),
  P("xp261", "迅速点火", FLINT, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-261"),
  P("xp262", "残り火の印", FLINT, [m("fireChance", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-262"),
  P("xp263", "耐火グリップ", FLINT, [m("fireChance", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-263"),
  P("xp264", "焚き火の匠", FLINT, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-264"),
  P("xp265", "軽翼", ELYTRA, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-265"),
  P("xp266", "高空の安定流", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-266"),
  P("xp267", "急降下の狩人", ELYTRA, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-267"),
  P("xp268", "安定着陸", ELYTRA, [m("fallReducePct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-268"),
  P("xp269", "風行の翼膜", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-269"),
  P("xp270", "翼膜の耐久", ELYTRA, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-270"),
  P("xp271", "急転風切り", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-271"),
  P("xp272", "気流感知", ELYTRA, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-272"),
  P("xp273", "長距離滑空", ELYTRA, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-273"),
  P("xp274", "嵐への適応", ELYTRA, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-274"),
  P("xp275", "緩降下", ELYTRA, [m("fallReducePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-275"),
  P("xp276", "離脱急降下", ELYTRA, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-276"),
  /* ==== 马铠 / 骑乘道具正面 ==== */
  P("horse_iron_plate", "鉄鱗の馬鎧", HORSE, [m("defensePct", L(8, 5))], 90, "fine"),
  P("horse_light_barding", "軽装の馬鎧", HORSE, [m("moveSpeedPct", L(8, 5))], 90, "fine"),
  P("horse_swift", "疾駆", HORSE, [m("moveSpeedPct", L(10, 7))], 80, "fine"),
  P("horse_stamina", "耐力の馬鎧", HORSE, [m("durabilitySave", L(12, 8))], 90, "fine"),
  P("horse_shielded", "主護の馬鎧", HORSE, [m("defensePct", L(6, 4)), m("maxHealthPct", L(5, 3))], 70, "rare"),
  P("steer_steady", "安定した舵", STEERING, [m("durabilitySave", L(12, 8))], 90, "fine"),
  P("steer_fast", "疾行", STEERING, [m("moveSpeedPct", L(10, 7))], 90, "fine"),
  P("steer_lucky", "追い風", STEERING, [m("cooldownReducePct", L(10, 7))], 80, "fine"),
  P("steer_durable", "強靭な手綱", STEERING, [m("indestructiblePct", L(8, 5))], 70, "rare"),
  P("steer_water", "水辺踏破", STEERING, [m("waterBreathing", F(1))], 60, "epic")
];
var NEGATIVE = [
  // ---------------- 攻击 ----------------
  N("dull", "鈍重", MELEE, [m("attackSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift", "agile", "extreme_speed"]),
  N("heavy", "重い", MELEE, [m("attackSpeedPct", L(-5, -7.5)), m("moveSpeedPct", L(-3, -3))], 90, "fine", 0.12, ["swift", "agile", "extreme_speed"]),
  N("weak", "軟弱", MELEE, [m("attackPct", L(-6, -6.5))], 100, "common"),
  N("imbalance", "失衡", MELEE, [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("backlash", "狂怒の反噬", MELEE, [m("selfDamageChance", L(1, 1.5))], 70, "rare"),
  N("thirsty", "飢渇", MELEE, [m("hungerDrain", L(8, 10))], 90, "fine"),
  N("fatigue", "疲労", MELEE, [m("comboDecayPct", L(4, 5.75))], 90, "fine"),
  N("charge_up", "溜めの遅延", MELEE, [m("firstHitDelay", L(5, 7.5))], 90, "fine"),
  N("recoil", "反震", MELEE, [m("selfDamageChance", L(1, 1)), m("attackDurabilityCost", L(1, 0.5))], 80, "fine"),
  N("bloodthirst", "血への渇望", MELEE, [m("idleDecayPct", L(5, 7.5))], 80, "fine"),
  N("irritable", "短気", MELEE, [m("aggroPct", L(10, 10))], 90, "fine"),
  N("erratic", "制御不能", MELEE, [m("erraticChance", L(3, 2))], 80, "fine"),
  N("frail_strike", "弱体化", MELEE, [m("idleDecayPct", L(3, 4)), m("healingReducePct", L(5, 5))], 80, "fine"),
  // ---------------- 暴击 ----------------
  N("blunt_sense", "鈍感", MELEE, [m("bluntCritPct", L(4, 4))], 100, "common"),
  N("misaim", "失準", MELEE, [m("lostCritDamagePct", L(8, 8))], 100, "common"),
  N("fragile_strike", "脆弱な打撃", MELEE, [m("critDefenseBreak", L(6, 6))], 80, "fine"),
  N("overload_crit", "過負荷", MELEE, [m("critDurabilityCost", L(1, 1))], 80, "fine"),
  N("fatal_cost", "致命的な代償", MELEE, [m("critDurabilityCost", L(1, 0.75)), m("critSelfDamage", L(1, 1))], 70, "rare"),
  N("gamble", "命懸け", MELEE, [m("gambleCrit", L(8, 6)), m("attackPct", L(-6, -5))], 70, "rare"),
  // ---------------- 耐久 ----------------
  N("fragile", "壊れやすい", ALL, [m("durabilityMult", L(25, 28.75))], 100, "common", 0.12, ["solid"]),
  N("brittle", "脆裂", ALL, [m("durabilityMult", L(40, 45))], 80, "fine", 0.12, ["solid"]),
  N("corrode_neg", "腐食", ALL, [m("durabilityDrain", L(1, 1.5))], 80, "fine"),
  N("self_harm", "自傷", MELEE_TOOLS, [m("skillDurabilityCost", L(2, 2.75))], 80, "fine"),
  N("overload", "過負荷", ALL, [m("skillDurabilityCost", L(3, 3.5))], 70, "rare"),
  N("fracture", "断裂リスク", ALL, [m("fractureChance", L(5, 4.75))], 80, "fine"),
  N("unstable", "不安定", ALL, [m("unstablePct", L(5, 6))], 80, "fine"),
  N("aging", "経年劣化", ALL, [m("agingPct", L(4, 5))], 80, "fine"),
  // ---------------- 移动 ----------------
  N("clumsy", "笨重", ["chest", "legs", "feet"], [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift", "leap", "boots_leap", "stiff"]),
  N("stagger_move", "よろめき", ["legs", "feet"], [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("pressure", "圧迫", ["legs", "feet"], [m("runDecayPct", L(4, 5.75))], 90, "fine"),
  N("inertia", "慣性", FE, [m("turnSlow", L(10, 10))], 90, "fine"),
  N("bulky", "厚重", ["legs", "chest"], [m("jumpPct", L(-8, -10))], 90, "fine", 0.12, ["leap", "boots_leap"]),
  N("sink", "沈底", FE, [m("swimPct", L(-12, -10.75))], 90, "fine"),
  N("slip", "滑り", FE, [m("iceSlip", L(10, 10))], 90, "fine"),
  N("sticky", "粘着", FE, [m("waterSpeedPct", L(-10, -10))], 80, "fine"),
  // ---------------- 生命 ----------------
  N("frail_body", "虚弱体質", ARMOR, [m("maxHealthPct", L(-6, -6))], 100, "common"),
  N("vulnerable", "被ダメージ増", ARMOR, [m("damageTakenPct", L(8, 8))], 100, "common"),
  N("brittle_bone", "脆い骨", ARMOR, [m("critTakenPct", L(8, 8))], 90, "fine"),
  N("regen_block", "再生阻害", ARMOR, [m("naturalRegenPct", L(-15, -15))], 90, "fine"),
  N("exhausted", "疲弊", ARMOR, [m("naturalRegenPct", L(-10, -12))], 90, "fine"),
  N("blood_loss", "失血", ARMOR, [m("bloodLossPct", L(3, 3))], 70, "rare"),
  N("sickly", "病弱", ARMOR, [m("debuffReduce", L(-10, -10))], 90, "fine"),
  N("fatal_frailty", "致命的脆弱", ARMOR, [m("frailtyPct", L(8, 8))], 70, "rare"),
  // ---------------- 防御 ----------------
  N("armor_break_body", "破甲体質", ARMOR, [m("armorBreakVulnPct", L(6, 6))], 90, "fine"),
  N("armor_crack", "アーマー亀裂", CH, [m("armorCrackPct", L(6, 6))], 80, "fine"),
  N("exposed", "露出", ARMOR, [m("exposedPct", L(8, 8))], 80, "fine"),
  N("lost_guard", "失守", CH, [m("lostGuardPct", L(5, 6))], 80, "fine"),
  N("open_guard", "隙", CH, [m("openGuardPct", L(5, 6))], 80, "fine"),
  N("shock_stun", "震盪", ARMOR, [m("shockImmobilePct", L(5, 6))], 80, "fine"),
  N("magic_fragile", "魔法脆弱", ARMOR, [m("magicFragilePct", L(6, 6))], 80, "fine"),
  // ---------------- 护甲 · 头盔 ----------------
  N("stuffy", "蒸し暑さ", HE, [m("healingReducePct", L(10, 10))], 100, "common"),
  N("dizzy", "昏沈", HE, [m("visionPct", L(5, 7.5))], 90, "fine"),
  N("hypoxia", "酸欠", HE, [m("waterBreathingNeg", L(1, 1))], 80, "fine"),
  N("dull_senses", "感覚鈍麻", HE, [m("senseReduce", L(10, 10))], 90, "fine"),
  N("mental_fatigue", "精神疲労", HE, [m("mentalFatiguePct", L(6, 6))], 90, "fine"),
  // ---------------- 护甲 · 胸甲 ----------------
  N("heavy_chest", "重い", CH, [m("moveSpeedPct", L(-6, -6.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift"]),
  N("bind_chest", "束縛", CH, [m("jumpPct", L(-8, -10))], 90, "fine", 0.12, ["leap", "boots_leap"]),
  N("sluggish", "遅鈍", CH, [m("attackSpeedPct", L(-5, -7.5))], 90, "fine", 0.12, ["swift", "agile", "extreme_speed"]),
  N("overheat", "過熱", CH, [m("fireVulnPct", L(10, 10))], 90, "fine"),
  N("heavy_press", "重圧", CH, [m("maxHealthPct", L(10, 10)), m("naturalRegenPct", L(-20, -15))], 80, "fine"),
  N("brittle_armor", "脆い鎧", CH, [m("critTakenPct", L(10, 10))], 80, "fine"),
  // ---------------- 护甲 · 护腿 ----------------
  N("stiff", "硬直", LE, [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift", "clumsy"]),
  N("fatigue_legs", "疲労", LE, [m("sprintHungerDrain", L(10, 10))], 90, "fine"),
  N("leg_bind", "脚甲の束縛", LE, [m("sprintStartup", L(10, 10))], 90, "fine"),
  N("heavy_lower", "重い下半身", LE, [m("heavyLowerBodyPct", L(8, 8))], 90, "fine"),
  N("action_slow", "行動遅滞", LE, [m("actionSlowPct", L(5, 6))], 80, "fine"),
  // ---------------- 护甲 · 靴子 ----------------
  N("clumsy_boots", "笨重", FE, [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift"]),
  N("water_absorb", "吸水", FE, [m("waterSpeedPct", L(-15, -11.75))], 90, "fine"),
  N("sink_boots", "沈底", FE, [m("swimPct", L(-12, -10.75))], 90, "fine"),
  N("slip_boots", "滑り", FE, [m("iceSlip", L(10, 10))], 90, "fine"),
  N("thin_sole", "脆い底", FE, [m("fallDamagePct", L(15, 11.75))], 90, "fine"),
  N("friction", "摩擦摩耗", FE, [m("moveDurabilityCost", L(1, 0.5))], 90, "fine"),
  // ---------------- 工具 · 镐 ----------------
  N("dull_pick", "鈍いツルハシ", PK, [m("miningSpeedPct", L(-10, -10))], 100, "common", 0.12, ["swift_dig"]),
  N("fragile_pick", "脆いツルハシ", PK, [m("durabilityMult", L(30, 28.75))], 100, "common", 0.12, ["solid"]),
  N("hand_shake", "手への衝撃", PK, [m("mineSlowSelf", L(5, 7.5))], 90, "fine"),
  N("greedy_dig", "欲張り採掘", PK, [m("miningSpeedPct", L(15, 11.75)), m("durabilityMult", L(60, 55))], 70, "rare"),
  N("slow_dig", "遅滞", PK, [m("miningSpeedDecay", L(4, 5.75))], 90, "fine"),
  N("unstable_vein", "不安定鉱脈", PK, [m("unstableVeinPct", L(5, 6))], 80, "fine"),
  // ---------------- 工具 · 斧 ----------------
  N("blunt", "鈍い刃", AX, [m("woodMasterPct", L(-12, -10.75))], 100, "common", 0.12, ["lumber"]),
  N("off_center", "重心の偏り", AX, [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("easy_break", "折れやすい", AX, [m("fractureChance", L(8, 7.5))], 90, "fine"),
  N("overweight", "過重量", AX, [m("woodMasterPct", L(15, 11.75)), m("moveSpeedPct", L(-8, -10))], 80, "fine"),
  // ---------------- 工具 · 锹 ----------------
  N("bent_blade", "シャベル刃の湾曲", SH, [m("miningSpeedPct", L(-10, -10))], 100, "common"),
  N("soil_dependency", "土壌依存", SH, [m("soilDependencyPct", L(6, 6))], 90, "fine"),
  N("easy_jam", "行動阻害", SH, [m("toolJamPct", L(5, 6))], 90, "fine"),
  // ---------------- 工具 · 锄 ----------------
  N("hardened", "板結", HO, [m("farmlandSlow", L(10, 10))], 100, "common"),
  N("barren", "不毛", HO, [m("harvestPct", L(-10, -10))], 100, "common", 0.12, ["harvest"]),
  N("greedy_grow", "欲張りな成長", HO, [m("harvestPct", L(15, 11.75)), m("growthPct", L(-15, -11.75))], 80, "fine", 0.12, ["lush"]),
  N("late_plant", "遅植", HO, [m("latePlantPct", L(6, 6))], 90, "fine"),
  /* ======================================================================
   * 钓鱼竿负面（§8.15 · 16 条）
   * ====================================================================*/
  N("fish_spool_jam", "糸巻きの固着", FISHING, [m("fishingCooldownPct", L(10, 7))], 100, "common", 0.12, ["fish_fast_reel"]),
  N("fish_line_break", "切れやすい釣り糸", FISHING, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["fish_durable_spool"]),
  N("fish_float_fail", "浮きの故障", FISHING, [m("fishingLuckPct", L(-10, -7))], 90, "fine", 0.12, ["fish_bait"]),
  N("fish_bait_loss", "餌の散逸", FISHING, [m("fishingCooldownPct", L(8, 5))], 90, "fine"),
  N("fish_slow_reel", "巻き取りの遅さ", FISHING, [m("reelSpeedPct", L(-10, -7))], 90, "fine", 0.12, ["fish_fast_reel"]),
  N("fish_tangle", "釣り糸のもつれ", FISHING, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("fish_short_cast", "飛距離不足", FISHING, [m("treasurePct", L(-6, -4))], 80, "fine", 0.12, ["fish_long_cast"]),
  N("fish_water_misjudge", "水域の誤認", FISHING, [m("fishingLuckPct", L(-8, -5))], 80, "fine"),
  N("fish_hook_blunt", "釣り針の鈍化", FISHING, [m("fishingLuckPct", L(-7, -5))], 90, "fine"),
  N("fish_brute_reel", "強引な巻き取り", FISHING, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("fish_damp_spool", "湿った糸巻き", FISHING, [m("fishingCooldownPct", L(9, 6))], 80, "fine"),
  N("fish_loot_drift", "戦利品の偏り", FISHING, [m("treasurePct", L(-8, -5))], 80, "fine"),
  N("fish_empty_fatigue", "空釣りの疲労", FISHING, [m("fishingCooldownPct", L(7, 5))], 80, "fine"),
  N("fish_barb", "釣り針の返し", FISHING, [m("moveSpeedPct", L(-6, -4))], 80, "fine"),
  N("fish_reel_noise", "糸巻きのノイズ", FISHING, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("fish_line_wear", "釣り糸の摩耗", FISHING, [m("durabilityMult", L(15, 10))], 90, "fine", 0.12, ["fish_durable_spool"]),
  /* ======================================================================
   * 剪刀负面（§8.16 · 16 条）
   * ====================================================================*/
  N("shear_blunt", "鈍い刃のハサミ", SHEARS, [m("shearSpeedPct", L(-10, -7))], 100, "common", 0.12, ["shear_sharp_blade"]),
  N("shear_nick", "刃こぼれ", SHEARS, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["shear_durable_joint"]),
  N("shear_wool_waste", "羊毛の浪費", SHEARS, [m("shearYieldPct", L(-10, -7))], 90, "fine", 0.12, ["shear_wool_master"]),
  N("shear_leaf_damage", "刃の破損", SHEARS, [m("shearYieldPct", L(-8, -5))], 90, "fine"),
  N("shear_knot", "結び目の引っ掛かり", SHEARS, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("shear_loose_handle", "柄の緩み", SHEARS, [m("durabilityMult", L(15, 10))], 90, "fine"),
  N("shear_fiber_tangle", "繊維の絡まり", SHEARS, [m("shearSpeedPct", L(-8, -5))], 80, "fine"),
  N("shear_low_precision", "精度不足", SHEARS, [m("shearYieldPct", L(-7, -5))], 80, "fine"),
  N("shear_overcut", "刈り過ぎ", SHEARS, [m("shearLossPct", L(10, 7))], 80, "fine"),
  N("shear_fluff_eye", "毛が目を覆う", SHEARS, [m("visionPct", L(8, 5))], 80, "fine"),
  N("shear_high_branch", "高い枝は刈れない", SHEARS, [m("shearYieldPct", L(-6, -4))], 80, "fine"),
  N("shear_rust_joint", "錆びた関節", SHEARS, [m("shearSpeedPct", L(-9, -6))], 80, "fine"),
  N("shear_deflect", "刃の偏り", SHEARS, [m("shearYieldPct", L(-8, -5))], 80, "fine"),
  N("shear_fiber_waste", "繊維の浪費", SHEARS, [m("shearYieldPct", L(-9, -6))], 80, "fine"),
  N("shear_handle_risk", "柄の折損リスク", SHEARS, [m("fractureChance", L(6, 4))], 70, "rare"),
  N("shear_weed_block", "雑草の抵抗", SHEARS, [m("cooldownReducePct", L(-7, -5))], 80, "fine"),
  /* ======================================================================
   * 刷子负面（§8.17 · 16 条）
   * ====================================================================*/
  N("brush_bristle_wear", "刷毛の摩耗", BRUSH, [m("durabilityMult", L(20, 15))], 100, "common", 0.12, ["brush_bristle"]),
  N("brush_loose_handle", "柄の緩み", BRUSH, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("brush_force_loss", "力加減の暴走", BRUSH, [m("brushLuckPct", L(-10, -7))], 90, "fine", 0.12, ["brush_fine"]),
  N("brush_dust_eye", "砂塵が目に入る", BRUSH, [m("visionPct", L(8, 5))], 80, "fine"),
  N("brush_bristle_fall", "刷毛の脱落", BRUSH, [m("brushLuckPct", L(-9, -6))], 90, "fine"),
  N("brush_mis_touch", "考古の誤触", BRUSH, [m("cooldownReducePct", L(-7, -5))], 80, "fine"),
  N("brush_wrist_fatigue", "手首の疲労", BRUSH, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("brush_relic_scratch", "遺物の傷つき", BRUSH, [m("brushLossPct", L(10, 7))], 80, "fine"),
  N("brush_uneven", "刷毛面の凹凸", BRUSH, [m("brushLuckPct", L(-8, -5))], 80, "fine"),
  N("brush_dust_accum", "埃の蓄積", BRUSH, [m("brushSpeedPct", L(-9, -6))], 80, "fine"),
  N("brush_fragile_relic", "脆い遺物", BRUSH, [m("brushLossPct", L(8, 5))], 80, "fine"),
  N("brush_dust_aura", "埃の気配", BRUSH, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("brush_handle_crack", "柄端のひび", BRUSH, [m("brushSpeedPct", L(-10, -7))], 80, "fine"),
  N("brush_over_clean", "清掃し過ぎ", BRUSH, [m("cooldownReducePct", L(-8, -5))], 80, "fine"),
  N("brush_sediment_block", "堆積物の詰まり", BRUSH, [m("brushLuckPct", L(-7, -5))], 80, "fine"),
  N("brush_relic_bias", "遺物の誤認", BRUSH, [m("brushLuckPct", L(-6, -4))], 80, "fine"),
  /* ======================================================================
   * 打火石负面（§8.18 · 16 条）
   * ====================================================================*/
  N("flint_blunt", "火打ち石の鈍化", FLINT, [m("igniteCooldownPct", L(10, 7))], 100, "common", 0.12, ["flint_precise"]),
  N("flint_spark_deflect", "火花の偏り", FLINT, [m("igniteChancePct", L(-10, -7))], 90, "fine", 0.12, ["flint_precise"]),
  N("flint_damp_tinder", "火口の湿気", FLINT, [m("igniteRiskPct", L(10, 7))], 90, "fine"),
  N("flint_low_fuel", "火種不足", FLINT, [m("igniteCooldownPct", L(12, 8))], 90, "fine"),
  N("flint_hot_grip", "柄の過熱", FLINT, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("flint_fragile", "耐久の脆さ", FLINT, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["flint_heat_grip"]),
  N("flint_wild_spark", "制御不能な火の粉", FLINT, [m("igniteRiskPct", L(12, 8))], 80, "fine"),
  N("flint_slow_ignite", "着火の遅延", FLINT, [m("cooldownReducePct", L(-8, -5))], 80, "fine"),
  N("flint_backfire", "炎の逆襲", FLINT, [m("igniteRiskPct", L(14, 9))], 70, "rare"),
  N("flint_fuel_mismatch", "燃料の不一致", FLINT, [m("igniteChancePct", L(-8, -5))], 80, "fine"),
  N("flint_fuel_waste", "火種の浪費", FLINT, [m("fireDurationPct", L(-12, -8))], 80, "fine"),
  N("flint_spark_expose", "火の粉の露出", FLINT, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("flint_overload", "点火の過負荷", FLINT, [m("igniteCooldownPct", L(9, 6))], 80, "fine"),
  N("flint_wet_extinguish", "湿地での消火", FLINT, [m("igniteChancePct", L(-9, -6))], 80, "fine"),
  N("flint_crack", "火打ち石の割れ", FLINT, [m("fractureChance", L(6, 4))], 70, "rare"),
  N("flint_scald", "手の火傷", FLINT, [m("igniteRiskPct", L(11, 7))], 80, "fine"),
  /* ==== 《扩展词条库》负面 333 条（§2） ==== */
  N("xn001", "弱々しい打撃", MELEE, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-001"),
  N("xn002", "鈍重", MELEE, [m("attackSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-002"),
  N("xn003", "重い", MELEE, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-003"),
  N("xn004", "失衡", MELEE, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-004"),
  N("xn005", "疲労コンボ", MELEE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-005"),
  N("xn006", "飢渇", MELEE, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-006"),
  N("xn007", "短気", MELEE, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-007"),
  N("xn008", "反震", MELEE, [m("vengeancePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-008"),
  N("xn009", "溜めの遅延", MELEE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-009"),
  N("xn010", "体勢の崩れ", MELEE, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-010"),
  N("xn011", "伸び過ぎ", MELEE, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-011"),
  N("xn012", "失準", MELEE, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-012"),
  N("xn013", "力を奪われる", MELEE, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-013"),
  N("xn014", "吸血の空白", MELEE, [m("lifesteal", L(-2, -1.2))], 80, "common", 0.12, [], void 0, "N-014"),
  N("xn015", "手への衝撃", MELEE, [m("comboPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-015"),
  N("xn016", "隙", MELEE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-016"),
  N("xn017", "鈍い刃", SWORD, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-017"),
  N("xn018", "刃こぼれ", SWORD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-018"),
  N("xn019", "血錆", SWORD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-019"),
  N("xn020", "刀身が長過ぎ", SWORD, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-020"),
  N("xn021", "逆手が不自由", SWORD, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-021"),
  N("xn022", "斬勢の暴走", SWORD, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-022"),
  N("xn023", "刃鳴り", SWORD, [m("aoePct", L(-5, -3))], 80, "fine", 0.12, [], void 0, "N-023"),
  N("xn024", "刃の跳ね返り", SWORD, [m("thornsPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-024"),
  N("xn025", "暗蝕", SWORD, [m("regenPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-025"),
  N("xn026", "闘気の漏れ", SWORD, [m("aoePct", L(-5, -3))], 80, "fine", 0.12, [], void 0, "N-026"),
  N("xn027", "血溝の詰まり", SWORD, [m("lifesteal", L(-2, -1.2))], 80, "rare", 0.12, [], void 0, "N-027"),
  N("xn028", "刃の脆さ", SWORD, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-028"),
  N("xn029", "柄の滑り", SWORD, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-029"),
  N("xn030", "鍔が邪魔", SWORD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-030"),
  N("xn031", "重心が先端寄り", SWORD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-031"),
  N("xn032", "好戦の呪い", SWORD, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-032"),
  N("xn033", "斧の柄の緩み", AXE, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-033"),
  N("xn034", "斧頭が重過ぎ", AXE, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-034"),
  N("xn035", "伐採の引っ掛かり", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-035"),
  N("xn036", "斬撃の反動", AXE, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-036"),
  N("xn037", "斧刃の割れ", AXE, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-037"),
  N("xn038", "逆手の遅れ", AXE, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-038"),
  N("xn039", "木屑が目に入る", AXE, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-039"),
  N("xn040", "枝の絡まり", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-040"),
  N("xn041", "峰の鈍化", AXE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-041"),
  N("xn042", "斧刃の偏り", AXE, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-042"),
  N("xn043", "柄の折損リスク", AXE, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-043"),
  N("xn044", "伐り過ぎ", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-044"),
  N("xn045", "重心のずれ", AXE, [m("attackPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-045"),
  N("xn046", "両手が塞がる", AXE, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-046"),
  N("xn047", "木材の浪費", AXE, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-047"),
  N("xn048", "伐採後の疲労", AXE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-048"),
  N("xn049", "鈍い先端", PICK, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-049"),
  N("xn050", "岩屑の飛散", PICK, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-050"),
  N("xn051", "鉱脈の撹乱", PICK, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-051"),
  N("xn052", "鉱砂の噛み込み", PICK, [m("miningSpeedPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-052"),
  N("xn053", "ドリルの過熱", PICK, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-053"),
  N("xn054", "噛みやすい岩層", PICK, [m("miningSpeedPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-054"),
  N("xn056", "耐久の過消耗", PICK, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-056"),
  N("xn057", "採掘の遅滞", PICK, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-057"),
  N("xn058", "鉱石の粉砕", PICK, [m("oreDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-058"),
  N("xn059", "脆い鉱石", PICK, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-059"),
  N("xn060", "欲張り採掘", PICK, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-060"),
  N("xn061", "閃光の誤認", PICK, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-061"),
  N("xn062", "深掘りの失衡", PICK, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-062"),
  N("xn063", "坑道崩落リスク", PICK, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-063"),
  N("xn064", "過負荷", PICK, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-064"),
  N("xn065", "シャベル刃の変形", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-065"),
  N("xn066", "粘土の付着", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-066"),
  N("xn067", "砂塵が目に入る", SHOVEL, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-067"),
  N("xn068", "深掘りの暴走", SHOVEL, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-068"),
  N("xn069", "砂利の滑落", SHOVEL, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-069"),
  N("xn070", "土壌の圧密", SHOVEL, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-070"),
  N("xn071", "土の浪費", SHOVEL, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-071"),
  N("xn072", "遅い採掘", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-072"),
  N("xn073", "シャベル柄のひび", SHOVEL, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-073"),
  N("xn074", "硬土特効の無効", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-074"),
  N("xn075", "砂地の漂流", SHOVEL, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-075"),
  N("xn076", "泥の付着", SHOVEL, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-076"),
  N("xn077", "考古の失敗", SHOVEL, [m("archaeologyChance", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-077"),
  N("xn078", "シャベル面が狭い", SHOVEL, [m("aoeBreak", F(1))], 80, "common", 0.12, [], void 0, "N-078"),
  N("xn079", "掘削後の疲労", SHOVEL, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-079"),
  N("xn080", "地層の混同", SHOVEL, [m("treasurePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-080"),
  N("xn081", "板結", HOE, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-081"),
  N("xn082", "種の散逸", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-082"),
  N("xn083", "クワの柄の緩み", HOE, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-083"),
  N("xn084", "作物への誤傷", HOE, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-084"),
  N("xn085", "耕し過ぎ", HOE, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-085"),
  N("xn086", "不毛", HOE, [m("extraDropPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-086"),
  N("xn087", "水分の流失", HOE, [m("harvestPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-087"),
  N("xn088", "成長の遅滞", HOE, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-088"),
  N("xn089", "収穫の断茎", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-089"),
  N("xn090", "雑草の蔓延", HOE, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-090"),
  N("xn091", "施肥し過ぎ", HOE, [m("extraDropPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-091"),
  N("xn092", "種まきのずれ", HOE, [m("autoReplant", F(1))], 80, "common", 0.12, [], void 0, "N-092"),
  N("xn093", "土壌の侵食", HOE, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-093"),
  N("xn094", "作物の枯死", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-094"),
  N("xn095", "収穫の遅延", HOE, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-095"),
  N("xn096", "農作業の疲労", HOE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-096"),
  N("xn097", "弓弦の緩み", BOW, [m("chargedBonusPct", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-097"),
  N("xn098", "弓臂のひび", BOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-098"),
  N("xn099", "引き絞りの遅れ", BOW, [m("attackSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-099"),
  N("xn100", "矢の偏り", BOW, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-100"),
  N("xn101", "矢羽の破損", BOW, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-101"),
  N("xn102", "弦の振動", BOW, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-102"),
  N("xn103", "力の漏れ", BOW, [m("chargedBonusPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-103"),
  N("xn104", "近距離の失準", BOW, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-104"),
  N("xn105", "遠距離の減衰", BOW, [m("snipePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-105"),
  N("xn106", "矢の装填遅滞", BOW, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-106"),
  N("xn107", "弓弦の摩耗", BOW, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-107"),
  N("xn108", "風の偏り", BOW, [m("varianceReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-108"),
  N("xn109", "引き過ぎの反動", BOW, [m("vengeancePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-109"),
  N("xn110", "矢筒の重さ", BOW, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-110"),
  N("xn111", "連射の失速", BOW, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-111"),
  N("xn112", "湿った弓弦", BOW, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-112"),
  N("xn113", "装填の停滞", CROSSBOW, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-113"),
  N("xn114", "機弾バネの摩耗", CROSSBOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-114"),
  N("xn115", "クロスボウの重さ", CROSSBOW, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-115"),
  N("xn116", "弦張りの遅さ", CROSSBOW, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-116"),
  N("xn117", "弩矢の偏り", CROSSBOW, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-117"),
  N("xn118", "連発の散弾", CROSSBOW, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-118"),
  N("xn119", "爆発の反動", CROSSBOW, [m("explosivePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-119"),
  N("xn120", "装填の失敗", CROSSBOW, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-120"),
  N("xn121", "機関の固着", CROSSBOW, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-121"),
  N("xn122", "遠射の失準", CROSSBOW, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-122"),
  N("xn123", "近接の鈍重", CROSSBOW, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-123"),
  N("xn124", "弩弦の脆裂", CROSSBOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-124"),
  N("xn125", "過負荷装填", CROSSBOW, [m("multishotPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-125"),
  N("xn126", "弩矢の浪費", CROSSBOW, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-126"),
  N("xn127", "装填のノイズ", CROSSBOW, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-127"),
  N("xn128", "低温での固着", CROSSBOW, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-128"),
  N("xn129", "投擲の遅滞", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-129"),
  N("xn130", "回流の不発", TRIDENT, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-130"),
  N("xn131", "叉先の鈍化", TRIDENT, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-131"),
  N("xn132", "水外での失衡", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-132"),
  N("xn133", "水中での偏航", TRIDENT, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-133"),
  N("xn134", "雷雨での暴走", TRIDENT, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-134"),
  N("xn135", "潮汐の逆流", TRIDENT, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-135"),
  N("xn136", "回収の震動", TRIDENT, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-136"),
  N("xn137", "深水の引き摺り", TRIDENT, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-137"),
  N("xn138", "三叉刃の欠け", TRIDENT, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-138"),
  N("xn139", "回流の遅延", TRIDENT, [m("cooldownReducePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-139"),
  N("xn140", "投擲の疲労", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-140"),
  N("xn141", "湿気の腐食", TRIDENT, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-141"),
  N("xn142", "遠距離の減衰", TRIDENT, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-142"),
  N("xn143", "近接の反震", TRIDENT, [m("thornsPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-143"),
  N("xn144", "海流の迷い", TRIDENT, [m("waterBreathing", F(1))], 80, "rare", 0.12, [], void 0, "N-144"),
  N("xn145", "ガードの遅滞", SHIELD, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-145"),
  N("xn146", "盾面の亀裂", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-146"),
  N("xn147", "盾の重さ", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-147"),
  N("xn148", "視界の遮り", SHIELD, [m("visionPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-148"),
  N("xn150", "ガードの過消耗", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-150"),
  N("xn151", "盾縁の変形", SHIELD, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-151"),
  N("xn152", "盾の滑り", SHIELD, [m("iceSlip", F(1))], 80, "fine", 0.12, [], void 0, "N-152"),
  N("xn153", "背後への露出", SHIELD, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-153"),
  N("xn154", "完璧ガードの窓が狭い", SHIELD, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-154"),
  N("xn155", "盾撃の失衡", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-155"),
  N("xn156", "ガード後の硬直", SHIELD, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-156"),
  N("xn157", "元素に脆い盾", SHIELD, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-157"),
  N("xn158", "腕甲の締め付け", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-158"),
  N("xn159", "遠距離の衝撃", SHIELD, [m("knockbackPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-159"),
  N("xn160", "ガードの消耗", SHIELD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-160"),
  N("xn161", "蒸し暑さ", HEAD, [m("regenPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-161"),
  N("xn162", "昏沈", HEAD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-162"),
  N("xn163", "酸欠", HEAD, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-163"),
  N("xn164", "感覚鈍麻", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-164"),
  N("xn165", "視野の狭窄", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-165"),
  N("xn166", "ノイズ", HEAD, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-166"),
  N("xn167", "精神疲労", HEAD, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-167"),
  N("xn168", "雷鳴の耳鳴り", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-168"),
  N("xn169", "埃が目を覆う", HEAD, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-169"),
  N("xn170", "夜盲", HEAD, [m("nightVision", F(1))], 80, "fine", 0.12, [], void 0, "N-170"),
  N("xn171", "水蒸気の凝結", HEAD, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-171"),
  N("xn172", "頭部の脆さ", HEAD, [m("defensePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-172"),
  N("xn173", "スタン", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-173"),
  N("xn174", "呪文妨害", HEAD, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-174"),
  N("xn175", "うつむき荷重", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-175"),
  N("xn176", "モブ認識不全", HEAD, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-176"),
  N("xn177", "沈むアーマー", CHEST, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-177"),
  N("xn178", "脆い鎧", CHEST, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-178"),
  N("xn179", "過熱", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-179"),
  N("xn180", "呼吸圧迫", CHEST, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-180"),
  N("xn181", "戦闘外回復低下", CHEST, [m("regenPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-181"),
  N("xn182", "反撃に脆い", CHEST, [m("vengeancePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-182"),
  N("xn183", "元素伝導", CHEST, [m("fireChance", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-183"),
  N("xn184", "脇下の束縛", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-184"),
  N("xn185", "衝撃伝導", CHEST, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-185"),
  N("xn186", "アーマー欠け", CHEST, [m("defensePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-186"),
  N("xn187", "アーマー緩み", CHEST, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-187"),
  N("xn188", "シールド遅滞", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-188"),
  N("xn189", "治療阻害", CHEST, [m("lifesteal", L(-2, -1.2))], 80, "fine", 0.12, [], void 0, "N-189"),
  N("xn190", "背部露出", CHEST, [m("defensePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-190"),
  N("xn191", "耐荷重超過", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-191"),
  N("xn192", "耐久亀裂", CHEST, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-192"),
  N("xn193", "硬直", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-193"),
  N("xn194", "膝部束縛", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-194"),
  N("xn195", "疲弊", LEGS, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-195"),
  N("xn196", "スリップ", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-196"),
  N("xn197", "重心沈下", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-197"),
  N("xn198", "ダッシュ遅延", LEGS, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-198"),
  N("xn199", "走行で空腹", LEGS, [m("maxHealthPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-199"),
  N("xn200", "近接歩幅", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-200"),
  N("xn201", "足首不安定", LEGS, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-201"),
  N("xn202", "潜行ノイズ", LEGS, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-202"),
  N("xn203", "着地後硬直", LEGS, [m("attackSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-203"),
  N("xn204", "環境適応不良", LEGS, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-204"),
  N("xn205", "深水で脚拘束", LEGS, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-205"),
  N("xn206", "坂で失衡", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-206"),
  N("xn207", "摩耗加速", LEGS, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-207"),
  N("xn208", "逃走遅延", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-208"),
  N("xn209", "笨重", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-209"),
  N("xn210", "脆い底", FEET, [m("fallDamagePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-210"),
  N("xn211", "吸水", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-211"),
  N("xn212", "沈底", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-212"),
  N("xn213", "滑り", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-213"),
  N("xn214", "ヒール不安定", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-214"),
  N("xn215", "靴底摩耗", FEET, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-215"),
  N("xn216", "砂利詰まり", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-216"),
  N("xn217", "溶岩伝導", FEET, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-217"),
  N("xn218", "氷上制御不能", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-218"),
  N("xn219", "着地衝撃", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-219"),
  N("xn220", "泥沼粘着", FEET, [m("soulPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-220"),
  N("xn222", "走行スタミナ消費", FEET, [m("maxHealthPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-222"),
  N("xn223", "跳躍遅滞", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-223"),
  N("xn224", "転落脆弱", FEET, [m("fallDamagePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-224"),
  N("xn225", "重鎚の鈍面", MACE, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-225"),
  N("xn226", "溜め遅滞", MACE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-226"),
  N("xn227", "落下撃不正確", MACE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-227"),
  N("xn228", "着地震動", MACE, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-228"),
  N("xn229", "重心過高", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-229"),
  N("xn230", "衝撃反震", MACE, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-230"),
  N("xn231", "柄の亀裂", MACE, [m("attackPct", L(-10, -6))], 80, "fine", 0.12, [], void 0, "N-231"),
  N("xn232", "チャージ漏れ", MACE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-232"),
  N("xn233", "アーマー震動", MACE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-233"),
  N("xn234", "地面反動", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-234"),
  N("xn235", "重撃スタミナ消費", MACE, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-235"),
  N("xn236", "空振り失衡", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-236"),
  N("xn237", "突進依存", MACE, [m("attackPct", L(-10, -6))], 80, "fine", 0.12, [], void 0, "N-237"),
  N("xn238", "鎚面崩壊", MACE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-238"),
  N("xn239", "遅滞リバウンド", MACE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-239"),
  N("xn240", "重鎚ノイズ", MACE, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-240"),
  N("xn241", "穂先の刃こぼれ", SPEAR, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-241"),
  N("xn242", "突進距離不足", SPEAR, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-242"),
  N("xn243", "突進過負荷", SPEAR, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-243"),
  N("xn244", "柄の偏り", SPEAR, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-244"),
  N("xn245", "近すぎて無効", SPEAR, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-245"),
  N("xn246", "遠距離制御難", SPEAR, [m("snipePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-246"),
  N("xn247", "槍持ちが鈍重", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-247"),
  N("xn248", "突きの反震", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-248"),
  N("xn249", "突進スタミナ消費", SPEAR, [m("maxHealthPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-249"),
  N("xn250", "柄の脆裂", SPEAR, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-250"),
  N("xn251", "旋回遅滞", SPEAR, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-251"),
  N("xn252", "騎乗不安定", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-252"),
  N("xn253", "突きの隙", SPEAR, [m("defensePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-253"),
  N("xn254", "刺し過ぎ", SPEAR, [m("piercePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-254"),
  N("xn255", "柄尻の引きずり", SPEAR, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-255"),
  N("xn256", "軍馬不調和", SPEAR, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-256"),
  N("xn257", "糸巻きの固着", FISHING, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-257"),
  N("xn258", "切れやすい釣り糸", FISHING, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-258"),
  N("xn259", "浮きの故障", FISHING, [m("fishingLuckPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-259"),
  N("xn260", "餌の散逸", FISHING, [m("cooldownReducePct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-260"),
  N("xn261", "巻き取りの遅さ", FISHING, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-261"),
  N("xn262", "釣り糸のもつれ", FISHING, [m("rootChance", L(-5, -3))], 80, "rare", 0.12, [], void 0, "N-262"),
  N("xn263", "飛距離不足", FISHING, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-263"),
  N("xn264", "水域の誤認", FISHING, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-264"),
  N("xn265", "釣り針の鈍化", FISHING, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-265"),
  N("xn266", "強引な巻き取り", FISHING, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-266"),
  N("xn267", "湿った糸巻き", FISHING, [m("waterBreathing", F(1))], 80, "rare", 0.12, [], void 0, "N-267"),
  N("xn268", "戦利品の偏り", FISHING, [m("treasurePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-268"),
  N("xn269", "空釣りの疲労", FISHING, [m("fishingLuckPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-269"),
  N("xn270", "釣り針の返し", FISHING, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-270"),
  N("xn271", "糸巻きのノイズ", FISHING, [m("reelSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-271"),
  N("xn272", "釣り糸の摩耗", FISHING, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-272"),
  N("xn273", "鈍い刃のハサミ", SHEARS, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-273"),
  N("xn274", "刃こぼれ", SHEARS, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-274"),
  N("xn275", "羊毛の浪費", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-275"),
  N("xn276", "刃の破損", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-276"),
  N("xn277", "結び目の引っ掛かり", SHEARS, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-277"),
  N("xn278", "柄の緩み", SHEARS, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-278"),
  N("xn279", "繊維の絡まり", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-279"),
  N("xn280", "精度不足", SHEARS, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-280"),
  N("xn281", "刈り過ぎ", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-281"),
  N("xn282", "毛が目を覆う", SHEARS, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-282"),
  N("xn283", "高い枝は刈れない", SHEARS, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-283"),
  N("xn284", "錆びた関節", SHEARS, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-284"),
  N("xn285", "刃の偏り", SHEARS, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-285"),
  N("xn286", "繊維の浪費", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-286"),
  N("xn287", "柄の折損リスク", SHEARS, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-287"),
  N("xn288", "雑草の抵抗", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-288"),
  N("xn289", "刷毛の摩耗", BRUSH, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-289"),
  N("xn290", "柄の緩み", BRUSH, [m("brushLuckPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-290"),
  N("xn291", "力加減の暴走", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-291"),
  N("xn292", "砂塵が目に入る", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-292"),
  N("xn293", "刷毛の脱落", BRUSH, [m("treasurePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-293"),
  N("xn294", "考古の誤触", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-294"),
  N("xn295", "手首の疲労", BRUSH, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-295"),
  N("xn296", "遺物の傷つき", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-296"),
  N("xn297", "刷毛面の凹凸", BRUSH, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-297"),
  N("xn298", "埃の蓄積", BRUSH, [m("brushLuckPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-298"),
  N("xn299", "脆い遺物", BRUSH, [m("defensePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-299"),
  N("xn300", "埃の気配", BRUSH, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-300"),
  N("xn301", "柄端のひび", BRUSH, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-301"),
  N("xn302", "清掃し過ぎ", BRUSH, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-302"),
  N("xn303", "堆積物の詰まり", BRUSH, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-303"),
  N("xn304", "遺物の誤認", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-304"),
  N("xn305", "火打ち石の鈍化", FLINT, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-305"),
  N("xn306", "火花の偏り", FLINT, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-306"),
  N("xn307", "火口の湿気", FLINT, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-307"),
  N("xn308", "火種不足", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-308"),
  N("xn309", "柄の過熱", FLINT, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-309"),
  N("xn310", "耐久の脆さ", FLINT, [m("defensePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-310"),
  N("xn311", "制御不能な火の粉", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-311"),
  N("xn312", "着火の遅延", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-312"),
  N("xn313", "炎の逆襲", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-313"),
  N("xn314", "燃料の不一致", FLINT, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-314"),
  N("xn315", "火種の浪費", FLINT, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-315"),
  N("xn316", "火の粉の露出", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-316"),
  N("xn317", "点火の過負荷", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-317"),
  N("xn318", "湿地での消火", FLINT, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-318"),
  N("xn319", "火打ち石の割れ", FLINT, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-319"),
  N("xn320", "手の火傷", FLINT, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-320"),
  N("xn321", "翼膜の破損", ELYTRA, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-321"),
  N("xn322", "離陸遅滞", ELYTRA, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-322"),
  N("xn323", "気流失衡", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-323"),
  N("xn324", "急降下しすぎ", ELYTRA, [m("fallDamagePct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-324"),
  N("xn325", "揚力不足", ELYTRA, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-325"),
  N("xn326", "折翼リスク", ELYTRA, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-326"),
  N("xn327", "風抵抗過大", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-327"),
  N("xn328", "翼端の亀裂", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-328"),
  N("xn329", "旋回遅鈍", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-329"),
  N("xn330", "離着陸震動", ELYTRA, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-330"),
  N("xn331", "積載過大", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-331"),
  N("xn332", "熱流不快", ELYTRA, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-332"),
  N("xn333", "冷風襲来", ELYTRA, [m("attackPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-333"),
  N("xn334", "翼膜の隙間", ELYTRA, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-334"),
  N("xn335", "気流ノイズ", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-335"),
  N("xn336", "緊急反転失敗", ELYTRA, [m("dodgeChance", L(-4, -2.5))], 80, "rare", 0.12, [], void 0, "N-336"),
  /* ==== 马铠 / 骑乘道具负面 ==== */
  N("horse_heavy_barding", "重装馬鎧", HORSE, [m("moveSpeedPct", L(-10, -7))], 90, "fine"),
  N("horse_rub", "擦り傷", HORSE, [m("durabilityMult", L(18, 12))], 90, "fine"),
  N("horse_loose", "鞍帯の緩み", HORSE, [m("defensePct", L(-8, -5))], 80, "fine"),
  N("horse_spook", "臆病", HORSE, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("horse_stiff", "硬直した背", HORSE, [m("jumpPct", L(-10, -7))], 80, "fine"),
  N("steer_snag", "手綱の引っかかり", STEERING, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("steer_fray", "手綱の摩耗", STEERING, [m("durabilityMult", L(20, 15))], 90, "fine"),
  N("steer_drag", "引きずり", STEERING, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("steer_slip", "取りこぼし", STEERING, [m("accuracyPct", L(-8, -5))], 80, "fine"),
  N("steer_tangle", "絡まり", STEERING, [m("cooldownReducePct", L(-7, -5))], 80, "fine")
];
var DUAL = [
  D("mad_war", "狂戦", MELEE, [m("attackPct", L(25, 17.5)), m("berserkPct", L(30, 24)), m("defensePct", L(-12, -10.75))], 60, "epic"),
  D("glass_cannon", "ガラスの大砲", MELEE, [m("attackPct", L(40, 37.5)), m("critChance", L(8, 7)), m("damageTakenPct", L(20, 18.75))], 40, "legendary"),
  D("titan", "巨神", ARMOR, [m("maxHealthPct", L(20, 18.75)), m("defensePct", L(12, 10.75)), m("moveSpeedPct", L(-8, -7.5)), m("jumpPct", L(-10, -8.75))], 40, "legendary"),
  D("gale_cost", "疾風の代償", MELEE, [m("attackSpeedPct", L(20, 15)), m("durabilityMult", L(20, 18.75))], 60, "epic"),
  D("greed", "強欲", MELEE_TOOLS, [m("extraDropPct", L(10, 10)), m("luckBreakChance", L(5, 4.75))], 60, "epic"),
  D("soul_reap", "魂狩り", MELEE, [m("killStackPct", L(6, 5)), m("idleDecayPct", L(6, 6))], 50, "epic"),
  D("blood_sacrifice", "血の供物", MELEE, [m("lifesteal", L(10, 8)), m("maxHealthPct", L(-12, -10.75))], 50, "epic"),
  D("flame_heart", "烈火の心", MELEE, [m("fireChance", L(20, 15)), m("fireVulnPct", L(15, 13.75))], 50, "epic"),
  D("eternal_frost_dual", "永霜", MELEE, [m("freezeChance", L(6, 5)), m("fireVulnPct", L(12, 12))], 50, "epic"),
  D("thunder_dual", "雷嵐", MELEE, [m("lightningChance", L(8, 6)), m("skillDurabilityCost", L(3, 2.75))], 50, "epic"),
  D("heavy_hammer", "重鎚", MELEE, [m("attackPct", L(30, 22)), m("attackSpeedPct", L(-10, -8.75))], 60, "epic"),
  D("light_blade", "軽刃", MELEE, [m("attackSpeedPct", L(25, 18.75)), m("attackPct", L(-10, -8.75))], 60, "epic"),
  D("gambler", "賭博師", MELEE, [m("gambleCrit", L(15, 12)), m("gambleLossPct", L(10, 8.75))], 50, "epic"),
  D("death_match", "死闘", MELEE, [m("berserkPct", L(35, 26)), m("naturalRegenPct", L(-40, -25))], 50, "epic"),
  D("unyielding_dual", "不屈", ARMOR, [m("lastStandChance", L(12, 9)), m("healingReducePct", L(15, 13.75))], 50, "epic")
];
var SPECIAL = [
  SP("world_tree", "世界樹", ALL, [m("specialWorldTree", F(1)), m("regenFlat", L(0.5, 0.5))], 30, "legendary", 0.2, [], "legendary"),
  SP("heavenly_thunder", "天雷", MELEE, [m("specialHeavenlyThunder", F(1)), m("lightningChance", L(15, 10))], 25, "legendary", 0.2, [], "legendary"),
  SP("blood_moon", "血月", MELEE, [m("specialBloodMoon", F(1)), m("nightPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("sun_glory_special", "日耀", MELEE, [m("specialSunGlory", F(1)), m("dayPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("abyss_special", "深淵", MELEE, [m("specialAbyss", F(1)), m("netherPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("sea_god_special", "海神", TR.concat(SD), [m("specialSeaGod", F(1)), m("waterPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("spacetime", "時空", ARMOR, [m("specialSpacetime", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("immortal_special", "不滅", ALL, [m("uniqueImmortal", F(1))], 20, "mythic", 0.2, [], "legendary"),
  SP("soulbound_special", "魂縛", ALL, [m("uniqueSoulbound", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("soul_harvest", "魂吸収", MELEE, [m("killStackPct", L(10, 8)), m("killHeal", L(2, 1.5))], 25, "legendary", 0.2, [], "legendary"),
  SP("void_walker", "虚空行者", ARMOR, [m("specialVoidWalker", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("destiny", "天命", ALL, [m("specialDestiny", F(1))], 20, "mythic", 0.2, [], "ancient"),
  SP("miracle", "奇跡", ALL, [m("specialMiracle", F(1))], 15, "mythic", 0.25, [], "ancient"),
  SP("reversal", "反転", ARMOR, [m("specialReversal", F(1))], 20, "mythic", 0.2, [], "ancient"),
  SP("endless", "無限", MELEE, [m("specialEndless", F(1))], 15, "mythic", 0.25, [], "ancient")
];
var CURSE = [
  CU(
    "curse_blood_thirst",
    "嗜血の呪い",
    MELEE,
    [m("curseBloodThirst", F(1)), m("comboAtkSpeed", L(10, 8)), m("curseDamagePerMin", L(1, 1))],
    40,
    "epic",
    0.2,
    [],
    "epic",
    "攻撃するほど強くなるが、長時間攻撃しないと体力を失い続ける"
  ),
  CU(
    "curse_greed",
    "強欲の呪い",
    MELEE_TOOLS,
    [m("extraDropPct", L(20, 15)), m("deathPenaltyPct", L(15, 10))],
    40,
    "epic",
    0.2,
    [],
    "epic",
    "ドロップが大幅に増えるが、死亡時に追加ペナルティ"
  ),
  CU(
    "curse_binding",
    "束縛の呪い",
    ARMOR,
    [m("bindingCurse", F(1)), m("defensePct", L(15, 12))],
    35,
    "epic",
    0.2,
    [],
    "epic",
    "防御が上がるが、装備を簡単に外せない"
  ),
  CU(
    "curse_frail",
    "脆命の呪い",
    MELEE,
    [m("attackPct", L(60, 45)), m("maxHealthNegPct", L(30, 20))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "攻撃能力は極めて高いが、体力上限が極めて低い"
  ),
  CU(
    "curse_fury",
    "狂怒の呪い",
    MELEE,
    [m("curseFury", F(1)), m("attackPct", L(25, 20)), m("aggroPct", L(30, 25))],
    35,
    "epic",
    0.2,
    [],
    "epic",
    "自動で戦闘状態に入るが、モブに見つかりやすくなる"
  ),
  CU(
    "curse_eternal_night",
    "永夜の呪い",
    MELEE,
    [m("uniqueEternalNight", F(1)), m("dayPct", L(-30, -20))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "夜は極めて強いが、昼は大きく弱体化"
  ),
  CU(
    "curse_abyss",
    "深淵の呪い",
    MELEE,
    [m("uniqueAbyssHeart", F(1)), m("netherPct", L(-20, -15))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "ネザーでは極めて強いが、主世界では能力低下"
  )
];
var UNIQUE = [
  U("unique_time", "時間", MELEE, [m("uniqueTime", F(1))], 1, "legendary", 0.2, [], void 0, "攻撃後、対象の動作を短時間鈍らせる"),
  U("unique_space", "空間", ARMOR, [m("uniqueSpace", F(1))], 1, "legendary", 0.2, [], void 0, "致命攻撃を受けた時、確率で短距離移動"),
  U("unique_gluttony", "貪食", MELEE, [m("uniqueGluttony", F(1))], 1, "legendary", 0.2, [], void 0, "撃破で体力回復、ただし食料消費が大幅増加"),
  U("unique_eternal_night", "永夜", MELEE, [m("uniqueEternalNight", F(1))], 1, "mythic", 0.2, [], void 0, "夜は力が極めて強いが、昼は大きく弱体化"),
  U("unique_sun_heart", "太陽の心", MELEE, [m("uniqueSunHeart", F(1))], 1, "mythic", 0.2, [], void 0, "昼は極めて強いが、夜は能力低下"),
  U("unique_abyss_heart", "深淵の心", MELEE, [m("uniqueAbyssHeart", F(1))], 1, "mythic", 0.2, [], void 0, "ネザーでは極めて強いが、主世界では能力低下")
];
var ALL_AFFIXES = POSITIVE.concat(NEGATIVE, DUAL, SPECIAL, CURSE, UNIQUE);
var AFFIX_BY_ID = Object.fromEntries(
  ALL_AFFIXES.map((a) => [a.id, a])
);
var ROMAN = ["", "I", "II", "III", "IV", "V"];
function roman(level) {
  return ROMAN[Math.max(1, Math.min(5, Math.round(level)))];
}
var RARITY_ORDER = ["common", "fine", "rare", "epic", "legendary", "mythic"];
var RARITY_NAME = {
  common: "ノーマル",
  fine: "上質",
  rare: "レア",
  epic: "エピック",
  legendary: "レジェンド",
  mythic: "ミシック"
};
var RARITY_VALUE_MULT = {
  common: 1,
  fine: 1.08,
  rare: 1.18,
  epic: 1.32,
  legendary: 1.5,
  mythic: 1.75
};
var RARITY_WEIGHT = {
  common: 62,
  fine: 24,
  rare: 9,
  epic: 3.5,
  legendary: 1.2,
  mythic: 0.3
};
function isMutuallyExclusive(a, b) {
  if (a === b) return true;
  const da = AFFIX_BY_ID[a];
  const db = AFFIX_BY_ID[b];
  if (!da || !db) return false;
  return da.exclusive.includes(b) || db.exclusive.includes(a);
}
function poolFor(kind, group) {
  const src = kind === "positive" ? POSITIVE : kind === "negative" ? NEGATIVE : kind === "dual" ? DUAL : kind === "special" ? SPECIAL : kind === "curse" ? CURSE : UNIQUE;
  return src.filter((a) => a.groups.includes(group));
}
function categoryOf(def) {
  if (def.category) return def.category;
  if (def.kind === "negative") return "負面プール";
  if (def.kind === "dual") return "両刃プール";
  if (def.kind === "curse") return "呪いプール";
  if (def.kind === "unique") return "古代・唯一プール";
  if (def.kind === "special") return "レジェンド・ミシックプール";
  const g = def.groups;
  const stat = def.mods[0]?.stat ?? "";
  const ranged = g.every((x) => x === "bow" || x === "crossbow" || x === "trident");
  if (ranged) return "遠距離プール";
  const toolOnly = g.every((x) => x === "pickaxe" || x === "axe" || x === "shovel" || x === "hoe");
  if (toolOnly) return "ツールプール";
  const armorOnly = g.every((x) => x === "head" || x === "chest" || x === "legs" || x === "feet");
  if (armorOnly) return "アーマープール";
  if (g.includes("shield") && g.length <= 2) return "盾プール";
  const elem = ["fire", "ice", "freeze", "lightning", "thunder", "poison", "chill", "molten", "shock", "corrode", "frost", "storm"];
  if (elem.some((k) => stat.includes(k))) return "元素プール";
  if (stat.includes("crit") || stat.includes("lucky")) return "クリティカルプール";
  if (stat.includes("attackSpeed") || stat.includes("comboAtkSpeed") || stat.includes("burstSpeed")) return "攻撃速度プール";
  if (stat.includes("lifesteal") || stat.includes("killHeal") || stat.includes("Health") || stat.includes("regen") || stat.includes("blood")) return "体力プール";
  if (stat.includes("defense") || stat.includes("Reduce") || stat.includes("shield") || stat.includes("dodge") || stat.includes("thorns") || stat.includes("resist")) return "防御プール";
  if (stat.includes("Speed") || stat.includes("jump") || stat.includes("fall") || stat.includes("swim") || stat.includes("water") || stat.includes("turn") || stat.includes("landing")) return "移動プール";
  if (stat.includes("stun") || stat.includes("slow") || stat.includes("weaken") || stat.includes("root") || stat.includes("fear") || stat.includes("silence") || stat.includes("dispel") || stat.includes("knockback")) return "制御プール";
  if (stat.includes("sweep") || stat.includes("quake") || stat.includes("fissure") || stat.includes("whirlwind") || stat.includes("explode") || stat.includes("chainHit") || stat.includes("stormAoe") || stat.includes("earthSplit")) return "範囲プール";
  if (g.length > 6) return "汎用プール";
  return "武器プール";
}
function poolStructure() {
  const out = {};
  for (const a of ALL_AFFIXES) {
    const c = categoryOf(a);
    out[c] = (out[c] ?? 0) + 1;
  }
  return out;
}
function poolStats() {
  const out = {};
  for (const a of ALL_AFFIXES) out[a.kind] = (out[a.kind] ?? 0) + 1;
  return out;
}

// scripts/data/SpeedTiers.ts
var BASE_COOLDOWN = 0.625;
var SPEED_TIERS = [
  { id: "sluggish", name: "極遅", pct: -30, cooldown: round3(BASE_COOLDOWN / 0.7), color: "\xA74" },
  { id: "slow", name: "遅い", pct: -15, cooldown: round3(BASE_COOLDOWN / 0.85), color: "\xA7c" },
  { id: "dull", name: "やや遅い", pct: -7, cooldown: round3(BASE_COOLDOWN / 0.93), color: "\xA76" },
  { id: "normal", name: "ノーマル", pct: 0, cooldown: BASE_COOLDOWN, color: "\xA7f" },
  { id: "quick", name: "やや速い", pct: 8, cooldown: round3(BASE_COOLDOWN / 1.08), color: "\xA7a" },
  { id: "fast", name: "速い", pct: 18, cooldown: round3(BASE_COOLDOWN / 1.18), color: "\xA7b" },
  { id: "swift", name: "極速", pct: 35, cooldown: round3(BASE_COOLDOWN / 1.35), color: "\xA7d" }
];
function round3(v) {
  return Math.round(v * 1e3) / 1e3;
}
var TIER_BY_ID = Object.fromEntries(SPEED_TIERS.map((t) => [t.id, t]));
var SPEED_NATIVE = false;
function speedTierFor(stats) {
  const pct = (stats.attackSpeedPct ?? 0) + (stats.comboAtkSpeed ?? 0) * 0.5 + (stats.burstSpeedPct ?? 0) * 0.3 + (stats.quickBladePct ?? 0) * 0.5 + (stats.rapidFirePct ?? 0) * 0.3;
  let best = SPEED_TIERS[3];
  let bestDist = Number.MAX_SAFE_INTEGER;
  for (const t of SPEED_TIERS) {
    const d = Math.abs(t.pct - pct);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}
function speedDpsCompensation(tier2) {
  if (SPEED_NATIVE) return 1;
  if (tier2.id === "normal") return 1;
  return 1 + tier2.pct / 100;
}
function nativeTemplate(material, tier2, damage, durability) {
  return {
    format_version: "1.21.100",
    "minecraft:item": {
      description: { identifier: `af:${material}_sword_spd_${tier2.id}`, menu_category: { category: "equipment" } },
      components: {
        "minecraft:icon": { textures: { default: `${material}_sword` } },
        "minecraft:display_name": { value: `item.af:${material}_sword_spd_${tier2.id}.name` },
        "minecraft:max_stack_size": 1,
        "minecraft:hand_equipped": { value: true },
        "minecraft:damage": { value: damage },
        "minecraft:durability": { max_durability: durability, damage_chance: { min: 0, max: 100 } },
        "minecraft:repairable": { repair_items: [{ items: [`minecraft:${material}_sword`], repair_amount: "query.max_durability * 0.25" }] },
        "minecraft:enchantable": { slot: "sword", value: 10 },
        "minecraft:cooldown": { category: "attack", duration: tier2.cooldown, type: "attack" },
        "minecraft:hover_text_color": tier2.color === "\xA7f" ? "white" : "aqua",
        "minecraft:rarity": { value: tier2.pct >= 18 ? "rare" : tier2.pct <= -15 ? "common" : "uncommon" }
      }
    }
  };
}

// scripts/systems/PlayerState.ts
var states = /* @__PURE__ */ new Map();
function getState(id, name = "") {
  let s = states.get(id);
  if (!s) {
    s = {
      id,
      name,
      stats: emptyStats(),
      weaponBaseMult: 1,
      armorBaseMult: 1,
      armor: {},
      resonances: [],
      lastHitTick: -1e4,
      lastVictimId: "",
      comboCount: 0,
      lastHurtTick: -1e4,
      killStacks: 0,
      lastKillTick: -1e4,
      bloodPool: 0,
      activeEffects: {},
      suppressUntilTick: -1,
      lastMineTick: -1e4,
      mineCount: 0,
      lastStandUsedTick: -1e4,
      blinkReadyTick: 0,
      generated: 0,
      unhandledProcs: 0,
      pos: { x: 0, y: 0, z: 0 },
      dimId: "minecraft:overworld",
      night: false,
      healthRatio: 1,
      health: 20,
      maxHealth: 20,
      enemyCount: 0,
      nearbyPlayers: 0,
      inWater: false
    };
    states.set(id, s);
  }
  if (name) s.name = name;
  return s;
}

// scripts/systems/EquipmentService.ts
import { EquipmentSlot } from "@minecraft/server";

// scripts/domain/Types.ts
var DATA_VERSION = 2;
var DYNPROP_KEY = "kira:af_data";
var DYNPROP_KEY_LEGACY = "af:data";
var LORE_MARKER = "\xA78[af1]";

// scripts/data/Qualities.ts
var QUALITIES = [
  {
    id: "poor",
    name: "粗悪",
    color: "\xA78",
    weight: 1200,
    baseMult: [0.5, 0.75],
    pos: [0, 1],
    neg: [1, 3],
    posLv: [1, 1],
    negLv: [1, 3],
    risk: [20, 60],
    rarityBias: {},
    dualChance: 0,
    specialChance: 0,
    curseChance: 0,
    uniqueChance: 0,
    unidentifiedChance: 0,
    scoreBase: 40
  },
  {
    id: "broken",
    name: "破損",
    color: "\xA77",
    weight: 1500,
    baseMult: [0.7, 0.9],
    pos: [0, 1],
    neg: [1, 2],
    posLv: [1, 2],
    negLv: [1, 2],
    risk: [12, 45],
    rarityBias: {},
    dualChance: 0,
    specialChance: 0,
    curseChance: 0,
    uniqueChance: 0,
    unidentifiedChance: 0,
    scoreBase: 70
  },
  {
    id: "common",
    name: "ノーマル",
    color: "\xA7f",
    weight: 2600,
    baseMult: [0.95, 1.05],
    pos: [0, 1],
    neg: [0, 1],
    posLv: [1, 2],
    negLv: [1, 1],
    risk: [0, 10],
    rarityBias: {},
    dualChance: 0.01,
    specialChance: 0,
    curseChance: 0,
    uniqueChance: 0,
    unidentifiedChance: 0,
    scoreBase: 110
  },
  {
    id: "fine",
    name: "優秀",
    color: "\xA7a",
    weight: 1900,
    baseMult: [1.05, 1.2],
    pos: [1, 2],
    neg: [0, 1],
    posLv: [1, 2],
    negLv: [1, 1],
    risk: [0, 20],
    rarityBias: { fine: 4 },
    dualChance: 0.02,
    specialChance: 0,
    curseChance: 0,
    uniqueChance: 1e-3,
    unidentifiedChance: 0,
    scoreBase: 150
  },
  {
    id: "rare",
    name: "レア",
    color: "\xA7b",
    weight: 1500,
    baseMult: [1.15, 1.35],
    pos: [1, 3],
    neg: [0, 2],
    posLv: [1, 3],
    negLv: [1, 2],
    risk: [5, 25],
    rarityBias: { fine: 8, rare: 4 },
    dualChance: 0.04,
    specialChance: 0,
    curseChance: 0,
    uniqueChance: 2e-3,
    unidentifiedChance: 0.05,
    scoreBase: 200
  },
  {
    id: "epic",
    name: "エピック",
    color: "\xA7d",
    weight: 800,
    baseMult: [1.3, 1.55],
    pos: [2, 4],
    neg: [0, 3],
    posLv: [2, 3],
    negLv: [1, 2],
    risk: [10, 40],
    rarityBias: { fine: 10, rare: 8, epic: 3 },
    dualChance: 0.07,
    specialChance: 0,
    curseChance: 0.02,
    uniqueChance: 5e-3,
    unidentifiedChance: 0.15,
    scoreBase: 260
  },
  {
    id: "legendary",
    name: "レジェンド",
    color: "\xA76",
    weight: 320,
    baseMult: [1.5, 1.85],
    pos: [3, 5],
    neg: [1, 3],
    posLv: [2, 4],
    negLv: [1, 3],
    risk: [20, 60],
    rarityBias: { rare: 12, epic: 8, legendary: 2 },
    dualChance: 0.1,
    specialChance: 0.06,
    curseChance: 0.05,
    uniqueChance: 0.01,
    unidentifiedChance: 0.3,
    scoreBase: 330
  },
  {
    id: "mythic",
    name: "ミシック",
    color: "\xA7c",
    weight: 120,
    baseMult: [1.8, 2.35],
    pos: [3, 6],
    neg: [1, 4],
    posLv: [3, 5],
    negLv: [2, 4],
    risk: [20, 90],
    rarityBias: { rare: 12, epic: 12, legendary: 6, mythic: 1 },
    dualChance: 0.14,
    specialChance: 0.12,
    curseChance: 0.08,
    uniqueChance: 0.02,
    unidentifiedChance: 0.55,
    scoreBase: 400
  },
  {
    id: "ancient",
    name: "古代",
    color: "\xA75",
    weight: 40,
    baseMult: [2.2, 2.8],
    pos: [4, 7],
    neg: [2, 5],
    posLv: [4, 5],
    negLv: [2, 4],
    risk: [35, 95],
    rarityBias: { epic: 15, legendary: 12, mythic: 4 },
    dualChance: 0.2,
    specialChance: 0.2,
    curseChance: 0.12,
    uniqueChance: 0.04,
    unidentifiedChance: 0.75,
    scoreBase: 480
  },
  {
    id: "unique",
    name: "唯一",
    color: "\xA74",
    weight: 20,
    // §38：唯一不受普通规则限制
    baseMult: [2.6, 3.4],
    pos: [4, 8],
    neg: [2, 6],
    posLv: [4, 5],
    negLv: [3, 5],
    risk: [45, 100],
    rarityBias: { legendary: 18, mythic: 8 },
    dualChance: 0.28,
    specialChance: 0.35,
    curseChance: 0.18,
    uniqueChance: 0.35,
    unidentifiedChance: 0.9,
    scoreBase: 560
  }
];
var QUALITY_BY_ID = Object.fromEntries(
  QUALITIES.map((q) => [q.id, q])
);
var QUALITY_WEIGHTS = QUALITIES.map((q) => q.weight);
function qualityRank(id) {
  return QUALITIES.findIndex((q) => q.id === id);
}

// scripts/domain/Resonance.ts
var RESONANCES = [
  {
    id: "war_god",
    name: "戦神の共鳴",
    kind: "armor",
    desc: "近接ダメージ +12%",
    armor: {
      head: ["monster_lore", "breaker", "suppress"],
      chest: ["vengeance_heart", "heavy_armor", "warrior_legs"],
      legs: ["war_will", "warrior_legs", "persistence"],
      feet: ["chase_wind", "flash_raid", "boots_escape"]
    },
    effects: { meleePct: 12 }
  },
  {
    id: "hunter",
    name: "狩人の共鳴",
    kind: "armor",
    desc: "遠距離ダメージ +12%、移動速度 +8%",
    armor: {
      head: ["insight", "danger_sense", "undead_sense", "night_vision"],
      chest: ["vengeance_heart", "guard_heart_chest"],
      legs: ["feral", "war_will"],
      feet: ["boots_swift", "boots_dash", "boots_wind", "boots_escape"]
    },
    effects: { bowDamagePct: 12, moveSpeedPct: 8 }
  },
  {
    id: "berserk",
    name: "狂戦の共鳴",
    kind: "armor",
    desc: "低体力時に絶大な強化（狂乱 +20%、吸血 +5%）",
    armor: {
      head: ["dizzy", "dull_senses", "mental_fatigue"],
      chest: ["vengeance_heart", "guard_heart_chest"],
      legs: ["feral", "war_will", "unyielding"],
      feet: ["boots_escape", "boots_swift"]
    },
    effects: { berserkPct: 20, lifesteal: 5, healingReducePct: 10 }
  },
  {
    id: "guard",
    name: "守護の共鳴",
    kind: "armor",
    desc: "追加 6% の全体ダメージ軽減",
    armor: {
      head: ["steadfast", "will", "spirit", "reflect"],
      chest: ["chest_bulwark", "chest_iron_wall", "shield", "chest_absorb", "guard_heart"],
      legs: ["legs_tough", "life_link", "recovery", "persistence"],
      feet: ["boots_feather", "dodge", "boots_swift"]
    },
    effects: { defensePct: 6 }
  },
  {
    id: "thorns",
    name: "棘の共鳴",
    kind: "armor",
    desc: "近接攻撃を受けると継続反撃（棘 +15%）",
    armor: {
      head: ["reflect", "steadfast"],
      chest: ["thorns", "chest_bulwark"],
      legs: ["legs_tough", "persistence", "life_link"],
      feet: ["thin_sole", "friction", "clumsy_boots"]
    },
    effects: { thornsPct: 15 }
  },
  {
    id: "wind",
    name: "風行の共鳴",
    kind: "armor",
    desc: "移動速度 +12%、ダッシュ速度 +10%",
    armor: {
      head: ["insight", "danger_sense"],
      chest: ["deflect"],
      legs: ["feral", "body"],
      feet: ["boots_swift", "boots_dash", "boots_wind", "light", "light_foot"]
    },
    effects: { moveSpeedPct: 12, sprintSpeedPct: 10 }
  },
  {
    id: "miner",
    name: "鉱夫の共鳴",
    kind: "tool",
    desc: "鉱夫の特殊効果を獲得（採掘速度 +20%、鉱物ドロップ +15%）",
    tool: { groups: ["pickaxe"], affixes: ["swift_dig", "ore_vein", "lucky_miner", "fortune", "chain_mine", "treasure"], need: 3 },
    effects: { miningSpeedPct: 20, oreDropPct: 15 }
  },
  {
    id: "harvest_res",
    name: "豊作の共鳴",
    kind: "tool",
    desc: "農業生産を大幅に増加（農作物 +25%、追加ドロップ +15%）",
    tool: { groups: ["hoe"], affixes: ["harvest", "lucky_farmer", "lush", "shennong", "abundant", "seed_master"], need: 3 },
    effects: { harvestPct: 25, extraDropPct: 15 }
  }
];
function affixIds(spec) {
  if (!spec) return [];
  return [
    ...spec.pos.map((a) => a.id),
    ...spec.neg.map((a) => a.id),
    ...spec.dual.map((a) => a.id),
    ...spec.special.map((a) => a.id),
    ...spec.curse.map((a) => a.id),
    ...spec.unique.map((a) => a.id)
  ];
}
function computeArmorResonances(set) {
  const slots = {
    head: affixIds(set.head),
    chest: affixIds(set.chest),
    legs: affixIds(set.legs),
    feet: affixIds(set.feet)
  };
  const out = [];
  for (const def of RESONANCES) {
    if (def.kind !== "armor" || !def.armor) continue;
    const ok = ["head", "chest", "legs", "feet"].every((slot) => {
      const req = def.armor?.[slot];
      if (!req || !req.length) return true;
      return slots[slot].some((i) => req.includes(i));
    });
    if (ok) out.push({ def, effects: { ...def.effects } });
  }
  return out;
}
function computeToolResonances(spec) {
  if (!spec) return [];
  const ids = affixIds(spec);
  const out = [];
  for (const def of RESONANCES) {
    if (def.kind !== "tool" || !def.tool) continue;
    if (!def.tool.groups.includes(spec.group)) continue;
    const hit = def.tool.affixes.filter((a) => ids.includes(a)).length;
    if (hit >= def.tool.need) out.push({ def, effects: { ...def.effects } });
  }
  return out;
}
function applyResonances(target, active) {
  for (const r of active) {
    for (const k of Object.keys(r.effects)) {
      target[k] = (target[k] ?? 0) + r.effects[k];
    }
  }
}

// scripts/domain/Synergy.ts
var SYNERGY_LEVEL_SCORE = {
  perfect: 1,
  high: 0.8,
  normal: 0.5,
  conflict: 0
};
var SYNERGY_LEVEL_NAME = {
  perfect: "極高",
  high: "高",
  normal: "ノーマル",
  conflict: "衝突"
};
var SYNERGY_PAIRS = [
  // ---------------- 极高 ----------------
  { a: "crit", b: "lethal", level: "perfect", note: "クリティカル + 致命" },
  { a: "crit", b: "precise", level: "perfect", note: "クリティカル + 精密" },
  { a: "lifesteal", b: "berserk", level: "perfect", note: "吸血 + 狂乱" },
  { a: "lifesteal", b: "mad_war", level: "perfect", note: "吸血 + 狂戦" },
  { a: "swift", b: "chain_slash", level: "perfect", note: "神速 + 連斬" },
  { a: "swift", b: "combo", level: "high", note: "神速 + コンボ" },
  { a: "fireChance", b: "blazing", level: "perfect", note: "着火 + 灼熱" },
  { a: "scorch", b: "blazing", level: "perfect", note: "灼熱 + 烈火" },
  { a: "chill", b: "ice_burst", level: "perfect", note: "凍結 + 氷爆" },
  { a: "freeze", b: "ice_burst", level: "perfect", note: "氷結 + 氷爆" },
  { a: "thunder", b: "chain_lightning", level: "perfect", note: "雷鳴 + 連鎖雷" },
  { a: "poison_blade", b: "poison_burst", level: "perfect", note: "毒刃 + 毒爆" },
  { a: "poison_blade", b: "strong_poison", level: "high", note: "毒刃 + 強毒" },
  { a: "execute", b: "behead", level: "perfect", note: "処刑 + 斬首" },
  { a: "execute", b: "lethal_pursuit", level: "high", note: "処刑 + 致命追撃" },
  { a: "berserk", b: "mad_war", level: "perfect", note: "狂乱 + 狂戦" },
  { a: "berserk", b: "tough", level: "high", note: "狂乱 + 堅忍（レアな極端組合せ）" },
  { a: "berserk", b: "life", level: "high", note: "狂乱 + 体力" },
  { a: "thorns", b: "bulwark", level: "perfect", note: "棘 + 堅壁" },
  { a: "thorns", b: "thorn_shield", level: "perfect", note: "棘 + 棘の盾" },
  { a: "dodge", b: "boots_swift", level: "high", note: "回避 + 疾歩" },
  { a: "chain_mine", b: "ore_vein", level: "perfect", note: "連鎖採掘 + 鉱脈" },
  { a: "chain_mine", b: "lucky_miner", level: "high", note: "連鎖採掘 + 幸運の鉱夫" },
  { a: "harvest", b: "lucky_farmer", level: "perfect", note: "豊作 + 幸運の農夫" },
  { a: "harvest", b: "lush", level: "high", note: "豊作 + 繁茂" },
  { a: "tree_feller", b: "lumber", level: "perfect", note: "伐倒 + 木こり" },
  { a: "multi_shot", b: "split_arrow", level: "perfect", note: "多重矢 + 分裂" },
  { a: "strong_bow", b: "sniper", level: "high", note: "強弓 + 狙撃" },
  { a: "heavy_crossbow", b: "armor_pierce", level: "high", note: "重クロスボウ + 貫通" },
  { a: "sea_god", b: "deep_hunter", level: "high", note: "海神 + 深海の狩人" },
  { a: "shield_bash", b: "counter", level: "perfect", note: "盾撃 + 反撃" },
  { a: "guard", b: "rebound", level: "high", note: "守護 + 反震" },
  { a: "sweep", b: "quake", level: "high", note: "薙ぎ払い + 地響き" },
  { a: "night_hunt", b: "blood_moon", level: "perfect", note: "夜狩り + 血の月" },
  { a: "sun_glory", b: "sun_glory_special", level: "perfect", note: "陽光 + 陽光（特殊）" },
  { a: "abyss", b: "abyss_special", level: "perfect", note: "深淵 + 深淵（特殊）" },
  { a: "indestructible", b: "solid", level: "high", note: "不壊 + 堅固" },
  { a: "lifesteal", b: "blood_sacrifice", level: "high", note: "吸血 + 血の儀式" },
  // ---------------- 冲突 ----------------
  { a: "light", b: "heavy", level: "conflict", note: "軽量 + 重量" },
  { a: "light", b: "clumsy", level: "conflict", note: "軽量 + 鈍重" },
  { a: "agile", b: "dull", level: "conflict", note: "軽快 + 鈍化" },
  { a: "swift", b: "heavy", level: "conflict", note: "迅速 + 重量" },
  { a: "extreme_speed", b: "sluggish", level: "conflict", note: "超速 + 鈍足" },
  { a: "solid", b: "fragile", level: "conflict", note: "堅固 + 脆弱" },
  { a: "solid", b: "brittle", level: "conflict", note: "堅固 + 亀裂" },
  { a: "lifesteal", b: "curse_frail", level: "conflict", note: "吸血 + 死の呪い" },
  { a: "life", b: "curse_frail", level: "conflict", note: "体力 + 死の呪い" },
  { a: "night_hunt", b: "day_walk", level: "conflict", note: "夜狩り + 日中" },
  { a: "nightVision", b: "dizzy", level: "conflict", note: "暗視 + 朦朧" },
  { a: "regeneration", b: "regen_block", level: "conflict", note: "再生 + 再生障害" },
  { a: "auto_replant", b: "late_plant", level: "conflict", note: "自動植え直し + 遅植え" },
  { a: "heavy_armor", b: "boots_swift", level: "conflict", note: "重甲 + 疾走" },
  { a: "chain_mine", b: "slow_dig", level: "conflict", note: "連鎖採掘 + 遅滞" },
  { a: "swift", b: "charge_up", level: "conflict", note: "迅速 + チャージ遅滞" },
  { a: "crit", b: "blunt_sense", level: "conflict", note: "クリティカル + 鈍感" },
  { a: "life", b: "frail_body", level: "conflict", note: "体力 + 虚弱体質" },
  { a: "night_walk", b: "day_walk", level: "conflict", note: "夜行 + 日中" },
  { a: "fast_till", b: "hardened", level: "conflict", note: "高速耕作 + 硬化" },
  { a: "swift_dig", b: "slow_dig", level: "conflict", note: "速掘 + 遅滞" },
  { a: "strong_bow", b: "misaim", level: "conflict", note: "強弓 + 失準" },
  { a: "heavy_armor", b: "boots_swift", level: "conflict", note: "重甲 + 疾走" }
];
var PAIR_INDEX = /* @__PURE__ */ new Map();
for (const p of SYNERGY_PAIRS) {
  PAIR_INDEX.set(p.a + "|" + p.b, p);
  PAIR_INDEX.set(p.b + "|" + p.a, p);
}
function computeSynergy(ids) {
  const uniq = [...new Set(ids)].filter((id) => AFFIX_BY_ID[id]);
  const perfect = [];
  const high = [];
  const conflicts = [];
  if (uniq.length < 2) {
    return { score: 0.5, level: "normal", perfect, high, conflicts };
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < uniq.length; i++) {
    for (let j = i + 1; j < uniq.length; j++) {
      const pair = PAIR_INDEX.get(uniq[i] + "|" + uniq[j]);
      const level2 = pair ? pair.level : "normal";
      sum += SYNERGY_LEVEL_SCORE[level2];
      n++;
      if (level2 === "perfect") perfect.push(pair?.note ?? `${uniq[i]}+${uniq[j]}`);
      else if (level2 === "high") high.push(pair?.note ?? `${uniq[i]}+${uniq[j]}`);
      else if (level2 === "conflict") conflicts.push(pair?.note ?? `${uniq[i]}+${uniq[j]}`);
    }
  }
  const score = n > 0 ? sum / n : 0.5;
  const level = conflicts.length > 0 ? "conflict" : score >= 0.85 ? "perfect" : score >= 0.65 ? "high" : "normal";
  return { score: Math.round(score * 100) / 100, level, perfect, high, conflicts };
}

// scripts/core/Rng.ts
function makeRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = s + 1831565813 >>> 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const int = (min, max) => {
    if (max < min) return min;
    return min + Math.floor(next() * (max - min + 1));
  };
  return {
    next,
    int,
    range: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick(items, weights) {
      if (!items.length) return void 0;
      let total = 0;
      for (let i = 0; i < items.length; i++) total += Math.max(0, weights[i] ?? 0);
      if (total <= 0) return items[Math.floor(next() * items.length)];
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= Math.max(0, weights[i] ?? 0);
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    sample(items, n) {
      const pool = items.slice();
      const out = [];
      while (out.length < n && pool.length) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      }
      return out;
    },
    seed: () => s >>> 0
  };
}
var seedCounter = 0;
function nextSeed() {
  seedCounter = seedCounter + 2654435769 >>> 0;
  let time = 0;
  try {
    time = Math.floor(worldTime());
  } catch {
    time = 0;
  }
  return (time ^ seedCounter ^ 1542469173) >>> 0;
}
function worldTime() {
  return Date.now() & 4294967295;
}

// scripts/data/QualityTables.ts
var DEFAULT_QUALITY_TABLE = {
  poor: 800,
  broken: 1200,
  common: 3200,
  fine: 2200,
  rare: 1400,
  epic: 700,
  legendary: 350,
  mythic: 120,
  ancient: 29,
  unique: 1
};
var SOURCE_QUALITY_TABLE = {
  crafting: DEFAULT_QUALITY_TABLE,
  // §4.1 普通怪物装备掉落
  mob_loot: {
    poor: 1500,
    broken: 2e3,
    common: 3400,
    fine: 1800,
    rare: 800,
    epic: 350,
    legendary: 120,
    mythic: 25,
    ancient: 4.9,
    unique: 0.1
  },
  // §4.2 精英怪 / 小 Boss
  elite_loot: {
    poor: 300,
    broken: 700,
    common: 2e3,
    fine: 2300,
    rare: 2e3,
    epic: 1400,
    legendary: 800,
    mythic: 350,
    ancient: 140,
    unique: 10
  },
  // §4.3 Boss（文档建议把唯一候选从 1% 降到 0.1%）
  boss_loot: {
    poor: 50,
    broken: 150,
    common: 800,
    fine: 1500,
    rare: 2e3,
    epic: 2e3,
    legendary: 1700,
    mythic: 1200,
    ancient: 590,
    unique: 10
  },
  // §4.4 普通自然结构宝箱
  chest_normal: {
    poor: 800,
    broken: 1200,
    common: 2800,
    fine: 2200,
    rare: 1500,
    epic: 800,
    legendary: 400,
    mythic: 200,
    ancient: 90,
    unique: 10
  },
  // §4.5 高阶结构宝箱
  chest_high: {
    poor: 100,
    broken: 300,
    common: 1e3,
    fine: 1800,
    rare: 2e3,
    epic: 2e3,
    legendary: 1500,
    mythic: 800,
    ancient: 400,
    unique: 100
  },
  // §4.6 钓鱼
  fishing: {
    poor: 1e3,
    broken: 1500,
    common: 3500,
    fine: 2200,
    rare: 1e3,
    epic: 500,
    legendary: 200,
    mythic: 70,
    ancient: 29,
    unique: 1
  },
  // §4.7 任务 / 奖励（默认同工作台）
  reward: DEFAULT_QUALITY_TABLE
};
var POS_COUNT = {
  poor: { 0: 35, 1: 65 },
  broken: { 0: 15, 1: 60, 2: 25 },
  common: { 1: 60, 2: 35, 3: 5 },
  fine: { 1: 30, 2: 55, 3: 15 },
  rare: { 2: 40, 3: 50, 4: 10 },
  epic: { 2: 20, 3: 50, 4: 25, 5: 5 },
  legendary: { 3: 30, 4: 45, 5: 20, 6: 5 },
  mythic: { 3: 20, 4: 35, 5: 30, 6: 15 },
  ancient: { 4: 15, 5: 35, 6: 30, 7: 20 },
  unique: { 4: 40, 5: 35, 6: 25 }
  // 文档：唯一按模板，这里给个合理默认
};
var NEG_COUNT = {
  poor: { 2: 35, 3: 50, 4: 15 },
  broken: { 1: 30, 2: 50, 3: 20 },
  common: { 0: 65, 1: 30, 2: 5 },
  fine: { 0: 60, 1: 35, 2: 5 },
  rare: { 1: 60, 2: 35, 3: 5 },
  epic: { 1: 45, 2: 45, 3: 10 },
  legendary: { 1: 30, 2: 50, 3: 20 },
  mythic: { 0: 5, 1: 20, 2: 35, 3: 30, 4: 10 },
  ancient: { 2: 20, 3: 40, 4: 30, 5: 10 },
  unique: { 1: 30, 2: 40, 3: 30 }
};
var NEG_PRESENCE = {
  poor: 1,
  broken: 1,
  common: 1,
  fine: 1,
  rare: 1,
  epic: 1,
  legendary: 1,
  mythic: 1,
  ancient: 1,
  unique: 1
};
var MAX_AFFIX_LEVEL = {
  poor: 2,
  broken: 3,
  common: 3,
  fine: 4,
  rare: 4,
  epic: 5,
  legendary: 5,
  mythic: 6,
  ancient: 7,
  unique: 7
};
var DUAL_CHANCE = {
  poor: 0.02,
  broken: 0.04,
  common: 0.05,
  fine: 0.08,
  rare: 0.15,
  epic: 0.25,
  legendary: 0.35,
  mythic: 0.45,
  ancient: 0.55,
  unique: 0.3
};
var LEVEL_WEIGHT = {
  1: 50,
  2: 25,
  3: 14,
  4: 7,
  5: 3,
  6: 0.8,
  7: 0.2
};
var MATERIAL_MAX_LEVEL = {
  0: 3,
  // 木 / 皮革
  1: 4,
  // 石 / 金 / 锁链 / 铜
  2: 4,
  // 铁
  3: 5,
  // 钻石
  4: 5
  // 下界合金
};
var CAPS = {
  critChance: 50,
  // 暴击率总计上限 %
  critMultiplier: 2.5,
  // 暴击倍率上限
  lifesteal: 20,
  // 吸血率上限 %
  moveSpeedUp: 35,
  // 额外移动速度上限 %
  moveSpeedDown: -40,
  // 移动惩罚下限 %
  damageReduction: 25,
  // 额外减伤层上限 %
  vulnerability: 35,
  // 额外易伤层上限 %
  chainBreakNormal: 9,
  // 普通词条连锁破坏上限
  chainBreakEpic: 25
  // 史诗以上连锁破坏上限
};
function clampCapped(stat, value) {
  switch (stat) {
    case "critChance":
      return Math.max(0, Math.min(CAPS.critChance, value));
    case "lifesteal":
      return Math.max(0, Math.min(CAPS.lifesteal, value));
    case "moveSpeedPct":
      return Math.max(CAPS.moveSpeedDown, Math.min(CAPS.moveSpeedUp, value));
    case "critDamage":
      return Math.max(0, Math.min((CAPS.critMultiplier - 1) * 100, value));
    default:
      return value;
  }
}
var QUALITY_ARMOR_DEFENSE = {
  poor: 6,
  // 受到伤害 +6%
  broken: 3,
  // +3%
  common: 0,
  // 0%
  fine: -1,
  // -1%
  rare: -2,
  // -2%
  epic: -3.5,
  // -3.5%
  legendary: -5,
  // -5%
  mythic: -6.5,
  // -6.5%
  ancient: -8,
  // -8%
  unique: -8
  // 唯一按模板，这里给远古同档
};
function pickWeighted(rng, table) {
  const raw = Object.keys(table);
  if (!raw.length) return void 0;
  const numeric = raw.every((k) => /^-?\d+$/.test(k));
  let total = 0;
  for (const k of raw) total += Math.max(0, table[k] ?? 0);
  if (total <= 0) return void 0;
  let r = rng() * total;
  let hit = raw[raw.length - 1];
  for (const k of raw) {
    r -= Math.max(0, table[k] ?? 0);
    if (r <= 0) {
      hit = k;
      break;
    }
  }
  return numeric ? Number(hit) : hit;
}

// scripts/data/Tiers.ts
var TIER_ORDER = [
  "poor",
  "broken",
  "common",
  "fine",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "ancient",
  "unique"
];
var TIERS = {
  trash: { id: "trash", label: "廃墟", range: ["poor", "common"] },
  normal: { id: "normal", label: "ノーマル", range: ["common", "fine"] },
  elite: { id: "elite", label: "エリート", range: ["fine", "epic"] },
  rare: { id: "rare", label: "レア", range: ["rare", "legendary"] },
  boss: { id: "boss", label: "ボス", range: ["epic", "mythic"] },
  deep: { id: "deep", label: "深層", range: ["fine", "epic"] },
  nether: { id: "nether", label: "ネザー", range: ["rare", "legendary"] },
  end: { id: "end", label: "エンド", range: ["epic", "legendary"] },
  ancient: { id: "ancient", label: "古代", range: ["epic", "mythic"] }
};
var BOSSES = /* @__PURE__ */ new Set([
  "minecraft:ender_dragon",
  "minecraft:wither",
  "minecraft:warden",
  "minecraft:elder_guardian"
]);
var RARE_MOBS = /* @__PURE__ */ new Set([
  "minecraft:enderman",
  "minecraft:blaze",
  "minecraft:witch",
  "minecraft:piglin_brute",
  "minecraft:ravager",
  "minecraft:evoker",
  "minecraft:vindicator",
  "minecraft:guardian",
  "minecraft:shulker",
  "minecraft:ghast",
  "minecraft:magma_cube",
  "minecraft:hoglin",
  "minecraft:zoglin",
  "minecraft:wither_skeleton",
  "minecraft:stray",
  "minecraft:phantom",
  "minecraft:pillager",
  "minecraft:illusioner",
  "minecraft:creaking",
  "minecraft:breeze"
]);
function classifyMob(typeId, equipped = false) {
  if (BOSSES.has(typeId)) return TIERS.boss;
  if (RARE_MOBS.has(typeId)) return TIERS.rare;
  if (equipped) return TIERS.elite;
  return TIERS.normal;
}
function classifyChest(dimensionId2, y, lootSource) {
  if (lootSource) {
    const key2 = lootSource.toLowerCase();
    if (key2 === "ancient_city" || key2 === "ancient") return TIERS.ancient;
    if (key2 === "end_city" || key2 === "end") return TIERS.end;
    if (key2 === "nether_fortress" || key2 === "bastion" || key2 === "nether") return TIERS.nether;
    if (key2 === "mineshaft" || key2 === "deep") return TIERS.deep;
    if (key2 === "boss" || key2 === "stronghold") return TIERS.boss;
    if (key2 === "dungeon" || key2 === "temple" || key2 === "ruin") return TIERS.normal;
  }
  if (dimensionId2.includes("nether")) return TIERS.nether;
  if (dimensionId2.includes("the_end")) return TIERS.end;
  if (y <= -30) return TIERS.ancient;
  if (y <= 0) return TIERS.deep;
  return TIERS.normal;
}
function rangeToQualityIds(range) {
  const lo = TIER_ORDER.indexOf(range[0]);
  const hi = TIER_ORDER.indexOf(range[1]);
  if (lo < 0 || hi < 0) return [];
  return TIER_ORDER.slice(lo, hi + 1);
}

// scripts/item/Classifier.ts
var EQUIP_KINDS = [
  "sword",
  "axe",
  "pickaxe",
  "shovel",
  "hoe",
  "spear",
  "mace",
  "fishing_rod",
  "shears",
  "brush",
  "flint_and_steel",
  "horse_armor",
  "steering",
  "bow",
  "crossbow",
  "trident",
  "shield",
  "helmet",
  "chestplate",
  "leggings",
  "boots"
];
var MATERIALS = [
  { prefix: "wooden", tier: 0, name: "木" },
  { prefix: "leather", tier: 0, name: "革" },
  { prefix: "stone", tier: 1, name: "石" },
  { prefix: "golden", tier: 1, name: "金" },
  { prefix: "chainmail", tier: 1, name: "鎖" },
  { prefix: "copper", tier: 1, name: "銅" },
  { prefix: "iron", tier: 2, name: "鉄" },
  { prefix: "diamond", tier: 3, name: "ダイヤモンド" },
  { prefix: "netherite", tier: 4, name: "ネザライト" }
];
var SUFFIX = {
  sword: { group: "sword", kind: "sword", cn: "剣" },
  axe: { group: "axe", kind: "axe", cn: "斧" },
  pickaxe: { group: "pickaxe", kind: "pickaxe", cn: "ツルハシ" },
  shovel: { group: "shovel", kind: "shovel", cn: "シャベル" },
  hoe: { group: "hoe", kind: "hoe", cn: "クワ" },
  helmet: { group: "head", kind: "helmet", cn: "ヘルメット" },
  chestplate: { group: "chest", kind: "chestplate", cn: "チェストプレート" },
  leggings: { group: "legs", kind: "leggings", cn: "レギンス" },
  boots: { group: "feet", kind: "boots", cn: "ブーツ" },
  spear: { group: "spear", kind: "spear", cn: "槍" },
  mace: { group: "mace", kind: "mace", cn: "重鎚" }
};
var SPECIAL2 = {
  "minecraft:bow": { kind: "bow", group: "bow", materialTier: 1, materialName: "弓", baseName: "弓" },
  "minecraft:crossbow": { kind: "crossbow", group: "crossbow", materialTier: 2, materialName: "クロスボウ", baseName: "クロスボウ" },
  "minecraft:trident": { kind: "trident", group: "trident", materialTier: 3, materialName: "トライデント", baseName: "トライデント" },
  "minecraft:shield": { kind: "shield", group: "shield", materialTier: 2, materialName: "盾", baseName: "盾" },
  "minecraft:leather_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 0, materialName: "革", baseName: "革の馬鎧" },
  "minecraft:copper_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 1, materialName: "銅", baseName: "銅の馬鎧" },
  "minecraft:iron_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 2, materialName: "鉄", baseName: "鉄の馬鎧" },
  "minecraft:golden_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 1, materialName: "金", baseName: "金の馬鎧" },
  "minecraft:diamond_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 3, materialName: "ダイヤモンド", baseName: "ダイヤの馬鎧" },
  "minecraft:carrot_on_a_stick": { kind: "steering", group: "steering", materialTier: 1, materialName: "ニンジン付きの釣り竿", baseName: "ニンジン付きの釣り竿" },
  "minecraft:warped_fungus_on_a_stick": { kind: "steering", group: "steering", materialTier: 1, materialName: "歪んだキノコ付きの釣り竿", baseName: "歪んだキノコ付きの釣り竿" },
  "minecraft:fishing_rod": { kind: "fishing_rod", group: "fishing", materialTier: 1, materialName: "釣り竿", baseName: "釣り竿" },
  "minecraft:shears": { kind: "shears", group: "shears", materialTier: 2, materialName: "ハサミ", baseName: "ハサミ" },
  "minecraft:brush": { kind: "brush", group: "brush", materialTier: 1, materialName: "ブラシ", baseName: "ブラシ" },
  "minecraft:flint_and_steel": { kind: "flint_and_steel", group: "flint", materialTier: 1, materialName: "火打ち石", baseName: "火打ち石" },
  "minecraft:mace": { kind: "mace", group: "mace", materialTier: 3, materialName: "重鎚", baseName: "重鎚" },
  "minecraft:elytra": { kind: "chestplate", group: "chest", materialTier: 2, materialName: "エリトラ", baseName: "エリトラ" },
  "minecraft:turtle_helmet": { kind: "helmet", group: "head", materialTier: 2, materialName: "カメ", baseName: "カメの甲羅" }
};
function classify(typeId) {
  if (!typeId) return void 0;
  const id = typeId.includes(":") ? typeId : "minecraft:" + typeId;
  if (SPECIAL2[id]) return SPECIAL2[id];
  if (!id.startsWith("minecraft:")) return void 0;
  const bare2 = id.slice("minecraft:".length);
  for (const mat of MATERIALS) {
    if (!bare2.startsWith(mat.prefix + "_")) continue;
    const suffix = bare2.slice(mat.prefix.length + 1);
    const s = SUFFIX[suffix];
    if (!s) continue;
    return {
      kind: s.kind,
      group: s.group,
      materialTier: mat.tier,
      materialName: mat.name,
      baseName: mat.name + s.cn
    };
  }
  return void 0;
}
var TP_KIND = {
  sword: { group: "sword", kind: "sword", cn: "剣", tier: 3 },
  axe: { group: "axe", kind: "axe", cn: "斧", tier: 3 },
  pickaxe: { group: "pickaxe", kind: "pickaxe", cn: "ツルハシ", tier: 3 },
  shovel: { group: "shovel", kind: "shovel", cn: "シャベル", tier: 3 },
  hoe: { group: "hoe", kind: "hoe", cn: "クワ", tier: 3 },
  spear: { group: "spear", kind: "spear", cn: "槍", tier: 3 },
  fishing: { group: "fishing", kind: "fishing_rod", cn: "釣り竿", tier: 1 },
  horse: { group: "horse", kind: "horse_armor", cn: "馬鎧", tier: 2 },
  horse_armor: { group: "horse", kind: "horse_armor", cn: "馬鎧", tier: 2 },
  steering: { group: "steering", kind: "steering", cn: "釣り竿", tier: 1 },
  fishing_rod: { group: "fishing", kind: "fishing_rod", cn: "釣り竿", tier: 1 },
  shears: { group: "shears", kind: "shears", cn: "ハサミ", tier: 2 },
  brush: { group: "brush", kind: "brush", cn: "ブラシ", tier: 1 },
  flint: { group: "flint", kind: "flint_and_steel", cn: "火打ち石", tier: 1 },
  flint_and_steel: { group: "flint", kind: "flint_and_steel", cn: "火打ち石", tier: 1 },
  mace: { group: "mace", kind: "mace", cn: "重鎚", tier: 3 },
  bow: { group: "bow", kind: "bow", cn: "弓", tier: 2 },
  crossbow: { group: "crossbow", kind: "crossbow", cn: "クロスボウ", tier: 2 },
  trident: { group: "trident", kind: "trident", cn: "トライデント", tier: 3 },
  shield: { group: "shield", kind: "shield", cn: "盾", tier: 2 },
  head: { group: "head", kind: "helmet", cn: "ヘルメット", tier: 3 },
  helmet: { group: "head", kind: "helmet", cn: "ヘルメット", tier: 3 },
  chest: { group: "chest", kind: "chestplate", cn: "チェストプレート", tier: 3 },
  chestplate: { group: "chest", kind: "chestplate", cn: "チェストプレート", tier: 3 },
  legs: { group: "legs", kind: "leggings", cn: "レギンス", tier: 3 },
  leggings: { group: "legs", kind: "leggings", cn: "レギンス", tier: 3 },
  feet: { group: "feet", kind: "boots", cn: "ブーツ", tier: 3 },
  boots: { group: "feet", kind: "boots", cn: "ブーツ", tier: 3 }
};
var TP_FALLBACK = {
  "kira:rpg_weapon": "sword",
  "kira:rpg_tool": "pickaxe",
  "kira:rpg_armor": "chest"
};
function classifyThirdParty(typeId, tags) {
  if (!tags || !tags.length) return void 0;
  const declared = tags.find((x) => x in TP_FALLBACK);
  if (!declared) return void 0;
  let key2;
  for (const tag of tags) {
    if (!tag.startsWith("kira:rpg_type_")) continue;
    const k = tag.slice("kira:rpg_type_".length).toLowerCase();
    if (TP_KIND[k]) {
      key2 = k;
      break;
    }
  }
  key2 ??= TP_FALLBACK[declared];
  const meta = TP_KIND[key2];
  if (!meta) return void 0;
  let baseName = meta.cn;
  for (const tag of tags) {
    if (tag.startsWith("kira:rpg_name_")) {
      baseName = tag.slice("kira:rpg_name_".length);
      break;
    }
  }
  return {
    kind: meta.kind,
    group: meta.group,
    materialTier: meta.tier,
    materialName: "サードパーティ",
    baseName
  };
}

// scripts/domain/Naming.ts
var FLAVOR = [
  "邪悪（イリジャー）",
  "血月",
  "星隕",
  "虚空",
  "蒼穹",
  "霜寂",
  "雷鳴",
  "暁",
  "黄昏",
  "竜魂",
  "タイタン",
  "幽影",
  "神託",
  "失われた世界",
  "永遠",
  "混沌",
  "終末",
  "赤月"
];
var TITLES = {
  ancient: ["呪い", "失落", "古代"],
  unique: ["唯一", "終焉", "創世"]
};
function buildName(input) {
  const { quality, baseName, pos, dual, unique, identified, rng } = input;
  void identified;
  const prefixes = [];
  for (const u of unique.slice(0, 1)) {
    const def = AFFIX_BY_ID[u.id];
    if (def) prefixes.push(def.name);
  }
  for (const d of dual.slice(0, 1)) {
    const def = AFFIX_BY_ID[d.id];
    if (def) prefixes.push(def.name);
  }
  const sorted = pos.slice().sort((a, b) => b.level - a.level);
  for (const p of sorted) {
    if (prefixes.length >= 2) break;
    const def = AFFIX_BY_ID[p.id];
    if (!def) continue;
    if (prefixes.includes(def.name)) continue;
    prefixes.push(def.name);
  }
  const wantsFlavor = quality.id === "ancient" || quality.id === "unique" || prefixes.length < 2 && rng.chance(0.45);
  if (wantsFlavor) {
    const flavor = rng.pick(FLAVOR, FLAVOR.map(() => 1));
    if (flavor && flavor !== quality.name && !prefixes.includes(flavor)) prefixes.unshift(flavor);
  }
  const title = (TITLES[quality.id] ?? []).filter((x) => x !== quality.name);
  const tag = title.length ? "\xB7" + rng.pick(title, title.map(() => 1)) : "";
  const head = prefixes.slice(0, 2).join("\xB7");
  const name = head ? `${head}\xB7${baseName}` : baseName;
  return `${quality.color}【${quality.name}${tag}】${name}\xA7r`;
}

// scripts/domain/Score.ts
function affixScore(def, level, roll = 1) {
  let total = 0;
  for (const mod of def.mods) {
    const meta = STAT_META[mod.stat];
    const idx = Math.max(1, Math.min(mod.levels.length, Math.round(level))) - 1;
    const value = (mod.levels[idx] ?? 0) * (roll || 1);
    const weight = meta?.score ?? 2;
    total += (meta?.negative ? -value : value) * weight;
  }
  return total;
}
function instanceScore(a) {
  const def = AFFIX_BY_ID[a.id];
  if (!def) return 0;
  return affixScore(def, a.level, a.roll);
}
function synergyBonus(spec) {
  let bonus = 0;
  const ids = /* @__PURE__ */ new Set([
    ...spec.pos.map((a) => a.id),
    ...spec.dual.map((a) => a.id),
    ...spec.special.map((a) => a.id),
    ...spec.curse.map((a) => a.id),
    ...spec.unique.map((a) => a.id)
  ]);
  if (spec.pos.length >= 3) bonus += 25;
  if (spec.pos.length >= 4) bonus += 25;
  if (ids.has("berserk") && (ids.has("tough") || ids.has("resist"))) bonus += 60;
  if (ids.has("glass_cannon") && ids.has("lifesteal")) bonus += 50;
  if (ids.has("scorch") && ids.has("blazing")) bonus += 40;
  if (ids.has("chill") && ids.has("ice_burst")) bonus += 40;
  if (ids.has("thunder") && ids.has("chain_lightning")) bonus += 40;
  if (ids.has("poison_blade") && ids.has("poison_burst")) bonus += 40;
  bonus += Math.round((spec.synergy - 0.5) * 120);
  return bonus;
}
function computeScore(spec) {
  const quality = QUALITY_BY_ID[spec.quality];
  let score = quality ? quality.scoreBase : 0;
  score += (spec.baseMult - 1) * 120;
  for (const a of spec.pos) score += instanceScore(a);
  for (const a of spec.neg) score += instanceScore(a);
  for (const a of spec.dual) score += instanceScore(a);
  for (const a of spec.special) score += instanceScore(a);
  for (const a of spec.curse) score += instanceScore(a);
  for (const a of spec.unique) score += instanceScore(a);
  for (const stat of Object.keys(spec.hidden)) {
    const meta = STAT_META[stat];
    const v = spec.hidden[stat];
    if (meta) score += (meta.negative ? -v : v) * meta.score;
  }
  score += synergyBonus(spec);
  return Math.max(0, Math.round(score));
}

// scripts/domain/Generator.ts
var HIDDEN_STATS = [
  "hiddenSpeciesUndead",
  "hiddenSpeciesArthropod",
  "hiddenSpeciesIllager",
  "hiddenSpeciesAquatic",
  "hiddenSpeciesNether",
  "hiddenLuck",
  "hiddenGreed"
];
var AWAKEN_STATS = [
  "hiddenAwakenNight",
  "hiddenAwakenBlood",
  "hiddenAwakenAbyss",
  "hiddenAwakenHunt",
  "hiddenAwakenEarth",
  "hiddenAwakenStar",
  "hiddenAwakenFate"
];
function pickQuality(rng, force, range, source) {
  if (force) return QUALITY_BY_ID[force];
  const table = SOURCE_QUALITY_TABLE[source ?? "crafting"] ?? SOURCE_QUALITY_TABLE.crafting;
  const pool = QUALITIES.filter((q2) => (table[q2.id] ?? 0) > 0);
  const weights = pool.map((q2) => table[q2.id] ?? 0);
  if (range) {
    const allowed = rangeToQualityIds(range);
    const sub = pool.filter((q2) => allowed.includes(q2.id));
    const subW = sub.map((q2) => table[q2.id] ?? 0);
    if (sub.length) {
      const q2 = rng.pick(sub, subW);
      if (q2) return q2;
    }
  }
  const q = rng.pick(pool, weights);
  return q ?? QUALITY_BY_ID.common;
}
function pickCount(rng, table, fallback) {
  if (!table || !Object.keys(table).length) return rng.int(fallback[0], fallback[1]);
  const k = pickWeighted(() => rng.next(), table);
  return typeof k === "number" ? k : fallback[0];
}
function levelOf(rng, range, bonus = 0, qualityId, materialTier) {
  const base = pickWeighted(() => rng.next(), LEVEL_WEIGHT) ?? 1;
  const lo = Math.max(1, range[0]);
  const hiRange = Math.max(lo, range[1] + bonus);
  let cap = 7;
  if (qualityId) cap = Math.min(cap, MAX_AFFIX_LEVEL[qualityId] ?? 7);
  if (typeof materialTier === "number") cap = Math.min(cap, MATERIAL_MAX_LEVEL[materialTier] ?? 5);
  const hi = Math.max(lo, Math.min(hiRange, cap));
  return Math.max(lo, Math.min(hi, base));
}
function rollRarity(rng, quality) {
  const weights = RARITY_ORDER.map((r) => RARITY_WEIGHT[r] + (quality.rarityBias[r] ?? 0));
  const picked = rng.pick(RARITY_ORDER, weights);
  return picked ?? "common";
}
function rollValue(rng, def, rarity) {
  const mult = RARITY_VALUE_MULT[rarity];
  const jitter = 1 + def.variance * (rng.next() * 2 - 1);
  return Math.round(mult * jitter * 100) / 100;
}
function drawAffixes(rng, pool, count, chosen, levelFn, quality) {
  const out = [];
  if (count <= 0) return out;
  const candidates = pool.filter((d) => d.weight > 0);
  const used = new Set(chosen);
  for (let i = 0; i < count; i++) {
    const avail = candidates.filter(
      (d) => !used.has(d.id) && !chosen.some((c) => isMutuallyExclusive(c, d.id))
    );
    if (!avail.length) break;
    const picked = rng.pick(avail, avail.map((d) => d.weight));
    if (!picked) break;
    used.add(picked.id);
    chosen.push(picked.id);
    const rarity = rollRarity(rng, quality);
    out.push({ id: picked.id, level: levelFn(picked), roll: rollValue(rng, picked, rarity), rarity });
  }
  return out;
}
function computeRisk(neg) {
  let raw = 0;
  for (const a of neg) raw += a.level * 7 + 5;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
function normalizeRisk(rng, neg, quality) {
  for (let guard = 0; guard < 24; guard++) {
    const risk = computeRisk(neg);
    if (risk < quality.risk[0]) {
      if (!neg.length) return;
      const i = rng.int(0, neg.length - 1);
      if (neg[i].level < 5) neg[i].level += 1;
      else return;
      continue;
    }
    if (risk > quality.risk[1]) {
      if (!neg.length) return;
      const i = rng.int(0, neg.length - 1);
      if (neg[i].level > 1) neg[i].level -= 1;
      else {
        neg.splice(i, 1);
        if (!neg.length) return;
      }
      continue;
    }
    return;
  }
}
function generateSpec(itemTypeId, seed, opts = {}) {
  const info = opts.forceInfo ?? classify(itemTypeId);
  if (!info) return void 0;
  const rng = makeRng(seed);
  const quality = pickQuality(rng, opts.forceQuality, opts.qualityRange, opts.source);
  const group = info.group;
  let baseMult = rng.range(quality.baseMult[0], quality.baseMult[1]);
  baseMult += info.materialTier * 0.04;
  const chosen = [];
  let negCount = 0;
  if (rng.next() < (NEG_PRESENCE[quality.id] ?? 1)) {
    negCount = pickCount(rng, NEG_COUNT[quality.id], quality.neg);
  }
  const neg = drawAffixes(rng, poolFor("negative", group), negCount, chosen, () => levelOf(rng, quality.negLv, 0, quality.id, info.materialTier), quality);
  normalizeRisk(rng, neg, quality);
  const risk = computeRisk(neg);
  baseMult *= 1 + risk / 500;
  const posPool = poolFor("positive", group).filter(
    (d) => !d.minQuality || qualityRank(quality.id) >= qualityRank(d.minQuality)
  );
  const posBonusCount = Math.floor(risk / 25);
  const posBonusLevel = Math.floor(risk / 30);
  const posBase = pickCount(rng, POS_COUNT[quality.id], quality.pos);
  const posCount = Math.max(0, Math.min(8, posBase + posBonusCount));
  const pos = drawAffixes(rng, posPool, posCount, chosen, () => levelOf(rng, quality.posLv, posBonusLevel, quality.id, info.materialTier), quality);
  if (pos.length === 0 && neg.length === 0) {
    const extra = drawAffixes(rng, posPool, 1, chosen, () => levelOf(rng, quality.posLv, posBonusLevel, quality.id, info.materialTier), quality);
    pos.push(...extra);
  }
  let dual = [];
  const dualChance = DUAL_CHANCE[quality.id] ?? quality.dualChance;
  if (rng.chance(dualChance)) {
    const pool = poolFor("dual", group).filter(
      (d) => !d.minQuality || qualityRank(quality.id) >= qualityRank(d.minQuality)
    );
    dual = drawAffixes(rng, pool, 1, chosen, () => levelOf(rng, quality.posLv, posBonusLevel, quality.id, info.materialTier), quality);
  }
  let special = [];
  if (rng.chance(quality.specialChance)) {
    const pool = poolFor("special", group).filter(
      (d) => !d.minQuality || qualityRank(quality.id) >= qualityRank(d.minQuality)
    );
    special = drawAffixes(rng, pool, 1, chosen, () => 1, quality);
  }
  let curse = [];
  if (rng.chance(quality.curseChance)) {
    const pool = poolFor("curse", group).filter(
      (d) => !d.minQuality || qualityRank(quality.id) >= qualityRank(d.minQuality)
    );
    curse = drawAffixes(rng, pool, 1, chosen, () => levelOf(rng, quality.posLv, posBonusLevel, quality.id, info.materialTier), quality);
  }
  let unique = [];
  if (rng.chance(quality.uniqueChance)) {
    unique = drawAffixes(rng, poolFor("unique", group), 1, chosen, () => 1, quality);
  }
  const hidden = {};
  if (rng.chance(0.25)) {
    const stat = rng.pick(HIDDEN_STATS, HIDDEN_STATS.map(() => 1));
    if (stat) hidden[stat] = rng.int(5, 25);
  }
  let awakened = opts.forceAwakened === true;
  if (rng.chance(0.04)) {
    const stat = rng.pick(AWAKEN_STATS, AWAKEN_STATS.map(() => 1));
    if (stat) {
      hidden[stat] = 1;
      awakened = awakened || rng.chance(0.35);
    }
  }
  const identified = true;
  const ids = [...pos, ...dual, ...special, ...curse, ...unique].map((a) => a.id);
  const synergy = computeSynergy(ids).score;
  const partial = {
    v: DATA_VERSION,
    seed,
    quality: quality.id,
    group,
    kind: info.kind,
    baseName: info.baseName,
    materialTier: info.materialTier,
    baseMult: Math.round(baseMult * 100) / 100,
    pos,
    neg,
    dual,
    special,
    curse,
    unique,
    hidden,
    awakened,
    synergy,
    risk,
    identified
  };
  const score = computeScore(partial);
  const name = buildName({
    quality,
    baseName: info.baseName,
    pos,
    dual,
    unique,
    identified,
    rng
  });
  return { ...partial, score, name };
}
function specStats(spec) {
  const out = {};
  const add = (def, level, roll) => {
    if (!def) return;
    for (const mod of def.mods) {
      const idx = Math.max(1, Math.min(mod.levels.length, Math.round(level))) - 1;
      const v = (mod.levels[idx] ?? 0) * (roll || 1);
      out[mod.stat] = (out[mod.stat] ?? 0) + Math.round(v * 100) / 100;
    }
  };
  for (const a of spec.pos) add(AFFIX_BY_ID[a.id], a.level, a.roll);
  for (const a of spec.neg) add(AFFIX_BY_ID[a.id], a.level, a.roll);
  for (const a of spec.dual) add(AFFIX_BY_ID[a.id], a.level, a.roll);
  for (const a of spec.special) add(AFFIX_BY_ID[a.id], a.level, a.roll);
  for (const a of spec.curse) add(AFFIX_BY_ID[a.id], a.level, a.roll);
  for (const a of spec.unique) add(AFFIX_BY_ID[a.id], a.level, a.roll);
  for (const stat of Object.keys(spec.hidden)) {
    out[stat] = (out[stat] ?? 0) + spec.hidden[stat];
  }
  return out;
}
function specInstances(spec) {
  return [...spec.pos, ...spec.neg, ...spec.dual, ...spec.special, ...spec.curse, ...spec.unique];
}

// scripts/item/Codec.ts
function toQuads(list) {
  return list.map((a) => [a.id, a.level, a.roll ?? 1, Math.max(0, RARITY_ORDER.indexOf(a.rarity ?? "common"))]);
}
function fromQuads(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list) {
    if (!Array.isArray(raw) || typeof raw[0] !== "string") continue;
    if (raw.length >= 3) {
      out.push({
        id: String(raw[0]),
        level: clampLevel(Number(raw[1])),
        roll: clampRoll(Number(raw[2])),
        rarity: RARITY_ORDER[clampIdx(Number(raw[3]))] ?? "common"
      });
    } else {
      out.push({ id: String(raw[0]), level: clampLevel(Number(raw[1])), roll: 1, rarity: "common" });
    }
  }
  return out;
}
function clampLevel(v) {
  return Math.max(1, Math.min(5, Math.round(v) || 1));
}
function clampRoll(v) {
  if (!isFinite(v) || v <= 0) return 1;
  return Math.max(0.5, Math.min(4, Math.round(v * 100) / 100));
}
function clampIdx(v) {
  if (!isFinite(v)) return 0;
  return Math.max(0, Math.min(RARITY_ORDER.length - 1, Math.round(v)));
}
function encodeSpec(spec) {
  const c = [
    DATA_VERSION,
    spec.seed,
    spec.quality,
    spec.group,
    spec.kind,
    spec.baseName,
    spec.materialTier,
    spec.baseMult,
    toQuads(spec.pos),
    toQuads(spec.neg),
    toQuads(spec.dual),
    toQuads(spec.special),
    toQuads(spec.curse),
    toQuads(spec.unique),
    spec.hidden ?? {},
    spec.awakened === true,
    spec.synergy ?? 0.5,
    spec.risk,
    spec.score,
    spec.identified,
    spec.name,
    spec.origin ?? "",
    spec.originDetail ?? ""
  ];
  return JSON.stringify(c);
}
function decodeSpec(raw) {
  if (!raw || typeof raw !== "string") return void 0;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (!Array.isArray(parsed)) return void 0;
  const c = parsed;
  const version = Number(c[0]);
  if (version === 1 && c.length >= 17) return decodeV1(c);
  if (version === 2 && c.length >= 21) return decodeV2(c);
  return void 0;
}
function decodeV1(c) {
  const quality = String(c[2]);
  if (!QUALITY_BY_ID[quality]) return void 0;
  return {
    v: 1,
    seed: Number(c[1]) || 0,
    quality,
    group: c[3],
    kind: String(c[4] ?? ""),
    baseName: String(c[5] ?? ""),
    materialTier: Number(c[6]) || 0,
    baseMult: Number(c[7]) || 1,
    pos: fromQuads(c[8]),
    neg: fromQuads(c[9]),
    dual: fromQuads(c[10]),
    special: [],
    curse: [],
    unique: fromQuads(c[11]),
    hidden: c[12] && typeof c[12] === "object" ? c[12] : {},
    awakened: true,
    synergy: 0.5,
    risk: Number(c[13]) || 0,
    score: Number(c[14]) || 0,
    identified: c[15] !== false,
    name: String(c[16] ?? "")
  };
}
function decodeV2(c) {
  const quality = String(c[2]);
  if (!QUALITY_BY_ID[quality]) return void 0;
  return {
    v: 2,
    seed: Number(c[1]) || 0,
    quality,
    group: c[3],
    kind: String(c[4] ?? ""),
    baseName: String(c[5] ?? ""),
    materialTier: Number(c[6]) || 0,
    baseMult: Number(c[7]) || 1,
    pos: fromQuads(c[8]),
    neg: fromQuads(c[9]),
    dual: fromQuads(c[10]),
    special: fromQuads(c[11]),
    curse: fromQuads(c[12]),
    unique: fromQuads(c[13]),
    hidden: c[14] && typeof c[14] === "object" ? c[14] : {},
    awakened: c[15] === true,
    synergy: typeof c[16] === "number" ? c[16] : 0.5,
    risk: Number(c[17]) || 0,
    score: Number(c[18]) || 0,
    identified: c[19] !== false,
    name: String(c[20] ?? ""),
    origin: c[21] ? String(c[21]) : void 0,
    originDetail: c[22] ? String(c[22]) : void 0
  };
}
function tidy(v, unit) {
  if (unit === "amp" || unit === "flag") return Math.round(v);
  return Math.round(v * 10) / 10;
}
function modText(def, level, roll) {
  const parts = [];
  for (const mod of def.mods) {
    const idx = Math.max(1, Math.min(mod.levels.length, Math.round(level))) - 1;
    const v = tidy((mod.levels[idx] ?? 0) * (roll || 1), STAT_META[mod.stat]?.unit);
    const meta = STAT_META[mod.stat];
    const label = meta ? meta.label : mod.stat;
    switch (meta?.unit) {
      case "pct":
        parts.push(`${label} ${v >= 0 ? "+" : ""}${round(v)}%`);
        break;
      case "sec":
        parts.push(`${label} +${round(v)} 秒`);
        break;
      case "amp":
        parts.push(`${label} +${round(v)} レベル`);
        break;
      case "flag":
        parts.push(label);
        break;
      default:
        parts.push(`${label} ${v >= 0 ? "+" : ""}${round(v)}`);
    }
  }
  return parts.join(" / ");
}
var ENCHANT_CN = {
  sharpness: "鋭利",
  smite: "アンデッド特効",
  bane_of_arthropods: "節足動物特効",
  knockback: "ノックバック",
  fire_aspect: "火属性",
  looting: "ドロップ増加",
  sweeping: "範囲ダメージ増加",
  efficiency: "効率強化",
  silk_touch: "精密採取",
  fortune: "幸運",
  unbreaking: "耐久力",
  mending: "修繕",
  protection: "ダメージ軽減",
  fire_protection: "火炎耐性",
  feather_falling: "落下耐性",
  blast_protection: "爆発耐性",
  projectile_protection: "飛び道具耐性",
  thorns: "棘",
  respiration: "水中呼吸",
  depth_strider: "水中歩行",
  aqua_affinity: "水中採掘",
  frost_walker: "氷渡り",
  soul_speed: "ソウルスピード",
  swift_sneak: "スニーク速度上昇",
  power: "射撃ダメージ増加",
  punch: "ノックバック",
  flame: "火矢",
  infinity: "無限",
  multishot: "多重射撃",
  quick_charge: "高速装填",
  piercing: "貫通",
  loyalty: "忠誠",
  impaling: "穿刺",
  riptide: "激流",
  channeling: "召雷",
  density: "密度",
  breach: "アーマー破壊",
  wind_burst: "ウィンドバースト"
};
function readEnchantNames(stack) {
  try {
    const comp = stack.getComponent("minecraft:enchantable");
    const list = comp?.getEnchantments?.() ?? [];
    return list.map((e) => {
      const key2 = e.type.id.replace("minecraft:", "");
      return ENCHANT_CN[key2] + " " + roman(e.level);
    });
  } catch {
    return [];
  }
}
var MARK_POS = "\xA7a\u25C6";
var MARK_NEG = "\xA7c⚠";
var MARK_SPE = "\xA76✦";
var MARK_UNI = "\xA75❖";
var AFFIX_BUDGET = 8;
var SEVERITY = {
  common: "",
  fine: "軽",
  rare: "中",
  epic: "重",
  legendary: "極重",
  mythic: "致命"
};
function section(lines, list, mark, nameColor, budget, negative = false) {
  if (!list.length || budget.left <= 0) return 0;
  const shown = list.slice(0, budget.left);
  for (const a of shown) {
    const def = AFFIX_BY_ID[a.id];
    const rar = a.rarity && a.rarity !== "common" ? negative ? " \xA7c[" + (SEVERITY[a.rarity] ?? "") + "]" : " \xA78[" + (RARITY_NAME[a.rarity] ?? a.rarity) + "]" : "";
    const affixName = def ? def.name : a.id;
    lines.push(mark + " " + nameColor + affixName + " " + roman(a.level) + rar);
    const text = def ? modText(def, a.level, a.roll ?? 1) : "";
    const plainText = text.replace(/§./g, "").trim();
    if (text && plainText && plainText !== affixName) lines.push("\xA77" + text);
  }
  budget.left -= shown.length;
  if (list.length > shown.length) {
    lines.push("\xA78…ほか " + (list.length - shown.length) + " 件");
  }
  return shown.length;
}
var ORIGIN_CN = {
  crafting: "クラフト",
  mob_loot: "モブドロップ",
  chest_loot: "チェストの戦利品",
  fishing: "釣り",
  reward: "クエスト報酬",
  script_give: "コマンド/スクリプト付与",
  inventory: "インベントリ入手",
  third_party: "サードパーティ Addon",
  unknown: "不明な入手元"
};
function originText(spec) {
  const raw = spec.origin;
  if (!raw) return void 0;
  const base = ORIGIN_CN[raw] ?? raw;
  const detail = spec.originDetail;
  if (!detail) return base;
  const short = detail.replace("minecraft:", "");
  const MOB_CN = {
    zombie: "ゾンビ",
    skeleton: "スケルトン",
    spider: "クモ",
    creeper: "クリーパー",
    enderman: "エンダーマン",
    blaze: "ブレイズ",
    witch: "ウィッチ",
    warden: "ウォーデン",
    wither: "ウィザー",
    ender_dragon: "エンダードラゴン",
    elder_guardian: "エルダーガーディアン"
  };
  const name = MOB_CN[short] ?? short;
  return base + "（" + name + "）";
}
function buildLore(spec, opts = {}) {
  const q = QUALITY_BY_ID[spec.quality];
  const color = q ? q.color : "\xA7f";
  const lines = [];
  const syn = spec.synergy >= 0.85 ? "perfect" : spec.synergy >= 0.65 ? "high" : spec.synergy >= 0.4 ? "normal" : "conflict";
  const synDetail = (() => {
    try {
      const d = synergyDetail(spec);
      return [...d.perfect, ...d.high, ...d.conflicts].slice(0, 2);
    } catch {
      return [];
    }
  })();
  lines.push("\xA78" + color + "【" + (q ? q.name : spec.quality) + "】\xA78 \xB7 リスク \xA7c" + spec.risk);
  if (syn !== "normal") {
    const note = synDetail && synDetail.length ? "（" + synDetail.join("、") + "）" : "";
    const synColor = syn === "conflict" ? "\xA7c" : syn === "perfect" ? "\xA76" : "\xA7b";
    lines.push("\xA78シナジー " + synColor + SYNERGY_LEVEL_NAME[syn] + "\xA78" + note);
  }
  lines.push("\xA78基本ステータス \xA7c\xD7" + spec.baseMult.toFixed(2) + "\xA78（" + spec.baseName + "）");
  const tier2 = speedTierFor(specStats(spec));
  if (tier2.id !== "normal") {
    lines.push("\xA78攻撃速度 " + tier2.color + tier2.name + "\xA78（" + (tier2.pct >= 0 ? "+" : "") + tier2.pct + "%）");
  }
  const budget = { left: AFFIX_BUDGET };
  const before = lines.length;
  section(lines, spec.unique, MARK_UNI, "\xA75", budget);
  section(lines, spec.special, MARK_SPE, "\xA76", budget);
  section(lines, spec.dual, MARK_POS, "\xA7d", budget);
  section(lines, spec.pos, MARK_POS, "\xA7a", budget);
  section(lines, spec.curse, MARK_NEG, "\xA74", budget, true);
  section(lines, spec.neg, MARK_NEG, "\xA7c", budget, true);
  if (lines.length > before) lines.splice(before, 0, "");
  const awakenKeys = Object.keys(spec.hidden).filter((k) => k.startsWith("hiddenAwaken"));
  if (awakenKeys.length) {
    lines.push("");
    lines.push("\xA78▎隠しアフィックス " + (spec.awakened ? "\xA7a覚醒済み" : "\xA77未覚醒"));
    if (spec.awakened) for (const k of awakenKeys) lines.push("\xA75❖ " + (STAT_META[k]?.label ?? k));
  }
  const hiddenKeys = Object.keys(spec.hidden).filter((k) => !k.startsWith("hiddenAwaken"));
  if (hiddenKeys.length) {
    lines.push("");
    lines.push("\xA78▎隠しステータス");
    for (const k of hiddenKeys.slice(0, 2)) lines.push("\xA78" + (STAT_META[k]?.label ?? k) + " +" + round(spec.hidden[k]));
    if (hiddenKeys.length > 2) lines.push("\xA78…ほか " + (hiddenKeys.length - 2) + " 件の隠しステータス");
  }
  const originLine = originText(spec);
  if (originLine) lines.push("\xA78入手元：" + originLine);
  lines.push("");
  lines.push("\xA77装備スコア：\xA7e" + spec.score);
  const ench = opts.enchantments ?? [];
  if (ench.length) {
    lines.push("\xA77エンチャント：\xA7b" + ench.join("\xA77、\xA7b"));
  } else {
    lines.push("\xA78通常のエンチャント / 金床 / 砥石が可能");
  }
  if (opts.includePayload) lines.push(...payloadLines(spec));
  return lines;
}
function payloadLines(spec) {
  const payload = encodeSpec(spec);
  const out = [];
  const CHUNK = 48;
  for (let i = 0; i < payload.length; i += CHUNK) {
    out.push((i === 0 ? LORE_MARKER : "\xA78[af1+]") + payload.slice(i, i + CHUNK));
  }
  return out;
}
function parseLorePayload(lore) {
  if (!lore) return void 0;
  const parts = [];
  let started = false;
  for (const line of lore) {
    if (typeof line !== "string") continue;
    if (line.includes(LORE_MARKER)) {
      started = true;
      parts.push(line.slice(line.indexOf(LORE_MARKER) + LORE_MARKER.length));
    } else if (started && line.startsWith("\xA78[af1+]")) {
      parts.push(line.slice("\xA78[af1+]".length));
    } else if (started) {
      break;
    }
  }
  return parts.length ? parts.join("") : void 0;
}
function awakenSpec(spec) {
  if (spec.awakened) return spec;
  return { ...spec, awakened: true };
}
function resonanceHint(spec) {
  if (!spec.identified) return void 0;
  const ids = [
    ...spec.pos.map((a) => a.id),
    ...spec.dual.map((a) => a.id),
    ...spec.special.map((a) => a.id),
    ...spec.curse.map((a) => a.id),
    ...spec.unique.map((a) => a.id)
  ];
  const hit = RESONANCES.find((r) => {
    if (r.kind === "armor" && r.armor) {
      return Object.values(r.armor).some((arr) => (arr ?? []).some((i) => ids.includes(i)));
    }
    if (r.kind === "tool" && r.tool) {
      return r.tool.groups.includes(spec.group) && r.tool.affixes.some((i) => ids.includes(i));
    }
    return false;
  });
  return hit ? `\xA78潜在共鳴：${hit.name}（${hit.desc}）` : void 0;
}
function synergyDetail(spec) {
  const ids = [
    ...spec.pos.map((a) => a.id),
    ...spec.dual.map((a) => a.id),
    ...spec.special.map((a) => a.id),
    ...spec.curse.map((a) => a.id),
    ...spec.unique.map((a) => a.id)
  ];
  const r = computeSynergy(ids);
  return { level: SYNERGY_LEVEL_NAME[r.level], perfect: r.perfect, high: r.high, conflicts: r.conflicts };
}

// scripts/item/Markers.ts
var AF_VERSION_KEY = "kira:af_version";
var AF_INSTANCE_KEY = "kira:af_instance";
var AF_ORIGIN_KEY = "kira:af_origin";
var AF_ORIGIN_DETAIL_KEY = "kira:af_origin_detail";
var AF_SEED_KEY = "kira:af_seed";
var AF_QUALITY_KEY = "kira:af_quality";
var AF_SCORE_KEY = "kira:af_score";
var HEX = "0123456789ABCDEF";
function newInstanceId() {
  let s = "AF-";
  for (let i = 0; i < 8; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}
function stampMarkers(stack, spec, origin, detail) {
  const instance = newInstanceId();
  try {
    stack.setDynamicProperty(AF_VERSION_KEY, spec.v);
    stack.setDynamicProperty(AF_INSTANCE_KEY, instance);
    stack.setDynamicProperty(AF_ORIGIN_KEY, origin);
    if (detail) stack.setDynamicProperty(AF_ORIGIN_DETAIL_KEY, detail);
    stack.setDynamicProperty(AF_SEED_KEY, spec.seed);
    stack.setDynamicProperty(AF_QUALITY_KEY, spec.quality);
    stack.setDynamicProperty(AF_SCORE_KEY, spec.score);
  } catch {
  }
  return instance;
}
var LEGACY = {
  "kira:af_version": "af:version",
  "kira:af_instance": "af:instance",
  "kira:af_origin": "af:origin",
  "kira:af_seed": "af:seed",
  "kira:af_quality": "af:quality",
  "kira:af_score": "af:score"
};
function readMarker(stack, key2) {
  if (!stack) return void 0;
  try {
    const v = stack.getDynamicProperty(key2);
    if (v !== void 0) return v;
  } catch {
  }
  const legacy = LEGACY[key2];
  if (legacy) {
    try {
      return stack.getDynamicProperty(legacy);
    } catch {
    }
  }
  return void 0;
}
function readVersion(stack) {
  const v = readMarker(stack, AF_VERSION_KEY);
  return typeof v === "number" ? v : void 0;
}
function readInstance(stack) {
  const v = readMarker(stack, AF_INSTANCE_KEY);
  return typeof v === "string" ? v : void 0;
}

// scripts/systems/EquipmentService.ts
function readSpec(stack) {
  if (!stack) return void 0;
  try {
    let raw = stack.getDynamicProperty(DYNPROP_KEY);
    if (raw === void 0) raw = stack.getDynamicProperty(DYNPROP_KEY_LEGACY);
    if (typeof raw === "string") {
      const spec = decodeSpec(raw);
      if (spec) return spec;
    }
  } catch {
  }
  return decodeSpec(parseLorePayload(stack.getLore()));
}
function writeSpec(stack, spec) {
  let error;
  let dynOk = true;
  try {
    stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
  } catch (e) {
    dynOk = false;
    error = "dynprop: " + String(e);
  }
  try {
    stack.setLore(buildLore(spec, { includePayload: !dynOk, enchantments: readEnchantNames(stack) }));
    stack.nameTag = spec.name;
  } catch (e) {
    error = (error ? error + "; " : "") + "name/lore: " + String(e);
  }
  try {
    if (spec.unique.some((u) => u.id === "immortal")) {
      const dur = stack.getComponent("minecraft:durability");
      if (dur) dur.unbreakable = true;
    }
    if (spec.unique.some((u) => u.id === "soulbound")) {
      stack.keepOnDeath = true;
    }
  } catch {
  }
  return { stack, spec, changed: true, generated: false, error };
}
function ensureSpec(stack, force = false) {
  if (!stack) return void 0;
  const info = classify(stack.typeId);
  if (!info) return void 0;
  const existing = readSpec(stack);
  if (existing && !force) {
    return { stack, spec: existing, changed: false, generated: false };
  }
  const seed = nextSeed();
  const spec = generateSpec(stack.typeId, seed);
  if (!spec) return void 0;
  stampMarkers(stack, spec, "inventory");
  const res = writeSpec(stack, spec);
  res.generated = true;
  return res;
}
function rerender(stack, spec) {
  return writeSpec(stack, spec);
}
function processContainer(container) {
  let changed = 0;
  const size = container.size;
  for (let i = 0; i < size; i++) {
    let item;
    try {
      item = container.getItem(i);
    } catch {
      continue;
    }
    if (!item) continue;
    const res = ensureSpec(item);
    if (res && res.generated) {
      try {
        container.setItem(i, res.stack);
        changed++;
      } catch (e) {
        zlog("setItem 失敗", { slot: i, error: String(e) });
      }
    }
  }
  return changed;
}
function processEquipped(player, generate = true) {
  const out = {};
  const eq = player.getComponent("minecraft:equippable");
  if (!eq) return out;
  const slots = [
    [EquipmentSlot.Mainhand, "weapon"],
    [EquipmentSlot.Offhand, "offhand"],
    [EquipmentSlot.Head, "head"],
    [EquipmentSlot.Chest, "chest"],
    [EquipmentSlot.Legs, "legs"],
    [EquipmentSlot.Feet, "feet"]
  ];
  for (const [slot, key2] of slots) {
    let item;
    try {
      item = eq.getEquipment(slot);
    } catch {
      continue;
    }
    if (!item) continue;
    const spec = readSpec(item);
    if (spec) {
      out[key2] = spec;
      continue;
    }
    if (!generate) continue;
    const res = ensureSpec(item);
    if (res?.spec) {
      try {
        eq.setEquipment(slot, res.stack);
      } catch (e) {
        zlog("setEquipment 失敗", { slot, error: String(e) });
      }
      out[key2] = res.spec;
    }
  }
  return out;
}
function mainhandItem(player) {
  try {
    const eq = player.getComponent("minecraft:equippable");
    return eq?.getEquipment(EquipmentSlot.Mainhand);
  } catch {
    return void 0;
  }
}
function mainhandSpec(player) {
  const item = mainhandItem(player);
  return readSpec(item);
}
function damageMainhand(player, amount) {
  if (amount <= 0) return;
  try {
    const eq = player.getComponent("minecraft:equippable");
    if (!eq) return;
    const item = eq.getEquipment(EquipmentSlot.Mainhand);
    if (!item) return;
    const dur = item.getComponent("minecraft:durability");
    if (!dur) return;
    if (dur.unbreakable) return;
    dur.damage = Math.min(dur.maxDurability, dur.damage + amount);
    eq.setEquipment(EquipmentSlot.Mainhand, item);
  } catch {
  }
}

// scripts/systems/CombatSystem.ts
var playerIds = /* @__PURE__ */ new Set();
function registerPlayer(id) {
  playerIds.add(id);
}
function unregisterPlayer(id) {
  playerIds.delete(id);
}
function asPlayer(e) {
  if (!e) return void 0;
  if (playerIds.has(e.id)) return e;
  try {
    if (e.typeId === "minecraft:player") {
      playerIds.add(e.id);
      return e;
    }
  } catch {
  }
  return void 0;
}
var currentTickCache = 0;
function setTickCache(t) {
  currentTickCache = t;
}
var scriptDamageTick = -1;
function markScriptDamage() {
  try {
    scriptDamageTick = system.currentTick;
  } catch {
    scriptDamageTick = 0;
  }
}
var victimStatus = /* @__PURE__ */ new Map();
function statusOf(id) {
  let s = victimStatus.get(id);
  if (!s) {
    s = { burning: 0, frozen: 0, poisoned: 0, lastHitTick: -1 };
    victimStatus.set(id, s);
  }
  return s;
}
var UNDEAD = ["zombie", "skeleton", "wither", "phantom", "drowned", "husk", "stray", "zoglin", "zombified"];
var ARTHROPOD = ["spider", "silverfish", "endermite", "cave_spider"];
var ILLAGER = ["pillager", "vindicator", "evocation", "ravager", "witch", "illusioner"];
var AQUATIC = ["guardian", "drowned", "cod", "salmon", "tropical", "pufferfish", "squid", "dolphin", "turtle", "axolotl"];
var NETHERMOB = ["blaze", "ghast", "piglin", "hoglin", "magma", "strider", "wither_skeleton", "zoglin"];
var BOSS = ["ender_dragon", "wither", "warden", "elder_guardian"];
var GIANT = ["ravager", "iron_golem", "hoglin", "zoglin", "giant", "warden"];
var ELITE = ["pillager", "vindicator", "evocation", "ravager", "witch", "wither_skeleton", "piglin_brute", "elder_guardian", "warden"];
function inList(typeId, list) {
  const t = typeId.toLowerCase();
  return list.some((k) => t.includes(k));
}
function evalCondition(cond, ctx) {
  if (!cond) return true;
  switch (cond) {
    case "night":
      return ctx.night;
    case "day":
      return !ctx.night;
    case "nether":
      return ctx.dimId === "minecraft:nether";
    case "overworld":
      return ctx.dimId === "minecraft:overworld";
    case "water":
      return ctx.inWater;
    case "underground":
      return ctx.underground;
    case "undead":
      return inList(ctx.victimTypeId, UNDEAD);
    case "arthropod":
      return inList(ctx.victimTypeId, ARTHROPOD);
    case "illager":
      return inList(ctx.victimTypeId, ILLAGER);
    case "aquatic":
      return inList(ctx.victimTypeId, AQUATIC);
    case "nethermob":
      return inList(ctx.victimTypeId, NETHERMOB);
    case "boss":
      return inList(ctx.victimTypeId, BOSS);
    case "giant":
      return inList(ctx.victimTypeId, GIANT);
    case "elite":
      return inList(ctx.victimTypeId, ELITE);
    case "selfLowHp":
      return ctx.st.healthRatio < 0.5;
    case "targetLowHp":
      return ctx.victimHealthRatio < 0.3;
    case "targetFullHp":
      return ctx.victimHealthRatio > 0.95;
    case "targetMoving":
      return ctx.victimMoving;
    case "far":
      return ctx.distance > 8;
    case "crowd":
      return ctx.st.enemyCount > 1;
    case "solo":
      return ctx.st.nearbyPlayers === 0;
    case "combo":
      return ctx.st.comboCount > 1;
    case "killStack":
      return ctx.st.killStacks > 0;
    case "hurtRecent":
      return currentTickCache - ctx.st.lastHurtTick < 100;
    case "standing":
      return ctx.standing;
    case "blocking":
      return ctx.blocking;
    case "behind":
      return ctx.behind;
    case "unwounded":
      return ctx.victimHealthRatio > 0.95;
    case "burning":
      return ctx.victimBurning;
    case "frozen":
      return ctx.victimFrozen;
    case "poisoned":
      return ctx.victimPoisoned;
    case "ranged":
      return ctx.ranged;
    case "crit":
      return ctx.crit;
    case "lowDurability":
      return ctx.lowDurability;
    default:
      return true;
  }
}
function computeOffense(ctx) {
  const s = ctx.st.stats;
  const g = (k) => s[k] ?? 0;
  const reasons = [];
  let mult = 1;
  for (const key2 of Object.keys(STAT_META)) {
    const meta = STAT_META[key2];
    if (meta.channel !== "offMult") continue;
    const v = g(key2);
    if (!v) continue;
    if (!evalCondition(meta.condition, ctx)) continue;
    mult += v / 100;
    if (reasons.length < 6) reasons.push(meta.label);
  }
  if (g("idleDecayPct") && currentTickCache - ctx.st.lastHitTick > 200) {
    mult -= g("idleDecayPct") / 100;
    reasons.push("待機攻撃低下");
  }
  if (ctx.dimId !== "minecraft:nether" && g("uniqueAbyssHeart")) {
    mult -= 0.2;
    reasons.push("深淵の心\xB7オーバーワールドで弱体化");
  }
  if (ctx.dimId === "minecraft:overworld" && g("uniqueEternalNight")) {
    mult += ctx.night ? 0.5 : -0.35;
    reasons.push(ctx.night ? "永夜" : "永夜\xB7昼間は弱体化");
  }
  if (ctx.dimId === "minecraft:overworld" && g("uniqueSunHeart")) {
    mult += ctx.night ? -0.3 : 0.45;
    reasons.push(ctx.night ? "太陽の心\xB7夜間は弱体化" : "太陽の心");
  }
  const base = ctx.st.weaponBaseMult ?? 1;
  if (base !== 1) {
    mult *= base;
    if (reasons.length < 6) reasons.push(`基本\xD7${base.toFixed(2)}`);
  }
  const tier2 = speedTierFor(s);
  const comp = speedDpsCompensation(tier2);
  if (comp !== 1) {
    mult *= comp;
    reasons.push(`攻撃速度\xB7${tier2.name}`);
  }
  mult = Math.max(0.1, mult);
  let critChance = 0;
  for (const key2 of Object.keys(STAT_META)) {
    const meta = STAT_META[key2];
    if (meta.channel !== "critChance") continue;
    const v = g(key2);
    if (!v) continue;
    if (!evalCondition(meta.condition, ctx)) continue;
    critChance += v;
  }
  let crit = false;
  if (critChance > 0 && ctx.roll * 100 < critChance) {
    crit = true;
    let critDmg = 50;
    for (const key2 of Object.keys(STAT_META)) {
      const meta = STAT_META[key2];
      if (meta.channel !== "critDamage") continue;
      const v = g(key2);
      if (!v) continue;
      if (!evalCondition(meta.condition, ctx)) continue;
      critDmg += v;
    }
    mult *= 1 + critDmg / 100;
    reasons.push("クリティカル");
  }
  const lucky = g("luckyChance") > 0 && ctx.roll2 * 100 < g("luckyChance");
  if (lucky) {
    mult *= 3;
    reasons.push("ラッキーヒット");
  }
  const doubleStrike = g("doubleStrikeChance") > 0 && ctx.roll3 * 100 < g("doubleStrikeChance");
  if (doubleStrike) reasons.push("追加攻撃");
  {
    const gamble = ctx.st.stats.gambleLossPct ?? 0;
    if (gamble > 0) {
      const swing = 1 - Math.random() * gamble / 100;
      mult *= swing;
    }
  }
  return { multiplier: mult, flat: g("flatDamage"), crit, lucky, doubleStrike, reasons: [...new Set(reasons)].filter(Boolean) };
}
function computeDefense(ctx) {
  const s = ctx.st.stats;
  const g = (k) => s[k] ?? 0;
  if (g("dodgeChance") > 0 && ctx.roll * 100 < g("dodgeChance")) {
    return { damage: 0, dodge: true, lastStand: false };
  }
  let reduction = 0;
  for (const key2 of Object.keys(STAT_META)) {
    const meta = STAT_META[key2];
    if (meta.channel !== "defense") continue;
    const v = g(key2);
    if (!v) continue;
    if (!evalCondition(meta.condition, ctx)) continue;
    if (meta.negative) reduction -= v;
    else reduction += v;
  }
  const armorBase = ctx.st.armorBaseMult ?? 1;
  if (armorBase !== 1) reduction *= armorBase;
  reduction = Math.max(-200, Math.min(80, reduction));
  let dmg = ctx.damage * (1 - reduction / 100);
  dmg -= Math.max(0, g("flatReduce"));
  dmg = Math.max(0, dmg);
  let lastStand = false;
  if (g("lastStandChance") > 0 && dmg >= ctx.st.health && ctx.st.health > 1 && ctx.roll * 100 < g("lastStandChance")) {
    dmg = ctx.st.health - 1;
    lastStand = true;
  }
  return { damage: dmg, dodge: false, lastStand };
}
var pendingOffense = /* @__PURE__ */ new Map();
var pendingDefense = /* @__PURE__ */ new Map();
function buildContext(st, victim, attacker) {
  const status = statusOf(victim.id);
  let distance = 0;
  let behind = false;
  let moving = false;
  try {
    const p = attacker.location;
    const q = victim.location;
    distance = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2);
    const v = victim.getVelocity();
    moving = Math.sqrt(v.x * v.x + v.z * v.z) > 0.05;
    const facing = victim.getViewDirection();
    const toAttacker = { x: p.x - q.x, y: 0, z: p.z - q.z };
    const len = Math.sqrt(toAttacker.x ** 2 + toAttacker.z ** 2) || 1;
    const dot = (facing.x * toAttacker.x + facing.z * toAttacker.z) / len;
    behind = dot < -0.5;
  } catch {
  }
  return {
    st,
    victimTypeId: victim.typeId,
    victimHealthRatio: safeHealthRatio(victim),
    distance,
    night: st.night,
    dimId: st.dimId,
    inWater: st.inWater,
    underground: st.pos.y < 56,
    victimMoving: moving,
    behind,
    victimBurning: currentTickCache - status.burning < 100,
    victimFrozen: currentTickCache - status.frozen < 100,
    victimPoisoned: currentTickCache - status.poisoned < 100,
    ranged: false,
    blocking: st.offhand?.group === "shield",
    standing: false,
    crit: false,
    lowDurability: false
  };
}
function onBeforeHurt(ev) {
  try {
    if (scriptDamageTick === currentTickCache) return;
    const victim = ev.hurtEntity;
    const attacker = ev.damageSource.damagingEntity;
    const victimPlayer = asPlayer(victim);
    const attackerPlayer = asPlayer(attacker);
    if (attackerPlayer && attackerPlayer.id !== victim.id) {
      const st = getState(attackerPlayer.id, attackerPlayer.name);
      const ctx = buildContext(st, victim, attackerPlayer);
      ctx.ranged = !!ev.damageSource.damagingProjectile;
      const res = computeOffense({ ...ctx, roll: Math.random(), roll2: Math.random(), roll3: Math.random() });
      ev.damage = ev.damage * res.multiplier + res.flat;
      pendingOffense.set(attackerPlayer.id, {
        victim,
        crit: res.crit,
        doubleStrike: res.doubleStrike,
        tick: currentTickCache
      });
    }
    if (victimPlayer && (!attacker || attacker.id !== victim.id)) {
      const st = getState(victimPlayer.id, victimPlayer.name);
      const ctx = buildContext(st, victimPlayer, victimPlayer);
      ctx.ranged = !!ev.damageSource.damagingProjectile;
      ctx.crit = ev.damageSource.cause === EntityDamageCause.entityAttack && ev.damage > 6;
      const res = computeDefense({ ...ctx, damage: ev.damage, roll: Math.random() });
      if (res.dodge) {
        ev.cancel = true;
        pendingDefense.set(victimPlayer.id, { dodge: true, tick: currentTickCache, attacker });
        return;
      }
      ev.damage = res.damage;
      pendingDefense.set(victimPlayer.id, { dodge: false, lastStand: res.lastStand, tick: currentTickCache, attacker });
    }
  } catch (e) {
    zlog("entityHurt(before) 異常", { error: String(e) });
  }
}
function onAfterHurt(ev) {
  try {
    const victim = ev.hurtEntity;
    const attacker = ev.damageSource.damagingEntity;
    const attackerPlayer = asPlayer(attacker);
    const victimPlayer = asPlayer(victim);
    if (attackerPlayer) {
      const st = getState(attackerPlayer.id, attackerPlayer.name);
      const pend = pendingOffense.get(attackerPlayer.id);
      if (st.lastVictimId === victim.id) st.comboCount++;
      else st.comboCount = 1;
      st.lastVictimId = victim.id;
      st.lastHitTick = currentTickCache;
      onHitEffects(attackerPlayer, st, victim, pend?.crit === true, pend?.doubleStrike === true);
      pendingOffense.delete(attackerPlayer.id);
    }
    if (victimPlayer) {
      const st = getState(victimPlayer.id, victimPlayer.name);
      st.lastHurtTick = currentTickCache;
      const pend = pendingDefense.get(victimPlayer.id);
      onHurtEffects(victimPlayer, st, pend);
      pendingDefense.delete(victimPlayer.id);
    }
  } catch (e) {
    zlog("entityHurt(after) 異常", { error: String(e) });
  }
}
function dispatchProc(effect, value, attacker, st, victim) {
  const dim = victim.dimension;
  const loc = victim.location;
  const status = statusOf(victim.id);
  const chance = (p) => Math.random() * 100 < p;
  const applyEffect = (id, ticks, amp) => {
    try {
      victim.addEffect(id, ticks, { amplifier: Math.max(0, Math.min(4, Math.round(amp))), showParticles: false });
    } catch {
    }
  };
  switch (effect) {
    case "bleed":
      scheduleBleed(victim, value, 4);
      return true;
    case "stagger":
      if (chance(value)) {
        applyEffect("minecraft:slowness", 30, 4);
        applyEffect("minecraft:weakness", 30, 3);
      }
      return true;
    case "lucky":
      return true;
    // 已在伤害层处理
    case "doubleStrike":
      return true;
    case "finisher":
      if (chance(value)) {
        markScriptDamage();
        victim.applyDamage(4, { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
      }
      return true;
    case "shield":
      try {
        attacker.addEffect("minecraft:absorption", 200, { amplifier: 0, showParticles: false });
      } catch {
      }
      return true;
    case "lastStand":
      return true;
    // 防御层处理
    case "reflect":
      try {
        const e = victim.getEffect("minecraft:poison");
        if (e) {
          victim.removeEffect("minecraft:poison");
          attacker.addEffect("minecraft:poison", e.duration, { amplifier: e.amplifier, showParticles: false });
        }
      } catch {
      }
      return true;
    case "selfDamage":
      if (chance(value)) {
        try {
          attacker.applyDamage(1, { cause: EntityDamageCause.magic });
        } catch {
        }
      }
      return true;
    case "curseDrain":
      try {
        attacker.applyDamage(value, { cause: EntityDamageCause.magic });
      } catch {
      }
      return true;
    case "erratic":
      if (chance(value * 0.5)) {
        try {
          attacker.addEffect("minecraft:mining_fatigue", 40, { amplifier: 0, showParticles: false });
        } catch {
        }
      }
      return true;
    case "fire":
      if (chance(value)) {
        try {
          victim.setOnFire(4 + (st.stats.fireDuration ?? 0) * 2, true);
          status.burning = currentTickCache;
        } catch {
        }
      }
      return true;
    case "fireDuration":
      return true;
    case "fireBurst":
      if (statusOf(victim.id).burning) {
        markScriptDamage();
        victim.applyDamage(value, { cause: EntityDamageCause.fire, damagingEntity: attacker });
      }
      return true;
    case "fireGround":
      try {
        const below = dim.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
        if (below && below.isAir) below.setType("minecraft:fire");
      } catch {
      }
      return true;
    case "fireSea":
      areaDamage(attacker, victim, value, 4);
      return true;
    case "ice":
      if (chance(value)) {
        applyEffect("minecraft:slowness", 60, st.stats.slowAmp ?? 0);
        status.frozen = currentTickCache;
      }
      return true;
    case "slowAmp":
      return true;
    case "freeze":
      if (chance(value)) {
        applyEffect("minecraft:slowness", 90, 4);
        status.frozen = currentTickCache;
      }
      return true;
    case "iceBurst":
      return true;
    // 通过 frozenTargetPct 在伤害层处理
    case "chillAura":
      areaSlow(attacker, victim, 6);
      return true;
    case "frostExtend":
      return true;
    case "lightning":
      if (chance(value)) {
        try {
          dim.spawnEntity("minecraft:lightning_bolt", loc);
        } catch {
        }
      }
      return true;
    case "shock":
      applyEffect("minecraft:slowness", 60, value);
      return true;
    case "chain":
      if (chance(value)) chainTo(attacker, victim, 3);
      return true;
    case "storm":
      return true;
    case "poison":
      if (chance(value)) {
        applyEffect("minecraft:poison", 80, st.stats.poisonAmp ?? 0);
        status.poisoned = currentTickCache;
      }
      return true;
    case "corrode":
      applyEffect("minecraft:mining_fatigue", 80, value);
      return true;
    case "poisonAmp":
      return true;
    case "poisonBurst":
      return true;
    case "poisonCloud":
      areaSlow(attacker, victim, 5);
      return true;
    case "snakeBite":
      applyEffect("minecraft:poison", 100, Math.max(0, value / 20));
      return true;
    case "knockback":
      try {
        victim.applyKnockback({ x: 0, z: 0 }, Math.min(4, value / 25));
      } catch {
      }
      return true;
    case "stun":
      if (chance(value)) {
        applyEffect("minecraft:slowness", 30, 4);
        applyEffect("minecraft:weakness", 30, 3);
      }
      return true;
    case "slowOnHit":
      applyEffect("minecraft:slowness", 60, value);
      return true;
    case "weaken":
      applyEffect("minecraft:weakness", 80, value);
      return true;
    case "sunder":
      applyEffect("minecraft:mining_fatigue", 80, value);
      return true;
    case "fear":
      if (chance(value)) applyEffect("minecraft:speed", 60, 1);
      return true;
    case "root":
      if (chance(value)) {
        applyEffect("minecraft:slowness", 50, 4);
        applyEffect("minecraft:jump_boost", 50, 128);
      }
      return true;
    case "silence":
      if (chance(value)) applyEffect("minecraft:weakness", 60, 2);
      return true;
    case "dispel":
      if (chance(value)) {
        try {
          victim.removeEffect("minecraft:strength");
          victim.removeEffect("minecraft:speed");
          victim.removeEffect("minecraft:resistance");
        } catch {
        }
      }
      return true;
    case "sweep":
      areaDamage(attacker, victim, value, 3);
      return true;
    case "quake":
      areaDamage(attacker, victim, value, 3);
      return true;
    case "fissure":
      areaDamage(attacker, victim, value, 3);
      return true;
    case "earthSplit":
      areaDamage(attacker, victim, value, 3);
      return true;
    case "stormAoe":
      areaDamage(attacker, victim, value, 4);
      return true;
    case "explode":
      areaDamage(attacker, victim, value, 2);
      return true;
    case "whirlwind":
      if (chance(value)) areaDamage(attacker, victim, 50, 3);
      return true;
    case "chainHit":
      chainTo(attacker, victim, 2);
      return true;
    case "swordQi":
      if (chance(40)) {
        markScriptDamage();
        victim.applyDamage(Math.max(1, value / 10), { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
      }
      return true;
    case "flyingBlade":
      if (chance(25)) {
        markScriptDamage();
        victim.applyDamage(Math.max(1, value / 10), { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
      }
      return true;
    case "boneBreak":
      if (chance(value)) applyEffect("minecraft:slowness", 80, 2);
      return true;
    case "cleave":
      areaDamage(attacker, victim, value, 3);
      return true;
    case "tide":
      try {
        victim.applyKnockback({ x: 0, z: 0 }, 1.5);
      } catch {
      }
      return true;
    case "perfectBlock":
      return true;
    case "time":
      applyEffect("minecraft:slowness", 40, 2);
      return true;
    case "explosiveArrow":
      areaDamage(attacker, victim, value, 2);
      return true;
    case "flameArrow":
      if (chance(value)) {
        try {
          victim.setOnFire(6, true);
          status.burning = currentTickCache;
        } catch {
        }
      }
      return true;
    case "iceArrow":
      if (chance(value)) applyEffect("minecraft:slowness", 60, 2);
      return true;
    case "thunderArrow":
      if (chance(value)) {
        try {
          dim.spawnEntity("minecraft:lightning_bolt", loc);
        } catch {
        }
      }
      return true;
    case "splitArrow":
      if (chance(value)) areaDamage(attacker, victim, 60, 3);
      return true;
    case "arrowPierce":
      return true;
    case "multiShot":
      return true;
    case "homing":
      return true;
    case "destiny":
      return true;
    case "miracle":
      return true;
    case "space":
      return true;
    case "voidWalk":
      return true;
    case "worldTree":
      try {
        attacker.addEffect("minecraft:regeneration", 200, { amplifier: 1, showParticles: false });
      } catch {
      }
      return true;
    case "immortal":
      return true;
    case "soulbound":
      return true;
    case "gluttony":
      try {
        attacker.addEffect("minecraft:saturation", 100, { amplifier: 0, showParticles: false });
      } catch {
      }
      return true;
    case "curseBloodThirst":
      return true;
    case "curseFury":
      return true;
    case "deathPenalty":
      return true;
    case "binding":
      return true;
    case "smelt":
      return true;
    case "treasure":
      return true;
    case "earthVein":
      return true;
    case "geologist":
      return true;
    case "archaeology":
      return true;
    case "artisan":
      return true;
    case "insight":
      return true;
    case "dangerSense":
      return true;
    case "undeadSense":
      return true;
    case "soulEye":
      return true;
    case "minerEye":
      return true;
    case "growth":
      return true;
    case "farmlandRange":
      return true;
    case "autoReplant":
      return true;
    case "eternalFarm":
      return true;
    case "chainMine":
      return true;
    case "aoeMine":
      return true;
    case "debuffReduce":
      return true;
    case "controlResist":
      return true;
    case "slowResist":
      return true;
    case "sprintCost":
      return true;
    case "knockbackResist":
      return true;
    case "senseReduce":
      return true;
    case "waterNeg":
      return true;
    case "aggro":
      return true;
    case "debuffUp":
      return true;
    case "fallReduce":
      return true;
    case "iceWalk":
      return true;
    default:
      return false;
  }
}
function onHitEffects(attacker, st, victim, crit, doubleStrike) {
  const s = st.stats;
  let unhandled = 0;
  for (const key2 of Object.keys(STAT_META)) {
    const meta = STAT_META[key2];
    if (meta.channel !== "proc" || !meta.effect) continue;
    const v = s[key2] ?? 0;
    if (!v) continue;
    if (meta.condition === "crit" && !crit) continue;
    if (meta.condition === "combo" && st.comboCount < 2) continue;
    if (meta.condition === "hurtRecent" && currentTickCache - st.lastHurtTick > 100) continue;
    if (meta.condition === "blocking" && st.offhand?.group !== "shield") continue;
    if (meta.condition === "lowDurability") continue;
    if (!dispatchProc(meta.effect, v, attacker, st, victim)) unhandled++;
  }
  if (unhandled > 0) st.unhandledProcs = (st.unhandledProcs ?? 0) + unhandled;
  const steal = s.lifesteal ?? 0;
  if (steal > 0) heal(attacker, Math.max(0.5, steal / 100));
  if (doubleStrike) {
    markScriptDamage();
    try {
      victim.applyDamage(3, { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
    } catch {
    }
  }
  const durCost = (s.attackDurabilityCost ?? 0) + (crit ? s.critSelfDamage ?? 0 : 0);
  if (durCost > 0) damageMainhand(attacker, durCost);
  if ((s.skillDurabilityCost ?? 0) > 0 && Math.random() < 0.25) damageMainhand(attacker, s.skillDurabilityCost);
}
function onHurtEffects(player, st, pend) {
  const s = st.stats;
  const attacker = pend?.attacker;
  if (!attacker) return;
  const thorns = (s.thornsPct ?? 0) + (s.thornShieldPct ?? 0) + (s.reboundPct ?? 0);
  if (thorns > 0) {
    try {
      markScriptDamage();
      attacker.applyDamage(Math.max(1, thorns / 10), { cause: EntityDamageCause.thorns, damagingEntity: player });
    } catch {
    }
  }
  if ((s.hurtSpeedPct ?? 0) > 0) {
    try {
      player.addEffect("minecraft:speed", 60, { amplifier: Math.max(0, Math.min(3, Math.floor((s.hurtSpeedPct ?? 0) / 25))), showParticles: false });
    } catch {
    }
  }
  if ((s.uniqueSpace ?? 0) && st.healthRatio < 0.25 && Math.random() < 0.25) {
    try {
      const p = player.location;
      player.teleport({ x: p.x + (Math.random() * 6 - 3), y: p.y, z: p.z + (Math.random() * 6 - 3) }, { dimension: player.dimension });
    } catch {
    }
  }
  if ((s.hurtSlowSelf ?? 0) > 0) {
    try {
      player.addEffect("minecraft:slowness", 40, { amplifier: Math.max(0, Math.min(3, Math.floor((s.hurtSlowSelf ?? 0) / 20))), showParticles: false });
    } catch {
    }
  }
  if ((s.bloodLossPct ?? 0) > 0) {
    scheduleBleed(player, Math.max(1, (s.bloodLossPct ?? 0) / 5), 3);
  }
}
function heal(player, amount) {
  try {
    const h = player.getComponent("minecraft:health");
    if (!h) return;
    const next = Math.min(h.effectiveMax, h.currentValue + amount);
    if (next > h.currentValue) h.setCurrentValue(next);
  } catch {
  }
}
function safeHealthRatio(e) {
  try {
    const h = e.getComponent("minecraft:health");
    if (!h) return 1;
    return h.currentValue / Math.max(1, h.effectiveMax);
  } catch {
    return 1;
  }
}
function areaDamage(attacker, primary, pct, radius) {
  try {
    const list = primary.dimension.getEntities({
      location: primary.location,
      maxDistance: radius,
      excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
    });
    let hits = 0;
    for (const e of list) {
      if (e.id === primary.id) continue;
      if (hits >= 5) break;
      markScriptDamage();
      e.applyDamage(Math.max(1, pct / 20), { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
      hits++;
    }
  } catch {
  }
}
function areaSlow(attacker, primary, radius) {
  try {
    const list = primary.dimension.getEntities({
      location: primary.location,
      maxDistance: radius,
      excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
    });
    for (const e of list) {
      try {
        e.addEffect("minecraft:slowness", 60, { amplifier: 0, showParticles: false });
      } catch {
      }
    }
  } catch {
  }
  void attacker;
}
function chainTo(attacker, from, count) {
  try {
    const list = from.dimension.getEntities({
      location: from.location,
      maxDistance: 6,
      excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"]
    });
    let hits = 0;
    for (const e of list) {
      if (e.id === from.id) continue;
      if (hits >= count) break;
      markScriptDamage();
      e.applyDamage(3, { cause: EntityDamageCause.lightning, damagingEntity: attacker });
      hits++;
    }
  } catch {
  }
}
function scheduleBleed(target, dps, times) {
  for (let i = 1; i <= times; i++) {
    system.runTimeout(() => {
      try {
        if (target.isValid) {
          markScriptDamage();
          target.applyDamage(Math.max(1, Math.round(dps / 2)), { cause: EntityDamageCause.magic });
        }
      } catch {
      }
    }, i * 20);
  }
}
function onDie(ev) {
  try {
    const killer = asPlayer(ev.damageSource.damagingEntity);
    if (!killer) return;
    const st = getState(killer.id, killer.name);
    const s = st.stats;
    st.killStacks = Math.min(20, st.killStacks + 1);
    st.lastKillTick = currentTickCache;
    const healAmount = (s.killHeal ?? 0) + (s.bloodPool ?? 0) * 0.5 + (s.uniqueGluttony ? 3 : 0);
    if (healAmount > 0) heal(killer, healAmount);
    if ((s.bloodPool ?? 0) > 0) {
      st.bloodPool = Math.min(10, st.bloodPool + (s.bloodPool ?? 0) * 0.5);
      try {
        killer.addEffect("minecraft:absorption", 600, { amplifier: Math.max(0, Math.min(4, Math.floor(st.bloodPool / 2))), showParticles: false });
      } catch {
      }
    }
  } catch (e) {
    zlog("entityDie 異常", { error: String(e) });
  }
}
function installCombat() {
  world3.beforeEvents.entityHurt.subscribe(onBeforeHurt);
  world3.afterEvents.entityHurt.subscribe(onAfterHurt);
  world3.afterEvents.entityDie.subscribe(onDie);
}

// scripts/systems/MiningSystem.ts
import { BlockPermutation, EntityDamageCause as EntityDamageCause2, ItemStack as ItemStack2, system as system2, world as world4 } from "@minecraft/server";
var MAX_EXTRA_BREAKS = 16;
var ORES = [
  "coal_ore",
  "iron_ore",
  "copper_ore",
  "gold_ore",
  "redstone_ore",
  "lapis_ore",
  "diamond_ore",
  "emerald_ore",
  "quartz_ore",
  "nether_gold_ore",
  "ancient_debris",
  "deepslate_coal_ore",
  "deepslate_iron_ore",
  "deepslate_copper_ore",
  "deepslate_gold_ore",
  "deepslate_redstone_ore",
  "deepslate_lapis_ore",
  "deepslate_diamond_ore",
  "deepslate_emerald_ore"
];
var LOGS = [
  "oak_log",
  "spruce_log",
  "birch_log",
  "jungle_log",
  "acacia_log",
  "dark_oak_log",
  "mangrove_log",
  "cherry_log",
  "pale_oak_log",
  "crimson_stem",
  "warped_stem",
  "oak_wood",
  "spruce_wood",
  "birch_wood",
  "jungle_wood",
  "acacia_wood",
  "dark_oak_wood"
];
var CROPS = {
  "minecraft:wheat": "minecraft:wheat_seeds",
  "minecraft:carrots": "minecraft:carrot",
  "minecraft:potatoes": "minecraft:potato",
  "minecraft:beetroot": "minecraft:beetroot_seeds"
};
function bare(typeId) {
  return typeId.replace("minecraft:", "");
}
function isOre(typeId) {
  const b = bare(typeId);
  return ORES.some((o) => b === o || b.endsWith("_" + o));
}
function isLog(typeId) {
  const b = bare(typeId);
  return LOGS.some((l) => b === l || b.endsWith("_" + l));
}
function breakLikePlayer(player, dim, x, y, z) {
  try {
    dim.runCommand(`setblock ${Math.floor(x)} ${Math.floor(y)} ${Math.floor(z)} air destroy`);
  } catch (e) {
    zlog("setblock destroy 失敗", { x, y, z, error: String(e) });
  }
}
function onBreak(ev) {
  try {
    const player = ev.player;
    const spec = mainhandSpec(player);
    if (!spec || !spec.identified) return;
    const st = getState(player.id, player.name);
    const s = st.stats;
    const g = (k) => s[k] ?? 0;
    const block = ev.block;
    const dim = player.dimension;
    const loc = block.location;
    const typeId = ev.brokenBlockPermutation.type.id;
    const b = bare(typeId);
    if (g("autoReplant") > 0 && CROPS[typeId]) {
      const growth = ev.brokenBlockPermutation.getState("growth");
      if (growth === void 0 || Number(growth) >= 7) {
        system2.run(() => {
          try {
            dim.getBlock(loc)?.setPermutation(BlockPermutation.resolve(typeId, { growth: 0 }));
          } catch {
          }
        });
      }
    }
    const chain = g("chainMine") > 0 && isOre(typeId);
    const feller = g("treeFeller") > 0 && isLog(typeId);
    const aoe = g("aoeMine") > 0 || g("aoeBreak") > 0;
    if (chain || feller) {
      const targets = collectConnected(dim, loc, typeId, feller ? 24 : 8 + g("chainMine") * 3);
      system2.run(() => {
        for (const t of targets.slice(0, MAX_EXTRA_BREAKS)) {
          breakLikePlayer(player, dim, t.x, t.y, t.z);
        }
      });
    } else if (aoe) {
      const radius = g("aoeMine") >= 3 || g("aoeBreak") >= 3 ? 1 : 1;
      system2.run(() => {
        let n = 0;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
              if (!dx && !dy && !dz) continue;
              if (n >= MAX_EXTRA_BREAKS) break;
              const x = Math.floor(loc.x) + dx;
              const y = Math.floor(loc.y) + dy;
              const z = Math.floor(loc.z) + dz;
              try {
                const blk = dim.getBlock({ x, y, z });
                if (!blk || blk.isAir) continue;
                const id = blk.typeId;
                if (id === "minecraft:bedrock" || id.includes("chest") || id.includes("spawner")) continue;
                breakLikePlayer(player, dim, x, y, z);
                n++;
              } catch {
              }
            }
          }
        }
      });
    }
    const crop = !!CROPS[typeId];
    const extraPct = g("extraDropPct") + (isOre(typeId) ? g("oreDropPct") + g("greedyMinerPct") : 0) + (isLog(typeId) ? g("woodPct") : 0) + g("gatherPct") + (crop ? g("harvestPct") + g("farmDropPct") + g("seedMasterPct") : 0) + g("hiddenLuck") + g("hiddenGreed") + g("abundantChance");
    if (extraPct > 0 && Math.random() * 100 < extraPct / 2) {
      const stack = blockItemStack(typeId);
      if (stack) {
        system2.run(() => {
          try {
            dim.spawnItem(stack, { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 });
          } catch {
          }
        });
      }
    }
    const treasure = g("treasureChance") + g("archaeologyChance");
    if (treasure > 0 && Math.random() * 100 < treasure) {
      const loot = pickTreasure();
      system2.run(() => {
        try {
          dim.spawnItem(loot, { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 });
        } catch {
        }
      });
    }
    const wear = g("agingPct") + g("unstablePct") + g("unstableVeinPct");
    if (wear > 0 && Math.random() * 100 < wear / 3) damageMainhand(player, 1);
    const cost = g("moveDurabilityCost");
    if (cost > 0 && Math.random() < 0.25) damageMainhand(player, cost);
    const decay = g("miningSpeedDecay");
    if (decay > 0 && Math.random() * 100 < decay / 4) {
      try {
        player.addEffect("minecraft:mining_fatigue", 60, { amplifier: 0, showParticles: false });
      } catch {
      }
    }
    const slowSelf = g("mineSlowSelf");
    if (slowSelf > 0 && Math.random() * 100 < slowSelf / 2) {
      try {
        player.addEffect("minecraft:slowness", 40, { amplifier: 0, showParticles: false });
      } catch {
      }
    }
    const selfDmg = g("selfDamageChance");
    if (selfDmg > 0 && Math.random() * 100 < selfDmg / 3) {
      try {
        player.applyDamage(1, { cause: EntityDamageCause2.magic });
      } catch {
      }
    }
    st.lastMineTick = 0;
    st.mineCount++;
  } catch (e) {
    zlog("playerBreakBlock 異常", { error: String(e) });
  }
}
function collectConnected(dim, start, typeId, limit) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const queue2 = [
    { x: Math.floor(start.x), y: Math.floor(start.y), z: Math.floor(start.z) }
  ];
  const dirs = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1]
  ];
  while (queue2.length && out.length < limit) {
    const cur = queue2.shift();
    const key2 = `${cur.x},${cur.y},${cur.z}`;
    if (seen.has(key2)) continue;
    seen.add(key2);
    try {
      const blk = dim.getBlock(cur);
      if (!blk || blk.typeId !== typeId) continue;
    } catch {
      continue;
    }
    out.push(cur);
    for (const d of dirs) {
      queue2.push({ x: cur.x + d[0], y: cur.y + d[1], z: cur.z + d[2] });
    }
  }
  return out;
}
function blockItemStack(typeId) {
  try {
    return new ItemStack2(typeId, 1);
  } catch {
    return void 0;
  }
}
var TREASURE_TABLE = [
  "minecraft:iron_nugget",
  "minecraft:gold_nugget",
  "minecraft:coal",
  "minecraft:flint",
  "minecraft:bone",
  "minecraft:clay_ball",
  "minecraft:raw_iron",
  "minecraft:raw_gold",
  "minecraft:amethyst_shard",
  "minecraft:lapis_lazuli"
];
function pickTreasure() {
  const id = TREASURE_TABLE[Math.floor(Math.random() * TREASURE_TABLE.length)];
  return new ItemStack2(id, 1);
}
function installMining() {
  world4.afterEvents.playerBreakBlock.subscribe(onBreak);
}

// scripts/systems/DurabilitySystem.ts
import { EquipmentSlot as EquipmentSlot2, system as system3, world as world5 } from "@minecraft/server";

// scripts/runtime/durability/DurabilityEngine.ts
var LOW_DURABILITY_RATIO = 0.25;
function computeWear(ctx) {
  const s = ctx.stats;
  const g = (k) => {
    const v = s[k];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  const reasons = [];
  let wear = Math.max(0, ctx.baseWear);
  let prevented = false;
  const save = g("durabilitySave");
  if (save > 0 && ctx.rng() * 100 < save) {
    prevented = true;
    reasons.push("durabilitySave");
  }
  if (!prevented && ctx.trigger === "shield_block") {
    const ss = g("shieldSavePct");
    if (ss > 0 && ctx.rng() * 100 < ss) {
      prevented = true;
      reasons.push("shieldSavePct");
    }
  }
  if (prevented) {
    return {
      adjusted: true,
      finalWear: 0,
      prevented: true,
      extraWear: 0,
      preventBreak: false,
      reasons
    };
  }
  const frugal = g("frugalPct");
  if (frugal > 0) {
    const f = Math.min(95, frugal) / 100;
    wear *= 1 - f;
    reasons.push("frugalPct");
  }
  const mult = g("durabilityMult");
  if (mult !== 0) {
    wear *= 1 + mult / 100;
    reasons.push("durabilityMult");
  }
  if (ctx.trigger === "time") {
    const aging = g("agingPct");
    if (aging > 0) {
      wear *= 1 + aging / 100;
      reasons.push("agingPct");
    }
  }
  let extra = 0;
  const addExtra = (v, tag) => {
    if (v > 0) {
      extra += v;
      reasons.push(tag);
    }
  };
  switch (ctx.trigger) {
    case "entity_hit":
      addExtra(g("attackDurabilityCost"), "attackDurabilityCost");
      break;
    case "crit":
      addExtra(g("critDurabilityCost"), "critDurabilityCost");
      break;
    case "skill":
      addExtra(g("skillDurabilityCost"), "skillDurabilityCost");
      break;
    case "movement":
      addExtra(g("moveDurabilityCost"), "moveDurabilityCost");
      break;
    case "combo": {
      const u = g("unstablePct");
      if (u > 0 && ctx.rng() * 100 < u) addExtra(1, "unstablePct");
      break;
    }
    case "vein": {
      const uv = g("unstableVeinPct");
      if (uv > 0 && ctx.rng() * 100 < uv) addExtra(1, "unstableVeinPct");
      break;
    }
    default:
      break;
  }
  const luck = g("luckBreakChance");
  if (luck > 0 && ctx.rng() * 100 < luck) addExtra(1, "luckBreakChance");
  const drain = g("durabilityDrain");
  if (drain > 0) {
    extra += drain;
    reasons.push("durabilityDrain");
  }
  const frac = g("fractureChance");
  if (frac > 0 && ctx.maxDurability > 0) {
    const ratio = ctx.remaining / ctx.maxDurability;
    if (ratio <= LOW_DURABILITY_RATIO && ctx.rng() * 100 < frac) {
      addExtra(1, "fractureChance");
    }
  }
  wear += extra;
  let preventBreak = false;
  const ind = g("indestructiblePct");
  if (ind > 0) {
    const after = ctx.remaining - wear;
    if (after <= 0 && ctx.rng() * 100 < ind) {
      preventBreak = true;
      reasons.push("indestructiblePct");
    }
  }
  const finalWear = Math.max(0, wear);
  return {
    adjusted: Math.abs(finalWear - ctx.baseWear) > 1e-9 || reasons.length > 0,
    finalWear,
    prevented: false,
    extraWear: extra,
    preventBreak,
    reasons
  };
}
function pickDurabilityStats(stats) {
  const keys = [
    "durabilitySave",
    "shieldSavePct",
    "frugalPct",
    "indestructiblePct",
    "durabilityMult",
    "durabilityDrain",
    "fractureChance",
    "skillDurabilityCost",
    "attackDurabilityCost",
    "moveDurabilityCost",
    "agingPct",
    "unstablePct",
    "critDurabilityCost",
    "luckBreakChance",
    "unstableVeinPct"
  ];
  const out = {};
  for (const k of keys) {
    const v = stats[k];
    if (typeof v === "number" && v !== 0) out[k] = v;
  }
  return out;
}

// scripts/systems/DurabilitySystem.ts
var lastDamage = /* @__PURE__ */ new Map();
var lastMoveTick = /* @__PURE__ */ new Map();
var MOVE_INTERVAL_TICKS = 60;
var MOVE_BASE_WEAR = 0;
var key = (p, slot) => `${p.id}:${slot}`;
var writing = false;
var pendingWrites = /* @__PURE__ */ new Map();
function durabilityOf(stack) {
  if (!stack) return void 0;
  try {
    const d = stack.getComponent("minecraft:durability");
    if (!d) return void 0;
    return { damage: d.damage, max: d.maxDurability };
  } catch {
    return void 0;
  }
}
function correctSlot(player, slot, trigger, opts = {}) {
  const eq = player.getComponent("minecraft:equippable");
  const item = eq?.getEquipment(slot);
  const d = durabilityOf(item);
  if (!eq || !item || !d) return false;
  const k = key(player, slot);
  const last = lastDamage.get(k);
  const now = d.damage;
  if (last === void 0) {
    lastDamage.set(k, now);
    return false;
  }
  const baseWear = opts.baseWearOverride ?? now - last;
  if (baseWear <= 0) {
    lastDamage.set(k, now);
    return false;
  }
  const spec = readSpec(item);
  const stats = spec ? pickDurabilityStats(specStats(spec)) : {};
  const rng = opts.rng ?? Math.random;
  const res = computeWear({
    baseWear,
    trigger,
    stats,
    remaining: Math.max(0, d.max - now),
    maxDurability: d.max,
    rng
  });
  if (!res.adjusted) {
    lastDamage.set(k, now);
    return false;
  }
  let target = last + res.finalWear;
  if (res.preventBreak) target = Math.min(target, d.max - 1);
  target = Math.max(0, Math.min(target, d.max));
  if (Math.abs(target - now) > 1e-9) {
    pendingWrites.set(k, { player, slot, target });
    lastDamage.set(k, target);
    zlog("durability:adjust", {
      player: player.name,
      slot,
      trigger,
      baseWear,
      finalWear: res.finalWear,
      target,
      reasons: res.reasons,
      deferred: true
    });
    return true;
  }
  lastDamage.set(k, target);
  return false;
}
function correctAllArmor(player, trigger) {
  for (const s of [EquipmentSlot2.Head, EquipmentSlot2.Chest, EquipmentSlot2.Legs, EquipmentSlot2.Feet]) {
    correctSlot(player, s, trigger);
  }
}
function asPlayer2(e) {
  if (!e) return void 0;
  if (e.typeId === "minecraft:player") return e;
  return void 0;
}
var installed = false;
function installDurability() {
  if (installed) return;
  installed = true;
  world5.afterEvents.playerBreakBlock.subscribe((ev) => {
    try {
      const player = ev.player;
      const before = durabilityOf(ev.itemStackBeforeBreak);
      const after = durabilityOf(ev.itemStackAfterBreak);
      if (before && after && after.damage > before.damage) {
        const slot = EquipmentSlot2.Mainhand;
        lastDamage.set(key(player, slot), before.damage);
        correctSlot(player, slot, "block_break");
      } else {
        correctSlot(player, EquipmentSlot2.Mainhand, "block_break");
      }
    } catch (e) {
      zlog("durability:break-failed", { error: String(e) });
    }
  });
  world5.afterEvents.entityHurt.subscribe((ev) => {
    try {
      const victim = ev.hurtEntity;
      const src = ev.damageSource;
      const attacker = asPlayer2(src.damagingEntity);
      if (attacker) {
        const trigger = ev.damage >= 9 ? "crit" : "entity_hit";
        correctSlot(attacker, EquipmentSlot2.Mainhand, trigger);
      }
      const pv = asPlayer2(victim);
      if (pv) correctAllArmor(pv, "armor_hit");
    } catch (e) {
      zlog("durability:hurt-failed", { error: String(e) });
    }
  });
  system3.runInterval(() => {
    try {
      const tick = system3.currentTick;
      for (const player of world5.getAllPlayers()) {
        if (!player || !player.isValid) continue;
        const k = player.id;
        const lastT = lastMoveTick.get(k) ?? 0;
        if (tick - lastT < MOVE_INTERVAL_TICKS) continue;
        lastMoveTick.set(k, tick);
        for (const s of [EquipmentSlot2.Feet, EquipmentSlot2.Legs, EquipmentSlot2.Chest, EquipmentSlot2.Head]) {
          correctSlot(player, s, "movement", { baseWearOverride: MOVE_BASE_WEAR });
        }
      }
    } catch {
    }
  }, MOVE_INTERVAL_TICKS);
  system3.runInterval(() => {
    primeSnapshots();
    flushWrites();
  }, 1);
  world5.afterEvents.playerLeave.subscribe((ev) => {
    try {
      for (const k of [...lastDamage.keys()]) {
        if (k.startsWith(`${ev.playerId}:`)) lastDamage.delete(k);
      }
      lastMoveTick.delete(ev.playerId);
    } catch {
    }
  });
  zlog("durability:installed", { moveIntervalTicks: MOVE_INTERVAL_TICKS });
}
function primeSnapshots() {
  try {
    for (const player of world5.getAllPlayers()) {
      if (!player || !player.isValid) continue;
      const eq = player.getComponent("minecraft:equippable");
      if (!eq) continue;
      for (const slot of [
        EquipmentSlot2.Mainhand,
        EquipmentSlot2.Offhand,
        EquipmentSlot2.Head,
        EquipmentSlot2.Chest,
        EquipmentSlot2.Legs,
        EquipmentSlot2.Feet
      ]) {
        const k = key(player, slot);
        if (lastDamage.has(k)) continue;
        const d = durabilityOf(eq.getEquipment(slot));
        if (d) lastDamage.set(k, d.damage);
      }
    }
  } catch {
  }
}
function flushWrites() {
  if (writing) return;
  writing = true;
  try {
    for (const [k, w] of pendingWrites) {
      pendingWrites.delete(k);
      try {
        if (!w.player.isValid) continue;
        const eq = w.player.getComponent("minecraft:equippable");
        const item = eq?.getEquipment(w.slot);
        if (!eq || !item) continue;
        const dur = item.getComponent("minecraft:durability");
        if (!dur) continue;
        const clamped = Math.max(0, Math.min(w.target, dur.maxDurability));
        if (Math.abs(clamped - dur.damage) < 1e-9) continue;
        dur.damage = clamped;
        eq.setEquipment(w.slot, item);
        lastDamage.set(k, clamped);
      } catch (e) {
        zlog("durability:flush-failed", { key: k, error: String(e) });
      }
    }
  } finally {
    writing = false;
  }
}

// scripts/runtime/environment/EnvironmentEngine.ts
import { system as system4, world as world6 } from "@minecraft/server";
var selfApplied = /* @__PURE__ */ new Map();
var POLL_TICKS = 40;
function tier(pct, step) {
  if (pct <= 0) return 0;
  return Math.max(1, Math.min(3, Math.ceil(pct / step)));
}
function desiredEffects(stats) {
  const out = [];
  const g = (k) => stats[k] ?? 0;
  const vision = g("visionPct");
  if (vision > 0) out.push({ id: "minecraft:blindness", amplifier: tier(vision, 8) - 1, duration: POLL_TICKS + 40 });
  const slow = Math.max(g("iceSlip") * 8, g("turnSlow"), g("sprintStartup"), g("shockImmobilePct"));
  if (slow > 0) out.push({ id: "minecraft:slowness", amplifier: tier(slow, 10) - 1, duration: POLL_TICKS + 40 });
  const gluttony = g("gluttonyGreedPct");
  if (gluttony > 0) out.push({ id: "minecraft:hunger", amplifier: tier(gluttony, 12) - 1, duration: POLL_TICKS + 40 });
  if (g("falseAlert") > 0) out.push({ id: "minecraft:nausea", amplifier: 0, duration: POLL_TICKS + 40 });
  return out;
}
function applyFor(player, want) {
  const key2 = player.id;
  const prev = selfApplied.get(key2) ?? /* @__PURE__ */ new Set();
  const next = /* @__PURE__ */ new Set();
  let changed = 0;
  for (const d of want) {
    next.add(d.id);
    try {
      const cur = player.getEffect(d.id);
      if (!cur || cur.amplifier !== d.amplifier || cur.duration < 20) {
        player.addEffect(d.id, d.duration, { amplifier: d.amplifier, showParticles: false });
        changed++;
      }
    } catch (e) {
      zlog("env:add-effect-failed", { effect: d.id, error: String(e) });
    }
  }
  for (const id of prev) {
    if (next.has(id)) continue;
    try {
      player.removeEffect(id);
      changed++;
    } catch {
    }
  }
  selfApplied.set(key2, next);
  return changed;
}
var installed2 = false;
function installEnvironment() {
  if (installed2) return;
  installed2 = true;
  system4.runInterval(() => {
    try {
      for (const player of world6.getAllPlayers()) {
        if (!player || !player.isValid) continue;
        const st = getState(player.id, player.name);
        if (!st || !st.stats) continue;
        applyFor(player, desiredEffects(st.stats));
      }
    } catch (e) {
      zlog("env:poll-failed", { error: String(e) });
    }
  }, POLL_TICKS);
  world6.beforeEvents.entityHurt.subscribe((ev) => {
    try {
      const victim = ev.hurtEntity;
      if (victim.typeId !== "minecraft:player") return;
      if (ev.damageSource.cause !== "fall") return;
      const st = getState(victim.id, victim.name);
      if (!st || !st.stats) return;
      const reduce = st.stats.fallReducePct ?? 0;
      const add = st.stats.fallDamagePct ?? 0;
      if (reduce <= 0 && add <= 0) return;
      let dmg = ev.damage;
      if (reduce > 0) dmg *= 1 - Math.min(80, reduce) / 100;
      if (add > 0) dmg *= 1 + Math.min(100, add) / 100;
      ev.damage = Math.max(0, dmg);
    } catch {
    }
  });
  world6.afterEvents.playerLeave.subscribe((ev) => {
    selfApplied.delete(ev.playerId);
  });
  zlog("env:installed", { pollTicks: POLL_TICKS });
}

// scripts/commands/ScriptEvents.ts
import { system as system7, world as world11 } from "@minecraft/server";
import { EquipmentSlot as EquipmentSlot3, ItemStack as ItemStack5 } from "@minecraft/server";

// scripts/ui/InspectForm.ts
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
function inspectLines(spec, resonances = []) {
  const q = QUALITY_BY_ID[spec.quality];
  const lines = [];
  const syn = spec.synergy >= 0.85 ? "極高" : spec.synergy >= 0.65 ? "高" : spec.synergy >= 0.4 ? "ノーマル" : "衝突";
  lines.push(`品質：${q ? q.name : spec.quality}    スコア：${spec.score}    リスク：${spec.risk}    シナジー：${Math.round(spec.synergy * 100)}%（${syn}）`);
  lines.push(`タイプ：${spec.baseName}    基本ステータス：\xD7${spec.baseMult.toFixed(2)}`);
  lines.push("");
  if (!spec.identified) {
    lines.push("【未鑑定】");
    lines.push("鑑定の巻物を使う（メインハンドに装備 + オフハンドに巻物、作業台を右クリック）と本当のアフィックスを確認できる。");
    return lines;
  }
  const sec = (title, list) => {
    if (!list.length) return;
    lines.push(`\u2014 ${title} \u2014`);
    for (const a of list) {
      const def = AFFIX_BY_ID[a.id];
      const rar = a.rarity && a.rarity !== "common" ? `[${RARITY_NAME[a.rarity]}]` : "";
      const text = def ? modText(def, a.level, a.roll ?? 1) : "";
      lines.push(`${def?.name ?? a.id} ${roman(a.level)} ${rar}`);
      if (text) lines.push(`    ${text}`);
    }
  };
  sec("ポジティブアフィックス", spec.pos);
  sec("諸刃アフィックス", spec.dual);
  sec("特殊アフィックス", spec.special);
  sec("マイナスアフィックス", spec.neg);
  sec("呪い", spec.curse);
  sec("ユニークアフィックス", spec.unique);
  const awaken = Object.keys(spec.hidden).filter((k) => k.startsWith("hiddenAwaken"));
  if (awaken.length) {
    lines.push("");
    lines.push(`隠しアフィックス：${spec.awakened ? "覚醒済み" : "未覚醒（しばらく使用すると覚醒）"}`);
    if (spec.awakened) for (const k of awaken) lines.push(`  ${STAT_META[k]?.label ?? k}`);
  }
  if (Object.keys(spec.hidden).length) {
    lines.push("");
    lines.push("— 隠し属性 —");
    for (const k of Object.keys(spec.hidden)) {
      if (k.startsWith("hiddenAwaken")) continue;
      lines.push(`${STAT_META[k]?.label ?? k} +${round(spec.hidden[k])}`);
    }
  }
  const hint = resonanceHint(spec);
  if (hint) {
    lines.push("");
    lines.push(hint.replace(/§./g, ""));
  }
  if (resonances.length) {
    lines.push("");
    lines.push("— 発動中の共鳴 —");
    for (const r of resonances) lines.push(`${r.def.name}：${r.def.desc}`);
  }
  return lines;
}
function statLines(spec) {
  const stats = specStats(spec);
  const lines = [];
  for (const k of Object.keys(stats)) {
    const v = stats[k];
    if (!v) continue;
    const meta = STAT_META[k];
    lines.push(`${meta?.label ?? k}：${v > 0 ? "+" : ""}${round(v)}${meta?.unit === "pct" ? "%" : ""}`);
  }
  return lines.length ? lines : ["（有効な属性なし）"];
}
async function showInspect(player, spec, resonances = []) {
  const form = new ActionFormData().title(spec.identified ? spec.name.replace(/§./g, "") : "神秘の装備").body(inspectLines(spec, resonances).join("\n")).button("属性の詳細").button("閉じる");
  const res = await form.show(player);
  if (res.canceled) return;
  if (res.selection === 0) {
    await new MessageFormData().title("属性の詳細").body(statLines(spec).join("\n")).button1("戻る").button2("閉じる").show(player);
  }
}

// scripts/tests/SelfTest.ts
import {
  EntityDamageCause as EntityDamageCause3,
  EffectTypes,
  EnchantmentTypes,
  EntityComponentTypes as EntityComponentTypes2,
  ItemStack as ItemStack3,
  Player as Player7,
  system as system5,
  world as world8
} from "@minecraft/server";

// scripts/systems/StatSystem.ts
import { world as world7 } from "@minecraft/server";
var EFFECT_DURATION = 100;
var EFFECT_ID = {
  speed: "minecraft:speed",
  haste: "minecraft:haste",
  mining_fatigue: "minecraft:mining_fatigue",
  health_boost: "minecraft:health_boost",
  regeneration: "minecraft:regeneration",
  absorption: "minecraft:absorption",
  jump_boost: "minecraft:jump_boost",
  fire_resistance: "minecraft:fire_resistance",
  water_breathing: "minecraft:water_breathing",
  night_vision: "minecraft:night_vision",
  conduit_power: "minecraft:conduit_power",
  slowness: "minecraft:slowness",
  hunger: "minecraft:hunger",
  wither: "minecraft:wither",
  // 近似映射（见 reports/IMPLEMENTATION_MAPPING.md）
  regenNeg: "minecraft:hunger",
  healthNeg: "minecraft:wither"
};
var INVERSE_EFFECT = {
  speed: "slowness",
  haste: "mining_fatigue",
  jump_boost: "slowness",
  regeneration: "hunger",
  resistance: "wither",
  health_boost: "wither",
  absorption: "wither",
  conduit_power: "slowness",
  night_vision: "slowness"
};
function ampFor(unit, value, per) {
  const abs = Math.abs(value);
  if (per && per > 0) return Math.max(0, Math.min(4, Math.floor(abs / per)));
  switch (unit) {
    case "pct":
      return Math.max(0, Math.min(4, Math.floor(abs / 20)));
    case "amp":
      return Math.max(0, Math.min(4, Math.round(abs)));
    case "flat":
      return Math.max(0, Math.min(4, Math.floor(abs / 4)));
    default:
      return 0;
  }
}
function effectPlan(stats, ctx) {
  const byId = /* @__PURE__ */ new Map();
  const add = (effect, amp, from) => {
    const id = EFFECT_ID[effect];
    if (!id) return;
    const cur = byId.get(id);
    if (cur) {
      cur.amp = Math.max(cur.amp, amp);
      cur.from.push(from);
    } else {
      byId.set(id, { id, amp, from: [from] });
    }
  };
  for (const key2 of Object.keys(STAT_META)) {
    const meta = STAT_META[key2];
    if (meta.channel !== "effect" && meta.channel !== "mining" || !meta.effect && meta.channel !== "mining") continue;
    let v = stats[key2] ?? 0;
    if (!v) continue;
    if (meta.condition === "underground" && !ctx.underground) continue;
    if (meta.condition === "selfLowHp" && !ctx.lowHp) continue;
    if (meta.condition === "night" || meta.condition === "day" || meta.condition === "nether" || meta.condition === "water") {
      continue;
    }
    if (meta.condition === "combo" || meta.condition === "hurtRecent" || meta.condition === "killStack") continue;
    const baseEffect = meta.channel === "mining" ? "haste" : meta.effect;
    let eff = baseEffect;
    if (!meta.negative && v < 0) eff = INVERSE_EFFECT[baseEffect] ?? baseEffect;
    const amp = ampFor(meta.unit, v, meta.per);
    if (amp <= 0 && meta.unit !== "flag") continue;
    add(eff, amp, key2);
  }
  return [...byId.values()];
}
function refreshPlayer(player, generate = true) {
  const st = getState(player.id, player.name);
  const eq = processEquipped(player, generate);
  const stats = emptyStats();
  const armorSlots = [eq.head, eq.chest, eq.legs, eq.feet];
  const weaponSlots = [eq.weapon, eq.offhand];
  const channelDomain = (ch) => {
    switch (ch) {
      case "offMult":
      case "critChance":
      case "critDamage":
      case "lifesteal":
      case "killHeal":
      case "proc":
      case "mining":
      case "drop":
        return "weapon";
      case "defense":
      case "flatReduce":
      case "dodge":
      case "thorns":
        return "armor";
      default:
        return "both";
    }
  };
  const mergeFrom = (list, want) => {
    for (const spec of list) {
      if (!spec) continue;
      const full = specStats(spec);
      const filtered = {};
      for (const [k, v] of Object.entries(full)) {
        const meta = STAT_META[k];
        const dom = meta ? channelDomain(meta.channel) : "both";
        if (dom === "both" || dom === want) filtered[k] = v;
      }
      aggregate(stats, filtered);
    }
  };
  mergeFrom(weaponSlots, "weapon");
  mergeFrom(armorSlots, "armor");
  const armor = { head: eq.head, chest: eq.chest, legs: eq.legs, feet: eq.feet };
  const armorSpecs0 = [eq.head, eq.chest, eq.legs, eq.feet].filter(Boolean);
  const resonances = [
    ...computeArmorResonances(armor),
    ...computeToolResonances(eq.weapon)
  ];
  applyResonances(stats, resonances);
  const armorQuality = armorSpecs0.map((s) => QUALITY_ARMOR_DEFENSE[s.quality] ?? 0);
  if (armorQuality.length) {
    const avg = armorQuality.reduce((a, b) => a + b, 0) / armorQuality.length;
    if (avg < 0) stats.qualityArmorPct = Math.max(-25, avg);
    else if (avg > 0) stats.qualityArmorVulnPct = Math.min(35, avg);
  }
  for (const key2 of Object.keys(stats)) {
    const capped = clampCapped(key2, stats[key2]);
    if (capped !== stats[key2]) stats[key2] = capped;
  }
  st.stats = stats;
  st.weaponBaseMult = eq.weapon ? eq.weapon.baseMult : 1;
  st.armorBaseMult = armorSpecs0.length ? armorSpecs0.reduce((a, s) => a + s.baseMult, 0) / armorSpecs0.length : 1;
  st.weapon = eq.weapon;
  st.armor = armor;
  st.resonances = resonances;
  st.offhand = eq.offhand;
  return st;
}
function applyEffects(player, st) {
  const underground = player.location.y < 56;
  const health = player.getComponent("minecraft:health");
  const lowHp = health ? health.currentValue / Math.max(1, health.effectiveMax) < 0.35 : false;
  const plan = effectPlan(st.stats, { underground, lowHp });
  let applied = 0;
  for (const entry of plan) {
    try {
      const existing = player.getEffect(entry.id);
      if (existing && existing.amplifier > entry.amp) continue;
      player.addEffect(entry.id, EFFECT_DURATION, { amplifier: entry.amp, showParticles: false });
      applied++;
    } catch (e) {
      zlog("addEffect 失敗", { id: entry.id, error: String(e) });
    }
  }
  return applied;
}
function isNight(_player) {
  try {
    const time = world7.getTimeOfDay();
    return time >= 13e3 && time <= 23e3;
  } catch {
    return false;
  }
}
function dimensionId(player) {
  try {
    return player.dimension.id;
  } catch {
    return "minecraft:overworld";
  }
}

// scripts/tests/SelfTest.ts
var SAMPLE_TYPES = [
  "minecraft:wooden_sword",
  "minecraft:stone_sword",
  "minecraft:iron_sword",
  "minecraft:diamond_sword",
  "minecraft:netherite_sword",
  "minecraft:wooden_axe",
  "minecraft:diamond_pickaxe",
  "minecraft:iron_shovel",
  "minecraft:golden_hoe",
  "minecraft:leather_helmet",
  "minecraft:iron_chestplate",
  "minecraft:diamond_leggings",
  "minecraft:netherite_boots",
  "minecraft:bow",
  "minecraft:crossbow",
  "minecraft:trident",
  "minecraft:shield"
];
var MAX_RETRIES = 400;
var running = false;
var stepIndex = 0;
var steps = [];
var scratch = {};
function isSelfTestRunning() {
  return running;
}
function startSelfTest() {
  if (running) return "セルフテストは実行中です";
  buildSteps();
  stepIndex = 0;
  running = true;
  zlog("Self test started", { steps: steps.length });
  return `セルフテストを開始しました（${steps.length} 項目）`;
}
function runStep() {
  if (!running) return;
  if (stepIndex >= steps.length) {
    running = false;
    pass("af.runtime.summary", { steps: steps.length, finished: true });
    zlog("Self test finished");
    return;
  }
  const step = steps[stepIndex];
  try {
    const done = step.fn();
    if (done === false) {
      step.attempts = (step.attempts ?? 0) + 1;
      if (step.attempts > MAX_RETRIES) {
        fail(step.id, `${MAX_RETRIES} 回再試行しても準備完了になりません（ワールドリソースが未準備）`);
        stepIndex++;
      }
      return;
    }
    stepIndex++;
  } catch (e) {
    fail(step.id, "セルフテストのステップで例外発生: " + String(e));
    stepIndex++;
  }
}
function install() {
  system5.runInterval(runStep, 2);
}
function buildSteps() {
  if (steps.length) return;
  steps.push({
    id: "af.runtime.boot",
    fn: () => {
      const ok = typeof generateSpec === "function" && typeof world8.getAllPlayers === "function" && typeof world8.getTimeOfDay === "function";
      if (!ok) return fail("af.runtime.boot", "コアモジュールまたは world API が利用できません");
      const ev = world8.afterEvents;
      const containerOpened = typeof ev["blockContainerOpened"] === "object";
      pass("af.runtime.boot", {
        version: "2.0.0",
        module: containerOpened ? "@minecraft/server 2.8.0+" : "@minecraft/server <=2.7.0",
        hasBlockContainerOpened: containerOpened,
        database: "v1.0"
      });
    }
  });
  steps.push({
    id: "af.runtime.registry",
    fn: () => {
      const errors = [];
      const byKind = poolStats();
      const seen = /* @__PURE__ */ new Set();
      const groups = /* @__PURE__ */ new Set();
      for (const a of ALL_AFFIXES) {
        if (seen.has(a.id)) errors.push("id の重複: " + a.id);
        seen.add(a.id);
        for (const g of a.groups) groups.add(g);
        for (const mod of a.mods) {
          if (!STAT_META[mod.stat]) errors.push(`${a.id}: 未登録の stat ${mod.stat}`);
          if (mod.levels.length !== 5) errors.push(`${a.id}: ${mod.stat} レベル配列の長さ=${mod.levels.length}`);
        }
        if (!a.groups.length) errors.push(`${a.id}: 使用可能な部位がありません`);
        if (!RARITY_ORDER.includes(a.rarity)) errors.push(`${a.id}: 不正なアフィックス品質 ${a.rarity}`);
      }
      const totalWeight = QUALITIES.reduce((s, q) => s + q.weight, 0);
      if (totalWeight !== 1e4) errors.push(`品質の重み合計=${totalWeight}`);
      if (ALL_AFFIXES.length < 400) errors.push(`アフィックス総数が不足: ${ALL_AFFIXES.length}`);
      if (groups.size !== 21) errors.push(`装備部位数=${groups.size}（21 であるべき）`);
      if (errors.length) return fail("af.runtime.registry", errors.slice(0, 5).join(" | "), { errors: errors.length });
      pass("af.runtime.registry", {
        affixes: ALL_AFFIXES.length,
        byKind,
        groups: groups.size,
        stats: Object.keys(STAT_META).length,
        channels: statsByChannel(),
        pools: poolStructure(),
        qualities: QUALITIES.length
      });
    }
  });
  steps.push({
    id: "af.runtime.coverage",
    fn: () => {
      const missing = [];
      for (const g of ["sword", "axe", "pickaxe", "shovel", "hoe", "spear", "mace", "fishing", "shears", "brush", "flint", "horse", "steering", "bow", "crossbow", "trident", "shield", "head", "chest", "legs", "feet"]) {
        if (poolFor("positive", g).length < 5) missing.push(`ポジティブプール不足 ${g}`);
        if (poolFor("negative", g).length < 3) missing.push(`ネガティブプール不足 ${g}`);
      }
      const metaOnly = Object.entries(STAT_META).filter(([, m2]) => m2.channel === "meta").map(([k]) => k);
      if (missing.length) return fail("af.runtime.coverage", missing.join(" | "));
      pass("af.runtime.coverage", {
        equipmentTypes: EQUIP_KINDS.length,
        metaOnlyStats: metaOnly.length,
        metaOnlySample: metaOnly.slice(0, 6)
      });
    }
  });
  steps.push({
    id: "af.runtime.generate",
    fn: () => {
      const rng = makeRng(10834270);
      let generated = 0;
      const qualities = {};
      let exclusionViolations = 0;
      let mythicTotal = 0;
      let mythicWithNeg = 0;
      let bestLegendary = 0;
      let worstMythic = Number.MAX_SAFE_INTEGER;
      let unidentified = 0;
      let unique = 0;
      let dual = 0;
      let special = 0;
      let curse = 0;
      let awakened = 0;
      let hiddenCount = 0;
      const rolls = /* @__PURE__ */ new Set();
      const rarities = /* @__PURE__ */ new Set();
      const usedIds = /* @__PURE__ */ new Set();
      const groupsSeen = /* @__PURE__ */ new Set();
      for (let i = 0; i < 2e3; i++) {
        const type = SAMPLE_TYPES[i % SAMPLE_TYPES.length];
        const seed = (rng.int(0, 2147483647) ^ Math.imul(i + 1, 2654435761)) >>> 0;
        const spec = generateSpec(type, seed);
        if (!spec) continue;
        generated++;
        groupsSeen.add(spec.group);
        qualities[spec.quality] = (qualities[spec.quality] ?? 0) + 1;
        if (!spec.identified) unidentified++;
        if (spec.unique.length) unique++;
        if (spec.dual.length) dual++;
        if (spec.special.length) special++;
        if (spec.curse.length) curse++;
        if (spec.awakened) awakened++;
        if (Object.keys(spec.hidden).length) hiddenCount++;
        for (const a of spec.pos) {
          rolls.add(a.roll);
          rarities.add(a.rarity ?? "common");
        }
        for (const a of specInstances(spec)) usedIds.add(a.id);
        const ids = specInstances(spec).map((a) => a.id);
        for (let x = 0; x < ids.length; x++) {
          for (let y = x + 1; y < ids.length; y++) if (isMutuallyExclusive(ids[x], ids[y])) exclusionViolations++;
        }
        if (spec.quality === "mythic") {
          mythicTotal++;
          if (spec.neg.length >= 1) mythicWithNeg++;
          worstMythic = Math.min(worstMythic, spec.score);
        }
        if (spec.quality === "legendary") bestLegendary = Math.max(bestLegendary, spec.score);
      }
      scratch.stats = {
        generated,
        qualities,
        exclusionViolations,
        mythicTotal,
        mythicWithNeg,
        bestLegendary,
        worstMythic,
        unidentified,
        unique,
        dual,
        special,
        curse,
        awakened,
        hiddenCount
      };
      scratch.rolls = rolls.size;
      scratch.rarities = [...rarities];
      scratch.coverage = usedIds.size / ALL_AFFIXES.length;
      if (generated < 1900) return fail("af.runtime.generate", `${generated}/2000 しか生成されない`);
      if (exclusionViolations > 0) return fail("af.runtime.generate", `排他衝突 ${exclusionViolations} 回`);
      if (mythicTotal > 0 && mythicWithNeg / mythicTotal < 0.9) {
        return fail("af.runtime.generate", `ミシックのマイナス付き比率が低すぎます ${mythicWithNeg}/${mythicTotal}`);
      }
      if (groupsSeen.size !== 13) return fail("af.runtime.generate", `カバー部位 ${groupsSeen.size}/13`);
      pass("af.runtime.generate", {
        generated,
        qualities,
        unidentified,
        unique,
        dual,
        special,
        curse,
        awakened,
        hidden: hiddenCount,
        mythicNegRatio: mythicTotal ? +(mythicWithNeg / mythicTotal).toFixed(3) : null,
        distinctRolls: rolls.size,
        rarityTiers: [...rarities].length
      });
    }
  });
  steps.push({
    id: "af.runtime.score",
    fn: () => {
      const s = scratch.stats;
      if (!s || !s.mythicTotal) return fail("af.runtime.score", "生成統計がありません");
      const worstMythic = s.worstMythic === Number.MAX_SAFE_INTEGER ? 0 : s.worstMythic;
      if (!(s.bestLegendary > worstMythic)) {
        return fail("af.runtime.score", `スコアが分離していない: 最良レジェンド ${s.bestLegendary} <= 最悪ミシック ${worstMythic}`);
      }
      const fragile = AFFIX_BY_ID.fragile;
      const s5 = affixScore(fragile, 5);
      if (s5 >= 0) return fail("af.runtime.score", `マイナスアフィックスのスコアは負であるべき: 壊れやすい V = ${s5}`);
      const sharp = AFFIX_BY_ID.sharpness;
      if (affixScore(sharp, 3, 1.5) <= affixScore(sharp, 3, 1)) {
        return fail("af.runtime.score", "アフィックス品質の倍率がスコアを増幅していない");
      }
      pass("af.runtime.score", {
        bestLegendary: s.bestLegendary,
        worstMythic,
        gap: s.bestLegendary - worstMythic,
        fragileV: s5
      });
    }
  });
  steps.push({
    id: "af.runtime.synergy",
    fn: () => {
      const perfect = computeSynergy(["crit", "lethal"]);
      const conflict = computeSynergy(["agile", "dull"]);
      const normal = computeSynergy(["sharpness", "smash"]);
      if (perfect.level !== "perfect") return fail("af.runtime.synergy", `クリティカル+致命 は最高評価であるべき、実際は ${perfect.level}`);
      if (conflict.level !== "conflict") return fail("af.runtime.synergy", `軽捷+鈍重 は衝突であるべき、実際は ${conflict.level}`);
      if (normal.level !== "normal") return fail("af.runtime.synergy", `鋭利+強打 は標準であるべき、実際は ${normal.level}`);
      const stats = scratch.stats;
      pass("af.runtime.synergy", {
        perfect: perfect.score,
        conflict: conflict.score,
        normal: normal.score,
        distinctRolls: scratch.rolls ?? 0,
        rarities: scratch.rarities ?? [],
        poolCoverage: Math.round((scratch.coverage ?? 0) * 100) + "%",
        generated: stats?.generated ?? 0
      });
    }
  });
  steps.push({
    id: "af.runtime.item_write",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 305441741, { forceQuality: "mythic", forceIdentified: true });
      if (!spec) return fail("af.runtime.item_write", "生成失敗");
      const stack = new ItemStack3("minecraft:diamond_sword", 1);
      stack.nameTag = spec.name;
      stack.setLore(buildLore(spec));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const back = stack.getDynamicProperty(DYNPROP_KEY);
      if (typeof back !== "string") return fail("af.runtime.item_write", "dynamic property が書き戻されていない");
      const lore = stack.getLore();
      if (!lore || !lore.length) return fail("af.runtime.item_write", "lore が空です");
      if (stack.nameTag !== spec.name) return fail("af.runtime.item_write", "nameTag が一致しません");
      pass("af.runtime.item_write", {
        name: spec.name,
        loreLines: lore.length,
        dynpropBytes: String(back).length
      });
    }
  });
  steps.push({
    id: "af.runtime.item_read",
    fn: () => {
      const spec = generateSpec("minecraft:netherite_chestplate", 4276993775, {
        forceQuality: "ancient",
        forceIdentified: true
      });
      if (!spec) return fail("af.runtime.item_read", "生成失敗");
      const stack = new ItemStack3("minecraft:netherite_chestplate", 1);
      stack.setLore(buildLore(spec, { includePayload: true }));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const a = decodeSpec(String(stack.getDynamicProperty(DYNPROP_KEY)));
      const b = decodeSpec(parseLorePayload(stack.getLore()));
      if (!a || !b) return fail("af.runtime.item_read", `二重経路の読み取りに失敗 A=${!!a} B=${!!b}`);
      const same = a.quality === spec.quality && a.score === spec.score && a.pos.length === spec.pos.length && a.neg.length === spec.neg.length && a.special.length === spec.special.length && a.curse.length === spec.curse.length && a.synergy === spec.synergy && a.awakened === spec.awakened;
      if (!same) return fail("af.runtime.item_read", "読み戻したデータが書き込み内容と一致しません");
      const v1 = decodeSpec(
        JSON.stringify([1, 1, "rare", "sword", "sword", "ダイヤの剣", 3, 1.2, [["sharpness", 2]], [], [], [], {}, 20, 300, true, "\xA7b【レア】ダイヤの剣\xA7r"])
      );
      if (!v1) return fail("af.runtime.item_read", "v1 の旧データを読み戻せません");
      pass("af.runtime.item_read", {
        channelA: a.quality,
        channelB: b.quality,
        pos: a.pos.length,
        special: a.special.length,
        synergy: a.synergy,
        v1Compat: true
      });
    }
  });
  steps.push({
    id: "af.runtime.enchant_preserved",
    fn: () => {
      const stack = new ItemStack3("minecraft:diamond_sword", 1);
      const ench = stack.getComponent("minecraft:enchantable");
      if (!ench) return fail("af.runtime.enchant_preserved", "アイテムに minecraft:enchantable コンポーネントがありません");
      const type = EnchantmentTypes.get("sharpness");
      if (!type) return fail("af.runtime.enchant_preserved", "sharpness エンチャントタイプが見つかりません");
      ench.addEnchantment({ type, level: 5 });
      const before = ench.getEnchantments().length;
      if (before < 1) return fail("af.runtime.enchant_preserved", "エンチャントが付与されていません");
      const spec = generateSpec("minecraft:diamond_sword", 20816, { forceQuality: "legendary", forceIdentified: true });
      if (!spec) return fail("af.runtime.enchant_preserved", "生成失敗");
      stack.setLore(buildLore(spec));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const after = stack.getComponent("minecraft:enchantable")?.getEnchantments().length ?? 0;
      if (after !== before) return fail("af.runtime.enchant_preserved", `エンチャントが破壊されました: ${before} -> ${after}`);
      pass("af.runtime.enchant_preserved", { enchantments: after, enchant: "sharpness V" });
    }
  });
  steps.push({
    id: "af.runtime.container",
    fn: () => {
      const dim = world8.getDimension("overworld");
      const spots = [{ x: 0, z: 0 }, { x: 32, z: 32 }, { x: -32, z: -32 }];
      const ys = [100, 120, 64];
      const tried = [];
      for (const s of spots) {
        try {
          dim.runCommand(`tickingarea add ${s.x} 100 ${s.z} ${s.x + 15} 100 ${s.z + 15} aftest`);
        } catch {
        }
        for (const y of ys) {
          const cx = s.x + 8;
          const cz = s.z + 8;
          try {
            dim.runCommand(`setblock ${cx} ${y} ${cz} chest`);
            const blk = dim.getBlock({ x: cx, y, z: cz });
            const inv = blk?.getComponent("minecraft:inventory");
            if (!inv?.container) {
              tried.push(`${cx},${y},${cz}: inventory コンポーネントがありません`);
              continue;
            }
            const spec = generateSpec("minecraft:iron_sword", 12648430, { forceQuality: "rare", forceIdentified: true });
            if (!spec) return fail("af.runtime.container", "生成失敗");
            const stack = new ItemStack3("minecraft:iron_sword", 1);
            stack.setLore(buildLore(spec));
            stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
            inv.container.setItem(0, stack);
            const back = inv.container.getItem(0);
            const read = decodeSpec(String(back?.getDynamicProperty(DYNPROP_KEY)));
            if (!read || read.score !== spec.score) return fail("af.runtime.container", "コンテナ内のデータ読み戻しが一致しません");
            pass("af.runtime.container", { location: { x: cx, y, z: cz }, score: read.score, quality: read.quality });
            return true;
          } catch (e) {
            tried.push(`${cx},${y},${cz}: ${String(e)}`);
          }
        }
      }
      zlog("container が未準備です。後で再試行してください", { tried: tried.slice(0, 3) });
      return false;
    }
  });
  steps.push({
    id: "af.runtime.effects",
    fn: () => {
      const ids = [
        "minecraft:speed",
        "minecraft:slowness",
        "minecraft:haste",
        "minecraft:mining_fatigue",
        "minecraft:health_boost",
        "minecraft:jump_boost",
        "minecraft:regeneration",
        "minecraft:resistance",
        "minecraft:fire_resistance",
        "minecraft:water_breathing",
        "minecraft:night_vision",
        "minecraft:absorption",
        "minecraft:hunger",
        "minecraft:wither",
        "minecraft:weakness",
        "minecraft:poison",
        "minecraft:conduit_power"
      ];
      const missing = ids.filter((id) => !EffectTypes.get(id));
      if (missing.length) return fail("af.runtime.effects", "無効な効果 id: " + missing.join(","));
      const plan = effectPlan(
        {
          moveSpeedPct: 40,
          attackSpeedPct: 50,
          maxHealthPct: 25,
          jumpPct: 30,
          regenPct: 60,
          defensePct: 45,
          absorbFlat: 8,
          fireResistPct: 50,
          nightVision: 1,
          waterBreathing: 1
        },
        { underground: true, lowHp: false }
      );
      if (!plan.length) return fail("af.runtime.effects", "effectPlan が効果を何も生成していません");
      const unknown = plan.filter((p) => !EffectTypes.get(p.id));
      if (unknown.length) return fail("af.runtime.effects", "未知の効果: " + unknown.map((u) => u.id).join(","));
      pass("af.runtime.effects", { verified: ids.length, plan: plan.map((p) => `${p.id}:${p.amp}`) });
    }
  });
  steps.push({
    id: "af.runtime.commands",
    fn: () => {
      const ids = registeredScriptEvents();
      if (!ids.length) return fail("af.runtime.commands", "scriptevent が何も登録されていません");
      pass("af.runtime.commands", { ids });
    }
  });
  steps.push({
    id: "af.runtime.resonance",
    fn: () => {
      const mk = (type, ids) => {
        const spec = generateSpec(type, 40503 + ids.length, { forceQuality: "legendary", forceIdentified: true });
        if (!spec) throw new Error("生成失敗 " + type);
        return {
          ...spec,
          pos: ids.map((id) => ({ id, level: 3, roll: 1 })),
          neg: [],
          dual: [],
          special: [],
          curse: [],
          unique: []
        };
      };
      const armor = computeArmorResonances({
        head: mk("minecraft:diamond_helmet", ["steadfast"]),
        chest: mk("minecraft:diamond_chestplate", ["chest_bulwark"]),
        legs: mk("minecraft:diamond_leggings", ["legs_tough"]),
        feet: mk("minecraft:diamond_boots", ["boots_feather"])
      });
      if (!armor.some((a) => a.def.id === "guard")) {
        return fail("af.runtime.resonance", "守護の共鳴が発動しません: " + JSON.stringify(armor.map((a) => a.def.id)));
      }
      const tool = computeToolResonances(mk("minecraft:diamond_pickaxe", ["swift_dig", "ore_vein", "lucky_miner"]));
      if (!tool.some((a) => a.def.id === "miner")) {
        return fail("af.runtime.resonance", "鉱夫の共鳴が発動しません: " + JSON.stringify(tool.map((a) => a.def.id)));
      }
      if (computeArmorResonances({}).length) return fail("af.runtime.resonance", "空のセットに共鳴はあってはなりません");
      pass("af.runtime.resonance", { armor: armor.map((a) => a.def.name), tool: tool.map((a) => a.def.name) });
    }
  });
  steps.push({
    id: "af.runtime.tooltip",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 7486, { forceQuality: "mythic" });
      if (!spec) return fail("af.runtime.tooltip", "生成失敗");
      if (!spec.identified) return fail("af.runtime.tooltip", "生成結果が鑑定済み状態ではありません（\xA7一 生成時点で使用可能であることが要件）");
      const lore = buildLore(spec, { enchantments: ["鋭さ V", "耐久力 III"] });
      const plain = lore.map((l) => l.replace(/§./g, ""));
      const hasMark = plain.some((l) => l.includes("\u25C6")) || plain.some((l) => l.includes("⚠"));
      const hasScore = plain.some((l) => l.startsWith("装備スコア："));
      const hasEnch = plain.some((l) => l.startsWith("エンチャント：") && l.includes("鋭さ V"));
      const hasName = plain.some((l) => l.includes("【ミシック】"));
      const noUnidentified = !plain.some((l) => l.includes("未鑑定"));
      if (!hasMark || !hasScore || !hasEnch || !hasName || !noUnidentified) {
        return fail("af.runtime.tooltip", "tooltip 構造が \xA742 に適合しません", { hasMark, hasScore, hasEnch, hasName, noUnidentified });
      }
      const awakenBase = generateSpec("minecraft:diamond_sword", 10794, { forceQuality: "ancient", forceIdentified: true });
      if (!awakenBase) return fail("af.runtime.tooltip", "覚醒テストケースの生成に失敗");
      const notAwake = { ...awakenBase, hidden: { hiddenAwakenNight: 1 }, awakened: false };
      const awake = awakenSpec(notAwake);
      if (!awake.awakened) return fail("af.runtime.tooltip", "覚醒状態が反転していません");
      if (!buildLore(notAwake).some((l) => l.includes("未覚醒"))) return fail("af.runtime.tooltip", "未覚醒のヒントがありません");
      pass("af.runtime.tooltip", {
        lines: lore.length,
        marks: plain.filter((l) => l.includes("\u25C6")).length,
        warns: plain.filter((l) => l.includes("⚠")).length,
        score: spec.score,
        enchantLine: plain.find((l) => l.startsWith("エンチャント：")) ?? null,
        awaken: "未覚醒 → 覚醒済み",
        noUnidentified
      });
    }
  });
  steps.push({
    id: "af.runtime.classifier",
    fn: () => {
      const checks = [
        ["minecraft:wooden_sword", "sword"],
        ["minecraft:netherite_axe", "axe"],
        ["minecraft:diamond_pickaxe", "pickaxe"],
        ["minecraft:golden_shovel", "shovel"],
        ["minecraft:iron_hoe", "hoe"],
        ["minecraft:bow", "bow"],
        ["minecraft:crossbow", "crossbow"],
        ["minecraft:trident", "trident"],
        ["minecraft:shield", "shield"],
        ["minecraft:leather_helmet", "head"],
        ["minecraft:chainmail_chestplate", "chest"],
        ["minecraft:diamond_leggings", "legs"],
        ["minecraft:netherite_boots", "feet"],
        ["minecraft:stick", void 0],
        ["minecraft:diamond", void 0]
      ];
      const bad = [];
      for (const [id, group] of checks) {
        const info = classify(id);
        if (group === void 0) {
          if (info) bad.push(`${id} は装備として認識されるべきではありません`);
        } else if (!info || info.group !== group) {
          bad.push(`${id} -> ${info?.group ?? "undefined"}（期待 ${group}）`);
        }
      }
      if (bad.length) return fail("af.runtime.classifier", bad.join(" | "));
      pass("af.runtime.classifier", { checked: checks.length, kinds: EQUIP_KINDS.length });
    }
  });
  steps.push({
    id: "af.runtime.damage_calibration",
    fn: () => {
      const dim = world8.getDimension("overworld");
      let base = { x: 8, y: 100, z: 8 };
      try {
        const sp = world8.getDefaultSpawnLocation();
        const top = dim.getTopmostBlock({ x: Math.floor(sp.x) + 4, z: Math.floor(sp.z) + 4 });
        base = { x: Math.floor(sp.x) + 4, y: (top ? top.y : Math.floor(sp.y)) + 2, z: Math.floor(sp.z) + 4 };
      } catch {
      }
      try {
        dim.runCommand(`tickingarea add ${base.x - 4} 0 ${base.z - 4} ${base.x + 8} 0 ${base.z + 8} afcal`);
      } catch {
      }
      const spawnAndHit = (loc, mult) => {
        let e;
        try {
          e = dim.spawnEntity("minecraft:cow", loc);
        } catch (err) {
          try {
            e = dim.spawnEntity("minecraft:pig", loc);
          } catch (err2) {
            return { loss: -1, error: "spawn: " + String(err) + " / " + String(err2) };
          }
        }
        let unsub;
        try {
          const hp = e.getComponent("minecraft:health");
          if (!hp) return { loss: -1, error: "no health component" };
          hp.setCurrentValue(hp.effectiveMax);
          if (mult !== 1) {
            const id = e.id;
            unsub = world8.beforeEvents.entityHurt.subscribe((ev) => {
              if (ev.hurtEntity.id === id) ev.damage = ev.damage * mult;
            });
          }
          const before = hp.currentValue;
          e.applyDamage(4, { cause: EntityDamageCause3.entityAttack });
          const after = hp.currentValue;
          return { loss: before - after };
        } catch (err) {
          return { loss: -1, error: String(err) };
        } finally {
          try {
            if (unsub) world8.beforeEvents.entityHurt.unsubscribe(unsub);
          } catch {
          }
          try {
            e.remove();
          } catch {
          }
        }
      };
      const baseline = spawnAndHit({ x: base.x, y: base.y, z: base.z }, 1);
      if (baseline.error || baseline.loss < 0) {
        zlog("damage_calibration が未準備です。後で再試行してください", { error: baseline.error ?? "loss<0" });
        return false;
      }
      const boosted = spawnAndHit({ x: base.x + 2, y: base.y, z: base.z }, 2);
      if (boosted.error || boosted.loss < 0) {
        zlog("damage_calibration が 2 回目も未準備です。後で再試行してください", { error: boosted.error ?? "loss<0" });
        return false;
      }
      if (baseline.loss <= 0) {
        return fail("af.runtime.damage_calibration", `ベースラインのダメージが反映されていません: loss=${baseline.loss}`);
      }
      if (!(boosted.loss > baseline.loss)) {
        return fail(
          "af.runtime.damage_calibration",
          `ev.damage の変更が最終的な減血量に影響していません: ${baseline.loss.toFixed(2)} -> ${boosted.loss.toFixed(2)}`
        );
      }
      pass("af.runtime.damage_calibration", {
        baselineLoss: +baseline.loss.toFixed(3),
        boostedLoss: +boosted.loss.toFixed(3),
        ratio: +(boosted.loss / baseline.loss).toFixed(2),
        note: "beforeEvents.entityHurt.damage の変更が確かに最終的な減血量へ伝わっています。倍率がちょうど 2 である必要はありません —— バニラ側にはアーマー/難易度/被弾処理があるためです。ここで証明しているのは「変更可能かつ有効」という経路です"
      });
      return true;
    }
  });
  steps.push({
    id: "af.runtime.stats_aggregate",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 1911, { forceQuality: "epic", forceIdentified: true });
      if (!spec) return fail("af.runtime.stats_aggregate", "生成失敗");
      const stats = specStats(spec);
      const total = Object.values(stats).reduce((a, b) => a + Math.abs(b), 0);
      if (total <= 0) return fail("af.runtime.stats_aggregate", "属性の集約が空です");
      if (Object.keys(emptyStats()).length < 200) return fail("af.runtime.stats_aggregate", "emptyStats のキー数が異常です");
      const risk0 = computeRisk([]);
      const risk1 = computeRisk([{ id: "fragile", level: 5, roll: 1 }]);
      if (!(risk1 > risk0)) return fail("af.runtime.stats_aggregate", "リスク予算の計算が異常です");
      const { score: _sc, name: _nm, ...rest } = spec;
      const recomputed = computeScore(rest);
      if (Math.abs(recomputed - spec.score) > 1) {
        return fail("af.runtime.stats_aggregate", `スコアが再現できません ${recomputed} vs ${spec.score}`);
      }
      pass("af.runtime.stats_aggregate", {
        stats: Object.keys(stats).length,
        magnitude: Math.round(total),
        risk5: risk1,
        scoreReproducible: true
      });
    }
  });
  steps.push({
    id: "af.runtime.speed_tier",
    fn: () => {
      if (SPEED_TIERS.length < 5) return fail("af.runtime.speed_tier", "段階の数が不足しています");
      const asc = SPEED_TIERS.every((x, i) => i === 0 || x.pct > SPEED_TIERS[i - 1].pct);
      if (!asc) return fail("af.runtime.speed_tier", "段階が単調増加ではありません");
      const cdAsc = SPEED_TIERS.every((x, i) => i === 0 || x.cooldown < SPEED_TIERS[i - 1].cooldown);
      if (!cdAsc) return fail("af.runtime.speed_tier", "クールダウンが段階に応じて減少していません");
      const normal = speedTierFor({});
      if (normal.id !== "normal") return fail("af.runtime.speed_tier", `空の属性は標準段階に入るべき、実際は ${normal.id}`);
      const fast = speedTierFor({ attackSpeedPct: 34 });
      if (fast.id !== "swift") return fail("af.runtime.speed_tier", `+34% は最速段階に入るべき、実際は ${fast.id}`);
      const slow = speedTierFor({ attackSpeedPct: -28 });
      if (slow.id !== "sluggish") return fail("af.runtime.speed_tier", `-28% は最遅段階に入るべき、実際は ${slow.id}`);
      const comp = speedDpsCompensation(fast);
      if (SPEED_NATIVE ? comp !== 1 : Math.abs(comp - 1.35) > 1e-3) {
        return fail("af.runtime.speed_tier", `等価 DPS の換算が異常です: ${comp}`);
      }
      const tpl = nativeTemplate("diamond", fast, 7, 1561);
      const comps = tpl["minecraft:item"]?.components ?? {};
      for (const k of ["minecraft:cooldown", "minecraft:damage", "minecraft:durability", "minecraft:enchantable", "minecraft:repairable", "minecraft:hover_text_color", "minecraft:rarity"]) {
        if (!(k in comps)) return fail("af.runtime.speed_tier", `ネイティブテンプレートにコンポーネント ${k} がありません`);
      }
      if (comps["minecraft:cooldown"].type !== "attack") return fail("af.runtime.speed_tier", "cooldown.type は attack でなければなりません");
      pass("af.runtime.speed_tier", {
        tiers: SPEED_TIERS.map((x) => `${x.name}${x.pct >= 0 ? "+" : ""}${x.pct}%`),
        nativeEnabled: SPEED_NATIVE,
        compensation: comp,
        normalTier: normal.name
      });
    }
  });
  steps.push({
    id: "af.runtime.item_entity",
    fn: () => {
      const dim = world8.getDimension("overworld");
      try {
        dim.runCommand("tickingarea add 0 100 0 15 100 15 afdrop");
      } catch {
      }
      let ent;
      try {
        const spec = generateSpec("minecraft:iron_sword", 53513, { forceQuality: "epic", forceIdentified: true });
        if (!spec) return fail("af.runtime.item_entity", "生成失敗");
        const stack = new ItemStack3("minecraft:iron_sword", 1);
        stack.setLore(buildLore(spec));
        stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
        ent = dim.spawnItem(stack, { x: 8, y: 101, z: 8 });
        if (!ent) {
          zlog("item_entity が未準備です。後で再試行してください");
          return false;
        }
        const comp = ent.getComponent("minecraft:item");
        const back = comp?.itemStack;
        if (!back) return fail("af.runtime.item_entity", "ドロップアイテムに minecraft:item コンポーネントがありません");
        const read = decodeSpec(String(back.getDynamicProperty(DYNPROP_KEY)));
        if (!read || read.score !== spec.score || read.pos.length !== spec.pos.length) {
          return fail("af.runtime.item_entity", "ドロップアイテム上の装備データが一致しません");
        }
        const loreOk = (back.getLore() ?? []).some((l) => l.includes("スコア"));
        if (!loreOk) return fail("af.runtime.item_entity", "ドロップアイテムの lore が失われました");
        pass("af.runtime.item_entity", {
          score: read.score,
          quality: read.quality,
          pos: read.pos.length,
          loreLines: (back.getLore() ?? []).length,
          note: "データはドロップアイテムエンティティとともに保持される（死亡ドロップ → 拾得 のデータ側の証拠）"
        });
        return true;
      } catch (e) {
        zlog("item_entity が未準備です。後で再試行してください", { error: String(e) });
        return false;
      } finally {
        try {
          ent?.remove();
        } catch {
        }
      }
    }
  });
  steps.push({
    id: "af.runtime.lore_limits",
    fn: () => {
      const long = "A".repeat(200);
      const stack = new ItemStack3("minecraft:diamond_sword", 1);
      const many = [];
      for (let i = 0; i < 60; i++) many.push(`L${i}-${long}`);
      stack.setLore(many);
      const back = stack.getLore() ?? [];
      const longest = back.reduce((m2, l) => Math.max(m2, l.length), 0);
      const single = new ItemStack3("minecraft:diamond_sword", 1);
      single.setLore([long]);
      const singleBack = (single.getLore() ?? [])[0] ?? "";
      const worst = generateSpec("minecraft:netherite_sword", 24301, { forceQuality: "unique", forceIdentified: true });
      const worstLore = worst ? buildLore(worst) : [];
      const worstLongest = worstLore.reduce((m2, l) => Math.max(m2, l.length), 0);
      const payloadDefault = parseLorePayload(worstLore);
      const fallbackLore = worst ? buildLore(worst, { includePayload: true }) : [];
      const payload = parseLorePayload(fallbackLore) ?? "";
      const payloadLine = fallbackLore.find((l) => l.includes(LORE_MARKER)) ?? "";
      const fallbackLongest = fallbackLore.reduce((m2, l) => Math.max(m2, l.length), 0);
      const observed = {
        loreLinesKept: back.length,
        longestLineKept: longest,
        singleLongLineKept: singleBack.length,
        worstCaseLines: worstLore.length,
        worstCaseLongest: worstLongest,
        payloadChars: payload.length,
        payloadLineChars: payloadLine.length,
        defaultPayloadHidden: payloadDefault === void 0,
        fallbackLines: fallbackLore.length,
        fallbackLongest
      };
      const problems = [];
      if (back.length < many.length) problems.push(`lore が切り詰められました: ${many.length} -> ${back.length}`);
      if (longest < long.length) problems.push(`1 行が切り詰められました: ${long.length} -> ${longest}`);
      if (payloadDefault !== void 0) problems.push("既定の tooltip に機械可読のペイロード行が残っています（プレイヤーに見えるゴミ行）");
      if (!payload) problems.push("フォールバックモードのペイロード行を組み立て直せません（dynamic property 失敗時はデータが失われます）");
      if (payloadLine.length > 60) problems.push(`フォールバックペイロードの 1 行が長すぎます: ${payloadLine.length}`);
      if (worstLore.length > 26) problems.push(`最悪の場合の tooltip 行数 ${worstLore.length} が長すぎます（可読性の上限 26 行）`);
      if (problems.length) {
        return fail("af.runtime.lore_limits", problems.join(" | "), observed);
      }
      pass("af.runtime.lore_limits", observed);
    }
  });
  steps.push({
    id: "af.runtime.world_api",
    fn: () => {
      const players = world8.getAllPlayers();
      const time = world8.getTimeOfDay();
      const dims = ["overworld", "nether", "the_end"].map((d) => world8.getDimension(d).id);
      if (!Array.isArray(players)) return fail("af.runtime.world_api", "getAllPlayers が配列以外を返しました");
      if (typeof time !== "number") return fail("af.runtime.world_api", "getTimeOfDay が数値以外を返しました");
      pass("af.runtime.world_api", {
        players: players.length,
        timeOfDay: time,
        dimensions: dims,
        playerPathNote: players.length === 0 ? "ヘッドレス環境にプレイヤーなし：プレイヤー操作経路は A 層の純粋関数でカバー" : "プレイヤーあり"
      });
    }
  });
}
function installSelfTest() {
  install();
}
function runSelfTestOnce() {
  buildSteps();
  const out = [];
  for (const s of steps) {
    try {
      const r = s.fn();
      if (r === false) continue;
      out.push(s.id);
    } catch (e) {
      fail(s.id, String(e));
    }
  }
  return `${out.length} 項目のセルフテストを実行しました`;
}

// scripts/systems/Ingestion.ts
import { system as system6, world as world10 } from "@minecraft/server";

// scripts/data/Sources.ts
var SOURCES = {
  crafting: true,
  mobLoot: true,
  chestLoot: true,
  fishing: true,
  rewards: true,
  scriptGive: true,
  playerDrop: false
};
var ORIGIN_SOURCE = {
  crafting: "crafting",
  mob_loot: "mobLoot",
  chest_loot: "chestLoot",
  fishing: "fishing",
  reward: "rewards",
  script_give: "scriptGive",
  inventory: "scriptGive",
  third_party: "scriptGive",
  unknown: "scriptGive"
};
function originEnabled(origin) {
  return SOURCES[ORIGIN_SOURCE[origin]] !== false;
}

// scripts/systems/UniqueRegistry.ts
import { world as world9 } from "@minecraft/server";
var REGISTRY_KEY = "kira:af_unique_registry";
var UNIQUE_TEMPLATES = [
  { id: "tpl_time", name: "時間" },
  { id: "tpl_space", name: "空間" },
  { id: "tpl_gluttony", name: "貪食" },
  { id: "tpl_eternal_night", name: "永夜" },
  { id: "tpl_sun_heart", name: "太陽の心" },
  { id: "tpl_abyss_heart", name: "深淵の心" }
];
function readRaw() {
  try {
    const v = world9.getDynamicProperty(REGISTRY_KEY);
    if (typeof v !== "string" || !v) return [];
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch (e) {
    zlog("unique:read-failed", { error: String(e) });
    return [];
  }
}
function writeRaw(list) {
  try {
    world9.setDynamicProperty(REGISTRY_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    zlog("unique:write-failed", { error: String(e) });
    return false;
  }
}
function claimUniqueTemplate(preferred) {
  const used = new Set(readRaw());
  const free = UNIQUE_TEMPLATES.filter((t) => !used.has(t.id));
  if (!free.length) return void 0;
  const pick = preferred && free.some((t) => t.id === preferred) ? free.find((t) => t.id === preferred) : free[Math.floor(Math.random() * free.length)];
  const next = [...used, pick.id];
  if (!writeRaw(next)) return void 0;
  zlog("unique:claimed", { template: pick.id, total: next.length });
  return pick.id;
}

// scripts/systems/Ingestion.ts
var TAG_WEAPON = "kira:rpg_weapon";
var TAG_ARMOR = "kira:rpg_armor";
var TAG_TOOL = "kira:rpg_tool";
var TAG_IGNORE = "kira:rpg_ignore";
var THIRD_PARTY_WHITELIST = [];
function safeTags(stack) {
  try {
    const anyStack = stack;
    return typeof anyStack.getTags === "function" ? anyStack.getTags() : [];
  } catch {
    return [];
  }
}
function isRPG(stack) {
  if (!stack) return false;
  const v = readVersion(stack);
  if (typeof v === "number" && v > 0) return true;
  return !!readSpec(stack);
}
function sourceOf(origin, range) {
  switch (origin) {
    case "fishing":
      return "fishing";
    case "reward":
      return "reward";
    case "mob_loot": {
      if (!range) return "mob_loot";
      const lo = qualityRank(range[0]);
      if (lo >= qualityRank("epic")) return "boss_loot";
      if (lo >= qualityRank("fine")) return "elite_loot";
      return "mob_loot";
    }
    case "chest_loot": {
      if (!range) return "chest_normal";
      const lo = qualityRank(range[0]);
      return lo >= qualityRank("fine") ? "chest_high" : "chest_normal";
    }
    default:
      return "crafting";
  }
}
function eligibility(stack, origin = "unknown") {
  if (!stack) return { eligible: false, reason: "アイテムなし", thirdParty: false };
  if (isRPG(stack)) return { eligible: false, reason: "すでに RPG 装備です（絶対に再抽選しません）", thirdParty: false };
  if (!originEnabled(origin)) return { eligible: false, reason: `ソースが無効です: ${origin}`, thirdParty: false };
  const tags = safeTags(stack);
  if (tags.includes(TAG_IGNORE)) return { eligible: false, reason: "サードパーティ宣言 kira:rpg_ignore", thirdParty: false };
  const declared = tags.find((t) => t === TAG_WEAPON || t === TAG_ARMOR || t === TAG_TOOL);
  if (declared) {
    const info2 = classifyThirdParty(stack.typeId, tags);
    if (!info2) {
      return { eligible: false, reason: "サードパーティが kira:rpg_* を宣言していますが、識別可能な kira:rpg_type_* がありません", thirdParty: true };
    }
    const poolTag = tags.find((t) => t.startsWith("kira:rpg_pool_") || t.startsWith("kira:rpg_material_"));
    return {
      eligible: true,
      reason: `サードパーティ宣言 ${declared} → ${info2.group}`,
      thirdParty: true,
      pool: poolTag ? poolTag.replace("kira:rpg_pool_", "").replace("kira:rpg_material_", "") : void 0,
      info: info2
    };
  }
  const info = classify(stack.typeId);
  if (info) return { eligible: true, reason: `バニラ装備 ${info.baseName}`, thirdParty: false };
  if (THIRD_PARTY_WHITELIST.includes(stack.typeId)) {
    return { eligible: true, reason: "サードパーティホワイトリスト", thirdParty: true };
  }
  return { eligible: false, reason: `接管プールにありません: ${stack.typeId}`, thirdParty: false };
}
function ingestStack(stack, origin, detail, force = false, qualityRange) {
  const verdict = eligibility(stack, origin);
  if (!verdict.eligible && !force) {
    return { stack, ingested: false, reason: verdict.reason, thirdParty: verdict.thirdParty };
  }
  const seed = nextSeed();
  let spec = generateSpec(stack.typeId, seed, {
    qualityRange,
    source: sourceOf(origin, qualityRange),
    forceInfo: verdict.info
  });
  if (!spec) {
    return { stack, ingested: false, reason: "生成器がこのアイテムを認識しません", thirdParty: verdict.thirdParty };
  }
  if (spec.unique.length > 0) {
    const tplId = spec.unique[0].id;
    const claimed = claimUniqueTemplate(tplId);
    if (!claimed) {
      const fallback = generateSpec(stack.typeId, seed, {
        forceQuality: "ancient",
        forceInfo: verdict.info,
        source: sourceOf(origin, qualityRange)
      });
      if (fallback) {
        spec = fallback;
        zlog("unique:downgraded", { template: tplId, reason: "すでに使用中か、レジストリが書き込み不可です" });
      }
    } else {
      zlog("unique:granted", { template: claimed, player: "world" });
    }
  }
  spec.origin = origin;
  if (detail) spec.originDetail = detail;
  stampMarkers(stack, spec, origin, detail);
  writeSpec(stack, spec);
  return { stack, spec, ingested: true, reason: verdict.reason, thirdParty: verdict.thirdParty };
}
var BATCH_PER_TICK = 4;
var queue = [];
var draining = false;
function drainQueue() {
  draining = false;
  const job = queue[0];
  if (!job) return;
  let processed = 0;
  while (processed < BATCH_PER_TICK && job.cursor < job.slots.length) {
    const slot = job.slots[job.cursor++];
    try {
      const item = job.container.getItem(slot);
      if (item) {
        const res = ingestStack(item, job.origin, job.detail, false, job.qualityRange);
        if (res.ingested) {
          job.container.setItem(slot, res.stack);
          job.converted++;
        }
      }
    } catch {
    }
    processed++;
  }
  if (job.cursor >= job.slots.length) {
    queue.shift();
    try {
      job.onDone?.(job.converted);
    } catch {
    }
  }
  if (queue.length && !draining) {
    draining = true;
    system6.runTimeout(drainQueue, 1);
  }
}
function scheduleContainerIngest(container, origin, detail, onDone, qualityRange) {
  const slots = [];
  const size = container.size;
  for (let i = 0; i < size; i++) {
    try {
      if (container.getItem(i)) slots.push(i);
    } catch {
    }
  }
  if (!slots.length) return 0;
  queue.push({ container, slots, origin, detail, qualityRange, cursor: 0, converted: 0, onDone });
  if (!draining) {
    draining = true;
    system6.runTimeout(drainQueue, 1);
  }
  return slots.length;
}
function ingestItemEntity(entity, origin, detail, qualityRange) {
  try {
    if (entity.typeId !== "minecraft:item") return false;
    const comp = entity.getComponent("minecraft:item");
    const stack = comp?.itemStack;
    if (!stack) return false;
    if (isRPG(stack)) return false;
    const res = ingestStack(stack, origin, detail, false, qualityRange);
    if (!res.ingested) return false;
    const loc = entity.location;
    const dim = entity.dimension;
    try {
      entity.remove();
    } catch {
    }
    try {
      dim.spawnItem(res.stack, loc);
    } catch (e) {
      zlog("ドロップアイテムの再生成に失敗", { error: String(e) });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
var PLACED_KEY = "af:placed_containers";
var PLACED_LIMIT = 2e3;
var placedCache;
function posKey(dimId, x, y, z) {
  return `${dimId}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}
function loadPlaced() {
  if (placedCache) return placedCache;
  const set = /* @__PURE__ */ new Set();
  try {
    const raw = world10.getDynamicProperty(PLACED_KEY);
    if (typeof raw === "string" && raw.length) {
      for (const k of JSON.parse(raw)) set.add(k);
    }
  } catch {
  }
  placedCache = set;
  return set;
}
function savePlaced(set) {
  try {
    let arr = [...set];
    if (arr.length > PLACED_LIMIT) arr = arr.slice(arr.length - PLACED_LIMIT);
    world10.setDynamicProperty(PLACED_KEY, JSON.stringify(arr));
  } catch {
  }
}
function markPlayerPlaced(dimId, x, y, z) {
  const set = loadPlaced();
  set.add(posKey(dimId, x, y, z));
  savePlaced(set);
}
function isPlayerPlaced(dimId, x, y, z) {
  return loadPlaced().has(posKey(dimId, x, y, z));
}

// scripts/commands/ScriptEvents.ts
var REGISTERED = [
  "af:help",
  "af:selftest",
  "af:inspect",
  "af:roll",
  "af:stats",
  "af:forge",
  "af:scan",
  "af:dura",
  "af:dura-set",
  "af:dura-slot",
  "af:dura-grant",
  "af:dura-test",
  "af:dumpinv",
  "af:dumpitems",
  "af:verify",
  "af:probe",
  "af:stress"
];
function registeredScriptEvents() {
  return [...REGISTERED];
}
function reply(player, text) {
  try {
    if (player) player.onScreenDisplay.setActionBar(text);
    else world11.sendMessage(text);
  } catch {
    zlog(text);
  }
}
function giveGenerated(player, typeId, quality) {
  const spec = generateSpec(typeId, nextSeed(), {
    forceQuality: quality && QUALITY_BY_ID[quality] ? quality : void 0
  });
  if (!spec) return void 0;
  const stack = new ItemStack5(typeId, 1);
  rerender(stack, spec);
  const inv = player.getComponent("minecraft:inventory");
  const container = inv?.container;
  if (container) {
    const leftover = container.addItem(stack);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
  } else {
    player.dimension.spawnItem(stack, player.location);
  }
  return spec;
}
function onScriptEvent(ev) {
  try {
    const id = ev.id;
    const arg = (ev.message ?? "").trim();
    const parts = arg.length ? arg.split(/\s+/) : [];
    const source = ev.sourceEntity;
    let player = source && source.typeId === "minecraft:player" ? source : void 0;
    const named = arg.match(/@([A-Za-z0-9_]{1,16})/);
    if (named) {
      for (const pl of world11.getAllPlayers()) {
        if (pl && pl.isValid && pl.name === named[1]) {
          player = pl;
          break;
        }
      }
    }
    switch (id) {
      case "af:help":
        zlog("アフィックスフォージ Affix Forge コマンド一覧", { ids: REGISTERED });
        world11.sendMessage(
          [
            "\xA76===== アフィックスフォージ Affix Forge =====",
            "\xA7e—— 遊び方 ——",
            "\xA77\xB7 いつも通りに採掘/モブ討伐/チェスト開封/装備作成 —— 装備は\xA7f自動\xA77でランダム装備になり、\xA7fすぐ使えます",
            "\xA77\xB7 追加の材料・巻物・専用作業台は一切不要",
            "\xA7e—— コマンド ——",
            "\xA77/scriptevent af:inspect \xA78メインハンド装備を確認（アフィックスパネル全体）",
            "\xA77/scriptevent af:stats \xA78メインハンド装備の集約属性を出力",
            "\xA77/scriptevent af:roll <アイテムid> [品質] \xA78指定した装備を 1 件生成",
            "\xA77/scriptevent af:verify \xA78セルフチェック一覧（実際のクライアントでの受入項目を含む）",
            "\xA77/scriptevent af:selftest \xA78ランタイムセルフテスト 22 項目を実行"
          ].join("\n")
        );
        break;
      case "af:selftest":
        world11.sendMessage("\xA7e" + runSelfTestOnce());
        break;
      case "af:inspect": {
        if (!player) {
          world11.sendMessage("\xA7cこのコマンドはプレイヤーが実行する必要があります");
          break;
        }
        const spec = mainhandSpec(player);
        if (!spec) {
          reply(player, "\xA7cメインハンドは本システムの装備ではありません");
          break;
        }
        void showInspect(player, spec, getState(player.id, player.name).resonances);
        break;
      }
      case "af:roll": {
        const type = parts[0] ?? "minecraft:diamond_sword";
        const quality = parts[1];
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7cオンラインのプレイヤーがいないため、アイテムを渡せません");
          break;
        }
        const spec = giveGenerated(target, type, quality);
        world11.sendMessage(spec ? `\xA7a生成しました \xA7r${spec.name}` : `\xA7c${type} を生成できません`);
        break;
      }
      case "af:stats": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7cオンラインのプレイヤーがいません");
          break;
        }
        const spec = mainhandSpec(target);
        if (!spec) {
          world11.sendMessage("\xA7cメインハンドは本システムの装備ではありません");
          break;
        }
        const stats = specStats(spec);
        const lines = Object.keys(stats).filter((k) => stats[k]).map((k) => `${k}=${stats[k]}`).join(" ");
        world11.sendMessage(`\xA77[${spec.baseName}] \xA7f${lines}`);
        zlog("af:stats", { spec: encodeSpec(spec).slice(0, 120) });
        break;
      }
      case "af:dura": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura にはプレイヤーの実行者が必要です");
          break;
        }
        const eq = target.getComponent("minecraft:equippable");
        const main = eq?.getEquipment(EquipmentSlot3.Mainhand);
        const info = { player: target.name, item: main?.typeId ?? null };
        if (main) {
          try {
            const dur = main.getComponent("minecraft:durability");
            if (dur) {
              info.damage = dur.damage;
              info.maxDurability = dur.maxDurability;
              info.unbreakable = dur.unbreakable;
              info.remaining = dur.maxDurability - dur.damage;
            }
          } catch (e) {
            info.err = String(e);
          }
          try {
            info.enchants = readEnchantNames(main);
          } catch {
          }
          const spec = readSpec(main);
          if (spec) {
            info.rpg = true;
            info.quality = spec.quality;
            info.instance = readInstance(main) ?? null;
          }
        }
        zlog("af:dura", info);
        world11.sendMessage(`\xA7a耐久: ${JSON.stringify(info)}`);
        break;
      }
      case "af:dura-set": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura-set にはプレイヤーの実行者が必要です");
          break;
        }
        const n = Number(parts[0]);
        const eq = target.getComponent("minecraft:equippable");
        const main = eq?.getEquipment(EquipmentSlot3.Mainhand);
        let ok = false;
        let before;
        let after;
        try {
          const dur = main?.getComponent("minecraft:durability");
          if (dur) {
            before = dur.damage;
            dur.damage = n;
            after = dur.damage;
            ok = after === n;
            eq?.setEquipment(EquipmentSlot3.Mainhand, main);
          }
        } catch (e) {
          zlog("af:dura-set 失敗", { error: String(e) });
        }
        zlog("af:dura-set", { requested: n, before, after, ok });
        world11.sendMessage(`\xA7a耐久の書き込み: 要求 ${n} / 前 ${before} / 後 ${after} / ok=${ok}`);
        break;
      }
      case "af:dura-slot": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura-slot にはプレイヤーが必要です");
          break;
        }
        const slotName = parts[0] ?? "Chest";
        const slot = EquipmentSlot3[slotName] ?? EquipmentSlot3.Chest;
        const eq = target.getComponent("minecraft:equippable");
        const item = eq?.getEquipment(slot);
        const info = { player: target.name, slot: String(slot), item: item?.typeId ?? null };
        if (item) {
          try {
            const dur = item.getComponent("minecraft:durability");
            if (dur) {
              info.damage = dur.damage;
              info.maxDurability = dur.maxDurability;
              info.unbreakable = dur.unbreakable;
            }
          } catch (e) {
            info.err = String(e);
          }
          const spec = readSpec(item);
          if (spec) {
            info.rpg = true;
            info.quality = spec.quality;
            info.name = spec.name;
          }
        }
        zlog("af:dura-slot", info);
        world11.sendMessage(`\xA7a耐久[${slotName}]: ${JSON.stringify(info)}`);
        break;
      }
      case "af:dura-grant": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura-grant にはプレイヤーが必要です");
          break;
        }
        const statName = parts[0];
        const statVal = Number(parts[1] ?? 0);
        const typeId = parts[2] ?? "minecraft:diamond_pickaxe";
        const slotName = parts[3] ?? "Mainhand";
        if (!statName) {
          world11.sendMessage("\xA7c使い方: af:dura-grant <stat> <value> [item] [slot]");
          break;
        }
        const item = new ItemStack5(typeId, 1);
        const spec = generateSpec(typeId, 12345, {
          forceQuality: "common",
          forceInfo: classify(typeId)
        });
        let specOk = false;
        if (spec) {
          spec.pos = [];
          spec.neg = [];
          spec.dual = [];
          spec.special = [];
          spec.curse = [];
          spec.unique = [];
          spec.hidden = { [statName]: statVal };
          spec.name = `\xA7e[テスト] ${statName}=${statVal}`;
          spec.score = 0;
          writeSpec(item, spec);
          specOk = true;
        }
        const eq = target.getComponent("minecraft:equippable");
        const slot = EquipmentSlot3[slotName] ?? EquipmentSlot3.Mainhand;
        eq?.setEquipment(slot, item);
        zlog("af:dura-grant", { player: target.name, stat: statName, value: statVal, item: typeId, slot: String(slot), specOk });
        world11.sendMessage(`\xA7a${typeId} に ${statName}=${statVal} を付けました（${slotName}）`);
        break;
      }
      case "af:dumpitems": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dumpitems にはプレイヤーの実行者が必要です");
          break;
        }
        const list = [];
        try {
          const ents = target.dimension.getEntities({ location: target.location, maxDistance: 24, type: "minecraft:item" });
          for (const e of ents) {
            const comp = e.getComponent("minecraft:item");
            const st = comp?.itemStack;
            if (!st) continue;
            const spec = readSpec(st);
            list.push({
              type: st.typeId,
              amount: st.amount,
              rpg: isRPG(st),
              quality: spec?.quality ?? null,
              score: spec?.score ?? null,
              instance: readInstance(st) ?? null,
              nameTag: st.nameTag ?? null,
              pos: [Math.round(e.location.x), Math.round(e.location.y), Math.round(e.location.z)]
            });
          }
        } catch (e) {
          list.push({ error: String(e) });
        }
        zlog("af:dumpitems", { player: target.name, count: list.length, items: list });
        world11.sendMessage(`\xA7a付近のドロップアイテムを dump しました（${list.length} 個）。サーバーログを参照`);
        break;
      }
      case "af:dumpinv": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dumpinv にはプレイヤーの実行者が必要です");
          break;
        }
        const out = [];
        try {
          const c = target.getComponent("minecraft:inventory")?.container;
          for (let i = 0; i < (c?.size ?? 0); i++) {
            const it = c?.getItem(i);
            if (!it) continue;
            const spec = readSpec(it);
            out.push({
              slot: i,
              type: it.typeId,
              nameTag: it.nameTag ?? null,
              lore: (it.getLore() ?? []).length,
              rpg: isRPG(it),
              quality: spec?.quality ?? null,
              score: spec?.score ?? null,
              instance: readInstance(it) ?? null,
              origin: spec?.origin ?? null,
              dynBytes: it.getDynamicPropertyTotalByteCount?.() ?? null,
              // 诊断: 第三方契约靠 Item Tag，这里把 tags 原样打出来
              tags: (() => {
                try {
                  const g = it.getTags;
                  return typeof g === "function" ? g.call(it) : "NO_GETTAGS_API";
                } catch (e) {
                  return "ERR:" + String(e);
                }
              })()
            });
          }
        } catch (e) {
          out.push({ error: String(e) });
        }
        zlog("af:dumpinv", { player: target.name, items: out });
        world11.sendMessage(`\xA7a${target.name} のインベントリを dump しました（${out.length} 件）。サーバーログを参照`);
        break;
      }
      case "af:scan": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:scan には実行者としてプレイヤーが必要です（/execute as @a run scriptevent af:scan）");
          break;
        }
        registerPlayer(target.id);
        let changed = 0;
        try {
          const inv = target.getComponent("minecraft:inventory");
          if (inv?.container) changed = processContainer(inv.container);
        } catch (e) {
          zlog("af:scan インベントリ失敗", { error: String(e) });
        }
        let stats = 0;
        try {
          const st = refreshPlayer(target, true);
          applyEffects(target, st);
          stats = Object.keys(st.stats).filter((k) => st.stats[k]).length;
        } catch (e) {
          zlog("af:scan 属性失敗", { error: String(e) });
        }
        zlog("af:scan", { player: target.name, changed, activeStats: stats });
        world11.sendMessage(`\xA7a${target.name} を再スキャンしました：新規生成装備 ${changed} 件、有効属性 ${stats} 項目`);
        break;
      }
      case "af:forge": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7cオンラインのプレイヤーがいないため、鍛造できません");
          break;
        }
        const clean = parts.filter((x) => !x.startsWith("@"));
        const typeId = clean[0] ?? "minecraft:diamond_sword";
        const quality = clean[1] && QUALITY_BY_ID[clean[1]] ? clean[1] : "common";
        const parse = (s) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((x) => {
          const [id2, lv] = x.split(":");
          return { id: id2, level: Math.max(1, Math.min(5, Number(lv) || 1)), roll: 1, rarity: "common" };
        });
        const pos = parse(clean[2] === "-" ? "" : clean[2]);
        const neg = parse(clean[3] === "-" ? "" : clean[3]);
        const unidentified = parts.includes("-u");
        const base = generateSpec(typeId, nextSeed(), { forceQuality: quality, forceIdentified: !unidentified });
        if (!base) {
          world11.sendMessage("\xA7c生成できません " + typeId);
          break;
        }
        const spec = { ...base, pos, neg, dual: [], special: [], curse: [], unique: [], hidden: {} };
        const stack = new ItemStack5(typeId, 1);
        rerender(stack, spec);
        const inv = target.getComponent("minecraft:inventory");
        const container = inv?.container;
        if (container) {
          const leftover = container.addItem(stack);
          if (leftover) target.dimension.spawnItem(leftover, target.location);
        } else {
          target.dimension.spawnItem(stack, target.location);
        }
        world11.sendMessage(`\xA7a鍛造しました \xA7r${spec.name}`);
        zlog("af:forge", { typeId, quality, pos: pos.map((a) => a.id), neg: neg.map((a) => a.id) });
        break;
      }
      case "af:verify": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7cプレイヤーが実行する必要があります：/scriptevent af:verify");
          break;
        }
        const spec = mainhandSpec(target);
        const st = getState(target.id, target.name);
        const lines = [];
        lines.push("\xA76===== アフィックスフォージ \xB7 垂直スライス自己点検 =====");
        lines.push(spec ? `\xA7a[自動] メインハンド装備を認識しました：${spec.name}` : "\xA7e[自動] メインハンドは本システムの装備ではありません（先に装備を 1 つ持ってください）");
        if (spec) {
          lines.push(`\xA7a[自動] 品質=${spec.quality} スコア=${spec.score} リスク=${spec.risk} シナジー=${Math.round(spec.synergy * 100)}%`);
          lines.push(`\xA7a[自動] アフィックス：ポジティブ ${spec.pos.length} / ネガティブ ${spec.neg.length} / 両刃 ${spec.dual.length} / 特殊 ${spec.special.length} / 呪い ${spec.curse.length} / ユニーク ${spec.unique.length}`);
          lines.push(spec.identified ? "\xA7a[自動] 鑑定状態：鑑定済み" : "\xA7e[自動] 鑑定状態：未鑑定（オフハンドに鑑定の巻物 + 作業台を右クリック）");
          const ench = 0;
          void ench;
        }
        lines.push(`\xA7a[自動] 発動中の共鳴：${st.resonances.length ? st.resonances.map((r) => r.def.name).join("、") : "なし"}`);
        const stats = st.stats;
        const active = Object.keys(stats).filter((k) => stats[k]).length;
        lines.push(`\xA7a[自動] 現在有効な属性：${active} 項目`);
        lines.push("\xA77--- あなたの手動確認が必要です（20 項目のリストは reports/PLAYER_ACCEPTANCE.md）---");
        lines.push("\xA77 1. 作業台に紙 4 + アメジストの欠片 1 → 鑑定の巻物 2 個を産出");
        lines.push("\xA77 2. 作業台で木の剣を作る → 名前がすぐ【品質】接頭辞\xB7木の剣 になる");
        lines.push("\xA77 3. ホバーで tooltip を表示：品質/スコア/リスク/シナジー/ポジ・ネガアフィックス/攻撃速度段階");
        lines.push("\xA77 4. チェストに入れる → 取り出す → アフィックスは変わらない");
        lines.push("\xA77 5. エンチャントテーブルで鋭さ V を付与 → アフィックスとエンチャントが同時に存在する");
        lines.push("\xA77 6. 剣を持ってモブを攻撃 → クリティカル/吸血/元素がアフィックスに従って発動");
        lines.push("\xA77 7. アーマーを着て攻撃を受ける → 軽減方向が正しい（素手/バニラアーマー/アフィックスアーマーと比較）");
        lines.push("\xA77 8. /kill @s → 装備を拾い戻す → アフィックスはそのまま");
        for (const l of lines) world11.sendMessage(l);
        zlog("af:verify", { spec: spec ? spec.name : null, resonances: st.resonances.map((r) => r.def.id), activeStats: active });
        break;
      }
      case "af:probe": {
        const dim = world11.getDimension("overworld");
        const out = {};
        const run = (cmd) => {
          try {
            const r = dim.runCommand(cmd);
            return "ok:" + String(r?.successCount ?? "?");
          } catch (e) {
            return "throw:" + String(e);
          }
        };
        out.tickingarea = run("tickingarea add 0 100 0 15 100 15 afprobe");
        out.setblock100 = run("setblock 8 100 8 chest");
        out.setblockNeg60 = run("setblock 8 -60 8 chest");
        const readAt = (y) => {
          try {
            const b = dim.getBlock({ x: 8, y, z: 8 });
            return b ? b.typeId : "undefined";
          } catch (e) {
            return "throw:" + String(e);
          }
        };
        out.block100 = readAt(100);
        out.blockNeg60 = readAt(-60);
        out.players = onlinePlayers().length;
        out.playerNames = onlinePlayers().map((p) => {
          try {
            return String(p.name);
          } catch (e) {
            return "ERR:" + String(e);
          }
        });
        out.dimId = dim.id;
        try {
          const ents = dim.getEntities();
          out.entityCount = ents.length;
          const byType = {};
          for (const e of ents) {
            try {
              byType[e.typeId] = (byType[e.typeId] ?? 0) + 1;
            } catch {
            }
          }
          out.entityTypes = byType;
        } catch (e) {
          out.entityErr = String(e);
        }
        try {
          out.spawn = JSON.stringify(world11.getDefaultSpawnLocation());
        } catch (e) {
          out.spawn = "throw:" + String(e);
        }
        zlog("af:probe", out);
        world11.sendMessage("\xA77[probe] " + JSON.stringify(out));
        break;
      }
      case "af:stress": {
        const n = Math.max(1, Math.min(2e4, Number(parts[0]) || 500));
        const t0 = Date.now();
        const counts = {};
        for (let i = 0; i < n; i++) {
          const spec = generateSpec("minecraft:diamond_sword", (nextSeed() ^ i * 2654435761) >>> 0);
          if (!spec) continue;
          counts[spec.quality] = (counts[spec.quality] ?? 0) + 1;
        }
        const dt = Date.now() - t0;
        world11.sendMessage(`\xA7a${n} 件を生成、所要 ${dt}ms`);
        zlog("af:stress", { n, ms: dt, counts });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    zlog("scriptevent 処理で例外発生", { id: ev.id, error: String(e) });
  }
}
function installScriptEvents() {
  system7.afterEvents.scriptEventReceive.subscribe(onScriptEvent);
  zlog("script events registered", { ids: REGISTERED });
}

// scripts/systems/Acquisition.ts
import { system as system9, world as world13 } from "@minecraft/server";

// scripts/systems/Feedback.ts
import { system as system8, world as world12 } from "@minecraft/server";
function tierOf(quality) {
  switch (quality) {
    case "poor":
    case "broken":
    case "common":
      return 0;
    case "fine":
    case "rare":
      return 1;
    case "epic":
    case "legendary":
      return 2;
    default:
      return 3;
  }
}
function tryParticles(player, id) {
  try {
    player.dimension.spawnParticle(id, { x: player.location.x, y: player.location.y + 1, z: player.location.z });
  } catch {
  }
}
function trySound(player, id, volume = 0.8, pitch = 1) {
  try {
    player.playSound(id, { volume, pitch });
  } catch {
  }
}
function announceGeneration(player, spec, origin) {
  const tier2 = tierOf(spec.quality);
  const q = QUALITY_BY_ID[spec.quality];
  const qName = q ? q.name : spec.quality;
  if (player) {
    system8.run(() => tryParticles(player, "af:affix_burst"));
    if (tier2 >= 1) {
      system8.run(() => trySound(player, tier2 >= 3 ? "random.levelup" : tier2 === 2 ? "random.anvil_use" : "random.orb", 0.7, tier2 >= 3 ? 1.2 : 1));
    }
    if (tier2 >= 2) {
      try {
        player.onScreenDisplay.setActionBar(`${q ? q.color : "\xA7f"}✦ ${spec.name} \xA77(${spec.score} 点)`);
      } catch {
      }
    }
  }
  if (tier2 >= 3) {
    try {
      world12.sendMessage(`\xA76✦✦✦ \xA7r${spec.name} \xA76✦✦✦ \xA77${player ? player.name : "ワールド"} が獲得（${spec.score} 点）`);
    } catch {
    }
    for (const p of onlinePlayers()) {
      if (p === player) continue;
      system8.run(() => trySound(p, "random.levelup", 0.5, 1.4));
    }
  }
}

// scripts/systems/Acquisition.ts
var playerDropIds = /* @__PURE__ */ new Set();
var CONTAINER_BLOCKS = /* @__PURE__ */ new Set([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel",
  "minecraft:shulker_box",
  "minecraft:undyed_shulker_box",
  "minecraft:dispenser",
  "minecraft:dropper",
  "minecraft:hopper"
]);
function isPlayerEntity(e) {
  if (!e) return false;
  try {
    return e.typeId === "minecraft:player";
  } catch {
    return false;
  }
}
function containerOf(block) {
  try {
    const b = block;
    const inv = b.getComponent?.("minecraft:inventory");
    return inv?.container;
  } catch {
    return void 0;
  }
}
var SWEEP_TICKS = 60;
var SWEEP_RADIUS = 32;
var SWEEP_MAX = 64;
function sweepWorldItems() {
  let budget = SWEEP_MAX;
  const consume = (list) => {
    for (const e of list) {
      if (budget <= 0) break;
      try {
        const comp = e.getComponent("minecraft:item");
        const s = comp?.itemStack;
        if (!s || isRPG(s)) continue;
        if (ingestItemEntity(e, "unknown")) budget--;
      } catch {
      }
    }
  };
  let sawPlayer = false;
  try {
    for (const p of world13.getAllPlayers()) {
      if (!p) continue;
      sawPlayer = true;
      consume(p.dimension.getEntities({ location: p.location, maxDistance: SWEEP_RADIUS, type: "minecraft:item" }));
      if (budget <= 0) return;
    }
  } catch {
  }
  if (!sawPlayer) {
    for (const dimId of ["overworld", "nether", "the_end"]) {
      if (budget <= 0) break;
      try {
        consume(world13.getDimension(dimId).getEntities({ type: "minecraft:item" }));
      } catch {
      }
    }
  }
}
var CRAFT_WINDOW_TICKS = 60;
var craftWindow = /* @__PURE__ */ new Map();
function installAcquisition() {
  world13.afterEvents.playerInteractWithBlock.subscribe((ev) => {
    try {
      zlog("playerInteractWithBlock", { block: ev.block?.typeId, player: ev.player?.name });
      if (ev.block?.typeId !== "minecraft:crafting_table") return;
      craftWindow.set(ev.player.id, system9.currentTick + CRAFT_WINDOW_TICKS);
      zlog("craft-window open", { player: ev.player?.name, until: system9.currentTick + CRAFT_WINDOW_TICKS });
    } catch {
    }
  });
  world13.afterEvents.playerInventoryItemChange.subscribe((ev) => {
    try {
      const stack = ev.itemStack;
      if (!stack) return;
      if (isRPG(stack)) return;
      const until = craftWindow.get(ev.player.id);
      const origin = until !== void 0 && system9.currentTick <= until ? "crafting" : "inventory";
      const player = ev.player;
      const typeId = stack.typeId;
      system9.run(() => {
        try {
          const container = player.getComponent("minecraft:inventory")?.container;
          if (!container) return;
          for (let i = 0; i < container.size; i++) {
            const it = container.getItem(i);
            if (!it || it.typeId !== typeId || isRPG(it)) continue;
            const res = ingestStack(it, origin);
            if (!res.ingested) continue;
            container.setItem(i, res.stack);
            if (res.spec) announceGeneration(player, res.spec, origin);
            zlog("ingest:" + origin, { item: typeId, slot: i, quality: res.spec?.quality, score: res.spec?.score });
            break;
          }
        } catch (e) {
          zlog("インベントリ接管の遅延書き戻しに失敗", { error: String(e) });
        }
      });
    } catch (e) {
      zlog("playerInventoryItemChange 例外", { error: String(e) });
    }
  });
  world13.afterEvents.entityItemDrop.subscribe((ev) => {
    try {
      const dropped = Array.isArray(ev.items) ? ev.items : [];
      if (!dropped.length) return;
      const fromPlayer = isPlayerEntity(ev.entity);
      if (fromPlayer && !SOURCES.playerDrop) {
        for (const it of dropped) playerDropIds.add(it.id);
        return;
      }
      const origin = fromPlayer ? "inventory" : "mob_loot";
      const detail = fromPlayer ? void 0 : ev.entity?.typeId;
      let tier2;
      if (!fromPlayer && ev.entity) {
        let equipped = false;
        try {
          const eq = ev.entity.getComponent("minecraft:equippable");
          for (const slot of ["Head", "Chest", "Legs", "Feet", "Mainhand"]) {
            if (eq?.getEquipment?.(slot)) {
              equipped = true;
              break;
            }
          }
        } catch {
        }
        tier2 = classifyMob(detail ?? "", equipped);
      }
      for (const itemEntity of dropped) {
        if (ingestItemEntity(itemEntity, origin, detail, tier2?.range)) {
          zlog("ingest:mob_loot", { from: detail, tier: tier2?.id, range: tier2?.range });
        }
      }
    } catch (e) {
      const anyE = e;
      let shape = "n/a";
      try {
        const it = ev.items;
        shape = Array.isArray(it) ? `Array(${it.length})` : typeof it;
      } catch {
      }
      zlog("entityItemDrop 例外", {
        error: String(e),
        itemsShape: shape,
        entityType: ev.entity?.typeId ?? null,
        stack: anyE?.stack ? String(anyE.stack).split("\n").slice(0, 6).join(" | ") : null
      });
    }
  });
  world13.afterEvents.entitySpawn.subscribe((ev) => {
    try {
      if (ev.entity.typeId !== "minecraft:item") return;
      const id = ev.entity.id;
      const ent = ev.entity;
      system9.run(() => {
        if (playerDropIds.has(id)) {
          playerDropIds.delete(id);
          return;
        }
        if (ingestItemEntity(ent, "unknown")) {
          zlog("ingest:world_item", {});
        }
      });
    } catch (e) {
      zlog("entitySpawn 例外", { error: String(e) });
    }
  });
  system9.runInterval(sweepWorldItems, SWEEP_TICKS);
  world13.afterEvents.playerPlaceBlock.subscribe((ev) => {
    try {
      const id = ev.block.typeId;
      if (!CONTAINER_BLOCKS.has(id)) return;
      const loc = ev.block.location;
      markPlayerPlaced(ev.block.dimension.id, loc.x, loc.y, loc.z);
    } catch (e) {
      zlog("playerPlaceBlock 例外", { error: String(e) });
    }
  });
  const openedSignal = world13.afterEvents["blockContainerOpened"];
  openedSignal?.subscribe?.((ev) => {
    try {
      const block = ev.block;
      if (!CONTAINER_BLOCKS.has(block.typeId)) return;
      const loc = block.location;
      if (isPlayerPlaced(block.dimension.id, loc.x, loc.y, loc.z)) {
        return;
      }
      const container = containerOf(block);
      if (!container) return;
      const tier2 = classifyChest(block.dimension.id, loc.y);
      const scheduled = scheduleContainerIngest(
        container,
        "chest_loot",
        block.typeId.replace("minecraft:", "") + ":" + tier2.id,
        (n) => {
          if (n > 0) zlog("ingest:chest_loot", { block: block.typeId, tier: tier2.id, range: tier2.range, count: n });
        },
        tier2.range
      );
      if (scheduled > 0) zlog("ingest:chest_loot:scheduled", { block: block.typeId, tier: tier2.id, slots: scheduled });
    } catch (e) {
      zlog("blockContainerOpened 例外", { error: String(e) });
    }
  });
}

// scripts/main.ts
var SELF_TEST_START_TICK = 200;
var STAT_REFRESH_TICKS = 20;
var INVENTORY_SCAN_TICKS = 40;
var booted = false;
function trackPlayer(player) {
  registerPlayer(player.id);
  getState(player.id, player.name);
}
function onPlayerSpawn(ev) {
  const player = ev.player;
  if (!player) return;
  trackPlayer(player);
  zlog("playerSpawn", { name: player.name, id: player.id });
  try {
    player.onScreenDisplay.setActionBar("\xA76【アフィックスフォージ】\xA77ロード済み：クラフト / ドロップ / 取引で得た装備にはランダムでアフィックスが生成されます");
  } catch {
  }
}
function refreshAll() {
  for (const player of onlinePlayers()) {
    if (!player) continue;
    try {
      const st = refreshPlayer(player, true);
      applyEffects(player, st);
      const loc = player.location;
      st.pos = { x: loc.x, y: loc.y, z: loc.z };
      st.dimId = dimensionId(player);
      st.night = isNight(player);
      const h = player.getComponent("minecraft:health");
      st.health = h?.currentValue ?? 20;
      st.maxHealth = h?.effectiveMax ?? 20;
      st.healthRatio = st.health / Math.max(1, st.maxHealth);
      st.inWater = safeInWater(player);
      st.nearbyPlayers = Math.max(0, onlinePlayers().length - 1);
      st.enemyCount = countEnemies(player);
    } catch (e) {
      zlog("refreshAll 例外", { player: player.name, error: String(e) });
    }
  }
}
function safeInWater(player) {
  try {
    const block = player.dimension.getBlock(player.location);
    return block?.typeId === "minecraft:water" || block?.typeId === "minecraft:flowing_water";
  } catch {
    return false;
  }
}
function countEnemies(player) {
  try {
    const list = player.dimension.getEntities({
      location: player.location,
      maxDistance: 12,
      excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb", "minecraft:armor_stand"]
    });
    return list.length;
  } catch {
    return 0;
  }
}
function scanInventories() {
  const all = onlinePlayers();
  if (all.length && system10.currentTick % 200 < 40) {
    zlog("scan-diag", { tick: system10.currentTick, count: all.length, names: all.map((p) => {
      try {
        return p ? String(p.name) + "/" + String(p.isValid) : "UNDEF";
      } catch (e) {
        return "ERR:" + String(e);
      }
    }) });
  }
  for (const player of all) {
    if (!player) continue;
    try {
      const inv = player.getComponent("minecraft:inventory");
      if (inv?.container) processContainer(inv.container);
      refreshPlayer(player, true);
    } catch (e) {
      zlog("scanInventories 例外", { error: String(e) });
    }
  }
}
var runtimeCache;
function runtimeInfo() {
  if (runtimeCache) return runtimeCache;
  let module = "@minecraft/server unknown";
  let server = "unknown";
  try {
    const sys = system10;
    if (typeof sys.version === "string") server = sys.version;
  } catch {
  }
  try {
    const ev = world14.afterEvents;
    const hasContainerOpened = typeof ev["blockContainerOpened"] === "object";
    module = hasContainerOpened ? "@minecraft/server 2.8.0+" : "@minecraft/server <=2.7.0";
  } catch {
  }
  runtimeCache = { server, module };
  return runtimeCache;
}
function boot() {
  if (booted) return;
  booted = true;
  installCombat();
  installMining();
  installDurability();
  installEnvironment();
  installAcquisition();
  installScriptEvents();
  installSelfTest();
  for (const player of onlinePlayers()) {
    if (!player) continue;
    trackPlayer(player);
  }
  system10.runInterval(() => {
    setTickCache(system10.currentTick);
  }, 1);
  system10.runInterval(refreshAll, STAT_REFRESH_TICKS);
  system10.runInterval(scanInventories, INVENTORY_SCAN_TICKS);
  system10.runTimeout(() => {
    if (!isSelfTestRunning()) {
      const msg = startSelfTest();
      zlog("self test scheduled", { msg });
    }
  }, SELF_TEST_START_TICK);
  zlog("affix-forge booted", {
    // 不要硬编码版本号 —— 同一份代码会在不同 BDS 上运行（正式 1.26.52.3 / lab 1.26.20.5）。
    // 这里读的是**运行时真实能力**，而不是编译期常量。
    server: runtimeInfo().server,
    module: runtimeInfo().module,
    selfTestTick: SELF_TEST_START_TICK
  });
}
world14.afterEvents.worldLoad.subscribe(() => boot());
world14.afterEvents.playerSpawn.subscribe(onPlayerSpawn);
world14.afterEvents.playerLeave.subscribe((ev) => {
  try {
    unregisterPlayer(ev.playerId);
  } catch {
  }
});
system10.run(() => {
  if (!booted) {
    try {
      world14.getDimension("overworld");
      boot();
    } catch (e) {
      zlog("遅延起動に失敗", { error: String(e) });
    }
  }
});

//# sourceMappingURL=../debug/main.js.map
