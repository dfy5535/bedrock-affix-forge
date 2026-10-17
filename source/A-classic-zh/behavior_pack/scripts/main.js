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
M("attackPct", "\u653B\u51FB\u4F24\u5BB3", "pct", 3, "offMult");
M("meleePct", "\u8FD1\u6218\u4F24\u5BB3", "pct", 2.8, "offMult");
M("chargedBonusPct", "\u84C4\u529B\u9996\u51FB\u4F24\u5BB3", "pct", 1.4, "offMult");
M("armorPenPct", "\u65E0\u89C6\u62A4\u7532", "pct", 2.6, "offMult");
M("sunderPct", "\u76EE\u6807\u9632\u5FA1\u524A\u5F31", "pct", 2, "offMult");
M("bleedDps", "\u6D41\u8840\u4F24\u5BB3/\u79D2", "flat", 9, "proc", void 0, { effect: "bleed" });
M("executePct", "\u5904\u51B3\u589E\u4F24", "pct", 1.6, "offMult", "targetLowHp");
M("killStackPct", "\u51FB\u6740\u53E0\u653B", "pct", 1.8, "offMult", "killStack");
M("rampagePct", "\u8FDE\u51FB\u540C\u76EE\u6807\u589E\u4F24", "pct", 2, "offMult", "combo");
M("berserkPct", "\u4F4E\u8840\u589E\u4F24", "pct", 2.2, "offMult", "selfLowHp");
M("vengeancePct", "\u53D7\u4F24\u540E\u589E\u4F24", "pct", 2, "offMult", "hurtRecent");
M("chasePct", "\u8FFD\u730E\u79FB\u52A8\u76EE\u6807", "pct", 1.8, "offMult", "targetMoving");
M("snipePct", "\u8FDC\u8DDD\u79BB\u589E\u4F24", "pct", 1.6, "offMult", "far");
M("weakspotPct", "\u5F31\u70B9\u589E\u4F24", "pct", 2.4, "offMult");
M("dancePct", "\u8FDE\u51FB\u989D\u5916\u4F24\u5BB3", "pct", 1.8, "offMult", "combo");
M("burstSpeedPct", "\u7206\u53D1\u653B\u901F", "pct", 1.6, "offMult", "hurtRecent");
M("bloodRagePct", "\u9020\u6210\u4F24\u5BB3\u540E\u589E\u653B", "pct", 1.8, "offMult", "hurtRecent");
M("assaultPct", "\u5F3A\u88AD\u589E\u4F24", "pct", 1.5, "offMult");
M("staggerChance", "\u786C\u76F4\u6982\u7387", "pct", 8, "proc", void 0, { effect: "stagger" });
M("elitePct", "\u5BF9\u7CBE\u82F1\u589E\u4F24", "pct", 2, "offMult", "elite");
M("giantPct", "\u5BF9\u5DE8\u578B\u751F\u7269\u589E\u4F24", "pct", 1.8, "offMult", "giant");
M("undeadPct", "\u5BF9\u4EA1\u7075\u589E\u4F24", "pct", 2, "offMult", "undead");
M("arthropodPct", "\u5BF9\u8282\u80A2\u589E\u4F24", "pct", 2, "offMult", "arthropod");
M("illagerPct", "\u5BF9\u707E\u5384\u589E\u4F24", "pct", 2, "offMult", "illager");
M("aquaticPct", "\u5BF9\u6C34\u751F\u589E\u4F24", "pct", 2, "offMult", "aquatic");
M("nethermobPct", "\u5BF9\u4E0B\u754C\u751F\u7269\u589E\u4F24", "pct", 2, "offMult", "nethermob");
M("bossPct", "\u5BF9 Boss \u589E\u4F24", "pct", 1.8, "offMult", "boss");
M("crowdPct", "\u654C\u4EBA\u8D8A\u591A\u589E\u4F24", "pct", 1.6, "offMult", "crowd");
M("soloPct", "\u72EC\u884C\u589E\u4F24", "pct", 1.8, "offMult", "solo");
M("allInPct", "\u5B64\u6CE8\u4E00\u63B7\u589E\u4F24", "pct", 1.4, "offMult", "crowd");
M("nightPct", "\u591C\u665A\u589E\u4F24", "pct", 1.6, "offMult", "night");
M("dayPct", "\u767D\u5929\u589E\u4F24", "pct", 1.6, "offMult", "day");
M("netherPct", "\u4E0B\u754C\u589E\u4F24", "pct", 1.5, "offMult", "nether");
M("waterPct", "\u6C34\u4E2D\u589E\u4F24", "pct", 1.5, "offMult", "water");
M("burningTargetPct", "\u5BF9\u71C3\u70E7\u76EE\u6807\u589E\u4F24", "pct", 1.8, "offMult", "burning");
M("frozenTargetPct", "\u5BF9\u51B0\u51BB\u76EE\u6807\u589E\u4F24", "pct", 1.8, "offMult", "frozen");
M("poisonedTargetPct", "\u5BF9\u4E2D\u6BD2\u76EE\u6807\u589E\u4F24", "pct", 1.8, "offMult", "poisoned");
M("backstabPct", "\u80CC\u88AD\u589E\u4F24", "pct", 2.2, "offMult", "behind");
M("unwoundedPct", "\u5BF9\u6EE1\u8840\u76EE\u6807\u589E\u4F24", "pct", 2, "offMult", "unwounded");
M("critFollowPct", "\u66B4\u51FB\u8FFD\u52A0\u4F24\u5BB3", "pct", 2.2, "offMult", "crit");
M("flatDamage", "\u989D\u5916\u56FA\u5B9A\u4F24\u5BB3", "flat", 14, "flat");
M("firstStrikePct", "\u5148\u624B\u589E\u4F24", "pct", 1.8, "offMult", "unwounded");
M("critChance", "\u66B4\u51FB\u7387", "pct", 7, "critChance");
M("critDamage", "\u66B4\u51FB\u4F24\u5BB3", "pct", 2.4, "critDamage");
M("killCritPct", "\u51FB\u6740\u540E\u66B4\u51FB\u7387", "pct", 3, "critChance", "killStack");
M("lowHpCrit", "\u4F4E\u8840\u76EE\u6807\u66B4\u51FB\u7387", "pct", 3.2, "critChance", "targetLowHp");
M("luckyChance", "\u5E78\u8FD0\u4E00\u51FB\u6982\u7387", "pct", 12, "proc", void 0, { effect: "lucky" });
M("doubleStrikeChance", "\u8FFD\u52A0\u4E00\u51FB\u6982\u7387", "pct", 6, "proc", void 0, { effect: "doubleStrike" });
M("finisherChance", "\u7EC8\u7ED3\u8FFD\u52A0\u91CD\u51FB", "pct", 5, "proc", void 0, { effect: "finisher" });
M("hunterHeartCrit", "\u6EE1\u8840\u76EE\u6807\u66B4\u51FB\u7387", "pct", 3, "critChance", "unwounded");
M("gambleCrit", "\u8D4C\u5F92\u66B4\u51FB\u7387", "pct", 5, "critChance");
M("gambleLossPct", "\u8D4C\u5F92\u4F24\u5BB3\u6CE2\u52A8", "pct", 2, "proc", void 0, { negative: true });
M("attackSpeedPct", "\u653B\u51FB\u901F\u5EA6", "pct", 4.2, "effect", void 0, { effect: "haste" });
M("comboAtkSpeed", "\u8FDE\u51FB\u653B\u901F", "pct", 3.2, "effect", "combo", { effect: "haste" });
M("followUpSpeedPct", "\u8FFD\u51FB\u653B\u901F", "pct", 3, "effect", "hurtRecent", { effect: "haste" });
M("attackCooldownPct", "\u653B\u51FB\u51B7\u5374", "pct", 3, "effect", void 0, { negative: true, effect: "mining_fatigue" });
M("lifesteal", "\u751F\u547D\u5077\u53D6", "pct", 9, "lifesteal");
M("killHeal", "\u51FB\u6740\u56DE\u590D", "flat", 10, "killHeal");
M("bloodPowerPct", "\u5438\u8840\u540E\u589E\u653B", "pct", 1.8, "offMult", "hurtRecent");
M("maxHealthPct", "\u6700\u5927\u751F\u547D", "pct", 3.4, "effect", void 0, { effect: "health_boost" });
M("regenPct", "\u751F\u547D\u6062\u590D\u6548\u7387", "pct", 2.6, "effect", void 0, { effect: "regeneration" });
M("regenFlat", "\u6BCF\u79D2\u56DE\u590D", "flat", 18, "effect", void 0, { effect: "regeneration", per: 0.4 });
M("lowHpDefense", "\u4F4E\u8840\u9632\u5FA1", "pct", 3, "defense", "selfLowHp");
M("bloodPool", "\u51FB\u6740\u83B7\u5F97\u4E34\u65F6\u751F\u547D", "flat", 9, "killHeal");
M("highHpShield", "\u9AD8\u8840\u62A4\u76FE", "flat", 8, "effect", void 0, { effect: "absorption", per: 1.5 });
M("outOfCombatRegen", "\u8131\u6218\u6062\u590D", "pct", 3, "effect", void 0, { effect: "regeneration" });
M("defensePct", "\u5168\u5C40\u51CF\u4F24", "pct", 5, "defense");
M("resistPct", "\u6297\u6027\u63D0\u5347", "pct", 3.6, "defense");
M("flatReduce", "\u56FA\u5B9A\u51CF\u4F24", "flat", 16, "flatReduce");
M("shieldChance", "\u62A4\u76FE\u89E6\u53D1", "pct", 6, "proc", void 0, { effect: "shield" });
M("absorbFlat", "\u5438\u6536\u91CF", "flat", 9, "effect", void 0, { effect: "absorption" });
M("deflectPct", "\u8FDC\u7A0B\u51CF\u4F24", "pct", 2.6, "defense", "ranged");
M("blockPct", "\u683C\u6321\u5F3A\u5EA6", "pct", 3, "defense", "blocking");
M("guardReducePct", "\u683C\u6321\u540E\u51CF\u4F24", "pct", 3.4, "defense", "blocking");
M("standStillDefense", "\u9759\u6B62\u9632\u5FA1", "pct", 3, "defense", "standing");
M("counterPct", "\u53CD\u51FB\u589E\u4F24", "pct", 2.2, "offMult", "blocking");
M("watchDefense", "\u9644\u8FD1\u654C\u4EBA\u9632\u5FA1", "pct", 3, "defense", "crowd");
M("lastStandChance", "\u81F4\u6B7B\u7559\u547D", "pct", 14, "proc", void 0, { effect: "lastStand" });
M("thornsPct", "\u8346\u68D8\u53CD\u4F24", "pct", 3.2, "thorns");
M("reflectChance", "\u8D1F\u9762\u53CD\u5F39", "pct", 5, "proc", void 0, { effect: "reflect" });
M("elementBarrierPct", "\u5143\u7D20\u51CF\u4F24", "pct", 3, "defense");
M("damageTakenPct", "\u53D7\u5230\u4F24\u5BB3", "pct", 3.6, "defense", void 0, { negative: true });
M("healingReducePct", "\u6CBB\u7597\u6548\u679C", "pct", 2.6, "effect", void 0, { negative: true, effect: "wither" });
M("moveSpeedPct", "\u79FB\u52A8\u901F\u5EA6", "pct", 4, "effect", void 0, { effect: "speed" });
M("sprintSpeedPct", "\u51B2\u523A\u901F\u5EA6", "pct", 2.6, "effect", void 0, { effect: "speed" });
M("jumpPct", "\u8DF3\u8DC3\u9AD8\u5EA6", "pct", 2, "effect", void 0, { effect: "jump_boost" });
M("fallReducePct", "\u6454\u843D\u51CF\u4F24", "pct", 2, "flag", void 0, { effect: "fallReduce" });
M("waterSpeedPct", "\u6C34\u4E2D\u79FB\u52A8", "pct", 1.6, "effect", void 0, { effect: "conduit_power" });
M("swimPct", "\u6E38\u6CF3\u901F\u5EA6", "pct", 1.6, "effect", void 0, { effect: "conduit_power" });
M("fireResistPct", "\u706B\u7130\u6297\u6027", "pct", 2.4, "effect", void 0, { effect: "fire_resistance" });
M("iceWalkPct", "\u51B0\u9762\u63A7\u5236", "pct", 1.2, "flag", void 0, { effect: "iceWalk" });
M("dodgeChance", "\u95EA\u907F\u6982\u7387", "pct", 12, "dodge");
M("hurtSpeedPct", "\u53D7\u51FB\u540E\u52A0\u901F", "pct", 2.2, "effect", "hurtRecent", { effect: "speed" });
M("turnAgilityPct", "\u8F6C\u5411\u7075\u6D3B", "pct", 1.2, "flag");
M("landingPct", "\u843D\u5730\u7F13\u51B2", "pct", 1.4, "flag", void 0, { effect: "fallReduce" });
M("slowResistPct", "\u51CF\u901F\u6297\u6027", "pct", 2, "flag", void 0, { effect: "slowResist" });
M("nightSpeedPct", "\u591C\u665A\u79FB\u901F", "pct", 2.2, "effect", "night", { effect: "speed" });
M("daySpeedPct", "\u767D\u5929\u79FB\u901F", "pct", 2.2, "effect", "day", { effect: "speed" });
M("wildAdaptPct", "\u8352\u91CE\u9002\u5E94", "pct", 2, "defense");
M("caveAdaptPct", "\u6D1E\u7A74\u9002\u5E94", "pct", 2.2, "effect", "underground", { effect: "haste" });
M("desertAdaptPct", "\u6C99\u6F20\u9002\u5E94", "pct", 1.6, "effect", void 0, { effect: "speed" });
M("snowAdaptPct", "\u96EA\u539F\u9002\u5E94", "pct", 1.6, "effect", void 0, { effect: "speed" });
M("netherAdaptPct", "\u4E0B\u754C\u9002\u5E94", "pct", 2.4, "defense", "nether");
M("waterAdaptPct", "\u6C34\u57DF\u9002\u5E94", "pct", 2.4, "effect", "water", { effect: "water_breathing" });
M("highAltAdaptPct", "\u9AD8\u7A7A\u9002\u5E94", "pct", 1.6, "defense");
M("fireChance", "\u70B9\u71C3\u6982\u7387", "pct", 2.4, "proc", void 0, { effect: "fire" });
M("fireDuration", "\u71C3\u70E7\u5EF6\u957F", "sec", 8, "proc", void 0, { effect: "fireDuration" });
M("fireBurst", "\u7206\u71C3\u4F24\u5BB3", "flat", 3, "proc", void 0, { effect: "fireBurst" });
M("fireGround", "\u5730\u9762\u7559\u706B", "flag", 22, "proc", void 0, { effect: "fireGround" });
M("fireSeaPct", "\u706B\u6D77\u8303\u56F4", "pct", 2, "proc", void 0, { effect: "fireSea" });
M("moltenPct", "\u7194\u706B\u7A7F\u900F", "pct", 1.8, "offMult", "burning");
M("iceChance", "\u51CF\u901F\u6982\u7387", "pct", 2.2, "proc", void 0, { effect: "ice" });
M("slowAmp", "\u51CF\u901F\u5F3A\u5EA6", "amp", 16, "proc", void 0, { effect: "slowAmp" });
M("freezeChance", "\u51BB\u7ED3\u6982\u7387", "pct", 9, "proc", void 0, { effect: "freeze" });
M("iceBurst", "\u51B0\u7206\u4F24\u5BB3", "flat", 3, "proc", void 0, { effect: "iceBurst" });
M("chillAura", "\u5BD2\u6C14\u5149\u73AF", "flag", 20, "proc", void 0, { effect: "chillAura" });
M("iceArmorPct", "\u51B0\u7532\u9632\u5FA1", "pct", 3, "defense");
M("frostExtendPct", "\u51CF\u901F\u5EF6\u957F", "pct", 1.8, "proc", void 0, { effect: "frostExtend" });
M("lightningChance", "\u5F15\u96F7\u6982\u7387", "pct", 11, "proc", void 0, { effect: "lightning" });
M("shockAmp", "\u611F\u7535\u5F3A\u5EA6", "amp", 12, "proc", void 0, { effect: "shock" });
M("chainChance", "\u8FDE\u9501\u95EA\u7535\u6982\u7387", "pct", 5, "proc", void 0, { effect: "chain" });
M("stormCharge", "\u96F7\u66B4\u5145\u80FD", "flat", 5, "proc", void 0, { effect: "storm" });
M("thunderMarkPct", "\u96F7\u75D5\u589E\u4F24", "pct", 2, "offMult", "poisoned");
M("overloadPct", "\u8FC7\u8F7D\u96F7\u4F24", "pct", 2.4, "offMult", "combo");
M("judgmentPct", "\u5929\u7F5A\u5BF9\u9AD8\u8840\u589E\u4F24", "pct", 2.2, "offMult", "targetFullHp");
M("poisonChance", "\u4E2D\u6BD2\u6982\u7387", "pct", 2.2, "proc", void 0, { effect: "poison" });
M("corrodeAmp", "\u8150\u8680\u5F3A\u5EA6", "amp", 9, "proc", void 0, { effect: "corrode" });
M("poisonAmp", "\u4E2D\u6BD2\u5F3A\u5EA6", "amp", 11, "proc", void 0, { effect: "poisonAmp" });
M("poisonBurst", "\u6BD2\u7206\u4F24\u5BB3", "flat", 3, "proc", void 0, { effect: "poisonBurst" });
M("poisonCloud", "\u6BD2\u96FE", "flag", 18, "proc", void 0, { effect: "poisonCloud" });
M("snakeBitePct", "\u86C7\u543B\u53E0\u6BD2", "pct", 2, "proc", void 0, { effect: "snakeBite" });
M("knockbackPct", "\u51FB\u9000", "pct", 1.2, "proc", void 0, { effect: "knockback" });
M("stunChance", "\u7729\u6655\u6982\u7387", "pct", 10, "proc", void 0, { effect: "stun" });
M("slowOnHit", "\u547D\u4E2D\u51CF\u901F", "amp", 10, "proc", void 0, { effect: "slowOnHit" });
M("weakenOnHit", "\u547D\u4E2D\u865A\u5F31", "amp", 12, "proc", void 0, { effect: "weaken" });
M("sunderOnHit", "\u547D\u4E2D\u7834\u9632", "amp", 12, "proc", void 0, { effect: "sunder" });
M("fearChance", "\u6050\u60E7\u6982\u7387", "pct", 6, "proc", void 0, { effect: "fear" });
M("rootChance", "\u675F\u7F1A\u6982\u7387", "pct", 9, "proc", void 0, { effect: "root" });
M("silenceChance", "\u6C89\u9ED8\u6982\u7387", "pct", 7, "proc", void 0, { effect: "silence" });
M("dispelChance", "\u9A71\u6563\u6982\u7387", "pct", 8, "proc", void 0, { effect: "dispel" });
M("sweepPct", "\u6A2A\u626B\u4F24\u5BB3", "pct", 1.8, "proc", void 0, { effect: "sweep" });
M("quakePct", "\u9707\u5730\u4F24\u5BB3", "pct", 1.8, "proc", void 0, { effect: "quake" });
M("fissurePct", "\u88C2\u5730\u4F24\u5BB3", "pct", 1.6, "proc", void 0, { effect: "fissure" });
M("stormAoePct", "\u98CE\u66B4\u4F24\u5BB3", "pct", 1.6, "proc", void 0, { effect: "stormAoe" });
M("explodePct", "\u7206\u88C2\u4F24\u5BB3", "pct", 2, "proc", void 0, { effect: "explode" });
M("whirlwindChance", "\u65CB\u98CE\u6982\u7387", "pct", 6, "proc", void 0, { effect: "whirlwind" });
M("chainHitPct", "\u4F24\u5BB3\u8DF3\u8DC3", "pct", 2, "proc", void 0, { effect: "chainHit" });
M("earthSplitPct", "\u5730\u88C2\u4F24\u5BB3", "pct", 1.8, "proc", void 0, { effect: "earthSplit" });
M("swordIntentPct", "\u5251\u610F\u589E\u4F24", "pct", 2.2, "offMult", "combo");
M("quickBladePct", "\u5FEB\u5251\u653B\u901F", "pct", 3, "effect", void 0, { effect: "haste" });
M("breakerPct", "\u7834\u519B\u5BF9\u7CBE\u82F1", "pct", 2.2, "offMult", "elite");
M("beheadPct", "\u65A9\u9996\u5904\u51B3", "pct", 2.4, "offMult", "targetLowHp");
M("doubleSlashChance", "\u8FDE\u73AF\u65A9\u6982\u7387", "pct", 5, "proc", void 0, { effect: "doubleStrike" });
M("spinBladeChance", "\u65CB\u5203\u6982\u7387", "pct", 4, "proc", void 0, { effect: "whirlwind" });
M("swordQiPct", "\u5251\u6C14\u4F24\u5BB3", "pct", 2, "proc", void 0, { effect: "swordQi" });
M("flyingBladePct", "\u98DE\u5203\u4F24\u5BB3", "pct", 1.8, "proc", void 0, { effect: "flyingBlade" });
M("bloodBladeHeal", "\u8840\u5203\u56DE\u590D", "flat", 8, "lifesteal");
M("soulStackPct", "\u730E\u9B42\u53E0\u5C42", "pct", 2, "offMult", "killStack");
M("frenzyPct", "\u72C2\u5251\u72C2\u70ED", "pct", 2.2, "offMult", "combo");
M("peerlessPct", "\u65E0\u53CC\u8FDE\u51FB", "pct", 2.4, "offMult", "combo");
M("boneBreakChance", "\u65AD\u9AA8\u51CF\u901F", "pct", 5, "proc", void 0, { effect: "boneBreak" });
M("shieldBreakPct", "\u7834\u76FE\u589E\u4F24", "pct", 2, "offMult", "elite");
M("cleavePct", "\u5288\u88C2\u8303\u56F4", "pct", 1.8, "proc", void 0, { effect: "cleave" });
M("mightyChopPct", "\u731B\u5288\u4F24\u5BB3", "pct", 2.4, "offMult", "unwounded");
M("woodMasterPct", "\u6728\u6750\u989D\u5916\u6389\u843D", "pct", 3, "drop");
M("frenzyChopPct", "\u72C2\u4F10\u63D0\u901F", "pct", 2.4, "mining", "combo");
M("miningSpeedPct", "\u6316\u6398\u901F\u5EA6", "pct", 2.6, "mining");
M("extraDropPct", "\u989D\u5916\u6389\u843D", "pct", 4, "drop");
M("oreDropPct", "\u77FF\u7269\u6389\u843D", "pct", 4.4, "drop");
M("smeltChance", "\u81EA\u52A8\u7194\u70BC", "pct", 6, "proc", void 0, { effect: "smelt" });
M("chainMine", "\u8FDE\u9501\u6316\u6398", "flag", 45, "flag", void 0, { effect: "chainMine" });
M("treeFeller", "\u8FDE\u9501\u4F10\u6728", "flag", 48, "flag", void 0, { effect: "treeFeller" });
M("aoeBreak", "\u8303\u56F4\u7834\u574F", "flag", 36, "flag", void 0, { effect: "aoeBreak" });
M("aoeMine", "\u8303\u56F4\u6316\u6398", "flag", 40, "flag", void 0, { effect: "aoeMine" });
M("deepMinePct", "\u5730\u4E0B\u6548\u7387", "pct", 2.2, "mining", "underground");
M("minerEye", "\u77FF\u5DE5\u4E4B\u773C", "flag", 18, "flag", void 0, { effect: "minerEye" });
M("treasureChance", "\u5B9D\u85CF\u6982\u7387", "pct", 7, "proc", void 0, { effect: "treasure" });
M("durabilitySave", "\u8010\u4E45\u8282\u7701", "pct", 3.2, "durability");
M("rapidMinePct", "\u6781\u901F\u91C7\u77FF", "pct", 2.4, "mining", "combo");
M("earthVeinChance", "\u5730\u8109\u89E6\u53D1", "pct", 5, "proc", void 0, { effect: "earthVein" });
M("sandMasterPct", "\u6C99\u5730\u6548\u7387", "pct", 2.4, "mining");
M("soilMasterPct", "\u571F\u5730\u6548\u7387", "pct", 2.4, "mining");
M("tillPct", "\u677E\u571F\u63D0\u901F", "pct", 2.2, "mining");
M("geologistChance", "\u5730\u8D28\u5B66\u5BB6", "pct", 5, "proc", void 0, { effect: "geologist" });
M("harvestPct", "\u519C\u4F5C\u7269\u4EA7\u91CF", "pct", 3.4, "drop");
M("autoReplant", "\u81EA\u52A8\u8865\u79CD", "flag", 30, "flag", void 0, { effect: "autoReplant" });
M("growthPct", "\u4F5C\u7269\u751F\u957F", "pct", 2.6, "flag", void 0, { effect: "growth" });
M("farmlandRange", "\u8015\u4F5C\u8303\u56F4", "flag", 22, "flag", void 0, { effect: "farmlandRange" });
M("fastTillPct", "\u8015\u4F5C\u901F\u5EA6", "pct", 2.2, "mining");
M("seedMasterPct", "\u79CD\u5B50\u6389\u843D", "pct", 2.6, "drop");
M("abundantChance", "\u4E30\u9976\u989D\u5916\u6389\u843D", "pct", 3.6, "drop");
M("eternalFarm", "\u6C38\u7EED\u8015\u4F5C", "flag", 20, "flag", void 0, { effect: "eternalFarm" });
M("archaeologyChance", "\u8003\u53E4\u6982\u7387", "pct", 6, "proc", void 0, { effect: "archaeology" });
M("qualityArmorPct", "\u54C1\u8D28\u62A4\u7532\u4FEE\u6B63", "pct", 0, "defense");
M("qualityArmorVulnPct", "\u54C1\u8D28\u6613\u4F24", "pct", 0, "defense");
M("soulPct", "\u7075\u9B42\u4F24\u5BB3", "pct", 2.6, "offMult");
M("accuracyPct", "\u547D\u4E2D\u7CBE\u51C6", "pct", 2.2, "offMult");
M("comboPct", "\u8FDE\u51FB\u4F24\u5BB3", "pct", 2.8, "offMult", "combo");
M("aoePct", "\u8303\u56F4\u4F24\u5BB3", "pct", 2.4, "offMult");
M("projectilePct", "\u8FDC\u7A0B\u4F24\u5BB3", "pct", 2.6, "offMult");
M("piercePct", "\u7A7F\u900F", "pct", 2.6, "offMult");
M("multishotPct", "\u591A\u91CD\u5C04\u51FB", "pct", 3, "offMult");
M("explosivePct", "\u7206\u88C2", "pct", 3, "proc");
M("ammoPct", "\u5F39\u836F\u56DE\u6536", "pct", 2.6, "drop");
M("fishingLuckPct", "\u9493\u9C7C\u989D\u5916\u5956\u52B1", "pct", 3.4, "drop");
M("treasurePct", "\u5B9D\u85CF\u6982\u7387", "pct", 3.8, "drop");
M("reelSpeedPct", "\u6536\u7EBF\u901F\u5EA6", "pct", 2.8, "drop");
M("fishingCooldownPct", "\u9493\u9C7C\u51B7\u5374", "pct", 2.6, "drop", void 0, { negative: true });
M("shearYieldPct", "\u526A\u53D6\u4EA7\u91CF", "pct", 3.2, "drop");
M("shearSpeedPct", "\u526A\u5207\u6548\u7387", "pct", 2.8, "mining");
M("brushLuckPct", "\u5237\u53D6\u5956\u52B1", "pct", 3.6, "drop");
M("brushSpeedPct", "\u5237\u53D6\u6548\u7387", "pct", 2.8, "mining");
M("igniteChancePct", "\u70B9\u706B\u6210\u529F\u7387", "pct", 3, "proc");
M("igniteCooldownPct", "\u70B9\u706B\u51B7\u5374", "pct", 2.6, "drop", void 0, { negative: true });
M("fireDurationPct", "\u706B\u7130\u6301\u7EED", "pct", 3.2, "proc");
M("cooldownReducePct", "\u51B7\u5374\u7F29\u51CF", "pct", 3.4, "drop");
M("varianceReducePct", "\u6536\u76CA\u7A33\u5B9A\u6027", "pct", 2.4, "drop");
M("shearLossPct", "\u526A\u53D6\u635F\u8017", "pct", 2.6, "drop", void 0, { negative: true });
M("brushLossPct", "\u5237\u53D6\u635F\u8017", "pct", 2.6, "drop", void 0, { negative: true });
M("igniteRiskPct", "\u70B9\u706B\u53CD\u566C", "pct", 3, "proc", void 0, { negative: true });
M("bowDamagePct", "\u5F13\u4F24\u5BB3", "pct", 3, "offMult", "ranged");
M("sniperPct", "\u72D9\u51FB\u8FDC\u8DDD\u589E\u4F24", "pct", 2.4, "offMult", "far");
M("arrowPierce", "\u7BAD\u77E2\u7A7F\u900F", "flag", 26, "proc", void 0, { effect: "arrowPierce" });
M("splitArrowChance", "\u7BAD\u77E2\u5206\u88C2", "pct", 5, "proc", void 0, { effect: "splitArrow" });
M("multiShot", "\u591A\u91CD\u7BAD", "flag", 34, "proc", void 0, { effect: "multiShot" });
M("explosiveArrowPct", "\u7206\u88C2\u7BAD", "pct", 2.6, "proc", void 0, { effect: "explosiveArrow" });
M("flameArrowChance", "\u706B\u77E2", "pct", 3, "proc", void 0, { effect: "flameArrow" });
M("iceArrowChance", "\u51B0\u77E2", "pct", 3, "proc", void 0, { effect: "iceArrow" });
M("thunderArrowChance", "\u96F7\u77E2", "pct", 4, "proc", void 0, { effect: "thunderArrow" });
M("homingArrow", "\u8FFD\u8E2A", "flag", 30, "proc", void 0, { effect: "homing" });
M("drawSpeedPct", "\u62C9\u5F13\u901F\u5EA6", "pct", 2.4, "effect", void 0, { effect: "haste" });
M("steadyAimPct", "\u7A33\u5B9A\u7784\u51C6", "pct", 2, "offMult", "ranged");
M("deadlyArrowPct", "\u81F4\u547D\u7BAD\u66B4\u51FB", "pct", 3, "critChance", "ranged");
M("hunterPct", "\u730E\u624B\u8FDC\u7A0B\u589E\u4F24", "pct", 2.2, "offMult", "ranged");
M("heavyCrossbowPct", "\u91CD\u5F29\u4F24\u5BB3", "pct", 3.2, "offMult", "ranged");
M("armorPierceArrowPct", "\u7A7F\u7532\u7BAD", "pct", 2.6, "offMult", "ranged");
M("reloadSpeedPct", "\u88C5\u586B\u901F\u5EA6", "pct", 2.6, "effect", void 0, { effect: "haste" });
M("multiBolt", "\u591A\u77E2", "flag", 32, "proc", void 0, { effect: "multiShot" });
M("blastBoltPct", "\u5F29\u7206\u7834", "pct", 2.6, "proc", void 0, { effect: "explosiveArrow" });
M("formationBreakPct", "\u7834\u9635", "pct", 2, "offMult", "crowd");
M("snipeKillPct", "\u72D9\u6740", "pct", 2.8, "offMult", "far");
M("rapidFirePct", "\u8FDE\u53D1", "pct", 3, "effect", void 0, { effect: "haste" });
M("stabilityPct", "\u7A33\u56FA", "pct", 2, "offMult", "ranged");
M("seaGodPct", "\u6D77\u795E\u6C34\u4E2D\u589E\u4F24", "pct", 3, "offMult", "water");
M("tidePct", "\u6F6E\u6C50\u51B2\u51FB", "pct", 2.2, "proc", void 0, { effect: "tide" });
M("stormEnvPct", "\u96F7\u96E8\u5F3A\u5316", "pct", 2.6, "offMult", "water");
M("thunderPct", "\u96F7\u9706\u5F15\u96F7", "pct", 4, "proc", void 0, { effect: "lightning" });
M("returnSpeedPct", "\u56DE\u6D41\u901F\u5EA6", "pct", 1.6, "meta", void 0, { wired: false });
M("seaPiercePct", "\u7A7F\u6D77\u6295\u63B7", "pct", 2.2, "offMult", "water");
M("deepHunterPct", "\u6DF1\u6D77\u730E\u624B", "pct", 2.4, "offMult", "aquatic");
M("stormBurstPct", "\u98CE\u66B4\u7206\u53D1", "pct", 2.4, "proc", void 0, { effect: "stormAoe" });
M("surgeKnockback", "\u6D6A\u6D8C\u51FB\u9000", "pct", 1.4, "proc", void 0, { effect: "knockback" });
M("ironShieldPct", "\u76FE\u724C\u9632\u5FA1", "pct", 3.6, "defense");
M("shieldSavePct", "\u76FE\u724C\u8010\u4E45\u8282\u7701", "pct", 3, "durability");
M("reboundPct", "\u683C\u6321\u53CD\u5F39", "pct", 3, "thorns", "blocking");
M("thornShieldPct", "\u8346\u68D8\u76FE\u53CD\u4F24", "pct", 3.2, "thorns");
M("shieldBashPct", "\u76FE\u51FB\u589E\u4F24", "pct", 2.4, "offMult", "blocking");
M("chargeKnockback", "\u51B2\u649E\u51FB\u9000", "pct", 1.6, "proc", void 0, { effect: "knockback" });
M("guardFieldPct", "\u5B88\u62A4\u9886\u57DF", "pct", 2.6, "defense", "crowd");
M("perfectBlockChance", "\u5B8C\u7F8E\u683C\u6321", "pct", 12, "proc", void 0, { effect: "perfectBlock" });
M("damageReduceHead", "\u5934\u90E8\u51CF\u4F24", "pct", 4, "defense");
M("insightFlat", "\u611F\u77E5\u8303\u56F4", "flat", 4, "flag", void 0, { effect: "insight" });
M("nightVision", "\u591C\u89C6", "flag", 30, "effect", void 0, { effect: "night_vision" });
M("waterBreathing", "\u6C34\u4E0B\u547C\u5438", "flag", 26, "effect", void 0, { effect: "water_breathing" });
M("deepVision", "\u6DF1\u6D77\u89C6\u89C9", "flag", 18, "effect", void 0, { effect: "night_vision" });
M("debuffReduce", "\u8D1F\u9762\u65F6\u957F\u51CF\u5C11", "pct", 3, "flag", void 0, { effect: "debuffReduce" });
M("controlResist", "\u63A7\u5236\u6297\u6027", "pct", 3, "flag", void 0, { effect: "controlResist" });
M("dangerSense", "\u5371\u9669\u611F\u77E5", "flag", 18, "flag", void 0, { effect: "dangerSense" });
M("undeadSense", "\u4EA1\u7075\u611F\u77E5", "flag", 14, "flag", void 0, { effect: "undeadSense" });
M("monsterLorePct", "\u602A\u7269\u5B66\u8BC6\u589E\u4F24", "pct", 2.2, "offMult");
M("soulEye", "\u7075\u9B42\u4E4B\u773C", "flag", 16, "flag", void 0, { effect: "soulEye" });
M("heavyArmorPct", "\u91CD\u7532\u9632\u5FA1", "pct", 4, "defense");
M("lifeCorePct", "\u751F\u547D\u6838\u5FC3", "pct", 3.4, "effect", void 0, { effect: "health_boost" });
M("shieldCore", "\u62A4\u76FE\u6838\u5FC3", "pct", 3, "proc", void 0, { effect: "shield" });
M("regenCorePct", "\u518D\u751F\u6838\u5FC3", "pct", 2.8, "effect", void 0, { effect: "regeneration" });
M("guardHeartPct", "\u5B88\u62A4\u4E4B\u5FC3", "pct", 3.2, "defense", "selfLowHp");
M("vengeanceHeartPct", "\u590D\u4EC7\u4E4B\u5FC3", "pct", 2.2, "offMult", "hurtRecent");
M("unyieldingCoreChance", "\u4E0D\u5C48\u6838\u5FC3", "pct", 12, "proc", void 0, { effect: "lastStand" });
M("endurancePct", "\u8010\u529B", "pct", 2, "flag", void 0, { effect: "sprintCost" });
M("warWillPct", "\u6218\u4E89\u610F\u5FD7", "pct", 2.2, "offMult", "combo");
M("persistencePct", "\u575A\u6301\u51CF\u4F24", "pct", 3, "defense", "hurtRecent");
M("feralPct", "\u91CE\u6027\u52A0\u901F", "pct", 2.2, "effect", "hurtRecent", { effect: "speed" });
M("damageSpreadPct", "\u4F24\u5BB3\u5206\u644A", "pct", 3, "defense");
M("bodyPct", "\u4F53\u9B44\u6297\u51FB\u9000", "pct", 1.6, "flag", void 0, { effect: "knockbackResist" });
M("warriorLegsPct", "\u6218\u58EB\u4E4B\u817F", "pct", 2.4, "offMult");
M("gatherPct", "\u91C7\u96C6\u91CF", "pct", 3, "drop");
M("frugalPct", "\u8010\u4E45\u8282\u7EA6", "pct", 3, "durability");
M("indestructiblePct", "\u575A\u4E0D\u53EF\u6467", "pct", 3.6, "durability");
M("xpPct", "\u7ECF\u9A8C\u83B7\u53D6", "pct", 2.6, "drop");
M("greedyMinerPct", "\u8D2A\u77FF\u8005", "pct", 3.4, "drop");
M("huntDropPct", "\u72E9\u730E\u6389\u843D", "pct", 2.6, "drop");
M("farmDropPct", "\u519C\u592B\u4EA7\u91CF", "pct", 2.8, "drop");
M("artisanChance", "\u5DE5\u5320\u989D\u5916\u4EA7\u7269", "pct", 4, "proc", void 0, { effect: "artisan" });
M("durabilityMult", "\u8010\u4E45\u6D88\u8017", "pct", 2.2, "durability", void 0, { negative: true });
M("durabilityDrain", "\u8010\u4E45\u81EA\u7136\u635F\u8017", "flat", 6, "durability", void 0, { negative: true });
M("fractureChance", "\u4F4E\u8010\u4E45\u65AD\u88C2", "pct", 4, "durability", "lowDurability", { negative: true });
M("skillDurabilityCost", "\u6280\u80FD\u989D\u5916\u8010\u4E45", "flat", 5, "durability", void 0, { negative: true });
M("attackDurabilityCost", "\u653B\u51FB\u989D\u5916\u8010\u4E45", "flat", 5, "durability", void 0, { negative: true });
M("moveDurabilityCost", "\u79FB\u52A8\u8010\u4E45\u6D88\u8017", "flat", 4, "durability", void 0, { negative: true });
M("agingPct", "\u8001\u5316\u52A0\u901F", "pct", 2.4, "durability", void 0, { negative: true });
M("unstablePct", "\u4E0D\u7A33\u5B9A\u635F\u8017", "pct", 2.6, "durability", "combo", { negative: true });
M("hungerDrain", "\u9965\u997F\u6D88\u8017", "pct", 2, "effect", void 0, { negative: true, effect: "hunger" });
M("sprintHungerDrain", "\u51B2\u523A\u9965\u997F\u6D88\u8017", "pct", 2, "effect", void 0, { negative: true, effect: "hunger" });
M("selfDamageChance", "\u53CD\u566C\u6982\u7387", "pct", 5, "proc", void 0, { negative: true, effect: "selfDamage" });
M("hurtSlowSelf", "\u53D7\u51FB\u540E\u51CF\u901F", "pct", 2.4, "effect", "hurtRecent", { negative: true, effect: "slowness" });
M("idleDecayPct", "\u95F2\u7F6E\u6389\u653B", "pct", 2.4, "offMult", void 0, { negative: true });
M("comboDecayPct", "\u8FDE\u51FB\u6389\u653B\u901F", "pct", 2.4, "effect", "combo", { negative: true, effect: "mining_fatigue" });
M("firstHitDelay", "\u9996\u51FB\u51C6\u5907\u65F6\u95F4", "pct", 2, "effect", void 0, { negative: true, effect: "mining_fatigue" });
M("aggroPct", "\u4EC7\u6068\u8303\u56F4", "pct", 1.6, "flag", void 0, { negative: true, effect: "aggro" });
M("erraticChance", "\u5931\u63A7\u6982\u7387", "pct", 2, "proc", void 0, { negative: true, effect: "erratic" });
M("critTakenPct", "\u88AB\u66B4\u51FB\u6613\u4F24", "pct", 2.6, "defense", "crit", { negative: true });
M("critDefenseBreak", "\u66B4\u51FB\u540E\u9632\u5FA1\u4E0B\u964D", "pct", 2.4, "defense", "crit", { negative: true });
M("critDurabilityCost", "\u66B4\u51FB\u989D\u5916\u8010\u4E45", "flat", 5, "durability", "crit", { negative: true });
M("bluntCritPct", "\u66B4\u51FB\u7387\u4E0B\u964D", "pct", 3, "critChance", void 0, { negative: true });
M("lostCritDamagePct", "\u66B4\u51FB\u4F24\u5BB3\u4E0B\u964D", "pct", 2.4, "critDamage", void 0, { negative: true });
M("visionPct", "\u89C6\u91CE\u53D7\u963B", "pct", 1.6, "flag", void 0, { negative: true });
M("senseReduce", "\u611F\u77E5\u4E0B\u964D", "pct", 1.6, "flag", void 0, { negative: true, effect: "senseReduce" });
M("falseAlert", "\u5E7B\u542C\u5E72\u6270", "pct", 1.4, "flag", void 0, { negative: true });
M("waterBreathingNeg", "\u6C34\u4E0B\u6D3B\u52A8\u4E0B\u964D", "flag", 16, "flag", void 0, { negative: true, effect: "waterNeg" });
M("fireVulnPct", "\u706B\u7130\u6613\u4F24", "pct", 2.2, "defense", void 0, { negative: true });
M("iceSlip", "\u51B0\u9762\u6253\u6ED1", "pct", 1.2, "flag", void 0, { negative: true });
M("fallDamagePct", "\u6454\u843D\u4F24\u5BB3", "pct", 2.4, "flag", void 0, { negative: true });
M("miningSpeedDecay", "\u6316\u6398\u6548\u7387\u8870\u51CF", "pct", 2, "mining", void 0, { negative: true });
M("mineSlowSelf", "\u6316\u6398\u540E\u51CF\u901F", "pct", 2, "effect", void 0, { negative: true, effect: "slowness" });
M("farmlandSlow", "\u8015\u5730\u901F\u5EA6", "pct", 1.8, "mining", void 0, { negative: true });
M("turnSlow", "\u8F6C\u5411\u8FDF\u6EDE", "pct", 1.4, "flag", void 0, { negative: true });
M("runDecayPct", "\u5954\u8DD1\u6389\u901F", "pct", 1.8, "effect", void 0, { negative: true, effect: "slowness" });
M("sprintStartup", "\u51B2\u523A\u8D77\u6B65\u5EF6\u8FDF", "pct", 1.8, "flag", void 0, { negative: true });
M("luckBreakChance", "\u5E78\u8FD0\u5931\u8D25\u635F\u5931\u8010\u4E45", "pct", 3, "durability", void 0, { negative: true });
M("critSelfDamage", "\u66B4\u51FB\u53CD\u4F24", "flat", 6, "proc", "crit", { negative: true, effect: "selfDamage" });
M("curseDamagePerMin", "\u6301\u7EED\u751F\u547D\u6D41\u5931", "flat", 8, "proc", void 0, { negative: true, effect: "curseDrain" });
M("maxHealthNegPct", "\u751F\u547D\u4E0A\u9650\u4E0B\u964D", "pct", 3.4, "effect", void 0, { negative: true, effect: "healthNeg" });
M("naturalRegenPct", "\u81EA\u7136\u6062\u590D", "pct", 2.4, "effect", void 0, { negative: true, effect: "regenNeg" });
M("bloodLossPct", "\u5931\u8840", "pct", 3, "proc", void 0, { negative: true, effect: "bloodLoss" });
M("frailtyPct", "\u81F4\u547D\u8106\u5F31", "pct", 3, "defense", "selfLowHp", { negative: true });
M("armorBreakVulnPct", "\u7834\u7532\u4F53\u6613\u4F24", "pct", 2.6, "defense", void 0, { negative: true });
M("armorCrackPct", "\u88C2\u7532", "pct", 2.8, "defense", "hurtRecent", { negative: true });
M("exposedPct", "\u66B4\u9732\u80CC\u4F24", "pct", 2.6, "defense", "behind", { negative: true });
M("lostGuardPct", "\u5931\u5B88", "pct", 2.6, "defense", "combo", { negative: true });
M("openGuardPct", "\u7A7A\u95E8", "pct", 2.4, "defense", void 0, { negative: true });
M("magicFragilePct", "\u9B54\u8106", "pct", 2.4, "defense", void 0, { negative: true });
M("shockImmobilePct", "\u9707\u8361\u65E0\u6CD5\u79FB\u52A8", "pct", 2, "flag", void 0, { negative: true });
M("mentalFatiguePct", "\u7CBE\u795E\u75B2\u52B3", "pct", 2, "flag", void 0, { negative: true, effect: "debuffUp" });
M("heavyLowerBodyPct", "\u6C89\u91CD\u4E0B\u76D8", "pct", 1.6, "effect", void 0, { negative: true, effect: "slowness" });
M("actionSlowPct", "\u884C\u52A8\u8FDF\u7F13", "pct", 1.8, "effect", "combo", { negative: true, effect: "slowness" });
M("soilDependencyPct", "\u571F\u58E4\u4F9D\u8D56", "pct", 1.8, "mining", void 0, { negative: true });
M("toolJamPct", "\u6613\u5361", "pct", 1.8, "mining", void 0, { negative: true });
M("latePlantPct", "\u8FDF\u79CD", "pct", 1.8, "mining", void 0, { negative: true });
M("unstableVeinPct", "\u4E0D\u7A33\u5B9A\u77FF\u8109", "pct", 2.2, "durability", void 0, { negative: true });
M("gluttonyGreedPct", "\u8D2A\u957F\u526F\u4F5C\u7528", "pct", 1.8, "flag", void 0, { negative: true });
M("deathPenaltyPct", "\u6B7B\u4EA1\u60E9\u7F5A", "pct", 3, "flag", void 0, { negative: true, effect: "deathPenalty" });
M("bindingCurse", "\u675F\u7F1A\u8BC5\u5492", "flag", 20, "flag", void 0, { negative: true, effect: "binding" });
M("uniqueImmortal", "\u4E0D\u706D", "flag", 90, "flag", void 0, { hidden: true, effect: "immortal" });
M("uniqueSoulbound", "\u7075\u9B42\u7ED1\u5B9A", "flag", 70, "flag", void 0, { hidden: true, effect: "soulbound" });
M("uniqueGluttony", "\u8D2A\u98DF", "flag", 60, "flag", void 0, { hidden: true, effect: "gluttony" });
M("uniqueTime", "\u65F6\u95F4", "flag", 75, "proc", void 0, { hidden: true, effect: "time" });
M("uniqueSpace", "\u7A7A\u95F4", "flag", 75, "flag", void 0, { hidden: true, effect: "space" });
M("uniqueEternalNight", "\u6C38\u591C", "flag", 80, "offMult", "night", { hidden: true });
M("uniqueSunHeart", "\u592A\u9633\u4E4B\u5FC3", "flag", 80, "offMult", "day", { hidden: true });
M("uniqueAbyssHeart", "\u6DF1\u6E0A\u4E4B\u5FC3", "flag", 80, "offMult", "nether", { hidden: true });
M("specialWorldTree", "\u4E16\u754C\u6811", "flag", 85, "effect", void 0, { hidden: true, effect: "worldTree" });
M("specialHeavenlyThunder", "\u5929\u96F7", "flag", 88, "proc", void 0, { hidden: true, effect: "lightning" });
M("specialBloodMoon", "\u8840\u6708", "flag", 82, "offMult", "night", { hidden: true });
M("specialSunGlory", "\u65E5\u8000", "flag", 82, "offMult", "day", { hidden: true });
M("specialAbyss", "\u6DF1\u6E0A", "flag", 82, "offMult", "nether", { hidden: true });
M("specialSeaGod", "\u6D77\u795E", "flag", 82, "offMult", "water", { hidden: true });
M("specialSpacetime", "\u65F6\u7A7A", "flag", 78, "flag", void 0, { hidden: true, effect: "space" });
M("specialVoidWalker", "\u865A\u7A7A\u884C\u8005", "flag", 76, "flag", void 0, { hidden: true, effect: "voidWalk" });
M("specialDestiny", "\u5929\u547D", "flag", 84, "proc", void 0, { hidden: true, effect: "destiny" });
M("specialMiracle", "\u5947\u8FF9", "flag", 92, "proc", void 0, { hidden: true, effect: "miracle" });
M("specialReversal", "\u53CD\u8F6C", "flag", 80, "offMult", "selfLowHp", { hidden: true });
M("specialEndless", "\u65E0\u5C3D", "flag", 86, "offMult", "killStack", { hidden: true });
M("curseBloodThirst", "\u55DC\u8840\u8BC5\u5492", "flag", 40, "offMult", "combo", { hidden: true, effect: "curseBloodThirst" });
M("curseFury", "\u72C2\u6012\u8BC5\u5492", "flag", 30, "flag", void 0, { hidden: true, effect: "curseFury" });
M("curseFrail", "\u6613\u4EA1\u8BC5\u5492", "flag", 35, "effect", void 0, { hidden: true, effect: "healthNeg" });
M("hiddenSpeciesUndead", "\u9690\u85CF\xB7\u5BF9\u4EA1\u7075", "pct", 1.6, "offMult", "undead", { hidden: true });
M("hiddenSpeciesArthropod", "\u9690\u85CF\xB7\u5BF9\u8282\u80A2", "pct", 1.6, "offMult", "arthropod", { hidden: true });
M("hiddenSpeciesIllager", "\u9690\u85CF\xB7\u5BF9\u707E\u5384", "pct", 1.6, "offMult", "illager", { hidden: true });
M("hiddenSpeciesAquatic", "\u9690\u85CF\xB7\u5BF9\u6C34\u751F", "pct", 1.6, "offMult", "aquatic", { hidden: true });
M("hiddenSpeciesNether", "\u9690\u85CF\xB7\u5BF9\u4E0B\u754C\u751F\u7269", "pct", 1.6, "offMult", "nethermob", { hidden: true });
M("hiddenLuck", "\u9690\u85CF\xB7\u5E78\u8FD0", "pct", 2.4, "drop", void 0, { hidden: true });
M("hiddenGreed", "\u9690\u85CF\xB7\u8D2A\u5A6A", "pct", 2, "drop", void 0, { hidden: true });
M("hiddenAwakenNight", "\u9690\u85CF\xB7\u591C\u95F4\u89C9\u9192", "flag", 60, "offMult", "night", { hidden: true });
M("hiddenAwakenBlood", "\u9690\u85CF\xB7\u8840\u4E4B\u8BB0\u5FC6", "flag", 55, "lifesteal", void 0, { hidden: true });
M("hiddenAwakenAbyss", "\u9690\u85CF\xB7\u6DF1\u6E0A\u4F4E\u8BED", "flag", 58, "offMult", "nether", { hidden: true });
M("hiddenAwakenHunt", "\u9690\u85CF\xB7\u72E9\u730E\u672C\u80FD", "flag", 56, "offMult", "far", { hidden: true });
M("hiddenAwakenEarth", "\u9690\u85CF\xB7\u5927\u5730\u5171\u9E23", "flag", 54, "mining", void 0, { hidden: true });
M("hiddenAwakenStar", "\u9690\u85CF\xB7\u661F\u8FB0\u6307\u5F15", "flag", 57, "drop", void 0, { hidden: true });
M("hiddenAwakenFate", "\u9690\u85CF\xB7\u547D\u8FD0\u4E4B\u7EBF", "flag", 62, "proc", void 0, { hidden: true, effect: "destiny" });
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
  P("sharpness", "\u950B\u9510", MELEE, [m("attackPct", L(12, 8))], 100, "common"),
  P("smash", "\u731B\u51FB", MELEE, [m("flatDamage", L(1, 1))], 100, "common"),
  P("strong_attack", "\u5F3A\u653B", MELEE, [m("meleePct", L(8, 6))], 100, "common"),
  P("heavy_blow", "\u91CD\u51FB", MELEE, [m("chargedBonusPct", L(15, 11))], 90, "fine"),
  P("pierce", "\u7A7F\u523A", MELEE, [m("armorPenPct", L(8, 5))], 90, "fine"),
  P("sunder", "\u7834\u7532", MELEE, [m("sunderPct", L(6, 4))], 90, "fine"),
  P("tear", "\u88C2\u4F24", MELEE, [m("bleedDps", L(1, 1))], 80, "fine"),
  P("execute", "\u5904\u51B3", MELEE, [m("executePct", L(20, 12))], 70, "rare"),
  P("hunt_move", "\u730E\u6740", MELEE, [m("chasePct", L(10, 7))], 80, "fine"),
  P("slaughter", "\u5C60\u622E", MELEE, [m("killStackPct", L(4, 3))], 70, "rare"),
  P("fighting_spirit", "\u6218\u610F", MELEE, [m("rampagePct", L(3, 2.5))], 80, "fine"),
  P("berserk", "\u72C2\u66B4", MELEE, [m("berserkPct", L(20, 14))], 60, "epic"),
  P("vengeance", "\u590D\u4EC7", MELEE, [m("vengeancePct", L(10, 7))], 80, "fine"),
  P("wild_hunt", "\u72C2\u730E", MELEE, [m("killCritPct", L(10, 7))], 70, "rare"),
  P("assault", "\u5F3A\u88AD", MELEE, [m("knockbackPct", L(20, 15))], 90, "common"),
  P("stagger", "\u9707\u51FB", MELEE, [m("staggerChance", L(4, 3))], 70, "rare"),
  P("shockwave", "\u9707\u8361", MELEE, [m("slowOnHit", L(1, 0.5))], 90, "common"),
  P("break_momentum", "\u7834\u52BF", MELEE, [m("weakenOnHit", L(1, 0.5))], 90, "common"),
  P("suppress", "\u9547\u538B", MELEE, [m("elitePct", L(10, 8))], 70, "rare"),
  P("giant_hunter", "\u5DE8\u517D\u730E\u624B", MELEE, [m("giantPct", L(10, 8))], 70, "rare"),
  // ---------------- 2. 暴击类 ----------------
  P("crit", "\u66B4\u51FB", MELEE, [m("critChance", L(4, 3))], 100, "common"),
  P("lethal", "\u81F4\u547D", MELEE, [m("critDamage", L(12, 8))], 100, "common"),
  P("precise", "\u7CBE\u51C6", MELEE, [m("critChance", L(3, 2.5)), m("critDamage", L(5, 4))], 90, "fine"),
  P("weakspot_insight", "\u5F31\u70B9\u6D1E\u5BDF", MELEE, [m("lowHpCrit", L(6, 4))], 80, "fine"),
  P("lethal_pursuit", "\u81F4\u547D\u8FFD\u51FB", MELEE, [m("lowHpCrit", L(8, 5))], 70, "rare"),
  P("combo", "\u8FDE\u51FB", MELEE, [m("doubleStrikeChance", L(5, 4))], 80, "fine"),
  P("double_blade", "\u53CC\u91CD\u6253\u51FB", MELEE, [m("doubleStrikeChance", L(8, 5))], 60, "epic"),
  P("lucky_strike", "\u5E78\u8FD0\u4E00\u51FB", MELEE, [m("luckyChance", L(1, 1))], 40, "epic"),
  P("hunter_heart", "\u730E\u5FC3", MELEE, [m("hunterHeartCrit", L(6, 4))], 70, "rare"),
  P("backstab", "\u80CC\u88AD", MELEE, [m("backstabPct", L(12, 9))], 70, "rare"),
  P("finisher", "\u7EC8\u7ED3", MELEE, [m("finisherChance", L(5, 3))], 50, "epic"),
  // ---------------- 3. 攻击速度类 ----------------
  P("swift", "\u8FC5\u6377", MELEE_TOOLS, [m("attackSpeedPct", L(8, 5))], 100, "common", 0.12, ["heavy", "dull", "sluggish"]),
  P("gale", "\u75BE\u98CE", MELEE, [m("comboAtkSpeed", L(4, 3))], 90, "fine"),
  P("chain_slash", "\u8FDE\u65A9", MELEE, [m("comboAtkSpeed", L(5, 3.5))], 90, "fine"),
  P("agile", "\u8F7B\u7075", MELEE, [m("attackSpeedPct", L(6, 4))], 100, "common", 0.12, ["heavy", "dull", "sluggish"]),
  P("extreme_speed", "\u6781\u901F", MELEE, [m("burstSpeedPct", L(15, 9))], 70, "rare", 0.15, ["heavy", "dull", "sluggish"]),
  P("wild_dance", "\u72C2\u821E", MELEE, [m("dancePct", L(8, 5))], 80, "fine"),
  P("first_strike", "\u5148\u624B", MELEE, [m("firstStrikePct", L(12, 9))], 80, "fine"),
  P("follow_up", "\u8FFD\u51FB", MELEE, [m("followUpSpeedPct", L(6, 4))], 80, "fine"),
  // ---------------- 4. 生命与吸血类 ----------------
  P("lifesteal", "\u5438\u8840", MELEE, [m("lifesteal", L(3, 2))], 90, "fine"),
  P("strong_lifesteal", "\u5F3A\u6548\u5438\u8840", MELEE, [m("lifesteal", L(5, 3))], 60, "epic"),
  P("soul_drain", "\u7075\u9B42\u6C72\u53D6", MELEE, [m("killHeal", L(1, 1))], 80, "fine"),
  P("hunt_recovery", "\u730E\u6740\u56DE\u590D", MELEE, [m("killHeal", L(1, 0.5))], 90, "common"),
  P("blood_power", "\u9C9C\u8840\u4E4B\u529B", MELEE, [m("bloodPowerPct", L(5, 4))], 70, "rare"),
  P("life", "\u751F\u547D", ARMOR, [m("maxHealthPct", L(5, 4))], 100, "common"),
  P("vitality", "\u6D3B\u529B", ["chest", "legs"], [m("regenPct", L(10, 8))], 90, "fine"),
  P("regeneration", "\u518D\u751F", ["chest", "legs", "head"], [m("regenFlat", L(0.2, 0.2))], 80, "fine"),
  P("unyielding", "\u4E0D\u5C48", ["chest", "legs"], [m("lowHpDefense", L(8, 6))], 80, "fine"),
  P("blood_pool", "\u8840\u6C60", MELEE, [m("bloodPool", L(1, 1))], 60, "epic"),
  P("life_shield", "\u751F\u547D\u62A4\u76FE", ARMOR, [m("highHpShield", L(2, 1.5))], 70, "rare"),
  P("rejuvenate", "\u56DE\u6625", ARMOR, [m("outOfCombatRegen", L(10, 8))], 80, "fine"),
  // ---------------- 5. 防御类 ----------------
  P("bulwark", "\u575A\u58C1", CH, [m("defensePct", L(8, 6))], 100, "common"),
  P("iron_wall", "\u94C1\u58C1", CH, [m("flatReduce", L(1, 1))], 80, "fine"),
  P("tough", "\u575A\u97E7", ["chest", "legs"], [m("resistPct", L(4, 3))], 100, "common"),
  P("shield", "\u62A4\u76FE", CH, [m("shieldChance", L(6, 4))], 80, "fine"),
  P("absorb", "\u5438\u6536", CH, [m("absorbFlat", L(2, 2))], 80, "fine"),
  P("deflect", "\u504F\u659C", ["chest", "head"], [m("deflectPct", L(8, 6))], 80, "fine"),
  P("block", "\u683C\u6321", SD, [m("blockPct", L(8, 6))], 100, "common"),
  P("guard", "\u5B88\u62A4", SD, [m("guardReducePct", L(6, 4))], 90, "fine"),
  P("immovable", "\u4E0D\u52A8\u5982\u5C71", CH, [m("standStillDefense", L(6, 4))], 70, "rare"),
  P("counter", "\u53CD\u51FB", SD, [m("counterPct", L(8, 6))], 80, "fine"),
  P("guard_heart", "\u5B88\u62A4\u5FC3\u810F", CH, [m("lastStandChance", L(6, 4))], 50, "epic"),
  P("watch", "\u5B88\u671B", ARMOR, [m("watchDefense", L(5, 4))], 80, "fine"),
  // ---------------- 6. 移动类 ----------------
  P("swift_step", "\u75BE\u6B65", FE, [m("moveSpeedPct", L(5, 3))], 100, "common", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  P("dash", "\u98DE\u5954", FE, [m("sprintSpeedPct", L(6, 4))], 100, "common"),
  P("light_feather", "\u8F7B\u7FBD", FE, [m("fallReducePct", L(15, 9))], 90, "fine"),
  P("leap", "\u8DC3\u8FC1", FE, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, ["clumsy", "bind_chest", "bulky"]),
  P("wind_walk", "\u98CE\u884C", FE, [m("sprintSpeedPct", L(5, 3.5))], 90, "fine"),
  P("chase_wind", "\u8FFD\u98CE", FE, [m("hurtSpeedPct", L(8, 6))], 80, "fine"),
  P("flash_raid", "\u95EA\u88AD", FE, [m("hurtSpeedPct", L(6, 4))], 90, "common"),
  P("escape", "\u9003\u8131", FE, [m("hurtSpeedPct", L(10, 7))], 80, "fine"),
  P("agility", "\u7075\u52A8", FE, [m("turnAgilityPct", L(10, 7))], 90, "common"),
  P("swim_swift", "\u8FC5\u6E38", FE, [m("waterSpeedPct", L(10, 7))], 90, "common"),
  P("deep_dive", "\u6DF1\u6F5C", FE, [m("swimPct", L(12, 8))], 90, "common"),
  P("fire_walk", "\u706B\u884C", FE, [m("fireResistPct", L(10, 7))], 90, "common"),
  // ---------------- 7. 元素 · 火 ----------------
  P("scorch", "\u707C\u70ED", MELEE, [m("fireChance", L(10, 7))], 90, "fine"),
  P("flame", "\u70C8\u7130", MELEE, [m("fireDuration", L(1, 1))], 90, "fine"),
  P("blazing", "\u70BD\u708E", MELEE, [m("burningTargetPct", L(8, 6))], 80, "fine"),
  P("fire_seed", "\u706B\u79CD", MELEE, [m("fireGround", L(1, 0.5))], 60, "epic"),
  P("deflagrate", "\u7206\u71C3", MELEE, [m("fireBurst", L(6, 4))], 80, "fine"),
  P("fire_sea", "\u706B\u6D77", MELEE, [m("fireSeaPct", L(10, 7))], 60, "epic"),
  P("molten", "\u7194\u706B", MELEE, [m("moltenPct", L(8, 6))], 70, "rare"),
  // ---------------- 8. 元素 · 冰霜 ----------------
  P("chill", "\u51B0\u51B7", MELEE, [m("iceChance", L(12, 8))], 90, "fine"),
  P("extreme_cold", "\u6781\u5BD2", MELEE, [m("slowAmp", L(1, 0.5))], 80, "fine"),
  P("freeze", "\u51BB\u7ED3", MELEE, [m("freezeChance", L(3, 3))], 50, "epic"),
  P("ice_burst", "\u51B0\u7206", MELEE, [m("frozenTargetPct", L(10, 8))], 80, "fine"),
  P("chill_aura", "\u5BD2\u6C14", ARMOR, [m("chillAura", L(1, 0.5))], 60, "epic"),
  P("ice_armor", "\u51B0\u7532", ARMOR, [m("iceArmorPct", L(6, 4))], 80, "fine"),
  P("eternal_frost", "\u6C38\u971C", MELEE, [m("frostExtendPct", L(10, 8))], 70, "rare"),
  // ---------------- 9. 元素 · 雷电 ----------------
  P("thunder", "\u96F7\u9E23", MELEE, [m("lightningChance", L(4, 3))], 60, "epic"),
  P("shock", "\u611F\u7535", MELEE, [m("shockAmp", L(1, 0.5))], 80, "fine"),
  P("chain_lightning", "\u8FDE\u9501\u95EA\u7535", MELEE, [m("chainChance", L(6, 4))], 70, "rare"),
  P("thunderstorm", "\u96F7\u66B4", MELEE, [m("stormCharge", L(3, 2))], 60, "epic"),
  P("thunder_mark", "\u96F7\u75D5", MELEE, [m("thunderMarkPct", L(8, 6))], 70, "rare"),
  P("overload_thunder", "\u8FC7\u8F7D", MELEE, [m("overloadPct", L(10, 8))], 70, "rare"),
  P("judgment", "\u5929\u7F5A", MELEE, [m("judgmentPct", L(10, 8))], 60, "epic"),
  // ---------------- 10. 元素 · 毒素 ----------------
  P("poison_blade", "\u6BD2\u5203", MELEE, [m("poisonChance", L(12, 8))], 90, "fine"),
  P("corrode", "\u8150\u8680", MELEE, [m("corrodeAmp", L(1, 0.5))], 80, "fine"),
  P("strong_poison", "\u731B\u6BD2", MELEE, [m("poisonAmp", L(1, 0.5))], 80, "fine"),
  P("poison_burst", "\u6BD2\u7206", MELEE, [m("poisonBurst", L(8, 6))], 80, "fine"),
  P("poison_cloud", "\u6BD2\u96FE", MELEE, [m("poisonCloud", L(1, 0.5))], 60, "epic"),
  P("snake_bite", "\u86C7\u543B", MELEE, [m("snakeBitePct", L(8, 6))], 70, "rare"),
  // ---------------- 11. 控制类 ----------------
  P("slow", "\u7F13\u6162", MELEE, [m("slowOnHit", L(1, 0.5))], 100, "common"),
  P("weaken", "\u865A\u5F31", MELEE, [m("weakenOnHit", L(1, 0.5))], 100, "common"),
  P("stun", "\u7729\u6655", MELEE, [m("stunChance", L(3, 2))], 60, "epic"),
  P("bind", "\u675F\u7F1A", MELEE, [m("rootChance", L(4, 3))], 60, "epic"),
  P("fear", "\u6050\u60E7", MELEE, [m("fearChance", L(3, 2))], 70, "rare"),
  P("silence", "\u6C89\u9ED8", MELEE, [m("silenceChance", L(4, 3))], 60, "epic"),
  P("break_stance", "\u7834\u52BF", MELEE, [m("sunderOnHit", L(1, 0.5))], 90, "common"),
  P("dispel", "\u9A71\u6563", MELEE, [m("dispelChance", L(5, 3))], 60, "epic"),
  // ---------------- 12. 范围类 ----------------
  P("sweep", "\u6A2A\u626B", MELEE, [m("sweepPct", L(20, 12))], 80, "fine"),
  P("quake", "\u9707\u5730", MELEE, [m("quakePct", L(15, 10))], 80, "fine"),
  P("fissure", "\u88C2\u5730", MELEE, [m("fissurePct", L(20, 12))], 70, "rare"),
  P("whirlwind", "\u65CB\u98CE", MELEE, [m("whirlwindChance", L(5, 3))], 70, "rare"),
  P("explode", "\u7206\u88C2", MELEE, [m("explodePct", L(10, 7))], 80, "fine"),
  P("chain_hit", "\u94FE\u51FB", MELEE, [m("chainHitPct", L(12, 8))], 80, "fine"),
  P("storm", "\u98CE\u66B4", MELEE, [m("stormAoePct", L(18, 10))], 70, "rare"),
  P("earth_split", "\u5730\u88C2", MELEE, [m("earthSplitPct", L(15, 10))], 70, "rare"),
  /* ====================== 第二部分：剑专属 ====================== */
  P("sword_intent", "\u5251\u610F", SW, [m("swordIntentPct", L(8, 6))], 100, "common"),
  P("quick_blade", "\u5FEB\u5251", SW, [m("quickBladePct", L(8, 5))], 90, "fine"),
  P("breaker", "\u7834\u519B", SW, [m("breakerPct", L(10, 8))], 70, "rare"),
  P("behead", "\u65A9\u9996", SW, [m("beheadPct", L(15, 12))], 60, "epic"),
  P("double_slash", "\u8FDE\u73AF\u65A9", SW, [m("doubleSlashChance", L(5, 4))], 70, "rare"),
  P("spin_blade", "\u65CB\u5203", SW, [m("spinBladeChance", L(4, 3))], 70, "rare"),
  P("sword_qi", "\u5251\u6C14", SW, [m("swordQiPct", L(10, 7))], 60, "epic"),
  P("flying_blade", "\u98DE\u5203", SW, [m("flyingBladePct", L(8, 6))], 60, "epic"),
  P("blood_blade", "\u8840\u5203", SW, [m("bloodBladeHeal", L(1, 1))], 70, "rare"),
  P("soul_hunt", "\u730E\u9B42", SW, [m("soulStackPct", L(4, 3))], 50, "epic"),
  P("mad_sword", "\u72C2\u5251", SW, [m("frenzyPct", L(6, 4))], 70, "rare"),
  P("peerless", "\u65E0\u53CC", SW, [m("peerlessPct", L(8, 5))], 40, "legendary"),
  /* ====================== 第三部分：斧专属 ====================== */
  P("heavy_axe", "\u91CD\u65A7", AX, [m("attackPct", L(10, 7)), m("knockbackPct", L(15, 10))], 100, "common"),
  P("swift_chop", "\u8FC5\u780D", AX, [m("miningSpeedPct", L(8, 6))], 100, "common"),
  P("lumber", "\u4F10\u6728", AX, [m("woodMasterPct", L(10, 7))], 100, "common", 0.12, ["blunt"]),
  P("tree_feller", "\u6811\u5012", AX, [m("treeFeller", L(1, 0.5))], 60, "epic"),
  P("reclaim", "\u5F00\u8352", AX, [m("aoeBreak", L(1, 0.5))], 70, "rare"),
  P("bone_break", "\u65AD\u9AA8", AX, [m("boneBreakChance", L(5, 4))], 80, "fine"),
  P("shield_break", "\u7834\u76FE", AX, [m("shieldBreakPct", L(8, 6))], 70, "rare"),
  P("cleave", "\u5288\u88C2", AX, [m("cleavePct", L(8, 6))], 70, "rare"),
  P("mighty_chop", "\u731B\u5288", AX, [m("mightyChopPct", L(20, 14))], 50, "epic"),
  P("wood_master", "\u6728\u5DE5\u5927\u5E08", AX, [m("extraDropPct", L(8, 6))], 80, "fine"),
  P("frenzy_chop", "\u72C2\u4F10", AX, [m("frenzyChopPct", L(8, 6))], 70, "rare"),
  /* ====================== 第四部分：镐专属 ====================== */
  P("swift_dig", "\u8FC5\u6398", PK, [m("miningSpeedPct", L(10, 7))], 100, "common", 0.12, ["dull_pick"]),
  P("ore_vein", "\u77FF\u8109", PK, [m("oreDropPct", L(8, 6))], 90, "fine"),
  P("lucky_miner", "\u5E78\u8FD0\u77FF\u5DE5", PK, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("refine", "\u7CBE\u70BC", PK, [m("smeltChance", L(5, 3))], 70, "rare"),
  P("chain_mine", "\u8FDE\u9501\u6316\u6398", PK, [m("chainMine", L(1, 0.5))], 60, "epic"),
  P("aoe_mine", "\u8303\u56F4\u6316\u6398", PK, [m("aoeMine", L(1, 0.5))], 70, "rare"),
  P("deep_dig", "\u6DF1\u6398", PK, [m("deepMinePct", L(10, 7))], 90, "fine"),
  P("miner_eye", "\u77FF\u5DE5\u4E4B\u773C", PK, [m("minerEye", L(1, 0.5))], 60, "epic"),
  P("treasure", "\u5B9D\u85CF\u730E\u624B", PK, [m("treasureChance", L(3, 2))], 60, "epic"),
  P("solid", "\u575A\u56FA", MELEE_TOOLS.concat(ARMOR), [m("durabilitySave", L(10, 8))], 100, "common", 0.12, ["fragile", "brittle", "fragile_pick"]),
  P("rapid_mine", "\u6781\u901F\u91C7\u77FF", PK, [m("rapidMinePct", L(8, 6))], 70, "rare"),
  P("earth_vein", "\u5730\u8109", PK, [m("earthVeinChance", L(5, 4))], 50, "epic"),
  /* ====================== 第五部分：锹专属 ====================== */
  P("swift_shovel", "\u8FC5\u6316", SH, [m("miningSpeedPct", L(10, 7))], 100, "common"),
  P("shovel_aoe", "\u8303\u56F4\u94F2", SH, [m("aoeMine", L(1, 0.5))], 70, "rare"),
  P("sand_master", "\u6C99\u5730\u5927\u5E08", SH, [m("sandMasterPct", L(10, 7))], 90, "fine"),
  P("soil_master", "\u571F\u5730\u5927\u5E08", SH, [m("soilMasterPct", L(10, 7))], 90, "fine"),
  P("treasure_hunter", "\u5B9D\u85CF\u730E\u4EBA", SH, [m("treasureChance", L(3, 2))], 70, "rare"),
  P("archaeology", "\u8003\u53E4", SH, [m("archaeologyChance", L(3, 2))], 70, "rare"),
  P("loosen_soil", "\u677E\u571F", SH, [m("tillPct", L(8, 6))], 90, "fine"),
  P("geologist", "\u5730\u8D28\u5B66\u5BB6", SH, [m("geologistChance", L(5, 4))], 50, "epic"),
  /* ====================== 第六部分：锄专属 ====================== */
  P("harvest", "\u4E30\u6536", HO, [m("harvestPct", L(10, 7))], 100, "common", 0.12, ["barren"]),
  P("lucky_farmer", "\u5E78\u8FD0\u519C\u592B", HO, [m("extraDropPct", L(8, 6))], 90, "fine"),
  P("auto_replant", "\u81EA\u52A8\u8865\u79CD", HO, [m("autoReplant", L(1, 0))], 70, "rare"),
  P("shennong", "\u795E\u519C", HO, [m("harvestPct", L(15, 9))], 60, "epic"),
  P("lush", "\u8302\u76DB", HO, [m("growthPct", L(10, 8))], 90, "fine", 0.12, ["greedy_grow"]),
  P("earth_gift", "\u5927\u5730\u6069\u8D50", HO, [m("farmlandRange", L(1, 0.5))], 70, "rare"),
  P("fast_till", "\u5FEB\u901F\u8015\u4F5C", HO, [m("fastTillPct", L(8, 6))], 90, "fine"),
  P("seed_master", "\u79CD\u5B50\u5927\u5E08", HO, [m("seedMasterPct", L(8, 6))], 90, "fine"),
  P("abundant", "\u4E30\u9976", HO, [m("abundantChance", L(8, 6))], 70, "rare"),
  P("eternal_farm", "\u6C38\u7EED\u8015\u4F5C", HO, [m("eternalFarm", L(1, 0))], 50, "epic"),
  /* ====================== 第七部分：弓专属 ====================== */
  P("strong_bow", "\u5F3A\u5F13", BW, [m("bowDamagePct", L(10, 7))], 100, "common"),
  P("sniper", "\u72D9\u51FB", BW, [m("sniperPct", L(10, 7))], 90, "fine"),
  P("pierce_arrow", "\u7A7F\u900F", BW, [m("arrowPierce", L(1, 0.5))], 70, "rare"),
  P("split_arrow", "\u5206\u88C2", BW, [m("splitArrowChance", L(5, 4))], 60, "epic"),
  P("multi_shot", "\u591A\u91CD\u7BAD", BW, [m("multiShot", L(1, 0.5))], 50, "epic"),
  P("explosive_arrow", "\u7206\u88C2\u7BAD", BW, [m("explosiveArrowPct", L(10, 7))], 60, "epic"),
  P("flame_arrow", "\u706B\u77E2", BW, [m("flameArrowChance", L(8, 6))], 80, "fine"),
  P("ice_arrow", "\u51B0\u77E2", BW, [m("iceArrowChance", L(8, 6))], 80, "fine"),
  P("thunder_arrow", "\u96F7\u77E2", BW, [m("thunderArrowChance", L(5, 4))], 60, "epic"),
  P("homing_arrow", "\u8FFD\u8E2A", BW, [m("homingArrow", L(1, 0.5))], 40, "legendary"),
  P("fast_string", "\u5FEB\u5F26", BW, [m("drawSpeedPct", L(8, 6))], 90, "fine"),
  P("steady_string", "\u7A33\u5F26", BW, [m("steadyAimPct", L(8, 6))], 90, "fine"),
  P("deadly_arrow", "\u81F4\u547D\u7BAD", BW, [m("deadlyArrowPct", L(6, 4))], 80, "fine"),
  P("hunter", "\u730E\u624B", BW, [m("hunterPct", L(8, 6))], 90, "fine"),
  /* ====================== 第八部分：弩专属 ====================== */
  P("heavy_crossbow", "\u91CD\u5F29", CB, [m("heavyCrossbowPct", L(12, 8))], 100, "common"),
  P("armor_pierce", "\u7A7F\u7532", CB, [m("armorPierceArrowPct", L(10, 7))], 90, "fine"),
  P("fast_reload", "\u5FEB\u88C5", CB, [m("reloadSpeedPct", L(10, 7))], 90, "fine"),
  P("multi_bolt", "\u591A\u77E2", CB, [m("multiBolt", L(1, 0.5))], 50, "epic"),
  P("blast_bolt", "\u7206\u7834", CB, [m("blastBoltPct", L(10, 7))], 60, "epic"),
  P("formation_break", "\u7834\u9635", CB, [m("formationBreakPct", L(8, 6))], 70, "rare"),
  P("snipe_kill", "\u72D9\u6740", CB, [m("snipeKillPct", L(12, 9))], 60, "epic"),
  P("rapid_fire", "\u8FDE\u53D1", CB, [m("rapidFirePct", L(10, 7))], 70, "rare"),
  P("stability", "\u7A33\u56FA", CB, [m("stabilityPct", L(8, 6))], 90, "fine"),
  /* ====================== 第九部分：三叉戟专属 ====================== */
  P("sea_god", "\u6D77\u795E", TR, [m("seaGodPct", L(10, 8))], 100, "common"),
  P("tide", "\u6F6E\u6C50", TR, [m("tidePct", L(8, 6))], 90, "fine"),
  P("storm_env", "\u96F7\u66B4", TR, [m("stormEnvPct", L(10, 7))], 80, "fine"),
  P("thunder_trident", "\u96F7\u9706", TR, [m("thunderPct", L(5, 4))], 60, "epic"),
  P("return_flow", "\u56DE\u6D41", TR, [m("returnSpeedPct", L(10, 8))], 90, "fine"),
  P("sea_pierce", "\u7A7F\u6D77", TR, [m("seaPiercePct", L(8, 6))], 90, "fine"),
  P("deep_hunter", "\u6DF1\u6D77\u730E\u624B", TR, [m("deepHunterPct", L(10, 7))], 90, "fine"),
  P("storm_trident", "\u98CE\u66B4", TR, [m("stormBurstPct", L(10, 7))], 70, "rare"),
  P("surge", "\u6D6A\u6D8C", TR, [m("surgeKnockback", L(15, 10))], 90, "fine"),
  /* ====================== 第十部分：盾牌专属 ====================== */
  P("iron_shield", "\u94C1\u76FE", SD, [m("ironShieldPct", L(8, 6))], 100, "common"),
  P("sturdy_shield", "\u575A\u76FE", SD, [m("shieldSavePct", L(10, 7))], 90, "fine"),
  P("rebound", "\u53CD\u9707", SD, [m("reboundPct", L(10, 7))], 80, "fine"),
  P("thorn_shield", "\u8346\u68D8\u76FE", SD, [m("thornShieldPct", L(10, 7))], 80, "fine"),
  P("shield_bash", "\u76FE\u51FB", SD, [m("shieldBashPct", L(10, 8))], 80, "fine"),
  P("charge", "\u51B2\u649E", SD, [m("chargeKnockback", L(20, 15))], 90, "common"),
  P("guard_field", "\u5B88\u62A4\u9886\u57DF", SD, [m("guardFieldPct", L(8, 6))], 60, "epic"),
  P("perfect_block", "\u5B8C\u7F8E\u683C\u6321", SD, [m("perfectBlockChance", L(4, 3))], 40, "legendary"),
  /* ====================== 第十一部分：头盔 ====================== */
  P("steadfast", "\u575A\u6BC5", HE, [m("damageReduceHead", L(8, 6))], 100, "common"),
  P("insight", "\u6D1E\u5BDF", HE, [m("insightFlat", L(2, 2))], 90, "fine"),
  P("night_vision", "\u591C\u89C6", HE, [m("nightVision", F(1))], 70, "rare"),
  P("water_breathing", "\u6C34\u4E0B\u547C\u5438", HE, [m("waterBreathing", F(1))], 70, "rare"),
  P("deep_vision", "\u6DF1\u6D77\u89C6\u89C9", HE, [m("deepVision", F(1))], 70, "rare"),
  P("spirit", "\u7CBE\u795E", HE, [m("debuffReduce", L(10, 8))], 90, "fine"),
  P("will", "\u610F\u5FD7", HE, [m("controlResist", L(10, 8))], 80, "fine"),
  P("danger_sense", "\u5371\u9669\u611F\u77E5", HE, [m("dangerSense", F(1))], 80, "fine"),
  P("undead_sense", "\u4EA1\u7075\u611F\u77E5", HE, [m("undeadSense", F(1))], 80, "fine"),
  P("monster_lore", "\u602A\u7269\u5B66\u8BC6", HE, [m("monsterLorePct", L(8, 6))], 70, "rare"),
  P("soul_eye", "\u7075\u9B42\u4E4B\u773C", HE, [m("soulEye", F(1))], 50, "epic"),
  /* ====================== 第十二部分：胸甲 ====================== */
  P("chest_bulwark", "\u575A\u58C1", CH, [m("defensePct", L(8, 6))], 100, "common"),
  P("chest_iron_wall", "\u94C1\u58C1", CH, [m("flatReduce", L(1, 1))], 90, "fine"),
  P("heavy_armor", "\u91CD\u7532", CH, [m("heavyArmorPct", L(10, 7))], 80, "fine"),
  P("life_core", "\u751F\u547D\u6838\u5FC3", CH, [m("lifeCorePct", L(8, 6))], 90, "fine"),
  P("shield_core", "\u62A4\u76FE\u6838\u5FC3", CH, [m("shieldCore", L(6, 4))], 70, "rare"),
  P("chest_absorb", "\u5438\u6536", CH, [m("absorbFlat", L(2, 2))], 90, "fine"),
  P("thorns", "\u8346\u68D8", CH, [m("thornsPct", L(10, 8))], 90, "fine"),
  P("regen_core", "\u518D\u751F\u6838\u5FC3", CH, [m("regenCorePct", L(8, 6))], 90, "fine"),
  P("guard_heart_chest", "\u5B88\u62A4\u4E4B\u5FC3", CH, [m("guardHeartPct", L(8, 6))], 80, "fine"),
  P("vengeance_heart", "\u590D\u4EC7\u4E4B\u5FC3", CH, [m("vengeanceHeartPct", L(6, 4))], 80, "fine"),
  P("unyielding_core", "\u4E0D\u5C48\u6838\u5FC3", CH, [m("unyieldingCoreChance", L(6, 4))], 50, "epic"),
  P("element_barrier", "\u5143\u7D20\u5C4F\u969C", CH, [m("elementBarrierPct", L(8, 6))], 70, "rare"),
  /* ====================== 第十三部分：护腿 ====================== */
  P("legs_tough", "\u575A\u97E7", LE, [m("maxHealthPct", L(4, 3))], 100, "common"),
  P("legs_vitality", "\u6D3B\u529B", LE, [m("regenPct", L(8, 6))], 90, "fine"),
  P("stamina", "\u8010\u529B", LE, [m("endurancePct", L(10, 7))], 90, "fine"),
  P("war_will", "\u6218\u4E89\u610F\u5FD7", LE, [m("warWillPct", L(3, 2.5))], 80, "fine"),
  P("recovery", "\u6062\u590D", LE, [m("outOfCombatRegen", L(10, 7))], 90, "fine"),
  P("persistence", "\u575A\u6301", LE, [m("persistencePct", L(8, 6))], 80, "fine"),
  P("feral", "\u91CE\u6027", LE, [m("feralPct", L(8, 6))], 80, "fine"),
  P("life_link", "\u751F\u547D\u94FE\u63A5", LE, [m("damageSpreadPct", L(10, 7))], 70, "rare"),
  P("body", "\u4F53\u9B44", LE, [m("bodyPct", L(10, 7))], 90, "fine"),
  P("warrior_legs", "\u6218\u58EB\u4E4B\u817F", LE, [m("warriorLegsPct", L(8, 6))], 80, "fine"),
  /* ====================== 第十四部分：靴子 ====================== */
  P("boots_swift", "\u75BE\u6B65", FE, [m("moveSpeedPct", L(5, 3.5))], 100, "common", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  P("boots_dash", "\u98DE\u5954", FE, [m("sprintSpeedPct", L(6, 4))], 100, "common"),
  P("boots_feather", "\u8F7B\u7FBD", FE, [m("fallReducePct", L(15, 9))], 90, "fine"),
  P("boots_leap", "\u8DC3\u8FC1", FE, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, ["clumsy", "bind_chest", "bulky"]),
  P("boots_wind", "\u98CE\u884C", FE, [m("sprintSpeedPct", L(5, 3.5))], 90, "fine"),
  P("boots_water", "\u6C34\u884C", FE, [m("waterSpeedPct", L(10, 7))], 90, "fine"),
  P("boots_dive", "\u6DF1\u6F5C", FE, [m("swimPct", L(12, 8))], 90, "fine"),
  P("boots_fire", "\u706B\u884C", FE, [m("fireResistPct", L(10, 7))], 90, "fine"),
  P("boots_ice", "\u51B0\u884C", FE, [m("iceWalkPct", L(15, 9))], 90, "fine"),
  P("dodge", "\u95EA\u907F", FE, [m("dodgeChance", L(4, 3))], 50, "epic"),
  P("boots_escape", "\u9003\u8131", FE, [m("hurtSpeedPct", L(10, 7))], 80, "fine"),
  P("light_foot", "\u7075\u8DB3", FE, [m("slowResistPct", L(10, 8))], 90, "fine"),
  P("soft_landing", "\u8FC5\u6377\u843D\u5730", FE, [m("landingPct", L(10, 8))], 90, "fine"),
  P("light", "\u8F7B\u76C8", FE, [m("moveSpeedPct", L(6, 4))], 80, "fine", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  /* ============ 第十五部分：通用资源 / 生存 ============ */
  P("fortune", "\u5E78\u8FD0", MELEE_TOOLS, [m("extraDropPct", L(10, 7))], 100, "common"),
  P("gather", "\u91C7\u96C6", TOOLS, [m("gatherPct", L(8, 6))], 90, "fine"),
  P("frugal", "\u8282\u7EA6", MELEE_TOOLS, [m("frugalPct", L(10, 7))], 90, "fine"),
  P("indestructible", "\u575A\u4E0D\u53EF\u6467", MELEE_TOOLS, [m("indestructiblePct", L(12, 8))], 60, "epic"),
  P("abundance", "\u4E30\u9976", MELEE_TOOLS, [m("abundantChance", L(8, 6))], 80, "fine"),
  P("xp_hunter", "\u7ECF\u9A8C\u730E\u624B", MELEE_TOOLS, [m("xpPct", L(10, 8))], 80, "fine"),
  P("greedy_miner", "\u8D2A\u77FF\u8005", PK, [m("greedyMinerPct", L(8, 6))], 80, "fine"),
  P("hunter_drop", "\u72E9\u730E\u8005", MELEE, [m("huntDropPct", L(8, 6))], 80, "fine"),
  P("farmer", "\u519C\u592B", HO, [m("farmDropPct", L(8, 6))], 80, "fine"),
  P("artisan", "\u5DE5\u5320", TOOLS, [m("artisanChance", L(4, 3))], 50, "epic"),
  /* ---------- 第十六部分：通用移动与生存 ---------- */
  P("night_walk", "\u591C\u884C", ARMOR, [m("nightSpeedPct", L(6, 4))], 80, "fine"),
  P("day_walk", "\u65E5\u884C", ARMOR, [m("daySpeedPct", L(6, 4))], 80, "fine"),
  P("wild_adapt", "\u8352\u91CE\u9002\u5E94", ARMOR, [m("wildAdaptPct", L(6, 4))], 80, "fine"),
  P("cave_walker", "\u6D1E\u7A74\u884C\u8005", ARMOR, [m("caveAdaptPct", L(6, 4))], 80, "fine"),
  P("desert_walker", "\u6C99\u6F20\u884C\u8005", FE, [m("desertAdaptPct", L(6, 4))], 80, "fine"),
  P("snow_walker", "\u96EA\u539F\u884C\u8005", FE, [m("snowAdaptPct", L(6, 4))], 80, "fine"),
  P("abyss_adapt", "\u6DF1\u6E0A\u9002\u5E94", ARMOR, [m("netherAdaptPct", L(8, 6))], 70, "rare"),
  P("water_adapt", "\u6C34\u57DF\u9002\u5E94", ARMOR, [m("waterAdaptPct", L(8, 6))], 70, "rare"),
  P("high_altitude", "\u9AD8\u7A7A\u9002\u5E94", FE, [m("highAltAdaptPct", L(6, 4))], 80, "fine"),
  /* ======================================================================
   * 钓鱼竿正面（§8.15 · 12 条）
   * ====================================================================*/
  P("fish_bait", "\u4E30\u9975", FISHING, [m("fishingLuckPct", L(12, 8))], 100, "common", 0.12, ["fish_float_fail"]),
  P("fish_stable_line", "\u7A33\u7EBF", FISHING, [m("varianceReducePct", L(15, 10))], 90, "fine"),
  P("fish_long_cast", "\u8FDC\u6295", FISHING, [m("treasurePct", L(8, 5))], 90, "fine", 0.12, ["fish_short_cast"]),
  P("fish_fast_reel", "\u5FEB\u6536", FISHING, [m("reelSpeedPct", L(12, 8))], 100, "common", 0.12, ["fish_spool_jam", "fish_slow_reel"]),
  P("fish_deep_hunter", "\u6DF1\u6C34\u730E\u624B", FISHING, [m("fishingLuckPct", L(10, 7)), m("waterBreathing", F(1))], 70, "rare"),
  P("fish_treasure_hook", "\u5B9D\u85CF\u94A9", FISHING, [m("treasurePct", L(10, 7))], 70, "rare"),
  P("fish_durable_spool", "\u8010\u4E45\u7EBF\u8F74", FISHING, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["fish_line_break", "fish_line_wear"]),
  P("fish_aroma", "\u8BF1\u9C7C\u9999\u6C14", FISHING, [m("fishingLuckPct", L(9, 6)), m("cooldownReducePct", L(6, 4))], 80, "fine"),
  P("fish_bycatch", "\u526F\u6E14\u83B7", FISHING, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("fish_quick_unhook", "\u5FEB\u901F\u89E3\u94A9", FISHING, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("fish_sonar_float", "\u63A2\u6D4B\u6D6E\u6F02", FISHING, [m("treasurePct", L(6, 4)), m("insightFlat", F(1))], 60, "epic"),
  P("fish_lucky_angler", "\u5E78\u8FD0\u6E14\u592B", FISHING, [m("fishingLuckPct", L(14, 9))], 60, "epic"),
  /* ======================================================================
   * 剪刀正面（§8.16 · 12 条）
   * ====================================================================*/
  P("shear_sharp_blade", "\u950B\u5229\u526A\u5203", SHEARS, [m("shearSpeedPct", L(15, 10))], 100, "common", 0.12, ["shear_blunt"]),
  P("shear_fine_cut", "\u7CBE\u7EC6\u526A\u88C1", SHEARS, [m("shearYieldPct", L(12, 8))], 100, "common"),
  P("shear_wool_master", "\u7F8A\u6BDB\u5927\u5E08", SHEARS, [m("shearYieldPct", L(14, 9))], 90, "fine", 0.12, ["shear_wool_waste"]),
  P("shear_leaf_collect", "\u53F6\u7247\u6536\u96C6", SHEARS, [m("shearYieldPct", L(10, 7))], 90, "fine"),
  P("shear_vine_reap", "\u85E4\u8513\u6536\u5272", SHEARS, [m("shearSpeedPct", L(12, 8))], 90, "fine"),
  P("shear_durable_joint", "\u8010\u7528\u5173\u8282", SHEARS, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["shear_nick"]),
  P("shear_silent", "\u9759\u97F3\u526A\u5207", SHEARS, [m("cooldownReducePct", L(8, 5))], 80, "fine"),
  P("shear_quick_prune", "\u5FEB\u901F\u4FEE\u679D", SHEARS, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("shear_fiber_sense", "\u7EA4\u7EF4\u8FA8\u8BC6", SHEARS, [m("insightFlat", F(1))], 60, "epic"),
  P("shear_precise", "\u7CBE\u51C6\u91C7\u96C6", SHEARS, [m("shearYieldPct", L(11, 7))], 70, "rare"),
  P("shear_lossless", "\u65E0\u635F\u526A\u88C1", SHEARS, [m("varianceReducePct", L(12, 8))], 80, "fine"),
  P("shear_gardener", "\u56ED\u827A\u719F\u624B", SHEARS, [m("harvestPct", L(10, 7))], 70, "rare"),
  /* ======================================================================
   * 刷子正面（§8.17 · 12 条）
   * ====================================================================*/
  P("brush_fine", "\u7EC6\u5237", BRUSH, [m("brushLuckPct", L(12, 8))], 100, "common", 0.12, ["brush_force_loss"]),
  P("brush_antiquarian", "\u53E4\u7269\u5B66\u8005", BRUSH, [m("brushLuckPct", L(14, 9))], 90, "fine"),
  P("brush_steady_hand", "\u7A33\u624B\u5237\u53D6", BRUSH, [m("varianceReducePct", L(15, 10))], 90, "fine"),
  P("brush_bristle", "\u5237\u6BDB\u8010\u4E45", BRUSH, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["brush_bristle_wear"]),
  P("brush_relic_id", "\u9057\u7269\u9274\u8BC6", BRUSH, [m("archaeologyChance", L(6, 4))], 70, "rare"),
  P("brush_dust_recover", "\u5C18\u57C3\u56DE\u6536", BRUSH, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("brush_precise_arch", "\u7CBE\u51C6\u8003\u53E4", BRUSH, [m("brushLuckPct", L(10, 7))], 90, "fine"),
  P("brush_civ_resonance", "\u53E4\u6587\u660E\u5171\u9E23", BRUSH, [m("brushLuckPct", L(13, 9))], 60, "epic"),
  P("brush_light_touch", "\u8F7B\u5237\u6280\u5DE7", BRUSH, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("brush_sediment", "\u6C89\u79EF\u4E13\u5BB6", BRUSH, [m("brushSpeedPct", L(12, 8))], 90, "fine"),
  P("brush_relic_luck", "\u9057\u8FF9\u5E78\u8FD0", BRUSH, [m("brushLuckPct", L(15, 10))], 60, "epic"),
  P("brush_detail", "\u7EC6\u8282\u89C2\u5BDF", BRUSH, [m("insightFlat", F(1))], 60, "epic"),
  /* ======================================================================
   * 打火石正面（§8.18 · 12 条）
   * ====================================================================*/
  P("flint_precise", "\u7CBE\u51C6\u70B9\u706B", FLINT, [m("igniteChancePct", L(12, 8))], 100, "common", 0.12, ["flint_blunt", "flint_spark_deflect"]),
  P("flint_long_burn", "\u957F\u71C3\u706B\u79CD", FLINT, [m("fireDurationPct", L(15, 10))], 100, "common"),
  P("flint_master", "\u5F15\u706B\u5927\u5E08", FLINT, [m("igniteChancePct", L(14, 9))], 90, "fine"),
  P("flint_spark_recover", "\u706B\u82B1\u56DE\u6536", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("flint_blaze", "\u70C8\u7130\u542F\u793A", FLINT, [m("fireChance", L(8, 5))], 80, "fine"),
  P("flint_damp_proof", "\u6297\u6F6E\u706B\u77F3", FLINT, [m("igniteChancePct", L(10, 7))], 80, "fine"),
  P("flint_reserve", "\u706B\u79CD\u50A8\u5907", FLINT, [m("fireDurationPct", L(12, 8))], 80, "fine"),
  P("flint_molten_res", "\u7194\u706B\u5171\u9E23", FLINT, [m("moltenPct", L(10, 7))], 70, "rare"),
  P("flint_quick_ignite", "\u8FC5\u6377\u5F15\u71C3", FLINT, [m("cooldownReducePct", L(12, 8))], 90, "fine"),
  P("flint_ember_mark", "\u4F59\u70EC\u6807\u8BB0", FLINT, [m("fireGround", F(1))], 60, "epic"),
  P("flint_heat_grip", "\u8010\u706B\u63E1\u67C4", FLINT, [m("fireResistPct", L(10, 7))], 90, "fine", 0.12, ["flint_fragile"]),
  P("flint_campfire", "\u7BDD\u706B\u5320", FLINT, [m("igniteChancePct", L(9, 6))], 80, "fine"),
  /* ==== 《扩展词条库》正面 274 条（§3） ==== */
  P("xp001", "\u7CBE\u51C6\u6253\u51FB", MELEE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-001"),
  P("xp002", "\u7834\u52BF", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-002"),
  P("xp003", "\u5148\u624B", MELEE, [m("firstStrikePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-003"),
  P("xp004", "\u8FFD\u51FB", MELEE, [m("chasePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-004"),
  P("xp005", "\u6218\u610F", MELEE, [m("killStackPct", L(4, 3))], 90, "common", 0.12, [], void 0, "P-005"),
  P("xp006", "\u5904\u51B3", MELEE, [m("critChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-006"),
  P("xp007", "\u590D\u4EC7", MELEE, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-007"),
  P("xp008", "\u730E\u6740", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-008"),
  P("xp009", "\u91CD\u51FB", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-009"),
  P("xp010", "\u7075\u9B42\u56DE\u54CD", MELEE, [m("soulPct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-010"),
  P("xp011", "\u9707\u8361", MELEE, [m("attackCooldownPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-011"),
  P("xp012", "\u7A33\u624B", MELEE, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-012"),
  P("xp013", "\u5251\u610F", SWORD, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-013"),
  P("xp014", "\u8FDE\u73AF\u65A9", SWORD, [m("comboPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-014"),
  P("xp015", "\u65CB\u5203", SWORD, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-015"),
  P("xp016", "\u8840\u5203", SWORD, [m("lifesteal", L(2, 1.2))], 90, "fine", 0.12, [], void 0, "P-016"),
  P("xp017", "\u5251\u6C14", SWORD, [m("aoePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-017"),
  P("xp018", "\u65A9\u9996", SWORD, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-018"),
  P("xp019", "\u7834\u519B", SWORD, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-019"),
  P("xp020", "\u730E\u5FC3", SWORD, [m("critChance", L(4, 2.5))], 90, "common", 0.12, [], void 0, "P-020"),
  P("xp021", "\u65E0\u53CC", SWORD, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-021"),
  P("xp022", "\u5FEB\u5251", SWORD, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-022"),
  P("xp023", "\u5251\u683C\u53CD\u51FB", SWORD, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-023"),
  P("xp024", "\u5143\u7D20\u5171\u9E23", SWORD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-024"),
  P("xp025", "\u91CD\u65A7", AXE, [m("knockbackPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-025"),
  P("xp026", "\u4F10\u6728\u5927\u5E08", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-026"),
  P("xp027", "\u6811\u5012", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-027"),
  P("xp028", "\u8FC5\u780D", AXE, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-028"),
  P("xp029", "\u7834\u76FE", AXE, [m("shieldBreakPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-029"),
  P("xp030", "\u65AD\u9AA8", AXE, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-030"),
  P("xp031", "\u5288\u88C2", AXE, [m("aoePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-031"),
  P("xp032", "\u5F00\u8352", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-032"),
  P("xp033", "\u6728\u5DE5\u5927\u5E08", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-033"),
  P("xp034", "\u731B\u5288", AXE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-034"),
  P("xp035", "\u72C2\u4F10", AXE, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-035"),
  P("xp036", "\u5B88\u6797", AXE, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-036"),
  P("xp037", "\u8FC5\u6398", PICK, [m("miningSpeedPct", L(15, 10))], 90, "rare", 0.12, [], void 0, "P-037"),
  P("xp038", "\u77FF\u8109", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-038"),
  P("xp039", "\u5E78\u8FD0\u77FF\u5DE5", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-039"),
  P("xp040", "\u7CBE\u70BC", PICK, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-040"),
  P("xp041", "\u8FDE\u9501\u6316\u6398", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-041"),
  P("xp042", "\u8303\u56F4\u6316\u6398", PICK, [m("aoeBreak", F(1))], 90, "rare", 0.12, [], void 0, "P-042"),
  P("xp043", "\u575A\u56FA", PICK, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-043"),
  P("xp044", "\u77FF\u5DE5\u4E4B\u773C", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-044"),
  P("xp045", "\u5B9D\u85CF\u730E\u624B", PICK, [m("treasurePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-045"),
  P("xp046", "\u6DF1\u6398", PICK, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-046"),
  P("xp047", "\u5730\u8109\u5171\u9E23", PICK, [m("oreDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-047"),
  P("xp048", "\u91C7\u77FF\u4E13\u6CE8", PICK, [m("miningSpeedPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-048"),
  P("xp049", "\u8FC5\u6316", SHOVEL, [m("miningSpeedPct", L(15, 10))], 90, "rare", 0.12, [], void 0, "P-049"),
  P("xp050", "\u8303\u56F4\u94F2", SHOVEL, [m("aoeBreak", F(1))], 90, "common", 0.12, [], void 0, "P-050"),
  P("xp051", "\u6C99\u5730\u5927\u5E08", SHOVEL, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-051"),
  P("xp052", "\u5B9D\u85CF\u730E\u4EBA", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-052"),
  P("xp053", "\u8003\u53E4\u5B66\u5BB6", SHOVEL, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-053"),
  P("xp054", "\u677E\u571F", SHOVEL, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-054"),
  P("xp055", "\u5730\u8D28\u5B66\u5BB6", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-055"),
  P("xp056", "\u94F2\u9762\u575A\u97E7", SHOVEL, [m("attackDurabilityCost", L(1, 0.6))], 90, "common", 0.12, [], void 0, "P-056"),
  P("xp057", "\u5FEB\u901F\u6E05\u7406", SHOVEL, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-057"),
  P("xp058", "\u7EC6\u81F4\u6316\u6398", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-058"),
  P("xp059", "\u5806\u571F\u4E13\u5BB6", SHOVEL, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-059"),
  P("xp060", "\u5730\u8868\u5BFB\u5B9D", SHOVEL, [m("treasurePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-060"),
  P("xp061", "\u4E30\u6536", HOE, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-061"),
  P("xp062", "\u5E78\u8FD0\u519C\u592B", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-062"),
  P("xp063", "\u81EA\u52A8\u8865\u79CD", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-063"),
  P("xp064", "\u795E\u519C", HOE, [m("harvestPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-064"),
  P("xp065", "\u8302\u76DB", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-065"),
  P("xp066", "\u5927\u5730\u6069\u8D50", HOE, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-066"),
  P("xp067", "\u5FEB\u901F\u8015\u4F5C", HOE, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-067"),
  P("xp068", "\u79CD\u5B50\u5927\u5E08", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-068"),
  P("xp069", "\u4E30\u9976", HOE, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-069"),
  P("xp070", "\u6C38\u7EED\u8015\u4F5C", HOE, [m("harvestPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-070"),
  P("xp071", "\u8F6E\u4F5C", HOE, [m("harvestPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-071"),
  P("xp072", "\u7530\u56ED\u5B88\u62A4", HOE, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-072"),
  P("xp073", "\u5F3A\u5F13", BOW, [m("projectilePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-073"),
  P("xp074", "\u72D9\u51FB", BOW, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-074"),
  P("xp075", "\u7A7F\u900F", BOW, [m("piercePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-075"),
  P("xp076", "\u591A\u91CD\u7BAD", BOW, [m("multishotPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-076"),
  P("xp077", "\u7206\u88C2\u7BAD", BOW, [m("aoePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-077"),
  P("xp078", "\u706B\u77E2", BOW, [m("fireChance", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-078"),
  P("xp079", "\u51B0\u77E2", BOW, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-079"),
  P("xp080", "\u96F7\u77E2", BOW, [m("lightningChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-080"),
  P("xp081", "\u8FFD\u730E\u7BAD", BOW, [m("chasePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-081"),
  P("xp082", "\u5FEB\u5F26", BOW, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-082"),
  P("xp083", "\u7A33\u5F26", BOW, [m("varianceReducePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-083"),
  P("xp084", "\u81F4\u547D\u7BAD", BOW, [m("critChance", L(4, 2.5))], 90, "common", 0.12, [], void 0, "P-084"),
  P("xp085", "\u91CD\u5F29", CROSSBOW, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-085"),
  P("xp086", "\u7A7F\u7532", CROSSBOW, [m("armorPenPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-086"),
  P("xp087", "\u5FEB\u88C5", CROSSBOW, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-087"),
  P("xp088", "\u591A\u77E2", CROSSBOW, [m("multishotPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-088"),
  P("xp089", "\u7206\u7834", CROSSBOW, [m("explosivePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-089"),
  P("xp090", "\u7834\u9635", CROSSBOW, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-090"),
  P("xp091", "\u72D9\u6740", CROSSBOW, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-091"),
  P("xp092", "\u8FDE\u53D1", CROSSBOW, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-092"),
  P("xp093", "\u7A33\u56FA", CROSSBOW, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-093"),
  P("xp094", "\u673A\u62EC\u5927\u5E08", CROSSBOW, [m("attackDurabilityCost", L(1, 0.6))], 90, "fine", 0.12, [], void 0, "P-094"),
  P("xp095", "\u7A7F\u4E91", CROSSBOW, [m("snipePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-095"),
  P("xp096", "\u5F39\u836F\u56DE\u6536", CROSSBOW, [m("ammoPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-096"),
  P("xp097", "\u6D77\u795E", TRIDENT, [m("waterBreathing", F(1))], 90, "rare", 0.12, [], void 0, "P-097"),
  P("xp098", "\u6F6E\u6C50", TRIDENT, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-098"),
  P("xp099", "\u96F7\u9706", TRIDENT, [m("lightningChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-099"),
  P("xp100", "\u56DE\u6D41", TRIDENT, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-100"),
  P("xp101", "\u7A7F\u6D77", TRIDENT, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-101"),
  P("xp102", "\u6DF1\u6D77\u730E\u624B", TRIDENT, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-102"),
  P("xp103", "\u6D6A\u6D8C", TRIDENT, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-103"),
  P("xp104", "\u98CE\u66B4", TRIDENT, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-104"),
  P("xp105", "\u6295\u63B7\u5927\u5E08", TRIDENT, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-105"),
  P("xp106", "\u56DE\u624B\u7A33\u56FA", TRIDENT, [m("accuracyPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-106"),
  P("xp107", "\u6F6E\u6C50\u6062\u590D", TRIDENT, [m("waterBreathing", F(1))], 90, "rare", 0.12, [], void 0, "P-107"),
  P("xp108", "\u6D77\u6D41\u611F\u77E5", TRIDENT, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-108"),
  P("xp109", "\u94C1\u76FE", SHIELD, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-109"),
  P("xp110", "\u575A\u76FE", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 90, "common", 0.12, [], void 0, "P-110"),
  P("xp112", "\u8346\u68D8\u76FE", SHIELD, [m("vengeancePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-112"),
  P("xp113", "\u76FE\u51FB", SHIELD, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-113"),
  P("xp114", "\u51B2\u649E", SHIELD, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-114"),
  P("xp115", "\u5B88\u62A4", SHIELD, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-115"),
  P("xp116", "\u5B88\u62A4\u9886\u57DF", SHIELD, [m("defensePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-116"),
  P("xp117", "\u5B8C\u7F8E\u683C\u6321", SHIELD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-117"),
  P("xp118", "\u76FE\u5899", SHIELD, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-118"),
  P("xp119", "\u53CD\u5C04\u5C4F\u969C", SHIELD, [m("thornsPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-119"),
  P("xp120", "\u575A\u5B88", SHIELD, [m("resistPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-120"),
  P("xp121", "\u575A\u6BC5", HEAD, [m("maxHealthPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-121"),
  P("xp122", "\u6D1E\u5BDF", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-122"),
  P("xp123", "\u591C\u89C6", HEAD, [m("nightVision", F(1))], 90, "common", 0.12, [], void 0, "P-123"),
  P("xp124", "\u6C34\u4E0B\u547C\u5438", HEAD, [m("waterBreathing", F(1))], 90, "fine", 0.12, [], void 0, "P-124"),
  P("xp125", "\u6DF1\u6D77\u89C6\u89C9", HEAD, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-125"),
  P("xp126", "\u7CBE\u795E", HEAD, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-126"),
  P("xp127", "\u610F\u5FD7", HEAD, [m("resistPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-127"),
  P("xp128", "\u5371\u9669\u611F\u77E5", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-128"),
  P("xp129", "\u4EA1\u7075\u611F\u77E5", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-129"),
  P("xp130", "\u602A\u7269\u5B66\u8BC6", HEAD, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-130"),
  P("xp131", "\u7075\u9B42\u4E4B\u773C", HEAD, [m("soulPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-131"),
  P("xp132", "\u6E05\u660E", HEAD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-132"),
  P("xp133", "\u575A\u58C1", CHEST, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-133"),
  P("xp134", "\u94C1\u58C1", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-134"),
  P("xp135", "\u91CD\u7532", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-135"),
  P("xp136", "\u751F\u547D\u6838\u5FC3", CHEST, [m("defensePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-136"),
  P("xp137", "\u62A4\u76FE\u6838\u5FC3", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-137"),
  P("xp138", "\u5438\u6536", CHEST, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-138"),
  P("xp139", "\u8346\u68D8", CHEST, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-139"),
  P("xp140", "\u518D\u751F\u6838\u5FC3", CHEST, [m("regenPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-140"),
  P("xp141", "\u5B88\u62A4\u4E4B\u5FC3", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-141"),
  P("xp142", "\u590D\u4EC7\u4E4B\u5FC3", CHEST, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-142"),
  P("xp143", "\u4E0D\u5C48\u6838\u5FC3", CHEST, [m("critChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-143"),
  P("xp144", "\u5143\u7D20\u5C4F\u969C", CHEST, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-144"),
  P("xp145", "\u575A\u97E7", LEGS, [m("maxHealthPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-145"),
  P("xp146", "\u6D3B\u529B", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-146"),
  P("xp147", "\u8010\u529B", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-147"),
  P("xp148", "\u6218\u4E89\u610F\u5FD7", LEGS, [m("killStackPct", L(4, 3))], 90, "fine", 0.12, [], void 0, "P-148"),
  P("xp149", "\u6062\u590D", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-149"),
  P("xp150", "\u575A\u6301", LEGS, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-150"),
  P("xp151", "\u91CE\u6027", LEGS, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-151"),
  P("xp152", "\u751F\u547D\u94FE\u63A5", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-152"),
  P("xp153", "\u4F53\u9B44", LEGS, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-153"),
  P("xp154", "\u6218\u58EB\u4E4B\u817F", LEGS, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-154"),
  P("xp155", "\u957F\u9014\u8DCB\u6D89", LEGS, [m("attackCooldownPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-155"),
  P("xp156", "\u7A33\u6B65", LEGS, [m("attackCooldownPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-156"),
  P("xp157", "\u75BE\u6B65", FEET, [m("moveSpeedPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-157"),
  P("xp158", "\u98DE\u5954", FEET, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-158"),
  P("xp159", "\u8F7B\u7FBD", FEET, [m("fallReducePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-159"),
  P("xp160", "\u8DC3\u8FC1", FEET, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-160"),
  P("xp161", "\u98CE\u884C", FEET, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-161"),
  P("xp162", "\u6C34\u884C", FEET, [m("moveSpeedPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-162"),
  P("xp163", "\u6DF1\u6F5C", FEET, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-163"),
  P("xp164", "\u706B\u884C", FEET, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-164"),
  P("xp165", "\u51B0\u884C", FEET, [m("iceSlip", F(1))], 90, "common", 0.12, [], void 0, "P-165"),
  P("xp166", "\u95EA\u907F", FEET, [m("dodgeChance", L(4, 2.5))], 90, "fine", 0.12, [], void 0, "P-166"),
  P("xp167", "\u9003\u8131", FEET, [m("dodgeChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-167"),
  P("xp168", "\u7075\u8DB3", FEET, [m("attackCooldownPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-168"),
  P("xp169", "\u5143\u7D20\u6297\u6027", ARMOR, [m("resistPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-169"),
  P("xp171", "\u53CD\u51FB\u4E4B\u52BF", ARMOR, [m("vengeancePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-171"),
  P("xp172", "\u8010\u4E45\u5B88\u62A4", ARMOR, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-172"),
  P("xp173", "\u751F\u547D\u6062\u590D", ARMOR, [m("maxHealthPct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-173"),
  P("xp174", "\u6297\u51FB\u9000", ARMOR, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-174"),
  P("xp175", "\u72B6\u6001\u62B5\u6297", ARMOR, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-175"),
  P("xp176", "\u6218\u6597\u9002\u5E94", ARMOR, [m("resistPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-176"),
  P("xp177", "\u73AF\u5883\u9002\u5E94", ARMOR, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-177"),
  P("xp178", "\u7D27\u6025\u62A4\u76FE", ARMOR, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-178"),
  P("xp179", "\u590D\u539F", ARMOR, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-179"),
  P("xp180", "\u5957\u88C5\u5171\u9E23", ARMOR, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-180"),
  P("xp181", "\u8282\u7EA6", TOOLS, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-181"),
  P("xp182", "\u7ECF\u9A8C\u730E\u624B", TOOLS, [m("xpPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-182"),
  P("xp183", "\u72E9\u730E\u8005", TOOLS, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-183"),
  P("xp184", "\u91C7\u96C6\u5927\u5E08", TOOLS, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-184"),
  P("xp185", "\u5FEB\u901F\u64CD\u4F5C", TOOLS, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-185"),
  P("xp186", "\u7A33\u56FA\u63E1\u67C4", TOOLS, [m("accuracyPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-186"),
  P("xp187", "\u7CBE\u7EC6\u4F5C\u4E1A", TOOLS, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-187"),
  P("xp188", "\u8D44\u6E90\u8FA8\u8BC6", TOOLS, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-188"),
  P("xp189", "\u8010\u4E45\u8C03\u6821", TOOLS, [m("durabilitySave", L(12, 8))], 90, "common", 0.12, [], void 0, "P-189"),
  P("xp190", "\u8FDE\u9501\u63A7\u5236", TOOLS, [m("aoeBreak", F(1))], 90, "fine", 0.12, [], void 0, "P-190"),
  P("xp191", "\u526F\u4EA7\u7269", TOOLS, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-191"),
  P("xp192", "\u5DE5\u5177\u4E13\u6CE8", TOOLS, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-192"),
  P("xp193", "\u788E\u7532\u91CD\u51FB", MACE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-193"),
  P("xp194", "\u5760\u51FB\u7CBE\u901A", MACE, [m("durabilitySave", L(10, 7))], 90, "common", 0.12, [], void 0, "P-194"),
  P("xp195", "\u51B2\u51FB\u6CE2", MACE, [m("aoePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-195"),
  P("xp196", "\u9707\u5730", MACE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-196"),
  P("xp197", "\u9524\u52BF\u84C4\u79EF", MACE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-197"),
  P("xp198", "\u7834\u76FE\u91CD\u538B", MACE, [m("shieldBreakPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-198"),
  P("xp199", "\u91CD\u9524\u56DE\u54CD", MACE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-199"),
  P("xp200", "\u843D\u661F", MACE, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-200"),
  P("xp201", "\u5DE8\u529B\u51FB\u9000", MACE, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-201"),
  P("xp202", "\u7CBE\u51C6\u843D\u70B9", MACE, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-202"),
  P("xp203", "\u6218\u573A\u9707\u6151", MACE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-203"),
  P("xp204", "\u9524\u9B42", MACE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-204"),
  P("xp205", "\u7CBE\u51C6\u7A81\u523A", SPEAR, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-205"),
  P("xp206", "\u51B2\u950B\u8D2F\u7A7F", SPEAR, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-206"),
  P("xp207", "\u9A91\u67AA\u5927\u5E08", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-207"),
  P("xp208", "\u6218\u9635\u957F\u77DB", SPEAR, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-208"),
  P("xp209", "\u957F\u8DDD\u538B\u5236", SPEAR, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-209"),
  P("xp210", "\u7A33\u6746", SPEAR, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-210"),
  P("xp211", "\u51B2\u52BF\u56DE\u6536", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-211"),
  P("xp212", "\u523A\u51FB\u8FDE\u8D2F", SPEAR, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-212"),
  P("xp213", "\u9A91\u4E58\u51B2\u950B", SPEAR, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-213"),
  P("xp214", "\u7834\u9635\u7A81\u8FDB", SPEAR, [m("knockbackPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-214"),
  P("xp215", "\u77DB\u5C16\u5171\u9E23", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-215"),
  P("xp216", "\u5148\u5236\u957F\u523A", SPEAR, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-216"),
  P("xp217", "\u4E30\u9975", FISHING, [m("treasurePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-217"),
  P("xp218", "\u7A33\u7EBF", FISHING, [m("varianceReducePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-218"),
  P("xp219", "\u8FDC\u6295", FISHING, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-219"),
  P("xp220", "\u5FEB\u6536", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-220"),
  P("xp221", "\u6DF1\u6C34\u730E\u624B", FISHING, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-221"),
  P("xp222", "\u5B9D\u85CF\u94A9", FISHING, [m("treasurePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-222"),
  P("xp223", "\u8010\u4E45\u7EBF\u8F74", FISHING, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-223"),
  P("xp224", "\u8BF1\u9C7C\u9999\u6C14", FISHING, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-224"),
  P("xp225", "\u526F\u6E14\u83B7", FISHING, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-225"),
  P("xp226", "\u5FEB\u901F\u89E3\u94A9", FISHING, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-226"),
  P("xp227", "\u63A2\u6D4B\u6D6E\u6F02", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-227"),
  P("xp228", "\u5E78\u8FD0\u6E14\u592B", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-228"),
  P("xp229", "\u950B\u5229\u526A\u5203", SHEARS, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-229"),
  P("xp230", "\u7CBE\u7EC6\u526A\u88C1", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-230"),
  P("xp231", "\u7F8A\u6BDB\u5927\u5E08", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-231"),
  P("xp232", "\u53F6\u7247\u6536\u96C6", SHEARS, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-232"),
  P("xp233", "\u85E4\u8513\u6536\u5272", SHEARS, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-233"),
  P("xp234", "\u8010\u7528\u5173\u8282", SHEARS, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-234"),
  P("xp235", "\u9759\u97F3\u526A\u5207", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-235"),
  P("xp236", "\u5FEB\u901F\u4FEE\u679D", SHEARS, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-236"),
  P("xp237", "\u7EA4\u7EF4\u8FA8\u8BC6", SHEARS, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-237"),
  P("xp238", "\u7CBE\u51C6\u91C7\u96C6", SHEARS, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-238"),
  P("xp239", "\u65E0\u635F\u526A\u88C1", SHEARS, [m("varianceReducePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-239"),
  P("xp240", "\u56ED\u827A\u719F\u624B", SHEARS, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-240"),
  P("xp241", "\u7EC6\u5237", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-241"),
  P("xp242", "\u53E4\u7269\u5B66\u8005", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-242"),
  P("xp243", "\u7A33\u624B\u5237\u53D6", BRUSH, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-243"),
  P("xp244", "\u5237\u6BDB\u8010\u4E45", BRUSH, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-244"),
  P("xp245", "\u9057\u7269\u9274\u8BC6", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-245"),
  P("xp246", "\u5C18\u57C3\u56DE\u6536", BRUSH, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-246"),
  P("xp247", "\u7CBE\u51C6\u8003\u53E4", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-247"),
  P("xp248", "\u53E4\u6587\u660E\u5171\u9E23", BRUSH, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-248"),
  P("xp249", "\u8F7B\u5237\u6280\u5DE7", BRUSH, [m("cooldownReducePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-249"),
  P("xp250", "\u6C89\u79EF\u4E13\u5BB6", BRUSH, [m("brushLuckPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-250"),
  P("xp251", "\u9057\u8FF9\u5E78\u8FD0", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-251"),
  P("xp252", "\u7EC6\u8282\u89C2\u5BDF", BRUSH, [m("brushLuckPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-252"),
  P("xp253", "\u7CBE\u51C6\u70B9\u706B", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-253"),
  P("xp254", "\u957F\u71C3\u706B\u79CD", FLINT, [m("igniteChancePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-254"),
  P("xp255", "\u5F15\u706B\u5927\u5E08", FLINT, [m("igniteChancePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-255"),
  P("xp256", "\u706B\u82B1\u56DE\u6536", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-256"),
  P("xp257", "\u70C8\u7130\u542F\u793A", FLINT, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-257"),
  P("xp258", "\u6297\u6F6E\u706B\u77F3", FLINT, [m("igniteChancePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-258"),
  P("xp259", "\u706B\u79CD\u50A8\u5907", FLINT, [m("igniteChancePct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-259"),
  P("xp260", "\u7194\u706B\u5171\u9E23", FLINT, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-260"),
  P("xp261", "\u8FC5\u6377\u5F15\u71C3", FLINT, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-261"),
  P("xp262", "\u4F59\u70EC\u6807\u8BB0", FLINT, [m("fireChance", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-262"),
  P("xp263", "\u8010\u706B\u63E1\u67C4", FLINT, [m("fireChance", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-263"),
  P("xp264", "\u7BDD\u706B\u5320", FLINT, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-264"),
  P("xp265", "\u8F7B\u7FFC", ELYTRA, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-265"),
  P("xp266", "\u9AD8\u7A7A\u7A33\u6D41", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-266"),
  P("xp267", "\u4FEF\u51B2\u730E\u624B", ELYTRA, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-267"),
  P("xp268", "\u5E73\u7A33\u7740\u9646", ELYTRA, [m("fallReducePct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-268"),
  P("xp269", "\u98CE\u884C\u7FFC\u819C", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-269"),
  P("xp270", "\u7FFC\u819C\u8010\u7528", ELYTRA, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-270"),
  P("xp271", "\u6025\u8F6C\u98CE\u5207", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-271"),
  P("xp272", "\u6C14\u6D41\u611F\u77E5", ELYTRA, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-272"),
  P("xp273", "\u957F\u8DDD\u6ED1\u7FD4", ELYTRA, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-273"),
  P("xp274", "\u98CE\u66B4\u9002\u5E94", ELYTRA, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-274"),
  P("xp275", "\u7F13\u964D", ELYTRA, [m("fallReducePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-275"),
  P("xp276", "\u9003\u9038\u4FEF\u51B2", ELYTRA, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-276"),
  /* ==== 马铠 / 骑乘道具正面 ==== */
  P("horse_iron_plate", "\u94C1\u9CDE\u9A6C\u94E0", HORSE, [m("defensePct", L(8, 5))], 90, "fine"),
  P("horse_light_barding", "\u8F7B\u88C5\u9A6C\u94E0", HORSE, [m("moveSpeedPct", L(8, 5))], 90, "fine"),
  P("horse_swift", "\u75BE\u9A70", HORSE, [m("moveSpeedPct", L(10, 7))], 80, "fine"),
  P("horse_stamina", "\u8010\u529B\u9A6C\u94E0", HORSE, [m("durabilitySave", L(12, 8))], 90, "fine"),
  P("horse_shielded", "\u62A4\u4E3B\u9A6C\u94E0", HORSE, [m("defensePct", L(6, 4)), m("maxHealthPct", L(5, 3))], 70, "rare"),
  P("steer_steady", "\u7A33\u8235", STEERING, [m("durabilitySave", L(12, 8))], 90, "fine"),
  P("steer_fast", "\u75BE\u884C", STEERING, [m("moveSpeedPct", L(10, 7))], 90, "fine"),
  P("steer_lucky", "\u987A\u98CE", STEERING, [m("cooldownReducePct", L(10, 7))], 80, "fine"),
  P("steer_durable", "\u575A\u97E7\u7F30\u7EF3", STEERING, [m("indestructiblePct", L(8, 5))], 70, "rare"),
  P("steer_water", "\u6D89\u6C34", STEERING, [m("waterBreathing", F(1))], 60, "epic")
];
var NEGATIVE = [
  // ---------------- 攻击 ----------------
  N("dull", "\u8FDF\u949D", MELEE, [m("attackSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift", "agile", "extreme_speed"]),
  N("heavy", "\u6C89\u91CD", MELEE, [m("attackSpeedPct", L(-5, -7.5)), m("moveSpeedPct", L(-3, -3))], 90, "fine", 0.12, ["swift", "agile", "extreme_speed"]),
  N("weak", "\u8F6F\u5F31", MELEE, [m("attackPct", L(-6, -6.5))], 100, "common"),
  N("imbalance", "\u5931\u8861", MELEE, [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("backlash", "\u72C2\u6012\u53CD\u566C", MELEE, [m("selfDamageChance", L(1, 1.5))], 70, "rare"),
  N("thirsty", "\u9965\u6E34", MELEE, [m("hungerDrain", L(8, 10))], 90, "fine"),
  N("fatigue", "\u75B2\u52B3", MELEE, [m("comboDecayPct", L(4, 5.75))], 90, "fine"),
  N("charge_up", "\u84C4\u529B\u8FDF\u6EDE", MELEE, [m("firstHitDelay", L(5, 7.5))], 90, "fine"),
  N("recoil", "\u53CD\u9707", MELEE, [m("selfDamageChance", L(1, 1)), m("attackDurabilityCost", L(1, 0.5))], 80, "fine"),
  N("bloodthirst", "\u55DC\u8840", MELEE, [m("idleDecayPct", L(5, 7.5))], 80, "fine"),
  N("irritable", "\u6613\u6012", MELEE, [m("aggroPct", L(10, 10))], 90, "fine"),
  N("erratic", "\u5931\u63A7", MELEE, [m("erraticChance", L(3, 2))], 80, "fine"),
  N("frail_strike", "\u865A\u5F31", MELEE, [m("idleDecayPct", L(3, 4)), m("healingReducePct", L(5, 5))], 80, "fine"),
  // ---------------- 暴击 ----------------
  N("blunt_sense", "\u949D\u611F", MELEE, [m("bluntCritPct", L(4, 4))], 100, "common"),
  N("misaim", "\u5931\u51C6", MELEE, [m("lostCritDamagePct", L(8, 8))], 100, "common"),
  N("fragile_strike", "\u8106\u5F31\u6253\u51FB", MELEE, [m("critDefenseBreak", L(6, 6))], 80, "fine"),
  N("overload_crit", "\u8FC7\u8F7D", MELEE, [m("critDurabilityCost", L(1, 1))], 80, "fine"),
  N("fatal_cost", "\u81F4\u547D\u4EE3\u4EF7", MELEE, [m("critDurabilityCost", L(1, 0.75)), m("critSelfDamage", L(1, 1))], 70, "rare"),
  N("gamble", "\u8D4C\u547D", MELEE, [m("gambleCrit", L(8, 6)), m("attackPct", L(-6, -5))], 70, "rare"),
  // ---------------- 耐久 ----------------
  N("fragile", "\u6613\u788E", ALL, [m("durabilityMult", L(25, 28.75))], 100, "common", 0.12, ["solid"]),
  N("brittle", "\u8106\u88C2", ALL, [m("durabilityMult", L(40, 45))], 80, "fine", 0.12, ["solid"]),
  N("corrode_neg", "\u8150\u8680", ALL, [m("durabilityDrain", L(1, 1.5))], 80, "fine"),
  N("self_harm", "\u81EA\u635F", MELEE_TOOLS, [m("skillDurabilityCost", L(2, 2.75))], 80, "fine"),
  N("overload", "\u8FC7\u8F7D", ALL, [m("skillDurabilityCost", L(3, 3.5))], 70, "rare"),
  N("fracture", "\u65AD\u88C2\u98CE\u9669", ALL, [m("fractureChance", L(5, 4.75))], 80, "fine"),
  N("unstable", "\u4E0D\u7A33\u5B9A", ALL, [m("unstablePct", L(5, 6))], 80, "fine"),
  N("aging", "\u8001\u5316", ALL, [m("agingPct", L(4, 5))], 80, "fine"),
  // ---------------- 移动 ----------------
  N("clumsy", "\u7B28\u91CD", ["chest", "legs", "feet"], [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift", "leap", "boots_leap", "stiff"]),
  N("stagger_move", "\u8E52\u8DDA", ["legs", "feet"], [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("pressure", "\u538B\u8FEB", ["legs", "feet"], [m("runDecayPct", L(4, 5.75))], 90, "fine"),
  N("inertia", "\u60EF\u6027", FE, [m("turnSlow", L(10, 10))], 90, "fine"),
  N("bulky", "\u539A\u91CD", ["legs", "chest"], [m("jumpPct", L(-8, -10))], 90, "fine", 0.12, ["leap", "boots_leap"]),
  N("sink", "\u6C89\u5E95", FE, [m("swimPct", L(-12, -10.75))], 90, "fine"),
  N("slip", "\u6253\u6ED1", FE, [m("iceSlip", L(10, 10))], 90, "fine"),
  N("sticky", "\u7C98\u6EDE", FE, [m("waterSpeedPct", L(-10, -10))], 80, "fine"),
  // ---------------- 生命 ----------------
  N("frail_body", "\u865A\u5F31\u4F53\u8D28", ARMOR, [m("maxHealthPct", L(-6, -6))], 100, "common"),
  N("vulnerable", "\u6613\u4F24", ARMOR, [m("damageTakenPct", L(8, 8))], 100, "common"),
  N("brittle_bone", "\u8106\u9AA8", ARMOR, [m("critTakenPct", L(8, 8))], 90, "fine"),
  N("regen_block", "\u518D\u751F\u969C\u788D", ARMOR, [m("naturalRegenPct", L(-15, -15))], 90, "fine"),
  N("exhausted", "\u75B2\u60EB", ARMOR, [m("naturalRegenPct", L(-10, -12))], 90, "fine"),
  N("blood_loss", "\u5931\u8840", ARMOR, [m("bloodLossPct", L(3, 3))], 70, "rare"),
  N("sickly", "\u75C5\u5F31", ARMOR, [m("debuffReduce", L(-10, -10))], 90, "fine"),
  N("fatal_frailty", "\u81F4\u547D\u8106\u5F31", ARMOR, [m("frailtyPct", L(8, 8))], 70, "rare"),
  // ---------------- 防御 ----------------
  N("armor_break_body", "\u7834\u7532\u4F53", ARMOR, [m("armorBreakVulnPct", L(6, 6))], 90, "fine"),
  N("armor_crack", "\u88C2\u7532", CH, [m("armorCrackPct", L(6, 6))], 80, "fine"),
  N("exposed", "\u66B4\u9732", ARMOR, [m("exposedPct", L(8, 8))], 80, "fine"),
  N("lost_guard", "\u5931\u5B88", CH, [m("lostGuardPct", L(5, 6))], 80, "fine"),
  N("open_guard", "\u7A7A\u95E8", CH, [m("openGuardPct", L(5, 6))], 80, "fine"),
  N("shock_stun", "\u9707\u8361", ARMOR, [m("shockImmobilePct", L(5, 6))], 80, "fine"),
  N("magic_fragile", "\u9B54\u8106", ARMOR, [m("magicFragilePct", L(6, 6))], 80, "fine"),
  // ---------------- 护甲 · 头盔 ----------------
  N("stuffy", "\u95F7\u70ED", HE, [m("healingReducePct", L(10, 10))], 100, "common"),
  N("dizzy", "\u660F\u6C89", HE, [m("visionPct", L(5, 7.5))], 90, "fine"),
  N("hypoxia", "\u7F3A\u6C27", HE, [m("waterBreathingNeg", L(1, 1))], 80, "fine"),
  N("dull_senses", "\u611F\u5B98\u8FDF\u949D", HE, [m("senseReduce", L(10, 10))], 90, "fine"),
  N("mental_fatigue", "\u7CBE\u795E\u75B2\u52B3", HE, [m("mentalFatiguePct", L(6, 6))], 90, "fine"),
  // ---------------- 护甲 · 胸甲 ----------------
  N("heavy_chest", "\u6C89\u91CD", CH, [m("moveSpeedPct", L(-6, -6.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift"]),
  N("bind_chest", "\u675F\u7F1A", CH, [m("jumpPct", L(-8, -10))], 90, "fine", 0.12, ["leap", "boots_leap"]),
  N("sluggish", "\u8FDF\u7F13", CH, [m("attackSpeedPct", L(-5, -7.5))], 90, "fine", 0.12, ["swift", "agile", "extreme_speed"]),
  N("overheat", "\u8FC7\u70ED", CH, [m("fireVulnPct", L(10, 10))], 90, "fine"),
  N("heavy_press", "\u91CD\u538B", CH, [m("maxHealthPct", L(10, 10)), m("naturalRegenPct", L(-20, -15))], 80, "fine"),
  N("brittle_armor", "\u8106\u7532", CH, [m("critTakenPct", L(10, 10))], 80, "fine"),
  // ---------------- 护甲 · 护腿 ----------------
  N("stiff", "\u50F5\u786C", LE, [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift", "clumsy"]),
  N("fatigue_legs", "\u75B2\u52B3", LE, [m("sprintHungerDrain", L(10, 10))], 90, "fine"),
  N("leg_bind", "\u817F\u94E0\u675F\u7F1A", LE, [m("sprintStartup", L(10, 10))], 90, "fine"),
  N("heavy_lower", "\u6C89\u91CD\u4E0B\u76D8", LE, [m("heavyLowerBodyPct", L(8, 8))], 90, "fine"),
  N("action_slow", "\u884C\u52A8\u8FDF\u7F13", LE, [m("actionSlowPct", L(5, 6))], 80, "fine"),
  // ---------------- 护甲 · 靴子 ----------------
  N("clumsy_boots", "\u7B28\u91CD", FE, [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift"]),
  N("water_absorb", "\u5438\u6C34", FE, [m("waterSpeedPct", L(-15, -11.75))], 90, "fine"),
  N("sink_boots", "\u6C89\u5E95", FE, [m("swimPct", L(-12, -10.75))], 90, "fine"),
  N("slip_boots", "\u6253\u6ED1", FE, [m("iceSlip", L(10, 10))], 90, "fine"),
  N("thin_sole", "\u8106\u5E95", FE, [m("fallDamagePct", L(15, 11.75))], 90, "fine"),
  N("friction", "\u6469\u64E6\u635F\u8017", FE, [m("moveDurabilityCost", L(1, 0.5))], 90, "fine"),
  // ---------------- 工具 · 镐 ----------------
  N("dull_pick", "\u949D\u9550", PK, [m("miningSpeedPct", L(-10, -10))], 100, "common", 0.12, ["swift_dig"]),
  N("fragile_pick", "\u6613\u788E\u9550", PK, [m("durabilityMult", L(30, 28.75))], 100, "common", 0.12, ["solid"]),
  N("hand_shake", "\u9707\u624B", PK, [m("mineSlowSelf", L(5, 7.5))], 90, "fine"),
  N("greedy_dig", "\u8D2A\u6398", PK, [m("miningSpeedPct", L(15, 11.75)), m("durabilityMult", L(60, 55))], 70, "rare"),
  N("slow_dig", "\u8FDF\u6EDE", PK, [m("miningSpeedDecay", L(4, 5.75))], 90, "fine"),
  N("unstable_vein", "\u4E0D\u7A33\u5B9A\u77FF\u8109", PK, [m("unstableVeinPct", L(5, 6))], 80, "fine"),
  // ---------------- 工具 · 斧 ----------------
  N("blunt", "\u949D\u5203", AX, [m("woodMasterPct", L(-12, -10.75))], 100, "common", 0.12, ["lumber"]),
  N("off_center", "\u91CD\u5FC3\u504F\u79FB", AX, [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("easy_break", "\u6613\u65AD", AX, [m("fractureChance", L(8, 7.5))], 90, "fine"),
  N("overweight", "\u8FC7\u91CD", AX, [m("woodMasterPct", L(15, 11.75)), m("moveSpeedPct", L(-8, -10))], 80, "fine"),
  // ---------------- 工具 · 锹 ----------------
  N("bent_blade", "\u94F2\u5203\u5F2F\u66F2", SH, [m("miningSpeedPct", L(-10, -10))], 100, "common"),
  N("soil_dependency", "\u571F\u58E4\u4F9D\u8D56", SH, [m("soilDependencyPct", L(6, 6))], 90, "fine"),
  N("easy_jam", "\u6613\u5361", SH, [m("toolJamPct", L(5, 6))], 90, "fine"),
  // ---------------- 工具 · 锄 ----------------
  N("hardened", "\u677F\u7ED3", HO, [m("farmlandSlow", L(10, 10))], 100, "common"),
  N("barren", "\u8D2B\u7620", HO, [m("harvestPct", L(-10, -10))], 100, "common", 0.12, ["harvest"]),
  N("greedy_grow", "\u8D2A\u957F", HO, [m("harvestPct", L(15, 11.75)), m("growthPct", L(-15, -11.75))], 80, "fine", 0.12, ["lush"]),
  N("late_plant", "\u8FDF\u79CD", HO, [m("latePlantPct", L(6, 6))], 90, "fine"),
  /* ======================================================================
   * 钓鱼竿负面（§8.15 · 16 条）
   * ====================================================================*/
  N("fish_spool_jam", "\u7EBF\u8F74\u5361\u6DA9", FISHING, [m("fishingCooldownPct", L(10, 7))], 100, "common", 0.12, ["fish_fast_reel"]),
  N("fish_line_break", "\u9C7C\u7EBF\u6613\u65AD", FISHING, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["fish_durable_spool"]),
  N("fish_float_fail", "\u6D6E\u6F02\u5931\u7075", FISHING, [m("fishingLuckPct", L(-10, -7))], 90, "fine", 0.12, ["fish_bait"]),
  N("fish_bait_loss", "\u8BF1\u9975\u6563\u5931", FISHING, [m("fishingCooldownPct", L(8, 5))], 90, "fine"),
  N("fish_slow_reel", "\u6536\u7EBF\u8FDF\u7F13", FISHING, [m("reelSpeedPct", L(-10, -7))], 90, "fine", 0.12, ["fish_fast_reel"]),
  N("fish_tangle", "\u9C7C\u7EBF\u7F20\u7ED5", FISHING, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("fish_short_cast", "\u8FDC\u6295\u4E0D\u8DB3", FISHING, [m("treasurePct", L(-6, -4))], 80, "fine", 0.12, ["fish_long_cast"]),
  N("fish_water_misjudge", "\u6C34\u57DF\u8BEF\u5224", FISHING, [m("fishingLuckPct", L(-8, -5))], 80, "fine"),
  N("fish_hook_blunt", "\u9C7C\u94A9\u949D\u5316", FISHING, [m("fishingLuckPct", L(-7, -5))], 90, "fine"),
  N("fish_brute_reel", "\u66B4\u529B\u6536\u7EBF", FISHING, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("fish_damp_spool", "\u6F6E\u6E7F\u7EBF\u8F74", FISHING, [m("fishingCooldownPct", L(9, 6))], 80, "fine"),
  N("fish_loot_drift", "\u6218\u5229\u54C1\u504F\u6D41", FISHING, [m("treasurePct", L(-8, -5))], 80, "fine"),
  N("fish_empty_fatigue", "\u7A7A\u7AFF\u75B2\u52B3", FISHING, [m("fishingCooldownPct", L(7, 5))], 80, "fine"),
  N("fish_barb", "\u9C7C\u94A9\u5012\u523A", FISHING, [m("moveSpeedPct", L(-6, -4))], 80, "fine"),
  N("fish_reel_noise", "\u6536\u7EBF\u566A\u58F0", FISHING, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("fish_line_wear", "\u9C7C\u7EBF\u78E8\u635F", FISHING, [m("durabilityMult", L(15, 10))], 90, "fine", 0.12, ["fish_durable_spool"]),
  /* ======================================================================
   * 剪刀负面（§8.16 · 16 条）
   * ====================================================================*/
  N("shear_blunt", "\u949D\u5203\u526A", SHEARS, [m("shearSpeedPct", L(-10, -7))], 100, "common", 0.12, ["shear_sharp_blade"]),
  N("shear_nick", "\u5203\u53E3\u7F3A\u53E3", SHEARS, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["shear_durable_joint"]),
  N("shear_wool_waste", "\u6BDB\u6599\u6D6A\u8D39", SHEARS, [m("shearYieldPct", L(-10, -7))], 90, "fine", 0.12, ["shear_wool_master"]),
  N("shear_leaf_damage", "\u53F6\u7247\u7834\u635F", SHEARS, [m("shearYieldPct", L(-8, -5))], 90, "fine"),
  N("shear_knot", "\u7EBF\u7ED3\u5361\u5203", SHEARS, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("shear_loose_handle", "\u526A\u67C4\u677E\u52A8", SHEARS, [m("durabilityMult", L(15, 10))], 90, "fine"),
  N("shear_fiber_tangle", "\u7EA4\u7EF4\u7F20\u7ED5", SHEARS, [m("shearSpeedPct", L(-8, -5))], 80, "fine"),
  N("shear_low_precision", "\u7CBE\u7EC6\u5EA6\u4E0D\u8DB3", SHEARS, [m("shearYieldPct", L(-7, -5))], 80, "fine"),
  N("shear_overcut", "\u8FC7\u526A", SHEARS, [m("shearLossPct", L(10, 7))], 80, "fine"),
  N("shear_fluff_eye", "\u7ED2\u6BDB\u906E\u76EE", SHEARS, [m("visionPct", L(8, 5))], 80, "fine"),
  N("shear_high_branch", "\u9AD8\u679D\u96BE\u526A", SHEARS, [m("shearYieldPct", L(-6, -4))], 80, "fine"),
  N("shear_rust_joint", "\u9508\u8680\u5173\u8282", SHEARS, [m("shearSpeedPct", L(-9, -6))], 80, "fine"),
  N("shear_deflect", "\u526A\u5203\u504F\u659C", SHEARS, [m("shearYieldPct", L(-8, -5))], 80, "fine"),
  N("shear_fiber_waste", "\u7EA4\u7EF4\u6D6A\u8D39", SHEARS, [m("shearYieldPct", L(-9, -6))], 80, "fine"),
  N("shear_handle_risk", "\u6298\u67C4\u98CE\u9669", SHEARS, [m("fractureChance", L(6, 4))], 70, "rare"),
  N("shear_weed_block", "\u6742\u8349\u963B\u6EDE", SHEARS, [m("cooldownReducePct", L(-7, -5))], 80, "fine"),
  /* ======================================================================
   * 刷子负面（§8.17 · 16 条）
   * ====================================================================*/
  N("brush_bristle_wear", "\u5237\u6BDB\u78E8\u635F", BRUSH, [m("durabilityMult", L(20, 15))], 100, "common", 0.12, ["brush_bristle"]),
  N("brush_loose_handle", "\u5237\u67C4\u677E\u52A8", BRUSH, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("brush_force_loss", "\u529B\u5EA6\u5931\u63A7", BRUSH, [m("brushLuckPct", L(-10, -7))], 90, "fine", 0.12, ["brush_fine"]),
  N("brush_dust_eye", "\u6C99\u5C18\u6270\u773C", BRUSH, [m("visionPct", L(8, 5))], 80, "fine"),
  N("brush_bristle_fall", "\u5237\u6BDB\u8131\u843D", BRUSH, [m("brushLuckPct", L(-9, -6))], 90, "fine"),
  N("brush_mis_touch", "\u8003\u53E4\u8BEF\u89E6", BRUSH, [m("cooldownReducePct", L(-7, -5))], 80, "fine"),
  N("brush_wrist_fatigue", "\u624B\u8155\u75B2\u52B3", BRUSH, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("brush_relic_scratch", "\u9057\u7269\u522E\u635F", BRUSH, [m("brushLossPct", L(10, 7))], 80, "fine"),
  N("brush_uneven", "\u5237\u9762\u4E0D\u5E73", BRUSH, [m("brushLuckPct", L(-8, -5))], 80, "fine"),
  N("brush_dust_accum", "\u7070\u5C18\u79EF\u7D2F", BRUSH, [m("brushSpeedPct", L(-9, -6))], 80, "fine"),
  N("brush_fragile_relic", "\u8106\u5F31\u9057\u7269", BRUSH, [m("brushLossPct", L(8, 5))], 80, "fine"),
  N("brush_dust_aura", "\u5C18\u5C01\u6C14\u606F", BRUSH, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("brush_handle_crack", "\u67C4\u7AEF\u5F00\u88C2", BRUSH, [m("brushSpeedPct", L(-10, -7))], 80, "fine"),
  N("brush_over_clean", "\u8FC7\u5EA6\u6E05\u7406", BRUSH, [m("cooldownReducePct", L(-8, -5))], 80, "fine"),
  N("brush_sediment_block", "\u6C89\u79EF\u5835\u585E", BRUSH, [m("brushLuckPct", L(-7, -5))], 80, "fine"),
  N("brush_relic_bias", "\u9057\u7269\u504F\u8BC6", BRUSH, [m("brushLuckPct", L(-6, -4))], 80, "fine"),
  /* ======================================================================
   * 打火石负面（§8.18 · 16 条）
   * ====================================================================*/
  N("flint_blunt", "\u706B\u77F3\u949D\u5316", FLINT, [m("igniteCooldownPct", L(10, 7))], 100, "common", 0.12, ["flint_precise"]),
  N("flint_spark_deflect", "\u706B\u82B1\u504F\u659C", FLINT, [m("igniteChancePct", L(-10, -7))], 90, "fine", 0.12, ["flint_precise"]),
  N("flint_damp_tinder", "\u706B\u7ED2\u6F6E\u6E7F", FLINT, [m("igniteRiskPct", L(10, 7))], 90, "fine"),
  N("flint_low_fuel", "\u706B\u79CD\u4E0D\u8DB3", FLINT, [m("igniteCooldownPct", L(12, 8))], 90, "fine"),
  N("flint_hot_grip", "\u8FC7\u70ED\u63E1\u67C4", FLINT, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("flint_fragile", "\u8010\u4E45\u8106\u5F31", FLINT, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["flint_heat_grip"]),
  N("flint_wild_spark", "\u5931\u63A7\u706B\u661F", FLINT, [m("igniteRiskPct", L(12, 8))], 80, "fine"),
  N("flint_slow_ignite", "\u5F15\u706B\u8FDF\u7F13", FLINT, [m("cooldownReducePct", L(-8, -5))], 80, "fine"),
  N("flint_backfire", "\u706B\u7130\u53CD\u566C", FLINT, [m("igniteRiskPct", L(14, 9))], 70, "rare"),
  N("flint_fuel_mismatch", "\u71C3\u6599\u9519\u914D", FLINT, [m("igniteChancePct", L(-8, -5))], 80, "fine"),
  N("flint_fuel_waste", "\u706B\u79CD\u6D6A\u8D39", FLINT, [m("fireDurationPct", L(-12, -8))], 80, "fine"),
  N("flint_spark_expose", "\u706B\u661F\u66B4\u9732", FLINT, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("flint_overload", "\u70B9\u706B\u8FC7\u8F7D", FLINT, [m("igniteCooldownPct", L(9, 6))], 80, "fine"),
  N("flint_wet_extinguish", "\u6E7F\u5730\u7184\u706B", FLINT, [m("igniteChancePct", L(-9, -6))], 80, "fine"),
  N("flint_crack", "\u706B\u77F3\u5F00\u88C2", FLINT, [m("fractureChance", L(6, 4))], 70, "rare"),
  N("flint_scald", "\u707C\u624B", FLINT, [m("igniteRiskPct", L(11, 7))], 80, "fine"),
  /* ==== 《扩展词条库》负面 333 条（§2） ==== */
  N("xn001", "\u865A\u5F31\u6253\u51FB", MELEE, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-001"),
  N("xn002", "\u8FDF\u949D", MELEE, [m("attackSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-002"),
  N("xn003", "\u6C89\u91CD", MELEE, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-003"),
  N("xn004", "\u5931\u8861", MELEE, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-004"),
  N("xn005", "\u75B2\u52B3\u8FDE\u51FB", MELEE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-005"),
  N("xn006", "\u9965\u6E34", MELEE, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-006"),
  N("xn007", "\u6613\u6012", MELEE, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-007"),
  N("xn008", "\u53CD\u9707", MELEE, [m("vengeancePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-008"),
  N("xn009", "\u84C4\u529B\u8FDF\u6EDE", MELEE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-009"),
  N("xn010", "\u65AD\u52BF", MELEE, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-010"),
  N("xn011", "\u8FC7\u5EA6\u5EF6\u4F38", MELEE, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-011"),
  N("xn012", "\u5931\u51C6", MELEE, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-012"),
  N("xn013", "\u593A\u529B", MELEE, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-013"),
  N("xn014", "\u55DC\u8840\u7A7A\u7A97", MELEE, [m("lifesteal", L(-2, -1.2))], 80, "common", 0.12, [], void 0, "N-014"),
  N("xn015", "\u9707\u624B", MELEE, [m("comboPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-015"),
  N("xn016", "\u7834\u7EFD", MELEE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-016"),
  N("xn017", "\u949D\u5203", SWORD, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-017"),
  N("xn018", "\u5D29\u53E3", SWORD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-018"),
  N("xn019", "\u8840\u9508", SWORD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-019"),
  N("xn020", "\u5251\u8EAB\u8FC7\u957F", SWORD, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-020"),
  N("xn021", "\u53CD\u624B\u4E0D\u987A", SWORD, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-021"),
  N("xn022", "\u65A9\u52BF\u5931\u63A7", SWORD, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-022"),
  N("xn023", "\u5203\u9E23", SWORD, [m("aoePct", L(-5, -3))], 80, "fine", 0.12, [], void 0, "N-023"),
  N("xn024", "\u5203\u53E3\u56DE\u5F39", SWORD, [m("thornsPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-024"),
  N("xn025", "\u6697\u8680", SWORD, [m("regenPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-025"),
  N("xn026", "\u5251\u6C14\u6CC4\u6F0F", SWORD, [m("aoePct", L(-5, -3))], 80, "fine", 0.12, [], void 0, "N-026"),
  N("xn027", "\u8840\u69FD\u5835\u585E", SWORD, [m("lifesteal", L(-2, -1.2))], 80, "rare", 0.12, [], void 0, "N-027"),
  N("xn028", "\u5203\u8106", SWORD, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-028"),
  N("xn029", "\u63E1\u67C4\u6ED1\u8131", SWORD, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-029"),
  N("xn030", "\u5251\u683C\u788D\u624B", SWORD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-030"),
  N("xn031", "\u91CD\u5FC3\u504F\u5C16", SWORD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-031"),
  N("xn032", "\u55DC\u6218\u8BC5\u5492", SWORD, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-032"),
  N("xn033", "\u65A7\u67C4\u677E\u52A8", AXE, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-033"),
  N("xn034", "\u65A7\u5934\u504F\u91CD", AXE, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-034"),
  N("xn035", "\u4F10\u6728\u5361\u5203", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-035"),
  N("xn036", "\u5288\u780D\u56DE\u9707", AXE, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-036"),
  N("xn037", "\u65A7\u53E3\u5D29\u88C2", AXE, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-037"),
  N("xn038", "\u53CD\u624B\u8FDF\u6EDE", AXE, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-038"),
  N("xn039", "\u6728\u5C51\u906E\u76EE", AXE, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-039"),
  N("xn040", "\u679D\u6748\u7F20\u7ED5", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-040"),
  N("xn041", "\u5200\u80CC\u949D\u5316", AXE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-041"),
  N("xn042", "\u65A7\u5203\u504F\u659C", AXE, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-042"),
  N("xn043", "\u65AD\u67C4\u98CE\u9669", AXE, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-043"),
  N("xn044", "\u8FC7\u5EA6\u4F10\u780D", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-044"),
  N("xn045", "\u91CD\u5FC3\u6F02\u79FB", AXE, [m("attackPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-045"),
  N("xn046", "\u53CC\u624B\u5360\u7528", AXE, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-046"),
  N("xn047", "\u6728\u6750\u6D6A\u8D39", AXE, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-047"),
  N("xn048", "\u4F10\u540E\u75B2\u52B3", AXE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-048"),
  N("xn049", "\u949D\u5C16", PICK, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-049"),
  N("xn050", "\u5CA9\u5C51\u98DE\u6E85", PICK, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-050"),
  N("xn051", "\u77FF\u8109\u6270\u52A8", PICK, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-051"),
  N("xn052", "\u77FF\u7802\u5939\u5203", PICK, [m("miningSpeedPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-052"),
  N("xn053", "\u94BB\u5934\u8FC7\u70ED", PICK, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-053"),
  N("xn054", "\u6613\u5361\u5CA9\u5C42", PICK, [m("miningSpeedPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-054"),
  N("xn056", "\u8010\u4E45\u8FC7\u8017", PICK, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-056"),
  N("xn057", "\u6316\u6398\u8FDF\u6EDE", PICK, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-057"),
  N("xn058", "\u77FF\u77F3\u7C89\u788E", PICK, [m("oreDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-058"),
  N("xn059", "\u8106\u77FF", PICK, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-059"),
  N("xn060", "\u8D2A\u6398", PICK, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-060"),
  N("xn061", "\u95EA\u5149\u8BEF\u5224", PICK, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-061"),
  N("xn062", "\u6DF1\u6398\u5931\u8861", PICK, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-062"),
  N("xn063", "\u5751\u9053\u574D\u584C\u98CE\u9669", PICK, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-063"),
  N("xn064", "\u8FC7\u8F7D", PICK, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-064"),
  N("xn065", "\u94F2\u5203\u53D8\u5F62", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-065"),
  N("xn066", "\u7C98\u571F\u9644\u5203", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-066"),
  N("xn067", "\u6C99\u5C18\u8FF7\u773C", SHOVEL, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-067"),
  N("xn068", "\u6DF1\u6316\u5931\u63A7", SHOVEL, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-068"),
  N("xn069", "\u6C99\u783E\u6ED1\u843D", SHOVEL, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-069"),
  N("xn070", "\u571F\u58E4\u538B\u5B9E", SHOVEL, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-070"),
  N("xn071", "\u94F2\u571F\u6D6A\u8D39", SHOVEL, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-071"),
  N("xn072", "\u8FDF\u7F13\u6316\u6398", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-072"),
  N("xn073", "\u94F2\u67C4\u5F00\u88C2", SHOVEL, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-073"),
  N("xn074", "\u786C\u571F\u514B\u661F\u5931\u6548", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-074"),
  N("xn075", "\u6C99\u5730\u6F02\u79FB", SHOVEL, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-075"),
  N("xn076", "\u6CE5\u6D46\u9ECF\u9644", SHOVEL, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-076"),
  N("xn077", "\u8003\u53E4\u5931\u624B", SHOVEL, [m("archaeologyChance", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-077"),
  N("xn078", "\u94F2\u9762\u8FC7\u7A84", SHOVEL, [m("aoeBreak", F(1))], 80, "common", 0.12, [], void 0, "N-078"),
  N("xn079", "\u94F2\u540E\u75B2\u52B3", SHOVEL, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-079"),
  N("xn080", "\u5730\u5C42\u6DF7\u6DC6", SHOVEL, [m("treasurePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-080"),
  N("xn081", "\u677F\u7ED3", HOE, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-081"),
  N("xn082", "\u79CD\u5B50\u6563\u5931", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-082"),
  N("xn083", "\u9504\u67C4\u677E\u52A8", HOE, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-083"),
  N("xn084", "\u8BEF\u4F24\u4F5C\u7269", HOE, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-084"),
  N("xn085", "\u8FC7\u5EA6\u8015\u4F5C", HOE, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-085"),
  N("xn086", "\u8D2B\u7620", HOE, [m("extraDropPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-086"),
  N("xn087", "\u6C34\u5206\u6D41\u5931", HOE, [m("harvestPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-087"),
  N("xn088", "\u751F\u957F\u8FDF\u6EDE", HOE, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-088"),
  N("xn089", "\u6536\u5272\u65AD\u830E", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-089"),
  N("xn090", "\u6742\u8349\u8513\u751F", HOE, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-090"),
  N("xn091", "\u8FC7\u5EA6\u65BD\u80A5", HOE, [m("extraDropPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-091"),
  N("xn092", "\u64AD\u79CD\u9519\u4F4D", HOE, [m("autoReplant", F(1))], 80, "common", 0.12, [], void 0, "N-092"),
  N("xn093", "\u571F\u58E4\u4FB5\u8680", HOE, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-093"),
  N("xn094", "\u4F5C\u7269\u67AF\u840E", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-094"),
  N("xn095", "\u6536\u83B7\u62D6\u5EF6", HOE, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-095"),
  N("xn096", "\u519C\u52A1\u75B2\u52B3", HOE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-096"),
  N("xn097", "\u5F13\u5F26\u677E\u5F1B", BOW, [m("chargedBonusPct", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-097"),
  N("xn098", "\u5F13\u81C2\u5F00\u88C2", BOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-098"),
  N("xn099", "\u62C9\u5F13\u8FDF\u7F13", BOW, [m("attackSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-099"),
  N("xn100", "\u7BAD\u77E2\u504F\u659C", BOW, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-100"),
  N("xn101", "\u7BAD\u7FBD\u7834\u635F", BOW, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-101"),
  N("xn102", "\u5F26\u9707", BOW, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-102"),
  N("xn103", "\u529B\u91CF\u6CC4\u9732", BOW, [m("chargedBonusPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-103"),
  N("xn104", "\u8FD1\u8DDD\u5931\u51C6", BOW, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-104"),
  N("xn105", "\u8FDC\u8DDD\u8870\u51CF", BOW, [m("snipePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-105"),
  N("xn106", "\u88C5\u7BAD\u8FDF\u6EDE", BOW, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-106"),
  N("xn107", "\u5F13\u5F26\u78E8\u635F", BOW, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-107"),
  N("xn108", "\u98CE\u504F", BOW, [m("varianceReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-108"),
  N("xn109", "\u8FC7\u62C9\u53CD\u4F24", BOW, [m("vengeancePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-109"),
  N("xn110", "\u7BAD\u888B\u6C89\u91CD", BOW, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-110"),
  N("xn111", "\u8FDE\u5C04\u5931\u7A33", BOW, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-111"),
  N("xn112", "\u6F6E\u6E7F\u5F13\u5F26", BOW, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-112"),
  N("xn113", "\u88C5\u586B\u5361\u987F", CROSSBOW, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-113"),
  N("xn114", "\u673A\u7C27\u78E8\u635F", CROSSBOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-114"),
  N("xn115", "\u5F29\u673A\u8FC7\u91CD", CROSSBOW, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-115"),
  N("xn116", "\u4E0A\u5F26\u7F13\u6162", CROSSBOW, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-116"),
  N("xn117", "\u5F29\u77E2\u504F\u659C", CROSSBOW, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-117"),
  N("xn118", "\u8FDE\u53D1\u6563\u5C04", CROSSBOW, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-118"),
  N("xn119", "\u7206\u70B8\u56DE\u9707", CROSSBOW, [m("explosivePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-119"),
  N("xn120", "\u88C5\u586B\u5931\u8BEF", CROSSBOW, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-120"),
  N("xn121", "\u673A\u62EC\u5361\u6B7B", CROSSBOW, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-121"),
  N("xn122", "\u8FDC\u5C04\u5931\u51C6", CROSSBOW, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-122"),
  N("xn123", "\u8FD1\u6218\u7B28\u91CD", CROSSBOW, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-123"),
  N("xn124", "\u5F29\u5F26\u8106\u88C2", CROSSBOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-124"),
  N("xn125", "\u8FC7\u8F7D\u88C5\u586B", CROSSBOW, [m("multishotPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-125"),
  N("xn126", "\u5F29\u77E2\u6D6A\u8D39", CROSSBOW, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-126"),
  N("xn127", "\u88C5\u586B\u566A\u58F0", CROSSBOW, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-127"),
  N("xn128", "\u4F4E\u6E29\u5361\u673A", CROSSBOW, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-128"),
  N("xn129", "\u6295\u63B7\u8FDF\u6EDE", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-129"),
  N("xn130", "\u56DE\u6D41\u5931\u7075", TRIDENT, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-130"),
  N("xn131", "\u53C9\u5C16\u949D\u5316", TRIDENT, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-131"),
  N("xn132", "\u6C34\u5916\u5931\u8861", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-132"),
  N("xn133", "\u6C34\u4E2D\u504F\u822A", TRIDENT, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-133"),
  N("xn134", "\u96F7\u96E8\u5931\u63A7", TRIDENT, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-134"),
  N("xn135", "\u6F6E\u6C50\u9006\u6D41", TRIDENT, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-135"),
  N("xn136", "\u56DE\u624B\u9707\u8361", TRIDENT, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-136"),
  N("xn137", "\u6DF1\u6C34\u62D6\u62FD", TRIDENT, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-137"),
  N("xn138", "\u4E09\u53C9\u5203\u7F3A", TRIDENT, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-138"),
  N("xn139", "\u56DE\u6D41\u5EF6\u8BEF", TRIDENT, [m("cooldownReducePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-139"),
  N("xn140", "\u6295\u63B7\u8017\u529B", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-140"),
  N("xn141", "\u6F6E\u6E7F\u8150\u8680", TRIDENT, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-141"),
  N("xn142", "\u8FDC\u7A0B\u8870\u51CF", TRIDENT, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-142"),
  N("xn143", "\u8FD1\u6218\u53CD\u9707", TRIDENT, [m("thornsPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-143"),
  N("xn144", "\u6D77\u6D41\u8FF7\u5411", TRIDENT, [m("waterBreathing", F(1))], 80, "rare", 0.12, [], void 0, "N-144"),
  N("xn145", "\u683C\u6321\u8FDF\u6EDE", SHIELD, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-145"),
  N("xn146", "\u76FE\u9762\u88C2\u7EB9", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-146"),
  N("xn147", "\u76FE\u91CD", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-147"),
  N("xn148", "\u89C6\u91CE\u906E\u6321", SHIELD, [m("visionPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-148"),
  N("xn150", "\u683C\u6321\u8FC7\u8017", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-150"),
  N("xn151", "\u76FE\u7F18\u53D8\u5F62", SHIELD, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-151"),
  N("xn152", "\u76FE\u724C\u6253\u6ED1", SHIELD, [m("iceSlip", F(1))], 80, "fine", 0.12, [], void 0, "N-152"),
  N("xn153", "\u80CC\u540E\u66B4\u9732", SHIELD, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-153"),
  N("xn154", "\u5B8C\u7F8E\u683C\u6321\u7A97\u53E3\u7A84", SHIELD, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-154"),
  N("xn155", "\u76FE\u51FB\u5931\u8861", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-155"),
  N("xn156", "\u683C\u6321\u540E\u786C\u76F4", SHIELD, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-156"),
  N("xn157", "\u5143\u7D20\u8106\u76FE", SHIELD, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-157"),
  N("xn158", "\u62A4\u81C2\u52D2\u7D27", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-158"),
  N("xn159", "\u8FDC\u7A0B\u51B2\u51FB", SHIELD, [m("knockbackPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-159"),
  N("xn160", "\u683C\u6321\u6D88\u8017", SHIELD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-160"),
  N("xn161", "\u95F7\u70ED", HEAD, [m("regenPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-161"),
  N("xn162", "\u660F\u6C89", HEAD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-162"),
  N("xn163", "\u7F3A\u6C27", HEAD, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-163"),
  N("xn164", "\u611F\u5B98\u8FDF\u949D", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-164"),
  N("xn165", "\u89C6\u91CE\u72ED\u7A84", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-165"),
  N("xn166", "\u566A\u97F3", HEAD, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-166"),
  N("xn167", "\u7CBE\u795E\u75B2\u52B3", HEAD, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-167"),
  N("xn168", "\u96F7\u9E23\u8033\u9E23", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-168"),
  N("xn169", "\u7070\u5C18\u906E\u76EE", HEAD, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-169"),
  N("xn170", "\u591C\u76F2", HEAD, [m("nightVision", F(1))], 80, "fine", 0.12, [], void 0, "N-170"),
  N("xn171", "\u6C34\u6C7D\u51DD\u7ED3", HEAD, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-171"),
  N("xn172", "\u5934\u90E8\u8106\u5F31", HEAD, [m("defensePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-172"),
  N("xn173", "\u7729\u6655", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-173"),
  N("xn174", "\u5492\u6587\u5E72\u6270", HEAD, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-174"),
  N("xn175", "\u4F4E\u5934\u8D1F\u91CD", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-175"),
  N("xn176", "\u751F\u7269\u8BC6\u522B\u5931\u7075", HEAD, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-176"),
  N("xn177", "\u6C89\u7532", CHEST, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-177"),
  N("xn178", "\u8106\u7532", CHEST, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-178"),
  N("xn179", "\u8FC7\u70ED", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-179"),
  N("xn180", "\u547C\u5438\u538B\u8FEB", CHEST, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-180"),
  N("xn181", "\u8131\u6218\u6062\u590D\u964D\u4F4E", CHEST, [m("regenPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-181"),
  N("xn182", "\u53CD\u4F24\u8106\u5F31", CHEST, [m("vengeancePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-182"),
  N("xn183", "\u5143\u7D20\u5BFC\u70ED", CHEST, [m("fireChance", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-183"),
  N("xn184", "\u814B\u4E0B\u675F\u7F1A", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-184"),
  N("xn185", "\u9707\u51FB\u4F20\u5BFC", CHEST, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-185"),
  N("xn186", "\u7532\u7247\u7F3A\u53E3", CHEST, [m("defensePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-186"),
  N("xn187", "\u7532\u7247\u677E\u52A8", CHEST, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-187"),
  N("xn188", "\u62A4\u76FE\u8FDF\u6EDE", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-188"),
  N("xn189", "\u6CBB\u7597\u53D7\u963B", CHEST, [m("lifesteal", L(-2, -1.2))], 80, "fine", 0.12, [], void 0, "N-189"),
  N("xn190", "\u80CC\u90E8\u66B4\u9732", CHEST, [m("defensePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-190"),
  N("xn191", "\u627F\u91CD\u8D85\u9650", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-191"),
  N("xn192", "\u8010\u4E45\u9F9F\u88C2", CHEST, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-192"),
  N("xn193", "\u50F5\u786C", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-193"),
  N("xn194", "\u819D\u90E8\u675F\u7F1A", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-194"),
  N("xn195", "\u75B2\u60EB", LEGS, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-195"),
  N("xn196", "\u6ED1\u6B65", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-196"),
  N("xn197", "\u91CD\u5FC3\u4E0B\u5760", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-197"),
  N("xn198", "\u51B2\u523A\u62D6\u5EF6", LEGS, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-198"),
  N("xn199", "\u8DD1\u52A8\u8017\u98DF", LEGS, [m("maxHealthPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-199"),
  N("xn200", "\u8FD1\u6218\u6B65\u5E45", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-200"),
  N("xn201", "\u811A\u8E1D\u4E0D\u7A33", LEGS, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-201"),
  N("xn202", "\u6F5C\u884C\u566A\u58F0", LEGS, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-202"),
  N("xn203", "\u5760\u843D\u540E\u786C\u76F4", LEGS, [m("attackSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-203"),
  N("xn204", "\u73AF\u5883\u9002\u5E94\u5DEE", LEGS, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-204"),
  N("xn205", "\u6DF1\u6C34\u675F\u817F", LEGS, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-205"),
  N("xn206", "\u659C\u5761\u5931\u8861", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-206"),
  N("xn207", "\u78E8\u635F\u52A0\u5267", LEGS, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-207"),
  N("xn208", "\u9003\u8131\u8FDF\u7F13", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-208"),
  N("xn209", "\u7B28\u91CD", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-209"),
  N("xn210", "\u8106\u5E95", FEET, [m("fallDamagePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-210"),
  N("xn211", "\u5438\u6C34", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-211"),
  N("xn212", "\u6C89\u5E95", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-212"),
  N("xn213", "\u6253\u6ED1", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-213"),
  N("xn214", "\u9AD8\u8DDF\u4E0D\u7A33", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-214"),
  N("xn215", "\u978B\u5E95\u78E8\u635F", FEET, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-215"),
  N("xn216", "\u7802\u783E\u5361\u7F1D", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-216"),
  N("xn217", "\u7194\u5CA9\u5BFC\u70ED", FEET, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-217"),
  N("xn218", "\u51B0\u9762\u5931\u63A7", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-218"),
  N("xn219", "\u843D\u5730\u9707\u811A", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-219"),
  N("xn220", "\u6CE5\u6CBC\u9ECF\u6EDE", FEET, [m("soulPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-220"),
  N("xn222", "\u8DD1\u6B65\u8017\u8010", FEET, [m("maxHealthPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-222"),
  N("xn223", "\u8DC3\u8D77\u8FDF\u6EDE", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-223"),
  N("xn224", "\u8DCC\u843D\u6613\u4F24", FEET, [m("fallDamagePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-224"),
  N("xn225", "\u91CD\u9524\u949D\u9762", MACE, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-225"),
  N("xn226", "\u84C4\u52BF\u8FDF\u6EDE", MACE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-226"),
  N("xn227", "\u5760\u51FB\u5931\u51C6", MACE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-227"),
  N("xn228", "\u843D\u5730\u9707\u8361", MACE, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-228"),
  N("xn229", "\u91CD\u5FC3\u8FC7\u9AD8", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-229"),
  N("xn230", "\u51B2\u51FB\u56DE\u9707", MACE, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-230"),
  N("xn231", "\u9524\u67C4\u88C2\u7EB9", MACE, [m("attackPct", L(-10, -6))], 80, "fine", 0.12, [], void 0, "N-231"),
  N("xn232", "\u84C4\u529B\u5916\u6CC4", MACE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-232"),
  N("xn233", "\u76D4\u7532\u9707\u8361", MACE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-233"),
  N("xn234", "\u5730\u9762\u53CD\u51B2", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-234"),
  N("xn235", "\u91CD\u51FB\u8017\u8010", MACE, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-235"),
  N("xn236", "\u7A7A\u6325\u5931\u8861", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-236"),
  N("xn237", "\u51B2\u950B\u4F9D\u8D56", MACE, [m("attackPct", L(-10, -6))], 80, "fine", 0.12, [], void 0, "N-237"),
  N("xn238", "\u9524\u9762\u5D29\u88C2", MACE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-238"),
  N("xn239", "\u8FDF\u6EDE\u56DE\u5F39", MACE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-239"),
  N("xn240", "\u91CD\u9524\u566A\u58F0", MACE, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-240"),
  N("xn241", "\u77DB\u5C16\u5377\u5203", SPEAR, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-241"),
  N("xn242", "\u51B2\u950B\u8DDD\u79BB\u4E0D\u8DB3", SPEAR, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-242"),
  N("xn243", "\u51B2\u950B\u8FC7\u8F7D", SPEAR, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-243"),
  N("xn244", "\u67AA\u6746\u504F\u659C", SPEAR, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-244"),
  N("xn245", "\u8FC7\u8FD1\u5931\u6548", SPEAR, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-245"),
  N("xn246", "\u8FDC\u8DDD\u96BE\u63A7", SPEAR, [m("snipePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-246"),
  N("xn247", "\u6301\u77DB\u7B28\u91CD", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-247"),
  N("xn248", "\u7A81\u523A\u56DE\u9707", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-248"),
  N("xn249", "\u51B2\u950B\u8017\u8010", SPEAR, [m("maxHealthPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-249"),
  N("xn250", "\u77DB\u6746\u8106\u88C2", SPEAR, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-250"),
  N("xn251", "\u8F6C\u5411\u8FDF\u6EDE", SPEAR, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-251"),
  N("xn252", "\u9A91\u4E58\u4E0D\u7A33", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-252"),
  N("xn253", "\u523A\u51FB\u7A7A\u95E8", SPEAR, [m("defensePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-253"),
  N("xn254", "\u7A7F\u523A\u8FC7\u6DF1", SPEAR, [m("piercePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-254"),
  N("xn255", "\u67AA\u5C3E\u62D6\u5730", SPEAR, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-255"),
  N("xn256", "\u6218\u9A6C\u4E0D\u534F", SPEAR, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-256"),
  N("xn257", "\u7EBF\u8F74\u5361\u6DA9", FISHING, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-257"),
  N("xn258", "\u9C7C\u7EBF\u6613\u65AD", FISHING, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-258"),
  N("xn259", "\u6D6E\u6F02\u5931\u7075", FISHING, [m("fishingLuckPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-259"),
  N("xn260", "\u8BF1\u9975\u6563\u5931", FISHING, [m("cooldownReducePct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-260"),
  N("xn261", "\u6536\u7EBF\u8FDF\u7F13", FISHING, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-261"),
  N("xn262", "\u9C7C\u7EBF\u7F20\u7ED5", FISHING, [m("rootChance", L(-5, -3))], 80, "rare", 0.12, [], void 0, "N-262"),
  N("xn263", "\u8FDC\u6295\u4E0D\u8DB3", FISHING, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-263"),
  N("xn264", "\u6C34\u57DF\u8BEF\u5224", FISHING, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-264"),
  N("xn265", "\u9C7C\u94A9\u949D\u5316", FISHING, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-265"),
  N("xn266", "\u66B4\u529B\u6536\u7EBF", FISHING, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-266"),
  N("xn267", "\u6F6E\u6E7F\u7EBF\u8F74", FISHING, [m("waterBreathing", F(1))], 80, "rare", 0.12, [], void 0, "N-267"),
  N("xn268", "\u6218\u5229\u54C1\u504F\u6D41", FISHING, [m("treasurePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-268"),
  N("xn269", "\u7A7A\u7AFF\u75B2\u52B3", FISHING, [m("fishingLuckPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-269"),
  N("xn270", "\u9C7C\u94A9\u5012\u523A", FISHING, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-270"),
  N("xn271", "\u6536\u7EBF\u566A\u58F0", FISHING, [m("reelSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-271"),
  N("xn272", "\u9C7C\u7EBF\u78E8\u635F", FISHING, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-272"),
  N("xn273", "\u949D\u5203\u526A", SHEARS, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-273"),
  N("xn274", "\u5203\u53E3\u7F3A\u53E3", SHEARS, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-274"),
  N("xn275", "\u6BDB\u6599\u6D6A\u8D39", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-275"),
  N("xn276", "\u53F6\u7247\u7834\u635F", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-276"),
  N("xn277", "\u7EBF\u7ED3\u5361\u5203", SHEARS, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-277"),
  N("xn278", "\u526A\u67C4\u677E\u52A8", SHEARS, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-278"),
  N("xn279", "\u7EA4\u7EF4\u7F20\u7ED5", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-279"),
  N("xn280", "\u7CBE\u7EC6\u5EA6\u4E0D\u8DB3", SHEARS, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-280"),
  N("xn281", "\u8FC7\u526A", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-281"),
  N("xn282", "\u7ED2\u6BDB\u906E\u76EE", SHEARS, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-282"),
  N("xn283", "\u9AD8\u679D\u96BE\u526A", SHEARS, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-283"),
  N("xn284", "\u9508\u8680\u5173\u8282", SHEARS, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-284"),
  N("xn285", "\u526A\u5203\u504F\u659C", SHEARS, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-285"),
  N("xn286", "\u7EA4\u7EF4\u6D6A\u8D39", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-286"),
  N("xn287", "\u6298\u67C4\u98CE\u9669", SHEARS, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-287"),
  N("xn288", "\u6742\u8349\u963B\u6EDE", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-288"),
  N("xn289", "\u5237\u6BDB\u78E8\u635F", BRUSH, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-289"),
  N("xn290", "\u5237\u67C4\u677E\u52A8", BRUSH, [m("brushLuckPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-290"),
  N("xn291", "\u529B\u5EA6\u5931\u63A7", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-291"),
  N("xn292", "\u6C99\u5C18\u6270\u773C", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-292"),
  N("xn293", "\u5237\u6BDB\u8131\u843D", BRUSH, [m("treasurePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-293"),
  N("xn294", "\u8003\u53E4\u8BEF\u89E6", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-294"),
  N("xn295", "\u624B\u8155\u75B2\u52B3", BRUSH, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-295"),
  N("xn296", "\u9057\u7269\u522E\u635F", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-296"),
  N("xn297", "\u5237\u9762\u4E0D\u5E73", BRUSH, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-297"),
  N("xn298", "\u7070\u5C18\u79EF\u7D2F", BRUSH, [m("brushLuckPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-298"),
  N("xn299", "\u8106\u5F31\u9057\u7269", BRUSH, [m("defensePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-299"),
  N("xn300", "\u5C18\u5C01\u6C14\u606F", BRUSH, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-300"),
  N("xn301", "\u67C4\u7AEF\u5F00\u88C2", BRUSH, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-301"),
  N("xn302", "\u8FC7\u5EA6\u6E05\u7406", BRUSH, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-302"),
  N("xn303", "\u6C89\u79EF\u5835\u585E", BRUSH, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-303"),
  N("xn304", "\u9057\u7269\u504F\u8BC6", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-304"),
  N("xn305", "\u706B\u77F3\u949D\u5316", FLINT, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-305"),
  N("xn306", "\u706B\u82B1\u504F\u659C", FLINT, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-306"),
  N("xn307", "\u706B\u7ED2\u6F6E\u6E7F", FLINT, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-307"),
  N("xn308", "\u706B\u79CD\u4E0D\u8DB3", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-308"),
  N("xn309", "\u8FC7\u70ED\u63E1\u67C4", FLINT, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-309"),
  N("xn310", "\u8010\u4E45\u8106\u5F31", FLINT, [m("defensePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-310"),
  N("xn311", "\u5931\u63A7\u706B\u661F", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-311"),
  N("xn312", "\u5F15\u706B\u8FDF\u7F13", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-312"),
  N("xn313", "\u706B\u7130\u53CD\u566C", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-313"),
  N("xn314", "\u71C3\u6599\u9519\u914D", FLINT, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-314"),
  N("xn315", "\u706B\u79CD\u6D6A\u8D39", FLINT, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-315"),
  N("xn316", "\u706B\u661F\u66B4\u9732", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-316"),
  N("xn317", "\u70B9\u706B\u8FC7\u8F7D", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-317"),
  N("xn318", "\u6E7F\u5730\u7184\u706B", FLINT, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-318"),
  N("xn319", "\u706B\u77F3\u5F00\u88C2", FLINT, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-319"),
  N("xn320", "\u707C\u624B", FLINT, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-320"),
  N("xn321", "\u7FFC\u819C\u7834\u635F", ELYTRA, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-321"),
  N("xn322", "\u8D77\u98DE\u8FDF\u6EDE", ELYTRA, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-322"),
  N("xn323", "\u6C14\u6D41\u5931\u8861", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-323"),
  N("xn324", "\u4FEF\u51B2\u8FC7\u6DF1", ELYTRA, [m("fallDamagePct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-324"),
  N("xn325", "\u5347\u529B\u4E0D\u8DB3", ELYTRA, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-325"),
  N("xn326", "\u6298\u7FFC\u98CE\u9669", ELYTRA, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-326"),
  N("xn327", "\u98CE\u963B\u8FC7\u5927", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-327"),
  N("xn328", "\u7FFC\u5C16\u88C2\u75D5", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-328"),
  N("xn329", "\u8F6C\u5411\u8FDF\u7F13", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-329"),
  N("xn330", "\u8D77\u964D\u9707\u8361", ELYTRA, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-330"),
  N("xn331", "\u8D1F\u91CD\u8FC7\u5927", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-331"),
  N("xn332", "\u70ED\u6D41\u4E0D\u9002", ELYTRA, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-332"),
  N("xn333", "\u51B7\u98CE\u4FB5\u88AD", ELYTRA, [m("attackPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-333"),
  N("xn334", "\u7FFC\u819C\u6F0F\u98CE", ELYTRA, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-334"),
  N("xn335", "\u6C14\u6D41\u566A\u58F0", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-335"),
  N("xn336", "\u7D27\u6025\u6298\u8FD4\u5931\u8D25", ELYTRA, [m("dodgeChance", L(-4, -2.5))], 80, "rare", 0.12, [], void 0, "N-336"),
  /* ==== 马铠 / 骑乘道具负面 ==== */
  N("horse_heavy_barding", "\u91CD\u88C5\u9A6C\u94E0", HORSE, [m("moveSpeedPct", L(-10, -7))], 90, "fine"),
  N("horse_rub", "\u78E8\u4F24", HORSE, [m("durabilityMult", L(18, 12))], 90, "fine"),
  N("horse_loose", "\u978D\u5E26\u677E\u5F1B", HORSE, [m("defensePct", L(-8, -5))], 80, "fine"),
  N("horse_spook", "\u6613\u60CA", HORSE, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("horse_stiff", "\u50F5\u80CC", HORSE, [m("jumpPct", L(-10, -7))], 80, "fine"),
  N("steer_snag", "\u7F30\u7EF3\u5361\u6DA9", STEERING, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("steer_fray", "\u7F30\u7EF3\u78E8\u635F", STEERING, [m("durabilityMult", L(20, 15))], 90, "fine"),
  N("steer_drag", "\u62D6\u62FD", STEERING, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("steer_slip", "\u8131\u624B", STEERING, [m("accuracyPct", L(-8, -5))], 80, "fine"),
  N("steer_tangle", "\u7F20\u7ED3", STEERING, [m("cooldownReducePct", L(-7, -5))], 80, "fine")
];
var DUAL = [
  D("mad_war", "\u72C2\u6218", MELEE, [m("attackPct", L(25, 17.5)), m("berserkPct", L(30, 24)), m("defensePct", L(-12, -10.75))], 60, "epic"),
  D("glass_cannon", "\u73BB\u7483\u5927\u70AE", MELEE, [m("attackPct", L(40, 37.5)), m("critChance", L(8, 7)), m("damageTakenPct", L(20, 18.75))], 40, "legendary"),
  D("titan", "\u5DE8\u795E", ARMOR, [m("maxHealthPct", L(20, 18.75)), m("defensePct", L(12, 10.75)), m("moveSpeedPct", L(-8, -7.5)), m("jumpPct", L(-10, -8.75))], 40, "legendary"),
  D("gale_cost", "\u75BE\u98CE\u4EE3\u4EF7", MELEE, [m("attackSpeedPct", L(20, 15)), m("durabilityMult", L(20, 18.75))], 60, "epic"),
  D("greed", "\u8D2A\u5A6A", MELEE_TOOLS, [m("extraDropPct", L(10, 10)), m("luckBreakChance", L(5, 4.75))], 60, "epic"),
  D("soul_reap", "\u730E\u9B42", MELEE, [m("killStackPct", L(6, 5)), m("idleDecayPct", L(6, 6))], 50, "epic"),
  D("blood_sacrifice", "\u8840\u796D", MELEE, [m("lifesteal", L(10, 8)), m("maxHealthPct", L(-12, -10.75))], 50, "epic"),
  D("flame_heart", "\u70C8\u706B\u4E4B\u5FC3", MELEE, [m("fireChance", L(20, 15)), m("fireVulnPct", L(15, 13.75))], 50, "epic"),
  D("eternal_frost_dual", "\u6C38\u971C", MELEE, [m("freezeChance", L(6, 5)), m("fireVulnPct", L(12, 12))], 50, "epic"),
  D("thunder_dual", "\u96F7\u66B4", MELEE, [m("lightningChance", L(8, 6)), m("skillDurabilityCost", L(3, 2.75))], 50, "epic"),
  D("heavy_hammer", "\u91CD\u9524", MELEE, [m("attackPct", L(30, 22)), m("attackSpeedPct", L(-10, -8.75))], 60, "epic"),
  D("light_blade", "\u8F7B\u5203", MELEE, [m("attackSpeedPct", L(25, 18.75)), m("attackPct", L(-10, -8.75))], 60, "epic"),
  D("gambler", "\u8D4C\u5F92", MELEE, [m("gambleCrit", L(15, 12)), m("gambleLossPct", L(10, 8.75))], 50, "epic"),
  D("death_match", "\u6B7B\u6597", MELEE, [m("berserkPct", L(35, 26)), m("naturalRegenPct", L(-40, -25))], 50, "epic"),
  D("unyielding_dual", "\u4E0D\u5C48", ARMOR, [m("lastStandChance", L(12, 9)), m("healingReducePct", L(15, 13.75))], 50, "epic")
];
var SPECIAL = [
  SP("world_tree", "\u4E16\u754C\u6811", ALL, [m("specialWorldTree", F(1)), m("regenFlat", L(0.5, 0.5))], 30, "legendary", 0.2, [], "legendary"),
  SP("heavenly_thunder", "\u5929\u96F7", MELEE, [m("specialHeavenlyThunder", F(1)), m("lightningChance", L(15, 10))], 25, "legendary", 0.2, [], "legendary"),
  SP("blood_moon", "\u8840\u6708", MELEE, [m("specialBloodMoon", F(1)), m("nightPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("sun_glory_special", "\u65E5\u8000", MELEE, [m("specialSunGlory", F(1)), m("dayPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("abyss_special", "\u6DF1\u6E0A", MELEE, [m("specialAbyss", F(1)), m("netherPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("sea_god_special", "\u6D77\u795E", TR.concat(SD), [m("specialSeaGod", F(1)), m("waterPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("spacetime", "\u65F6\u7A7A", ARMOR, [m("specialSpacetime", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("immortal_special", "\u4E0D\u706D", ALL, [m("uniqueImmortal", F(1))], 20, "mythic", 0.2, [], "legendary"),
  SP("soulbound_special", "\u7075\u9B42\u7ED1\u5B9A", ALL, [m("uniqueSoulbound", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("soul_harvest", "\u7075\u9B42\u6C72\u53D6", MELEE, [m("killStackPct", L(10, 8)), m("killHeal", L(2, 1.5))], 25, "legendary", 0.2, [], "legendary"),
  SP("void_walker", "\u865A\u7A7A\u884C\u8005", ARMOR, [m("specialVoidWalker", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("destiny", "\u5929\u547D", ALL, [m("specialDestiny", F(1))], 20, "mythic", 0.2, [], "ancient"),
  SP("miracle", "\u5947\u8FF9", ALL, [m("specialMiracle", F(1))], 15, "mythic", 0.25, [], "ancient"),
  SP("reversal", "\u53CD\u8F6C", ARMOR, [m("specialReversal", F(1))], 20, "mythic", 0.2, [], "ancient"),
  SP("endless", "\u65E0\u5C3D", MELEE, [m("specialEndless", F(1))], 15, "mythic", 0.25, [], "ancient")
];
var CURSE = [
  CU(
    "curse_blood_thirst",
    "\u55DC\u8840\u8BC5\u5492",
    MELEE,
    [m("curseBloodThirst", F(1)), m("comboAtkSpeed", L(10, 8)), m("curseDamagePerMin", L(1, 1))],
    40,
    "epic",
    0.2,
    [],
    "epic",
    "\u653B\u51FB\u8D8A\u591A\u8D8A\u5F3A\uFF0C\u4F46\u957F\u65F6\u95F4\u4E0D\u653B\u51FB\u4F1A\u6301\u7EED\u635F\u5931\u751F\u547D"
  ),
  CU(
    "curse_greed",
    "\u8D2A\u5A6A\u8BC5\u5492",
    MELEE_TOOLS,
    [m("extraDropPct", L(20, 15)), m("deathPenaltyPct", L(15, 10))],
    40,
    "epic",
    0.2,
    [],
    "epic",
    "\u6389\u843D\u663E\u8457\u589E\u52A0\uFF0C\u4F46\u6B7B\u4EA1\u65F6\u6709\u989D\u5916\u60E9\u7F5A"
  ),
  CU(
    "curse_binding",
    "\u675F\u7F1A\u8BC5\u5492",
    ARMOR,
    [m("bindingCurse", F(1)), m("defensePct", L(15, 12))],
    35,
    "epic",
    0.2,
    [],
    "epic",
    "\u9632\u5FA1\u63D0\u5347\uFF0C\u4F46\u88C5\u5907\u65E0\u6CD5\u8F7B\u6613\u8131\u4E0B"
  ),
  CU(
    "curse_frail",
    "\u6613\u4EA1\u8BC5\u5492",
    MELEE,
    [m("attackPct", L(60, 45)), m("maxHealthNegPct", L(30, 20))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "\u653B\u51FB\u80FD\u529B\u6781\u9AD8\uFF0C\u4F46\u751F\u547D\u4E0A\u9650\u6781\u4F4E"
  ),
  CU(
    "curse_fury",
    "\u72C2\u6012\u8BC5\u5492",
    MELEE,
    [m("curseFury", F(1)), m("attackPct", L(25, 20)), m("aggroPct", L(30, 25))],
    35,
    "epic",
    0.2,
    [],
    "epic",
    "\u81EA\u52A8\u8FDB\u5165\u6218\u6597\u72B6\u6001\uFF0C\u4F46\u602A\u7269\u66F4\u5BB9\u6613\u53D1\u73B0\u4F60"
  ),
  CU(
    "curse_eternal_night",
    "\u6C38\u591C\u8BC5\u5492",
    MELEE,
    [m("uniqueEternalNight", F(1)), m("dayPct", L(-30, -20))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "\u591C\u665A\u6781\u5F3A\uFF0C\u4F46\u767D\u5929\u53D7\u5230\u4E25\u91CD\u524A\u5F31"
  ),
  CU(
    "curse_abyss",
    "\u6DF1\u6E0A\u8BC5\u5492",
    MELEE,
    [m("uniqueAbyssHeart", F(1)), m("netherPct", L(-20, -15))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "\u4E0B\u754C\u6781\u5F3A\uFF0C\u4F46\u4E3B\u4E16\u754C\u80FD\u529B\u4E0B\u964D"
  )
];
var UNIQUE = [
  U("unique_time", "\u65F6\u95F4", MELEE, [m("uniqueTime", F(1))], 1, "legendary", 0.2, [], void 0, "\u653B\u51FB\u540E\u77ED\u6682\u51CF\u7F13\u76EE\u6807\u52A8\u4F5C"),
  U("unique_space", "\u7A7A\u95F4", ARMOR, [m("uniqueSpace", F(1))], 1, "legendary", 0.2, [], void 0, "\u53D7\u5230\u81F4\u547D\u653B\u51FB\u65F6\u6982\u7387\u77ED\u8DDD\u79BB\u4F4D\u79FB"),
  U("unique_gluttony", "\u8D2A\u98DF", MELEE, [m("uniqueGluttony", F(1))], 1, "legendary", 0.2, [], void 0, "\u51FB\u6740\u6062\u590D\u751F\u547D\uFF0C\u4F46\u98DF\u7269\u6D88\u8017\u5927\u5E45\u589E\u52A0"),
  U("unique_eternal_night", "\u6C38\u591C", MELEE, [m("uniqueEternalNight", F(1))], 1, "mythic", 0.2, [], void 0, "\u591C\u665A\u529B\u91CF\u6781\u5F3A\uFF0C\u767D\u5929\u4E25\u91CD\u524A\u5F31"),
  U("unique_sun_heart", "\u592A\u9633\u4E4B\u5FC3", MELEE, [m("uniqueSunHeart", F(1))], 1, "mythic", 0.2, [], void 0, "\u767D\u5929\u6781\u5F3A\uFF0C\u591C\u665A\u80FD\u529B\u4E0B\u964D"),
  U("unique_abyss_heart", "\u6DF1\u6E0A\u4E4B\u5FC3", MELEE, [m("uniqueAbyssHeart", F(1))], 1, "mythic", 0.2, [], void 0, "\u4E0B\u754C\u6781\u5F3A\uFF0C\u4E3B\u4E16\u754C\u80FD\u529B\u4E0B\u964D")
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
  common: "\u666E\u901A",
  fine: "\u7CBE\u826F",
  rare: "\u7A00\u6709",
  epic: "\u53F2\u8BD7",
  legendary: "\u4F20\u5947",
  mythic: "\u795E\u8BDD"
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
  if (def.kind === "negative") return "\u8D1F\u9762\u6C60";
  if (def.kind === "dual") return "\u53CC\u5203\u6C60";
  if (def.kind === "curse") return "\u8BC5\u5492\u6C60";
  if (def.kind === "unique") return "\u8FDC\u53E4/\u552F\u4E00\u6C60";
  if (def.kind === "special") return "\u4F20\u5947/\u795E\u8BDD\u6C60";
  const g = def.groups;
  const stat = def.mods[0]?.stat ?? "";
  const ranged = g.every((x) => x === "bow" || x === "crossbow" || x === "trident");
  if (ranged) return "\u8FDC\u7A0B\u6C60";
  const toolOnly = g.every((x) => x === "pickaxe" || x === "axe" || x === "shovel" || x === "hoe");
  if (toolOnly) return "\u5DE5\u5177\u6C60";
  const armorOnly = g.every((x) => x === "head" || x === "chest" || x === "legs" || x === "feet");
  if (armorOnly) return "\u62A4\u7532\u6C60";
  if (g.includes("shield") && g.length <= 2) return "\u76FE\u724C\u6C60";
  const elem = ["fire", "ice", "freeze", "lightning", "thunder", "poison", "chill", "molten", "shock", "corrode", "frost", "storm"];
  if (elem.some((k) => stat.includes(k))) return "\u5143\u7D20\u6C60";
  if (stat.includes("crit") || stat.includes("lucky")) return "\u66B4\u51FB\u6C60";
  if (stat.includes("attackSpeed") || stat.includes("comboAtkSpeed") || stat.includes("burstSpeed")) return "\u653B\u901F\u6C60";
  if (stat.includes("lifesteal") || stat.includes("killHeal") || stat.includes("Health") || stat.includes("regen") || stat.includes("blood")) return "\u751F\u547D\u6C60";
  if (stat.includes("defense") || stat.includes("Reduce") || stat.includes("shield") || stat.includes("dodge") || stat.includes("thorns") || stat.includes("resist")) return "\u9632\u5FA1\u6C60";
  if (stat.includes("Speed") || stat.includes("jump") || stat.includes("fall") || stat.includes("swim") || stat.includes("water") || stat.includes("turn") || stat.includes("landing")) return "\u79FB\u52A8\u6C60";
  if (stat.includes("stun") || stat.includes("slow") || stat.includes("weaken") || stat.includes("root") || stat.includes("fear") || stat.includes("silence") || stat.includes("dispel") || stat.includes("knockback")) return "\u63A7\u5236\u6C60";
  if (stat.includes("sweep") || stat.includes("quake") || stat.includes("fissure") || stat.includes("whirlwind") || stat.includes("explode") || stat.includes("chainHit") || stat.includes("stormAoe") || stat.includes("earthSplit")) return "\u8303\u56F4\u6C60";
  if (g.length > 6) return "\u901A\u7528\u6C60";
  return "\u6B66\u5668\u6C60";
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
  { id: "sluggish", name: "\u6781\u6162", pct: -30, cooldown: round3(BASE_COOLDOWN / 0.7), color: "\xA74" },
  { id: "slow", name: "\u6162", pct: -15, cooldown: round3(BASE_COOLDOWN / 0.85), color: "\xA7c" },
  { id: "dull", name: "\u7565\u6162", pct: -7, cooldown: round3(BASE_COOLDOWN / 0.93), color: "\xA76" },
  { id: "normal", name: "\u666E\u901A", pct: 0, cooldown: BASE_COOLDOWN, color: "\xA7f" },
  { id: "quick", name: "\u7565\u5FEB", pct: 8, cooldown: round3(BASE_COOLDOWN / 1.08), color: "\xA7a" },
  { id: "fast", name: "\u5FEB\u901F", pct: 18, cooldown: round3(BASE_COOLDOWN / 1.18), color: "\xA7b" },
  { id: "swift", name: "\u6781\u5FEB", pct: 35, cooldown: round3(BASE_COOLDOWN / 1.35), color: "\xA7d" }
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
    name: "\u52A3\u8D28",
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
    name: "\u7834\u635F",
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
    name: "\u666E\u901A",
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
    name: "\u4F18\u79C0",
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
    name: "\u7A00\u6709",
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
    name: "\u53F2\u8BD7",
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
    name: "\u4F20\u5947",
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
    name: "\u795E\u8BDD",
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
    name: "\u8FDC\u53E4",
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
    name: "\u552F\u4E00",
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
    name: "\u6218\u795E\u5171\u9E23",
    kind: "armor",
    desc: "\u8FD1\u6218\u4F24\u5BB3 +12%",
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
    name: "\u730E\u624B\u5171\u9E23",
    kind: "armor",
    desc: "\u8FDC\u7A0B\u4F24\u5BB3 +12%\u3001\u79FB\u52A8\u901F\u5EA6 +8%",
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
    name: "\u72C2\u6218\u5171\u9E23",
    kind: "armor",
    desc: "\u4F4E\u8840\u72B6\u6001\u83B7\u5F97\u5DE8\u5927\u5F3A\u5316\uFF08\u72C2\u66B4 +20%\u3001\u5438\u8840 +5%\uFF09",
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
    name: "\u5B88\u62A4\u5171\u9E23",
    kind: "armor",
    desc: "\u989D\u5916 6% \u5168\u5C40\u51CF\u4F24",
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
    name: "\u8346\u68D8\u5171\u9E23",
    kind: "armor",
    desc: "\u53D7\u5230\u8FD1\u6218\u653B\u51FB\u65F6\u6301\u7EED\u53CD\u4F24\uFF08\u8346\u68D8 +15%\uFF09",
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
    name: "\u98CE\u884C\u5171\u9E23",
    kind: "armor",
    desc: "\u79FB\u52A8\u901F\u5EA6 +12%\u3001\u51B2\u523A\u901F\u5EA6 +10%",
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
    name: "\u77FF\u5DE5\u5171\u9E23",
    kind: "tool",
    desc: "\u83B7\u5F97\u77FF\u5DE5\u7279\u6B8A\u6548\u679C\uFF08\u6316\u6398\u901F\u5EA6 +20%\u3001\u77FF\u7269\u6389\u843D +15%\uFF09",
    tool: { groups: ["pickaxe"], affixes: ["swift_dig", "ore_vein", "lucky_miner", "fortune", "chain_mine", "treasure"], need: 3 },
    effects: { miningSpeedPct: 20, oreDropPct: 15 }
  },
  {
    id: "harvest_res",
    name: "\u4E30\u6536\u5171\u9E23",
    kind: "tool",
    desc: "\u5927\u5E45\u63D0\u9AD8\u519C\u4E1A\u4EA7\u91CF\uFF08\u519C\u4F5C\u7269 +25%\u3001\u989D\u5916\u6389\u843D +15%\uFF09",
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
  perfect: "\u6781\u9AD8",
  high: "\u9AD8",
  normal: "\u666E\u901A",
  conflict: "\u51B2\u7A81"
};
var SYNERGY_PAIRS = [
  // ---------------- 极高 ----------------
  { a: "crit", b: "lethal", level: "perfect", note: "\u66B4\u51FB + \u81F4\u547D" },
  { a: "crit", b: "precise", level: "perfect", note: "\u66B4\u51FB + \u7CBE\u51C6" },
  { a: "lifesteal", b: "berserk", level: "perfect", note: "\u5438\u8840 + \u72C2\u66B4" },
  { a: "lifesteal", b: "mad_war", level: "perfect", note: "\u5438\u8840 + \u72C2\u6218" },
  { a: "swift", b: "chain_slash", level: "perfect", note: "\u8FC5\u6377 + \u8FDE\u65A9" },
  { a: "swift", b: "combo", level: "high", note: "\u8FC5\u6377 + \u8FDE\u51FB" },
  { a: "fireChance", b: "blazing", level: "perfect", note: "\u70B9\u71C3 + \u70BD\u708E" },
  { a: "scorch", b: "blazing", level: "perfect", note: "\u707C\u70ED + \u70BD\u708E" },
  { a: "chill", b: "ice_burst", level: "perfect", note: "\u51B0\u51B7 + \u51B0\u7206" },
  { a: "freeze", b: "ice_burst", level: "perfect", note: "\u51BB\u7ED3 + \u51B0\u7206" },
  { a: "thunder", b: "chain_lightning", level: "perfect", note: "\u96F7\u9E23 + \u8FDE\u9501\u95EA\u7535" },
  { a: "poison_blade", b: "poison_burst", level: "perfect", note: "\u6BD2\u5203 + \u6BD2\u7206" },
  { a: "poison_blade", b: "strong_poison", level: "high", note: "\u6BD2\u5203 + \u731B\u6BD2" },
  { a: "execute", b: "behead", level: "perfect", note: "\u5904\u51B3 + \u65A9\u9996" },
  { a: "execute", b: "lethal_pursuit", level: "high", note: "\u5904\u51B3 + \u81F4\u547D\u8FFD\u51FB" },
  { a: "berserk", b: "mad_war", level: "perfect", note: "\u72C2\u66B4 + \u72C2\u6218" },
  { a: "berserk", b: "tough", level: "high", note: "\u72C2\u66B4 + \u575A\u97E7\uFF08\u7A00\u6709\u6781\u7AEF\u7EC4\u5408\uFF09" },
  { a: "berserk", b: "life", level: "high", note: "\u72C2\u66B4 + \u751F\u547D" },
  { a: "thorns", b: "bulwark", level: "perfect", note: "\u8346\u68D8 + \u575A\u58C1" },
  { a: "thorns", b: "thorn_shield", level: "perfect", note: "\u8346\u68D8 + \u8346\u68D8\u76FE" },
  { a: "dodge", b: "boots_swift", level: "high", note: "\u95EA\u907F + \u75BE\u6B65" },
  { a: "chain_mine", b: "ore_vein", level: "perfect", note: "\u8FDE\u9501\u6316\u6398 + \u77FF\u8109" },
  { a: "chain_mine", b: "lucky_miner", level: "high", note: "\u8FDE\u9501\u6316\u6398 + \u5E78\u8FD0\u77FF\u5DE5" },
  { a: "harvest", b: "lucky_farmer", level: "perfect", note: "\u4E30\u6536 + \u5E78\u8FD0\u519C\u592B" },
  { a: "harvest", b: "lush", level: "high", note: "\u4E30\u6536 + \u8302\u76DB" },
  { a: "tree_feller", b: "lumber", level: "perfect", note: "\u6811\u5012 + \u4F10\u6728" },
  { a: "multi_shot", b: "split_arrow", level: "perfect", note: "\u591A\u91CD\u7BAD + \u5206\u88C2" },
  { a: "strong_bow", b: "sniper", level: "high", note: "\u5F3A\u5F13 + \u72D9\u51FB" },
  { a: "heavy_crossbow", b: "armor_pierce", level: "high", note: "\u91CD\u5F29 + \u7A7F\u7532" },
  { a: "sea_god", b: "deep_hunter", level: "high", note: "\u6D77\u795E + \u6DF1\u6D77\u730E\u624B" },
  { a: "shield_bash", b: "counter", level: "perfect", note: "\u76FE\u51FB + \u53CD\u51FB" },
  { a: "guard", b: "rebound", level: "high", note: "\u5B88\u62A4 + \u53CD\u9707" },
  { a: "sweep", b: "quake", level: "high", note: "\u6A2A\u626B + \u9707\u5730" },
  { a: "night_hunt", b: "blood_moon", level: "perfect", note: "\u591C\u730E + \u8840\u6708" },
  { a: "sun_glory", b: "sun_glory_special", level: "perfect", note: "\u65E5\u8000 + \u65E5\u8000\uFF08\u7279\u6B8A\uFF09" },
  { a: "abyss", b: "abyss_special", level: "perfect", note: "\u6DF1\u6E0A + \u6DF1\u6E0A\uFF08\u7279\u6B8A\uFF09" },
  { a: "indestructible", b: "solid", level: "high", note: "\u575A\u4E0D\u53EF\u6467 + \u575A\u56FA" },
  { a: "lifesteal", b: "blood_sacrifice", level: "high", note: "\u5438\u8840 + \u8840\u796D" },
  // ---------------- 冲突 ----------------
  { a: "light", b: "heavy", level: "conflict", note: "\u8F7B\u76C8 + \u6C89\u91CD" },
  { a: "light", b: "clumsy", level: "conflict", note: "\u8F7B\u76C8 + \u7B28\u91CD" },
  { a: "agile", b: "dull", level: "conflict", note: "\u8F7B\u7075 + \u8FDF\u949D" },
  { a: "swift", b: "heavy", level: "conflict", note: "\u8FC5\u6377 + \u6C89\u91CD" },
  { a: "extreme_speed", b: "sluggish", level: "conflict", note: "\u6781\u901F + \u8FDF\u7F13" },
  { a: "solid", b: "fragile", level: "conflict", note: "\u575A\u56FA + \u6613\u788E" },
  { a: "solid", b: "brittle", level: "conflict", note: "\u575A\u56FA + \u8106\u88C2" },
  { a: "lifesteal", b: "curse_frail", level: "conflict", note: "\u5438\u8840 + \u6613\u4EA1\u8BC5\u5492" },
  { a: "life", b: "curse_frail", level: "conflict", note: "\u751F\u547D + \u6613\u4EA1\u8BC5\u5492" },
  { a: "night_hunt", b: "day_walk", level: "conflict", note: "\u591C\u730E + \u65E5\u884C" },
  { a: "nightVision", b: "dizzy", level: "conflict", note: "\u591C\u89C6 + \u660F\u6C89" },
  { a: "regeneration", b: "regen_block", level: "conflict", note: "\u518D\u751F + \u518D\u751F\u969C\u788D" },
  { a: "auto_replant", b: "late_plant", level: "conflict", note: "\u81EA\u52A8\u8865\u79CD + \u8FDF\u79CD" },
  { a: "heavy_armor", b: "boots_swift", level: "conflict", note: "\u91CD\u7532 + \u75BE\u6B65" },
  { a: "chain_mine", b: "slow_dig", level: "conflict", note: "\u8FDE\u9501\u6316\u6398 + \u8FDF\u6EDE" },
  { a: "swift", b: "charge_up", level: "conflict", note: "\u8FC5\u6377 + \u84C4\u529B\u8FDF\u6EDE" },
  { a: "crit", b: "blunt_sense", level: "conflict", note: "\u66B4\u51FB + \u949D\u611F" },
  { a: "life", b: "frail_body", level: "conflict", note: "\u751F\u547D + \u865A\u5F31\u4F53\u8D28" },
  { a: "night_walk", b: "day_walk", level: "conflict", note: "\u591C\u884C + \u65E5\u884C" },
  { a: "fast_till", b: "hardened", level: "conflict", note: "\u5FEB\u901F\u8015\u4F5C + \u677F\u7ED3" },
  { a: "swift_dig", b: "slow_dig", level: "conflict", note: "\u8FC5\u6398 + \u8FDF\u6EDE" },
  { a: "strong_bow", b: "misaim", level: "conflict", note: "\u5F3A\u5F13 + \u5931\u51C6" },
  { a: "heavy_armor", b: "boots_swift", level: "conflict", note: "\u91CD\u7532 + \u75BE\u6B65" }
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
  trash: { id: "trash", label: "\u5E9F\u589F", range: ["poor", "common"] },
  normal: { id: "normal", label: "\u666E\u901A", range: ["common", "fine"] },
  elite: { id: "elite", label: "\u7CBE\u82F1", range: ["fine", "epic"] },
  rare: { id: "rare", label: "\u7A00\u6709", range: ["rare", "legendary"] },
  boss: { id: "boss", label: "\u9996\u9886", range: ["epic", "mythic"] },
  deep: { id: "deep", label: "\u6DF1\u5C42", range: ["fine", "epic"] },
  nether: { id: "nether", label: "\u4E0B\u754C", range: ["rare", "legendary"] },
  end: { id: "end", label: "\u672B\u5730", range: ["epic", "legendary"] },
  ancient: { id: "ancient", label: "\u8FDC\u53E4", range: ["epic", "mythic"] }
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
  { prefix: "wooden", tier: 0, name: "\u6728" },
  { prefix: "leather", tier: 0, name: "\u76AE\u9769" },
  { prefix: "stone", tier: 1, name: "\u77F3" },
  { prefix: "golden", tier: 1, name: "\u91D1" },
  { prefix: "chainmail", tier: 1, name: "\u9501\u94FE" },
  { prefix: "copper", tier: 1, name: "\u94DC" },
  { prefix: "iron", tier: 2, name: "\u94C1" },
  { prefix: "diamond", tier: 3, name: "\u94BB\u77F3" },
  { prefix: "netherite", tier: 4, name: "\u4E0B\u754C\u5408\u91D1" }
];
var SUFFIX = {
  sword: { group: "sword", kind: "sword", cn: "\u5251" },
  axe: { group: "axe", kind: "axe", cn: "\u65A7" },
  pickaxe: { group: "pickaxe", kind: "pickaxe", cn: "\u9550" },
  shovel: { group: "shovel", kind: "shovel", cn: "\u9539" },
  hoe: { group: "hoe", kind: "hoe", cn: "\u9504" },
  helmet: { group: "head", kind: "helmet", cn: "\u5934\u76D4" },
  chestplate: { group: "chest", kind: "chestplate", cn: "\u80F8\u7532" },
  leggings: { group: "legs", kind: "leggings", cn: "\u62A4\u817F" },
  boots: { group: "feet", kind: "boots", cn: "\u9774\u5B50" },
  spear: { group: "spear", kind: "spear", cn: "\u957F\u77DB" },
  mace: { group: "mace", kind: "mace", cn: "\u91CD\u9524" }
};
var SPECIAL2 = {
  "minecraft:bow": { kind: "bow", group: "bow", materialTier: 1, materialName: "\u5F13", baseName: "\u5F13" },
  "minecraft:crossbow": { kind: "crossbow", group: "crossbow", materialTier: 2, materialName: "\u5F29", baseName: "\u5F29" },
  "minecraft:trident": { kind: "trident", group: "trident", materialTier: 3, materialName: "\u4E09\u53C9\u621F", baseName: "\u4E09\u53C9\u621F" },
  "minecraft:shield": { kind: "shield", group: "shield", materialTier: 2, materialName: "\u76FE", baseName: "\u76FE\u724C" },
  "minecraft:leather_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 0, materialName: "\u76AE\u9769", baseName: "\u76AE\u9769\u9A6C\u94E0" },
  "minecraft:copper_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 1, materialName: "\u94DC", baseName: "\u94DC\u9A6C\u94E0" },
  "minecraft:iron_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 2, materialName: "\u94C1", baseName: "\u94C1\u9A6C\u94E0" },
  "minecraft:golden_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 1, materialName: "\u91D1", baseName: "\u91D1\u9A6C\u94E0" },
  "minecraft:diamond_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 3, materialName: "\u94BB\u77F3", baseName: "\u94BB\u77F3\u9A6C\u94E0" },
  "minecraft:carrot_on_a_stick": { kind: "steering", group: "steering", materialTier: 1, materialName: "\u80E1\u841D\u535C\u9493\u7AFF", baseName: "\u80E1\u841D\u535C\u9493\u7AFF" },
  "minecraft:warped_fungus_on_a_stick": { kind: "steering", group: "steering", materialTier: 1, materialName: "\u8BE1\u5F02\u83CC\u9493\u7AFF", baseName: "\u8BE1\u5F02\u83CC\u9493\u7AFF" },
  "minecraft:fishing_rod": { kind: "fishing_rod", group: "fishing", materialTier: 1, materialName: "\u9493\u9C7C\u7AFF", baseName: "\u9493\u9C7C\u7AFF" },
  "minecraft:shears": { kind: "shears", group: "shears", materialTier: 2, materialName: "\u526A\u5200", baseName: "\u526A\u5200" },
  "minecraft:brush": { kind: "brush", group: "brush", materialTier: 1, materialName: "\u5237\u5B50", baseName: "\u5237\u5B50" },
  "minecraft:flint_and_steel": { kind: "flint_and_steel", group: "flint", materialTier: 1, materialName: "\u6253\u706B\u77F3", baseName: "\u6253\u706B\u77F3" },
  "minecraft:mace": { kind: "mace", group: "mace", materialTier: 3, materialName: "\u91CD\u9524", baseName: "\u91CD\u9524" },
  "minecraft:elytra": { kind: "chestplate", group: "chest", materialTier: 2, materialName: "\u9798\u7FC5", baseName: "\u9798\u7FC5" },
  "minecraft:turtle_helmet": { kind: "helmet", group: "head", materialTier: 2, materialName: "\u6D77\u9F9F", baseName: "\u6D77\u9F9F\u58F3" }
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
  sword: { group: "sword", kind: "sword", cn: "\u5251", tier: 3 },
  axe: { group: "axe", kind: "axe", cn: "\u65A7", tier: 3 },
  pickaxe: { group: "pickaxe", kind: "pickaxe", cn: "\u9550", tier: 3 },
  shovel: { group: "shovel", kind: "shovel", cn: "\u9539", tier: 3 },
  hoe: { group: "hoe", kind: "hoe", cn: "\u9504", tier: 3 },
  spear: { group: "spear", kind: "spear", cn: "\u957F\u77DB", tier: 3 },
  fishing: { group: "fishing", kind: "fishing_rod", cn: "\u9493\u9C7C\u7AFF", tier: 1 },
  horse: { group: "horse", kind: "horse_armor", cn: "\u9A6C\u94E0", tier: 2 },
  horse_armor: { group: "horse", kind: "horse_armor", cn: "\u9A6C\u94E0", tier: 2 },
  steering: { group: "steering", kind: "steering", cn: "\u9493\u7AFF", tier: 1 },
  fishing_rod: { group: "fishing", kind: "fishing_rod", cn: "\u9493\u9C7C\u7AFF", tier: 1 },
  shears: { group: "shears", kind: "shears", cn: "\u526A\u5200", tier: 2 },
  brush: { group: "brush", kind: "brush", cn: "\u5237\u5B50", tier: 1 },
  flint: { group: "flint", kind: "flint_and_steel", cn: "\u6253\u706B\u77F3", tier: 1 },
  flint_and_steel: { group: "flint", kind: "flint_and_steel", cn: "\u6253\u706B\u77F3", tier: 1 },
  mace: { group: "mace", kind: "mace", cn: "\u91CD\u9524", tier: 3 },
  bow: { group: "bow", kind: "bow", cn: "\u5F13", tier: 2 },
  crossbow: { group: "crossbow", kind: "crossbow", cn: "\u5F29", tier: 2 },
  trident: { group: "trident", kind: "trident", cn: "\u4E09\u53C9\u621F", tier: 3 },
  shield: { group: "shield", kind: "shield", cn: "\u76FE", tier: 2 },
  head: { group: "head", kind: "helmet", cn: "\u5934\u76D4", tier: 3 },
  helmet: { group: "head", kind: "helmet", cn: "\u5934\u76D4", tier: 3 },
  chest: { group: "chest", kind: "chestplate", cn: "\u80F8\u7532", tier: 3 },
  chestplate: { group: "chest", kind: "chestplate", cn: "\u80F8\u7532", tier: 3 },
  legs: { group: "legs", kind: "leggings", cn: "\u62A4\u817F", tier: 3 },
  leggings: { group: "legs", kind: "leggings", cn: "\u62A4\u817F", tier: 3 },
  feet: { group: "feet", kind: "boots", cn: "\u9774\u5B50", tier: 3 },
  boots: { group: "feet", kind: "boots", cn: "\u9774\u5B50", tier: 3 }
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
    materialName: "\u7B2C\u4E09\u65B9",
    baseName
  };
}

// scripts/domain/Naming.ts
var FLAVOR = [
  "\u707E\u5384",
  "\u8840\u6708",
  "\u661F\u9668",
  "\u865A\u7A7A",
  "\u82CD\u7A79",
  "\u971C\u5BC2",
  "\u96F7\u9E23",
  "\u6668\u66E6",
  "\u9EC4\u660F",
  "\u9F99\u9B42",
  "\u6CF0\u5766",
  "\u5E7D\u5F71",
  "\u795E\u8C15",
  "\u5931\u843D\u7684\u4E16\u754C",
  "\u6C38\u6052",
  "\u6DF7\u6C8C",
  "\u672B\u65E5",
  "\u8D64\u6708"
];
var TITLES = {
  ancient: ["\u8BC5\u5492", "\u5931\u843D", "\u8FDC\u53E4"],
  unique: ["\u552F\u4E00", "\u7EC8\u7109", "\u521B\u4E16"]
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
  return `${quality.color}\u3010${quality.name}${tag}\u3011${name}\xA7r`;
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
        parts.push(`${label} +${round(v)} \u79D2`);
        break;
      case "amp":
        parts.push(`${label} +${round(v)} \u7EA7`);
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
  sharpness: "\u950B\u5229",
  smite: "\u4EA1\u7075\u6740\u624B",
  bane_of_arthropods: "\u8282\u80A2\u6740\u624B",
  knockback: "\u51FB\u9000",
  fire_aspect: "\u706B\u7130\u9644\u52A0",
  looting: "\u62A2\u593A",
  sweeping: "\u6A2A\u626B\u4E4B\u5203",
  efficiency: "\u6548\u7387",
  silk_touch: "\u7CBE\u51C6\u91C7\u96C6",
  fortune: "\u65F6\u8FD0",
  unbreaking: "\u8010\u4E45",
  mending: "\u7ECF\u9A8C\u4FEE\u8865",
  protection: "\u4FDD\u62A4",
  fire_protection: "\u706B\u7130\u4FDD\u62A4",
  feather_falling: "\u6454\u843D\u4FDD\u62A4",
  blast_protection: "\u7206\u70B8\u4FDD\u62A4",
  projectile_protection: "\u5F39\u5C04\u7269\u4FDD\u62A4",
  thorns: "\u8346\u68D8",
  respiration: "\u6C34\u4E0B\u547C\u5438",
  depth_strider: "\u6DF1\u6D77\u63A2\u7D22\u8005",
  aqua_affinity: "\u6C34\u4E0B\u901F\u6398",
  frost_walker: "\u51B0\u971C\u884C\u8005",
  soul_speed: "\u7075\u9B42\u75BE\u884C",
  swift_sneak: "\u8FC5\u6377\u6F5C\u884C",
  power: "\u529B\u91CF",
  punch: "\u51B2\u51FB",
  flame: "\u706B\u77E2",
  infinity: "\u65E0\u9650",
  multishot: "\u591A\u91CD\u5C04\u51FB",
  quick_charge: "\u5FEB\u901F\u88C5\u586B",
  piercing: "\u7A7F\u900F",
  loyalty: "\u5FE0\u8BDA",
  impaling: "\u7A7F\u523A",
  riptide: "\u6FC0\u6D41",
  channeling: "\u5F15\u96F7",
  density: "\u5BC6\u5EA6",
  breach: "\u7834\u7532",
  wind_burst: "\u98CE\u7206"
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
var MARK_NEG = "\xA7c\u26A0";
var MARK_SPE = "\xA76\u2726";
var MARK_UNI = "\xA75\u2756";
var AFFIX_BUDGET = 8;
var SEVERITY = {
  common: "",
  fine: "\u8F7B",
  rare: "\u4E2D",
  epic: "\u91CD",
  legendary: "\u6781\u91CD",
  mythic: "\u81F4\u547D"
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
    lines.push("\xA78\u2026\u8FD8\u6709 " + (list.length - shown.length) + " \u6761");
  }
  return shown.length;
}
var ORIGIN_CN = {
  crafting: "\u5236\u4F5C",
  mob_loot: "\u602A\u7269\u6389\u843D",
  chest_loot: "\u5B9D\u7BB1\u6218\u5229\u54C1",
  fishing: "\u9493\u9C7C",
  reward: "\u4EFB\u52A1\u5956\u52B1",
  script_give: "\u547D\u4EE4/\u811A\u672C\u7ED9\u4E88",
  inventory: "\u80CC\u5305\u83B7\u5F97",
  third_party: "\u7B2C\u4E09\u65B9 Addon",
  unknown: "\u672A\u77E5\u6765\u6E90"
};
function originText(spec) {
  const raw = spec.origin;
  if (!raw) return void 0;
  const base = ORIGIN_CN[raw] ?? raw;
  const detail = spec.originDetail;
  if (!detail) return base;
  const short = detail.replace("minecraft:", "");
  const MOB_CN = {
    zombie: "\u50F5\u5C38",
    skeleton: "\u9AB7\u9AC5",
    spider: "\u8718\u86DB",
    creeper: "\u82E6\u529B\u6015",
    enderman: "\u672B\u5F71\u4EBA",
    blaze: "\u70C8\u7130\u4EBA",
    witch: "\u5973\u5DEB",
    warden: "\u76D1\u5B88\u8005",
    wither: "\u51CB\u7075",
    ender_dragon: "\u672B\u5F71\u9F99",
    elder_guardian: "\u8FDC\u53E4\u5B88\u536B\u8005"
  };
  const name = MOB_CN[short] ?? short;
  return base + "\uFF08" + name + "\uFF09";
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
  lines.push("\xA78" + color + "\u3010" + (q ? q.name : spec.quality) + "\u3011\xA78 \xB7 \u98CE\u9669 \xA7c" + spec.risk);
  if (syn !== "normal") {
    const note = synDetail && synDetail.length ? "\uFF08" + synDetail.join("\u3001") + "\uFF09" : "";
    const synColor = syn === "conflict" ? "\xA7c" : syn === "perfect" ? "\xA76" : "\xA7b";
    lines.push("\xA78\u534F\u540C " + synColor + SYNERGY_LEVEL_NAME[syn] + "\xA78" + note);
  }
  lines.push("\xA78\u57FA\u7840\u5C5E\u6027 \xA7c\xD7" + spec.baseMult.toFixed(2) + "\xA78\uFF08" + spec.baseName + "\uFF09");
  const tier2 = speedTierFor(specStats(spec));
  if (tier2.id !== "normal") {
    lines.push("\xA78\u653B\u51FB\u901F\u5EA6 " + tier2.color + tier2.name + "\xA78\uFF08" + (tier2.pct >= 0 ? "+" : "") + tier2.pct + "%\uFF09");
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
    lines.push("\xA78\u258E\u9690\u85CF\u8BCD\u6761 " + (spec.awakened ? "\xA7a\u5DF2\u89C9\u9192" : "\xA77\u672A\u89C9\u9192"));
    if (spec.awakened) for (const k of awakenKeys) lines.push("\xA75\u2756 " + (STAT_META[k]?.label ?? k));
  }
  const hiddenKeys = Object.keys(spec.hidden).filter((k) => !k.startsWith("hiddenAwaken"));
  if (hiddenKeys.length) {
    lines.push("");
    lines.push("\xA78\u258E\u9690\u85CF\u5C5E\u6027");
    for (const k of hiddenKeys.slice(0, 2)) lines.push("\xA78" + (STAT_META[k]?.label ?? k) + " +" + round(spec.hidden[k]));
    if (hiddenKeys.length > 2) lines.push("\xA78\u2026\u8FD8\u6709 " + (hiddenKeys.length - 2) + " \u6761\u9690\u85CF\u5C5E\u6027");
  }
  const originLine = originText(spec);
  if (originLine) lines.push("\xA78\u6765\u6E90\uFF1A" + originLine);
  lines.push("");
  lines.push("\xA77\u88C5\u5907\u8BC4\u5206\uFF1A\xA7e" + spec.score);
  const ench = opts.enchantments ?? [];
  if (ench.length) {
    lines.push("\xA77\u9644\u9B54\uFF1A\xA7b" + ench.join("\xA77\u3001\xA7b"));
  } else {
    lines.push("\xA78\u53EF\u6B63\u5E38\u9644\u9B54 / \u94C1\u7827 / \u7802\u8F6E");
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
  return hit ? `\xA78\u6F5C\u5728\u5171\u9E23\uFF1A${hit.name}\uFF08${hit.desc}\uFF09` : void 0;
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
        zlog("setItem \u5931\u8D25", { slot: i, error: String(e) });
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
        zlog("setEquipment \u5931\u8D25", { slot, error: String(e) });
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
    reasons.push("\u95F2\u7F6E\u6389\u653B");
  }
  if (ctx.dimId !== "minecraft:nether" && g("uniqueAbyssHeart")) {
    mult -= 0.2;
    reasons.push("\u6DF1\u6E0A\u4E4B\u5FC3\xB7\u4E3B\u4E16\u754C\u524A\u5F31");
  }
  if (ctx.dimId === "minecraft:overworld" && g("uniqueEternalNight")) {
    mult += ctx.night ? 0.5 : -0.35;
    reasons.push(ctx.night ? "\u6C38\u591C" : "\u6C38\u591C\xB7\u767D\u663C\u524A\u5F31");
  }
  if (ctx.dimId === "minecraft:overworld" && g("uniqueSunHeart")) {
    mult += ctx.night ? -0.3 : 0.45;
    reasons.push(ctx.night ? "\u592A\u9633\u4E4B\u5FC3\xB7\u591C\u665A\u524A\u5F31" : "\u592A\u9633\u4E4B\u5FC3");
  }
  const base = ctx.st.weaponBaseMult ?? 1;
  if (base !== 1) {
    mult *= base;
    if (reasons.length < 6) reasons.push(`\u57FA\u7840\xD7${base.toFixed(2)}`);
  }
  const tier2 = speedTierFor(s);
  const comp = speedDpsCompensation(tier2);
  if (comp !== 1) {
    mult *= comp;
    reasons.push(`\u653B\u901F\xB7${tier2.name}`);
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
    reasons.push("\u66B4\u51FB");
  }
  const lucky = g("luckyChance") > 0 && ctx.roll2 * 100 < g("luckyChance");
  if (lucky) {
    mult *= 3;
    reasons.push("\u5E78\u8FD0\u4E00\u51FB");
  }
  const doubleStrike = g("doubleStrikeChance") > 0 && ctx.roll3 * 100 < g("doubleStrikeChance");
  if (doubleStrike) reasons.push("\u8FFD\u52A0\u4E00\u51FB");
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
    zlog("entityHurt(before) \u5F02\u5E38", { error: String(e) });
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
    zlog("entityHurt(after) \u5F02\u5E38", { error: String(e) });
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
    zlog("entityDie \u5F02\u5E38", { error: String(e) });
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
    zlog("setblock destroy \u5931\u8D25", { x, y, z, error: String(e) });
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
    zlog("playerBreakBlock \u5F02\u5E38", { error: String(e) });
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
  const syn = spec.synergy >= 0.85 ? "\u6781\u9AD8" : spec.synergy >= 0.65 ? "\u9AD8" : spec.synergy >= 0.4 ? "\u666E\u901A" : "\u51B2\u7A81";
  lines.push(`\u54C1\u8D28\uFF1A${q ? q.name : spec.quality}    \u8BC4\u5206\uFF1A${spec.score}    \u98CE\u9669\uFF1A${spec.risk}    \u534F\u540C\uFF1A${Math.round(spec.synergy * 100)}%\uFF08${syn}\uFF09`);
  lines.push(`\u7C7B\u578B\uFF1A${spec.baseName}    \u57FA\u7840\u5C5E\u6027\uFF1A\xD7${spec.baseMult.toFixed(2)}`);
  lines.push("");
  if (!spec.identified) {
    lines.push("\u3010\u672A\u9274\u5B9A\u3011");
    lines.push("\u4F7F\u7528\u9274\u5B9A\u5377\u8F74\uFF08\u4E3B\u624B\u88C5\u5907 + \u526F\u624B\u5377\u8F74\uFF0C\u53F3\u952E\u5DE5\u4F5C\u53F0\uFF09\u67E5\u770B\u771F\u5B9E\u8BCD\u6761\u3002");
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
  sec("\u6B63\u9762\u8BCD\u6761", spec.pos);
  sec("\u53CC\u5203\u8BCD\u6761", spec.dual);
  sec("\u7279\u6B8A\u8BCD\u6761", spec.special);
  sec("\u8D1F\u9762\u8BCD\u6761", spec.neg);
  sec("\u8BC5\u5492", spec.curse);
  sec("\u552F\u4E00\u8BCD\u7F00", spec.unique);
  const awaken = Object.keys(spec.hidden).filter((k) => k.startsWith("hiddenAwaken"));
  if (awaken.length) {
    lines.push("");
    lines.push(`\u9690\u85CF\u8BCD\u6761\uFF1A${spec.awakened ? "\u5DF2\u89C9\u9192" : "\u672A\u89C9\u9192\uFF08\u4F7F\u7528\u4E00\u6BB5\u65F6\u95F4\u540E\u89C9\u9192\uFF09"}`);
    if (spec.awakened) for (const k of awaken) lines.push(`  ${STAT_META[k]?.label ?? k}`);
  }
  if (Object.keys(spec.hidden).length) {
    lines.push("");
    lines.push("\u2014 \u9690\u85CF\u5C5E\u6027 \u2014");
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
    lines.push("\u2014 \u5DF2\u6FC0\u6D3B\u5171\u9E23 \u2014");
    for (const r of resonances) lines.push(`${r.def.name}\uFF1A${r.def.desc}`);
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
    lines.push(`${meta?.label ?? k}\uFF1A${v > 0 ? "+" : ""}${round(v)}${meta?.unit === "pct" ? "%" : ""}`);
  }
  return lines.length ? lines : ["\uFF08\u65E0\u751F\u6548\u5C5E\u6027\uFF09"];
}
async function showInspect(player, spec, resonances = []) {
  const form = new ActionFormData().title(spec.identified ? spec.name.replace(/§./g, "") : "\u795E\u79D8\u7684\u88C5\u5907").body(inspectLines(spec, resonances).join("\n")).button("\u5C5E\u6027\u660E\u7EC6").button("\u5173\u95ED");
  const res = await form.show(player);
  if (res.canceled) return;
  if (res.selection === 0) {
    await new MessageFormData().title("\u5C5E\u6027\u660E\u7EC6").body(statLines(spec).join("\n")).button1("\u8FD4\u56DE").button2("\u5173\u95ED").show(player);
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
      zlog("addEffect \u5931\u8D25", { id: entry.id, error: String(e) });
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
  if (running) return "\u81EA\u6D4B\u5DF2\u5728\u8FD0\u884C";
  buildSteps();
  stepIndex = 0;
  running = true;
  zlog("Self test started", { steps: steps.length });
  return `\u81EA\u6D4B\u5DF2\u542F\u52A8\uFF08${steps.length} \u9879\uFF09`;
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
        fail(step.id, `\u91CD\u8BD5 ${MAX_RETRIES} \u6B21\u4ECD\u672A\u5C31\u7EEA\uFF08\u4E16\u754C\u8D44\u6E90\u672A\u51C6\u5907\u597D\uFF09`);
        stepIndex++;
      }
      return;
    }
    stepIndex++;
  } catch (e) {
    fail(step.id, "\u81EA\u6D4B\u6B65\u9AA4\u629B\u5F02\u5E38: " + String(e));
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
      if (!ok) return fail("af.runtime.boot", "\u6838\u5FC3\u6A21\u5757\u6216 world API \u4E0D\u53EF\u7528");
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
        if (seen.has(a.id)) errors.push("\u91CD\u590D id: " + a.id);
        seen.add(a.id);
        for (const g of a.groups) groups.add(g);
        for (const mod of a.mods) {
          if (!STAT_META[mod.stat]) errors.push(`${a.id}: \u672A\u767B\u8BB0 stat ${mod.stat}`);
          if (mod.levels.length !== 5) errors.push(`${a.id}: ${mod.stat} \u7B49\u7EA7\u6570\u7EC4\u957F\u5EA6=${mod.levels.length}`);
        }
        if (!a.groups.length) errors.push(`${a.id}: \u6CA1\u6709\u53EF\u7528\u90E8\u4F4D`);
        if (!RARITY_ORDER.includes(a.rarity)) errors.push(`${a.id}: \u975E\u6CD5\u8BCD\u6761\u54C1\u8D28 ${a.rarity}`);
      }
      const totalWeight = QUALITIES.reduce((s, q) => s + q.weight, 0);
      if (totalWeight !== 1e4) errors.push(`\u54C1\u8D28\u6743\u91CD\u548C=${totalWeight}`);
      if (ALL_AFFIXES.length < 400) errors.push(`\u8BCD\u6761\u603B\u6570\u4E0D\u8DB3: ${ALL_AFFIXES.length}`);
      if (groups.size !== 21) errors.push(`\u88C5\u5907\u90E8\u4F4D\u6570=${groups.size}\uFF08\u5E94\u4E3A 21\uFF09`);
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
        if (poolFor("positive", g).length < 5) missing.push(`\u6B63\u9762\u6C60\u4E0D\u8DB3 ${g}`);
        if (poolFor("negative", g).length < 3) missing.push(`\u8D1F\u9762\u6C60\u4E0D\u8DB3 ${g}`);
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
      if (generated < 1900) return fail("af.runtime.generate", `\u53EA\u751F\u6210 ${generated}/2000`);
      if (exclusionViolations > 0) return fail("af.runtime.generate", `\u4E92\u65A5\u51B2\u7A81 ${exclusionViolations} \u6B21`);
      if (mythicTotal > 0 && mythicWithNeg / mythicTotal < 0.9) {
        return fail("af.runtime.generate", `\u795E\u8BDD\u5E26\u8D1F\u9762\u6BD4\u4F8B\u8FC7\u4F4E ${mythicWithNeg}/${mythicTotal}`);
      }
      if (groupsSeen.size !== 13) return fail("af.runtime.generate", `\u8986\u76D6\u90E8\u4F4D ${groupsSeen.size}/13`);
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
      if (!s || !s.mythicTotal) return fail("af.runtime.score", "\u7F3A\u5C11\u751F\u6210\u7EDF\u8BA1");
      const worstMythic = s.worstMythic === Number.MAX_SAFE_INTEGER ? 0 : s.worstMythic;
      if (!(s.bestLegendary > worstMythic)) {
        return fail("af.runtime.score", `\u8BC4\u5206\u672A\u62C9\u5F00: \u6700\u4F73\u4F20\u5947 ${s.bestLegendary} <= \u6700\u5DEE\u795E\u8BDD ${worstMythic}`);
      }
      const fragile = AFFIX_BY_ID.fragile;
      const s5 = affixScore(fragile, 5);
      if (s5 >= 0) return fail("af.runtime.score", `\u8D1F\u9762\u8BCD\u6761\u8BC4\u5206\u5E94\u4E3A\u8D1F: \u6613\u788E V = ${s5}`);
      const sharp = AFFIX_BY_ID.sharpness;
      if (affixScore(sharp, 3, 1.5) <= affixScore(sharp, 3, 1)) {
        return fail("af.runtime.score", "\u8BCD\u6761\u54C1\u8D28\u500D\u7387\u6CA1\u6709\u653E\u5927\u8BC4\u5206");
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
      if (perfect.level !== "perfect") return fail("af.runtime.synergy", `\u66B4\u51FB+\u81F4\u547D \u5E94\u4E3A\u6781\u9AD8\uFF0C\u5B9E\u9645 ${perfect.level}`);
      if (conflict.level !== "conflict") return fail("af.runtime.synergy", `\u8F7B\u7075+\u8FDF\u949D \u5E94\u4E3A\u51B2\u7A81\uFF0C\u5B9E\u9645 ${conflict.level}`);
      if (normal.level !== "normal") return fail("af.runtime.synergy", `\u950B\u9510+\u731B\u51FB \u5E94\u4E3A\u666E\u901A\uFF0C\u5B9E\u9645 ${normal.level}`);
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
      if (!spec) return fail("af.runtime.item_write", "\u751F\u6210\u5931\u8D25");
      const stack = new ItemStack3("minecraft:diamond_sword", 1);
      stack.nameTag = spec.name;
      stack.setLore(buildLore(spec));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const back = stack.getDynamicProperty(DYNPROP_KEY);
      if (typeof back !== "string") return fail("af.runtime.item_write", "dynamic property \u672A\u5199\u56DE");
      const lore = stack.getLore();
      if (!lore || !lore.length) return fail("af.runtime.item_write", "lore \u4E3A\u7A7A");
      if (stack.nameTag !== spec.name) return fail("af.runtime.item_write", "nameTag \u4E0D\u4E00\u81F4");
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
      if (!spec) return fail("af.runtime.item_read", "\u751F\u6210\u5931\u8D25");
      const stack = new ItemStack3("minecraft:netherite_chestplate", 1);
      stack.setLore(buildLore(spec, { includePayload: true }));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const a = decodeSpec(String(stack.getDynamicProperty(DYNPROP_KEY)));
      const b = decodeSpec(parseLorePayload(stack.getLore()));
      if (!a || !b) return fail("af.runtime.item_read", `\u53CC\u901A\u9053\u8BFB\u53D6\u5931\u8D25 A=${!!a} B=${!!b}`);
      const same = a.quality === spec.quality && a.score === spec.score && a.pos.length === spec.pos.length && a.neg.length === spec.neg.length && a.special.length === spec.special.length && a.curse.length === spec.curse.length && a.synergy === spec.synergy && a.awakened === spec.awakened;
      if (!same) return fail("af.runtime.item_read", "\u8BFB\u56DE\u7684\u6570\u636E\u4E0E\u5199\u5165\u4E0D\u4E00\u81F4");
      const v1 = decodeSpec(
        JSON.stringify([1, 1, "rare", "sword", "sword", "\u94BB\u77F3\u5251", 3, 1.2, [["sharpness", 2]], [], [], [], {}, 20, 300, true, "\xA7b\u3010\u7A00\u6709\u3011\u94BB\u77F3\u5251\xA7r"])
      );
      if (!v1) return fail("af.runtime.item_read", "v1 \u65E7\u6570\u636E\u65E0\u6CD5\u8BFB\u56DE");
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
      if (!ench) return fail("af.runtime.enchant_preserved", "\u7269\u54C1\u6CA1\u6709 minecraft:enchantable \u7EC4\u4EF6");
      const type = EnchantmentTypes.get("sharpness");
      if (!type) return fail("af.runtime.enchant_preserved", "\u627E\u4E0D\u5230 sharpness \u9644\u9B54\u7C7B\u578B");
      ench.addEnchantment({ type, level: 5 });
      const before = ench.getEnchantments().length;
      if (before < 1) return fail("af.runtime.enchant_preserved", "\u9644\u9B54\u6CA1\u6709\u52A0\u4E0A");
      const spec = generateSpec("minecraft:diamond_sword", 20816, { forceQuality: "legendary", forceIdentified: true });
      if (!spec) return fail("af.runtime.enchant_preserved", "\u751F\u6210\u5931\u8D25");
      stack.setLore(buildLore(spec));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const after = stack.getComponent("minecraft:enchantable")?.getEnchantments().length ?? 0;
      if (after !== before) return fail("af.runtime.enchant_preserved", `\u9644\u9B54\u88AB\u7834\u574F: ${before} -> ${after}`);
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
              tried.push(`${cx},${y},${cz}: \u65E0 inventory \u7EC4\u4EF6`);
              continue;
            }
            const spec = generateSpec("minecraft:iron_sword", 12648430, { forceQuality: "rare", forceIdentified: true });
            if (!spec) return fail("af.runtime.container", "\u751F\u6210\u5931\u8D25");
            const stack = new ItemStack3("minecraft:iron_sword", 1);
            stack.setLore(buildLore(spec));
            stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
            inv.container.setItem(0, stack);
            const back = inv.container.getItem(0);
            const read = decodeSpec(String(back?.getDynamicProperty(DYNPROP_KEY)));
            if (!read || read.score !== spec.score) return fail("af.runtime.container", "\u5BB9\u5668\u5185\u6570\u636E\u8BFB\u56DE\u4E0D\u4E00\u81F4");
            pass("af.runtime.container", { location: { x: cx, y, z: cz }, score: read.score, quality: read.quality });
            return true;
          } catch (e) {
            tried.push(`${cx},${y},${cz}: ${String(e)}`);
          }
        }
      }
      zlog("container \u672A\u5C31\u7EEA\uFF0C\u7A0D\u540E\u91CD\u8BD5", { tried: tried.slice(0, 3) });
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
      if (missing.length) return fail("af.runtime.effects", "\u65E0\u6548\u6548\u679C id: " + missing.join(","));
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
      if (!plan.length) return fail("af.runtime.effects", "effectPlan \u6CA1\u6709\u4EA7\u51FA\u4EFB\u4F55\u6548\u679C");
      const unknown = plan.filter((p) => !EffectTypes.get(p.id));
      if (unknown.length) return fail("af.runtime.effects", "\u672A\u77E5\u6548\u679C: " + unknown.map((u) => u.id).join(","));
      pass("af.runtime.effects", { verified: ids.length, plan: plan.map((p) => `${p.id}:${p.amp}`) });
    }
  });
  steps.push({
    id: "af.runtime.commands",
    fn: () => {
      const ids = registeredScriptEvents();
      if (!ids.length) return fail("af.runtime.commands", "\u6CA1\u6709\u6CE8\u518C\u4EFB\u4F55 scriptevent");
      pass("af.runtime.commands", { ids });
    }
  });
  steps.push({
    id: "af.runtime.resonance",
    fn: () => {
      const mk = (type, ids) => {
        const spec = generateSpec(type, 40503 + ids.length, { forceQuality: "legendary", forceIdentified: true });
        if (!spec) throw new Error("\u751F\u6210\u5931\u8D25 " + type);
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
        return fail("af.runtime.resonance", "\u5B88\u62A4\u5171\u9E23\u672A\u89E6\u53D1: " + JSON.stringify(armor.map((a) => a.def.id)));
      }
      const tool = computeToolResonances(mk("minecraft:diamond_pickaxe", ["swift_dig", "ore_vein", "lucky_miner"]));
      if (!tool.some((a) => a.def.id === "miner")) {
        return fail("af.runtime.resonance", "\u77FF\u5DE5\u5171\u9E23\u672A\u89E6\u53D1: " + JSON.stringify(tool.map((a) => a.def.id)));
      }
      if (computeArmorResonances({}).length) return fail("af.runtime.resonance", "\u7A7A\u5957\u88C5\u4E0D\u5E94\u6709\u5171\u9E23");
      pass("af.runtime.resonance", { armor: armor.map((a) => a.def.name), tool: tool.map((a) => a.def.name) });
    }
  });
  steps.push({
    id: "af.runtime.tooltip",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 7486, { forceQuality: "mythic" });
      if (!spec) return fail("af.runtime.tooltip", "\u751F\u6210\u5931\u8D25");
      if (!spec.identified) return fail("af.runtime.tooltip", "\u751F\u6210\u7ED3\u679C\u4E0D\u662F\u5DF2\u9274\u5B9A\u72B6\u6001\uFF08\xA7\u4E00 \u8981\u6C42\u751F\u6210\u5373\u53EF\u7528\uFF09");
      const lore = buildLore(spec, { enchantments: ["\u950B\u5229 V", "\u8010\u4E45 III"] });
      const plain = lore.map((l) => l.replace(/§./g, ""));
      const hasMark = plain.some((l) => l.includes("\u25C6")) || plain.some((l) => l.includes("\u26A0"));
      const hasScore = plain.some((l) => l.startsWith("\u88C5\u5907\u8BC4\u5206\uFF1A"));
      const hasEnch = plain.some((l) => l.startsWith("\u9644\u9B54\uFF1A") && l.includes("\u950B\u5229 V"));
      const hasName = plain.some((l) => l.includes("\u3010\u795E\u8BDD\u3011"));
      const noUnidentified = !plain.some((l) => l.includes("\u672A\u9274\u5B9A"));
      if (!hasMark || !hasScore || !hasEnch || !hasName || !noUnidentified) {
        return fail("af.runtime.tooltip", "tooltip \u7ED3\u6784\u4E0D\u7B26\u5408 \xA742", { hasMark, hasScore, hasEnch, hasName, noUnidentified });
      }
      const awakenBase = generateSpec("minecraft:diamond_sword", 10794, { forceQuality: "ancient", forceIdentified: true });
      if (!awakenBase) return fail("af.runtime.tooltip", "\u89C9\u9192\u7528\u4F8B\u751F\u6210\u5931\u8D25");
      const notAwake = { ...awakenBase, hidden: { hiddenAwakenNight: 1 }, awakened: false };
      const awake = awakenSpec(notAwake);
      if (!awake.awakened) return fail("af.runtime.tooltip", "\u89C9\u9192\u72B6\u6001\u6CA1\u6709\u7FFB\u8F6C");
      if (!buildLore(notAwake).some((l) => l.includes("\u672A\u89C9\u9192"))) return fail("af.runtime.tooltip", "\u672A\u89C9\u9192\u63D0\u793A\u7F3A\u5931");
      pass("af.runtime.tooltip", {
        lines: lore.length,
        marks: plain.filter((l) => l.includes("\u25C6")).length,
        warns: plain.filter((l) => l.includes("\u26A0")).length,
        score: spec.score,
        enchantLine: plain.find((l) => l.startsWith("\u9644\u9B54\uFF1A")) ?? null,
        awaken: "\u672A\u89C9\u9192 \u2192 \u5DF2\u89C9\u9192",
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
          if (info) bad.push(`${id} \u4E0D\u5E94\u88AB\u8BC6\u522B\u4E3A\u88C5\u5907`);
        } else if (!info || info.group !== group) {
          bad.push(`${id} -> ${info?.group ?? "undefined"}\uFF08\u671F\u671B ${group}\uFF09`);
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
        zlog("damage_calibration \u672A\u5C31\u7EEA\uFF0C\u7A0D\u540E\u91CD\u8BD5", { error: baseline.error ?? "loss<0" });
        return false;
      }
      const boosted = spawnAndHit({ x: base.x + 2, y: base.y, z: base.z }, 2);
      if (boosted.error || boosted.loss < 0) {
        zlog("damage_calibration \u7B2C\u4E8C\u6B21\u672A\u5C31\u7EEA\uFF0C\u7A0D\u540E\u91CD\u8BD5", { error: boosted.error ?? "loss<0" });
        return false;
      }
      if (baseline.loss <= 0) {
        return fail("af.runtime.damage_calibration", `\u57FA\u7EBF\u4F24\u5BB3\u6CA1\u6709\u751F\u6548: loss=${baseline.loss}`);
      }
      if (!(boosted.loss > baseline.loss)) {
        return fail(
          "af.runtime.damage_calibration",
          `ev.damage \u4FEE\u6539\u672A\u5F71\u54CD\u6700\u7EC8\u6389\u8840: ${baseline.loss.toFixed(2)} -> ${boosted.loss.toFixed(2)}`
        );
      }
      pass("af.runtime.damage_calibration", {
        baselineLoss: +baseline.loss.toFixed(3),
        boostedLoss: +boosted.loss.toFixed(3),
        ratio: +(boosted.loss / baseline.loss).toFixed(2),
        note: "beforeEvents.entityHurt.damage \u7684\u4FEE\u6539\u786E\u5B9E\u4F20\u5BFC\u5230\u6700\u7EC8\u6389\u8840\u3002\u500D\u7387\u4E0D\u5FC5\u6070\u597D\u7B49\u4E8E 2 \u2014\u2014 \u539F\u7248\u8FD8\u6709\u62A4\u7532/\u96BE\u5EA6/\u53D7\u51FB\u7ED3\u7B97\uFF0C\u8FD9\u91CC\u8BC1\u660E\u7684\u662F\u300C\u53EF\u4FEE\u6539\u4E14\u751F\u6548\u300D\u8FD9\u6761\u94FE\u8DEF"
      });
      return true;
    }
  });
  steps.push({
    id: "af.runtime.stats_aggregate",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 1911, { forceQuality: "epic", forceIdentified: true });
      if (!spec) return fail("af.runtime.stats_aggregate", "\u751F\u6210\u5931\u8D25");
      const stats = specStats(spec);
      const total = Object.values(stats).reduce((a, b) => a + Math.abs(b), 0);
      if (total <= 0) return fail("af.runtime.stats_aggregate", "\u5C5E\u6027\u805A\u5408\u4E3A\u7A7A");
      if (Object.keys(emptyStats()).length < 200) return fail("af.runtime.stats_aggregate", "emptyStats \u952E\u6570\u5F02\u5E38");
      const risk0 = computeRisk([]);
      const risk1 = computeRisk([{ id: "fragile", level: 5, roll: 1 }]);
      if (!(risk1 > risk0)) return fail("af.runtime.stats_aggregate", "\u98CE\u9669\u9884\u7B97\u8BA1\u7B97\u5F02\u5E38");
      const { score: _sc, name: _nm, ...rest } = spec;
      const recomputed = computeScore(rest);
      if (Math.abs(recomputed - spec.score) > 1) {
        return fail("af.runtime.stats_aggregate", `\u8BC4\u5206\u4E0D\u53EF\u590D\u73B0 ${recomputed} vs ${spec.score}`);
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
      if (SPEED_TIERS.length < 5) return fail("af.runtime.speed_tier", "\u6863\u4F4D\u6570\u91CF\u4E0D\u8DB3");
      const asc = SPEED_TIERS.every((x, i) => i === 0 || x.pct > SPEED_TIERS[i - 1].pct);
      if (!asc) return fail("af.runtime.speed_tier", "\u6863\u4F4D\u4E0D\u662F\u5355\u8C03\u9012\u589E");
      const cdAsc = SPEED_TIERS.every((x, i) => i === 0 || x.cooldown < SPEED_TIERS[i - 1].cooldown);
      if (!cdAsc) return fail("af.runtime.speed_tier", "\u51B7\u5374\u65F6\u95F4\u6CA1\u6709\u968F\u6863\u4F4D\u4E0B\u964D");
      const normal = speedTierFor({});
      if (normal.id !== "normal") return fail("af.runtime.speed_tier", `\u7A7A\u5C5E\u6027\u5E94\u843D\u5728\u666E\u901A\u6863\uFF0C\u5B9E\u9645 ${normal.id}`);
      const fast = speedTierFor({ attackSpeedPct: 34 });
      if (fast.id !== "swift") return fail("af.runtime.speed_tier", `+34% \u5E94\u843D\u5728\u6781\u5FEB\u6863\uFF0C\u5B9E\u9645 ${fast.id}`);
      const slow = speedTierFor({ attackSpeedPct: -28 });
      if (slow.id !== "sluggish") return fail("af.runtime.speed_tier", `-28% \u5E94\u843D\u5728\u6781\u6162\u6863\uFF0C\u5B9E\u9645 ${slow.id}`);
      const comp = speedDpsCompensation(fast);
      if (SPEED_NATIVE ? comp !== 1 : Math.abs(comp - 1.35) > 1e-3) {
        return fail("af.runtime.speed_tier", `\u7B49\u6548 DPS \u6298\u7B97\u5F02\u5E38: ${comp}`);
      }
      const tpl = nativeTemplate("diamond", fast, 7, 1561);
      const comps = tpl["minecraft:item"]?.components ?? {};
      for (const k of ["minecraft:cooldown", "minecraft:damage", "minecraft:durability", "minecraft:enchantable", "minecraft:repairable", "minecraft:hover_text_color", "minecraft:rarity"]) {
        if (!(k in comps)) return fail("af.runtime.speed_tier", `\u539F\u751F\u6A21\u677F\u7F3A\u7EC4\u4EF6 ${k}`);
      }
      if (comps["minecraft:cooldown"].type !== "attack") return fail("af.runtime.speed_tier", "cooldown.type \u5FC5\u987B\u662F attack");
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
        if (!spec) return fail("af.runtime.item_entity", "\u751F\u6210\u5931\u8D25");
        const stack = new ItemStack3("minecraft:iron_sword", 1);
        stack.setLore(buildLore(spec));
        stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
        ent = dim.spawnItem(stack, { x: 8, y: 101, z: 8 });
        if (!ent) {
          zlog("item_entity \u672A\u5C31\u7EEA\uFF0C\u7A0D\u540E\u91CD\u8BD5");
          return false;
        }
        const comp = ent.getComponent("minecraft:item");
        const back = comp?.itemStack;
        if (!back) return fail("af.runtime.item_entity", "\u6389\u843D\u7269\u6CA1\u6709 minecraft:item \u7EC4\u4EF6");
        const read = decodeSpec(String(back.getDynamicProperty(DYNPROP_KEY)));
        if (!read || read.score !== spec.score || read.pos.length !== spec.pos.length) {
          return fail("af.runtime.item_entity", "\u6389\u843D\u7269\u4E0A\u7684\u88C5\u5907\u6570\u636E\u4E0D\u4E00\u81F4");
        }
        const loreOk = (back.getLore() ?? []).some((l) => l.includes("\u8BC4\u5206"));
        if (!loreOk) return fail("af.runtime.item_entity", "\u6389\u843D\u7269 lore \u4E22\u5931");
        pass("af.runtime.item_entity", {
          score: read.score,
          quality: read.quality,
          pos: read.pos.length,
          loreLines: (back.getLore() ?? []).length,
          note: "\u6570\u636E\u968F\u6389\u843D\u7269\u5B9E\u4F53\u4FDD\u7559\uFF08\u6B7B\u4EA1\u6389\u843D \u2192 \u62FE\u53D6 \u7684\u6570\u636E\u4FA7\u8BC1\u636E\uFF09"
        });
        return true;
      } catch (e) {
        zlog("item_entity \u672A\u5C31\u7EEA\uFF0C\u7A0D\u540E\u91CD\u8BD5", { error: String(e) });
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
      if (back.length < many.length) problems.push(`lore \u88AB\u622A\u65AD: ${many.length} -> ${back.length}`);
      if (longest < long.length) problems.push(`\u5355\u884C\u88AB\u622A\u65AD: ${long.length} -> ${longest}`);
      if (payloadDefault !== void 0) problems.push("\u9ED8\u8BA4 tooltip \u91CC\u4ECD\u5E26\u7740\u673A\u5668\u53EF\u8BFB\u8F7D\u8377\u884C\uFF08\u73A9\u5BB6\u53EF\u89C1\u7684\u5783\u573E\u884C\uFF09");
      if (!payload) problems.push("\u515C\u5E95\u6A21\u5F0F\u7684\u8F7D\u8377\u884C\u65E0\u6CD5\u62FC\u56DE\uFF08dynamic property \u5931\u8D25\u65F6\u6570\u636E\u4F1A\u4E22\uFF09");
      if (payloadLine.length > 60) problems.push(`\u515C\u5E95\u8F7D\u8377\u5355\u884C\u8FC7\u957F: ${payloadLine.length}`);
      if (worstLore.length > 26) problems.push(`\u6700\u574F\u60C5\u51B5 tooltip \u884C\u6570 ${worstLore.length} \u8FC7\u957F\uFF08\u53EF\u8BFB\u6027\u4E0A\u9650 26 \u884C\uFF09`);
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
      if (!Array.isArray(players)) return fail("af.runtime.world_api", "getAllPlayers \u8FD4\u56DE\u975E\u6570\u7EC4");
      if (typeof time !== "number") return fail("af.runtime.world_api", "getTimeOfDay \u8FD4\u56DE\u975E\u6570\u5B57");
      pass("af.runtime.world_api", {
        players: players.length,
        timeOfDay: time,
        dimensions: dims,
        playerPathNote: players.length === 0 ? "\u65E0\u5934\u73AF\u5883\u65E0\u73A9\u5BB6\uFF1A\u73A9\u5BB6\u4EA4\u4E92\u8DEF\u5F84\u7531 A \u5C42\u7EAF\u51FD\u6570\u8986\u76D6" : "\u6709\u73A9\u5BB6"
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
  return `\u5DF2\u6267\u884C ${out.length} \u9879\u81EA\u6D4B`;
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
  { id: "tpl_time", name: "\u65F6\u95F4" },
  { id: "tpl_space", name: "\u7A7A\u95F4" },
  { id: "tpl_gluttony", name: "\u8D2A\u98DF" },
  { id: "tpl_eternal_night", name: "\u6C38\u591C" },
  { id: "tpl_sun_heart", name: "\u592A\u9633\u4E4B\u5FC3" },
  { id: "tpl_abyss_heart", name: "\u6DF1\u6E0A\u4E4B\u5FC3" }
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
  if (!stack) return { eligible: false, reason: "\u65E0\u7269\u54C1", thirdParty: false };
  if (isRPG(stack)) return { eligible: false, reason: "\u5DF2\u662F RPG \u88C5\u5907\uFF08\u7EDD\u4E0D\u91CD\u65B0\u968F\u673A\uFF09", thirdParty: false };
  if (!originEnabled(origin)) return { eligible: false, reason: `\u6765\u6E90\u5DF2\u5173\u95ED: ${origin}`, thirdParty: false };
  const tags = safeTags(stack);
  if (tags.includes(TAG_IGNORE)) return { eligible: false, reason: "\u7B2C\u4E09\u65B9\u58F0\u660E kira:rpg_ignore", thirdParty: false };
  const declared = tags.find((t) => t === TAG_WEAPON || t === TAG_ARMOR || t === TAG_TOOL);
  if (declared) {
    const info2 = classifyThirdParty(stack.typeId, tags);
    if (!info2) {
      return { eligible: false, reason: "\u7B2C\u4E09\u65B9\u58F0\u660E\u4E86 kira:rpg_* \u4F46\u7F3A\u5C11\u53EF\u8BC6\u522B\u7684 kira:rpg_type_*", thirdParty: true };
    }
    const poolTag = tags.find((t) => t.startsWith("kira:rpg_pool_") || t.startsWith("kira:rpg_material_"));
    return {
      eligible: true,
      reason: `\u7B2C\u4E09\u65B9\u58F0\u660E ${declared} \u2192 ${info2.group}`,
      thirdParty: true,
      pool: poolTag ? poolTag.replace("kira:rpg_pool_", "").replace("kira:rpg_material_", "") : void 0,
      info: info2
    };
  }
  const info = classify(stack.typeId);
  if (info) return { eligible: true, reason: `\u539F\u7248\u88C5\u5907 ${info.baseName}`, thirdParty: false };
  if (THIRD_PARTY_WHITELIST.includes(stack.typeId)) {
    return { eligible: true, reason: "\u7B2C\u4E09\u65B9\u767D\u540D\u5355", thirdParty: true };
  }
  return { eligible: false, reason: `\u4E0D\u5728\u63A5\u7BA1\u6C60: ${stack.typeId}`, thirdParty: false };
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
    return { stack, ingested: false, reason: "\u751F\u6210\u5668\u4E0D\u8BA4\u8BC6\u8FD9\u4E2A\u7269\u54C1", thirdParty: verdict.thirdParty };
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
        zlog("unique:downgraded", { template: tplId, reason: "\u5DF2\u88AB\u5360\u7528\u6216\u6CE8\u518C\u8868\u4E0D\u53EF\u5199" });
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
      zlog("\u91CD\u65B0\u751F\u6210\u6389\u843D\u7269\u5931\u8D25", { error: String(e) });
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
        zlog("\u8BCD\u7F00\u7194\u7089 Affix Forge \u547D\u4EE4\u8868", { ids: REGISTERED });
        world11.sendMessage(
          [
            "\xA76===== \u8BCD\u7F00\u7194\u7089 Affix Forge =====",
            "\xA7e\u2014\u2014 \u600E\u4E48\u73A9 \u2014\u2014",
            "\xA77\xB7 \u7167\u5E38\u6316\u77FF/\u6253\u602A/\u5F00\u7BB1/\u505A\u88C5\u5907 \u2014\u2014 \u88C5\u5907\xA7f\u81EA\u52A8\xA77\u53D8\u6210\u968F\u673A\u88C5\u5907\uFF0C\xA7f\u7ACB\u523B\u53EF\u7528",
            "\xA77\xB7 \u4E0D\u9700\u8981\u4EFB\u4F55\u989D\u5916\u6750\u6599\u3001\u5377\u8F74\u6216\u7279\u6B8A\u5DE5\u4F5C\u53F0",
            "\xA7e\u2014\u2014 \u547D\u4EE4 \u2014\u2014",
            "\xA77/scriptevent af:inspect \xA78\u68C0\u89C6\u4E3B\u624B\u88C5\u5907\uFF08\u5B8C\u6574\u8BCD\u6761\u9762\u677F\uFF09",
            "\xA77/scriptevent af:stats \xA78\u8F93\u51FA\u4E3B\u624B\u88C5\u5907\u7684\u805A\u5408\u5C5E\u6027",
            "\xA77/scriptevent af:roll <\u7269\u54C1id> [\u54C1\u8D28] \xA78\u751F\u6210\u4E00\u4EF6\u6307\u5B9A\u88C5\u5907",
            "\xA77/scriptevent af:verify \xA78\u81EA\u67E5\u6E05\u5355\uFF08\u542B\u771F\u4EBA\u5BA2\u6237\u7AEF\u9A8C\u6536\u9879\uFF09",
            "\xA77/scriptevent af:selftest \xA78\u8FD0\u884C 22 \u9879\u8FD0\u884C\u65F6\u81EA\u6D4B"
          ].join("\n")
        );
        break;
      case "af:selftest":
        world11.sendMessage("\xA7e" + runSelfTestOnce());
        break;
      case "af:inspect": {
        if (!player) {
          world11.sendMessage("\xA7c\u8BE5\u547D\u4EE4\u9700\u8981\u73A9\u5BB6\u6267\u884C");
          break;
        }
        const spec = mainhandSpec(player);
        if (!spec) {
          reply(player, "\xA7c\u4E3B\u624B\u4E0D\u662F\u672C\u7CFB\u7EDF\u7684\u88C5\u5907");
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
          world11.sendMessage("\xA7c\u6CA1\u6709\u73A9\u5BB6\u5728\u7EBF\uFF0C\u65E0\u6CD5\u7ED9\u4E88\u7269\u54C1");
          break;
        }
        const spec = giveGenerated(target, type, quality);
        world11.sendMessage(spec ? `\xA7a\u5DF2\u751F\u6210 \xA7r${spec.name}` : `\xA7c\u65E0\u6CD5\u751F\u6210 ${type}`);
        break;
      }
      case "af:stats": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7c\u6CA1\u6709\u73A9\u5BB6\u5728\u7EBF");
          break;
        }
        const spec = mainhandSpec(target);
        if (!spec) {
          world11.sendMessage("\xA7c\u4E3B\u624B\u4E0D\u662F\u672C\u7CFB\u7EDF\u7684\u88C5\u5907");
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
          world11.sendMessage("\xA7caf:dura \u9700\u8981\u73A9\u5BB6\u6267\u884C\u8005");
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
        world11.sendMessage(`\xA7a\u8010\u4E45: ${JSON.stringify(info)}`);
        break;
      }
      case "af:dura-set": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura-set \u9700\u8981\u73A9\u5BB6\u6267\u884C\u8005");
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
          zlog("af:dura-set \u5931\u8D25", { error: String(e) });
        }
        zlog("af:dura-set", { requested: n, before, after, ok });
        world11.sendMessage(`\xA7a\u8010\u4E45\u5199\u5165: \u8BF7\u6C42 ${n} / \u524D ${before} / \u540E ${after} / ok=${ok}`);
        break;
      }
      case "af:dura-slot": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura-slot \u9700\u8981\u73A9\u5BB6");
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
        world11.sendMessage(`\xA7a\u8010\u4E45[${slotName}]: ${JSON.stringify(info)}`);
        break;
      }
      case "af:dura-grant": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dura-grant \u9700\u8981\u73A9\u5BB6");
          break;
        }
        const statName = parts[0];
        const statVal = Number(parts[1] ?? 0);
        const typeId = parts[2] ?? "minecraft:diamond_pickaxe";
        const slotName = parts[3] ?? "Mainhand";
        if (!statName) {
          world11.sendMessage("\xA7c\u7528\u6CD5: af:dura-grant <stat> <value> [item] [slot]");
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
          spec.name = `\xA7e[\u6D4B\u8BD5] ${statName}=${statVal}`;
          spec.score = 0;
          writeSpec(item, spec);
          specOk = true;
        }
        const eq = target.getComponent("minecraft:equippable");
        const slot = EquipmentSlot3[slotName] ?? EquipmentSlot3.Mainhand;
        eq?.setEquipment(slot, item);
        zlog("af:dura-grant", { player: target.name, stat: statName, value: statVal, item: typeId, slot: String(slot), specOk });
        world11.sendMessage(`\xA7a\u5DF2\u7ED9 ${typeId} \u88C5\u4E0A ${statName}=${statVal}\uFF08${slotName}\uFF09`);
        break;
      }
      case "af:dumpitems": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dumpitems \u9700\u8981\u73A9\u5BB6\u6267\u884C\u8005");
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
        world11.sendMessage(`\xA7a\u5DF2 dump \u9644\u8FD1\u6389\u843D\u7269\uFF08${list.length} \u4E2A\uFF09\uFF0C\u89C1\u670D\u52A1\u5668\u65E5\u5FD7`);
        break;
      }
      case "af:dumpinv": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:dumpinv \u9700\u8981\u73A9\u5BB6\u6267\u884C\u8005");
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
        world11.sendMessage(`\xA7a\u5DF2 dump ${target.name} \u7684\u80CC\u5305\uFF08${out.length} \u4EF6\uFF09\uFF0C\u89C1\u670D\u52A1\u5668\u65E5\u5FD7`);
        break;
      }
      case "af:scan": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7caf:scan \u9700\u8981\u4E00\u4E2A\u73A9\u5BB6\u4F5C\u4E3A\u6267\u884C\u8005\uFF08/execute as @a run scriptevent af:scan\uFF09");
          break;
        }
        registerPlayer(target.id);
        let changed = 0;
        try {
          const inv = target.getComponent("minecraft:inventory");
          if (inv?.container) changed = processContainer(inv.container);
        } catch (e) {
          zlog("af:scan \u80CC\u5305\u5931\u8D25", { error: String(e) });
        }
        let stats = 0;
        try {
          const st = refreshPlayer(target, true);
          applyEffects(target, st);
          stats = Object.keys(st.stats).filter((k) => st.stats[k]).length;
        } catch (e) {
          zlog("af:scan \u5C5E\u6027\u5931\u8D25", { error: String(e) });
        }
        zlog("af:scan", { player: target.name, changed, activeStats: stats });
        world11.sendMessage(`\xA7a\u5DF2\u91CD\u626B ${target.name}\uFF1A\u65B0\u751F\u6210\u88C5\u5907 ${changed} \u4EF6\uFF0C\u751F\u6548\u5C5E\u6027 ${stats} \u9879`);
        break;
      }
      case "af:forge": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7c\u6CA1\u6709\u73A9\u5BB6\u5728\u7EBF\uFF0C\u65E0\u6CD5\u953B\u9020");
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
          world11.sendMessage("\xA7c\u65E0\u6CD5\u751F\u6210 " + typeId);
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
        world11.sendMessage(`\xA7a\u5DF2\u953B\u9020 \xA7r${spec.name}`);
        zlog("af:forge", { typeId, quality, pos: pos.map((a) => a.id), neg: neg.map((a) => a.id) });
        break;
      }
      case "af:verify": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\xA7c\u9700\u8981\u73A9\u5BB6\u6267\u884C\uFF1A/scriptevent af:verify");
          break;
        }
        const spec = mainhandSpec(target);
        const st = getState(target.id, target.name);
        const lines = [];
        lines.push("\xA76===== \u8BCD\u7F00\u7194\u7089 \xB7 \u5782\u76F4\u5207\u7247\u81EA\u68C0 =====");
        lines.push(spec ? `\xA7a[\u81EA\u52A8] \u4E3B\u624B\u88C5\u5907\u5DF2\u8BC6\u522B\uFF1A${spec.name}` : "\xA7e[\u81EA\u52A8] \u4E3B\u624B\u4E0D\u662F\u672C\u7CFB\u7EDF\u88C5\u5907\uFF08\u5148\u62FF\u4E00\u4EF6\u88C5\u5907\uFF09");
        if (spec) {
          lines.push(`\xA7a[\u81EA\u52A8] \u54C1\u8D28=${spec.quality} \u8BC4\u5206=${spec.score} \u98CE\u9669=${spec.risk} \u534F\u540C=${Math.round(spec.synergy * 100)}%`);
          lines.push(`\xA7a[\u81EA\u52A8] \u8BCD\u6761\uFF1A\u6B63\u9762 ${spec.pos.length} / \u8D1F\u9762 ${spec.neg.length} / \u53CC\u5203 ${spec.dual.length} / \u7279\u6B8A ${spec.special.length} / \u8BC5\u5492 ${spec.curse.length} / \u552F\u4E00 ${spec.unique.length}`);
          lines.push(spec.identified ? "\xA7a[\u81EA\u52A8] \u9274\u5B9A\u72B6\u6001\uFF1A\u5DF2\u9274\u5B9A" : "\xA7e[\u81EA\u52A8] \u9274\u5B9A\u72B6\u6001\uFF1A\u672A\u9274\u5B9A\uFF08\u526F\u624B\u9274\u5B9A\u5377\u8F74 + \u53F3\u952E\u5DE5\u4F5C\u53F0\uFF09");
          const ench = 0;
          void ench;
        }
        lines.push(`\xA7a[\u81EA\u52A8] \u5DF2\u6FC0\u6D3B\u5171\u9E23\uFF1A${st.resonances.length ? st.resonances.map((r) => r.def.name).join("\u3001") : "\u65E0"}`);
        const stats = st.stats;
        const active = Object.keys(stats).filter((k) => stats[k]).length;
        lines.push(`\xA7a[\u81EA\u52A8] \u5F53\u524D\u751F\u6548\u5C5E\u6027\uFF1A${active} \u9879`);
        lines.push("\xA77--- \u9700\u8981\u4F60\u4EBA\u5DE5\u786E\u8BA4\uFF0820 \u9879\u6E05\u5355\u89C1 reports/PLAYER_ACCEPTANCE.md\uFF09---");
        lines.push("\xA77 1. \u5DE5\u4F5C\u53F0\u653E\u5165 4 \u7EB8 + 1 \u7D2B\u6C34\u6676\u788E\u7247 \u2192 \u4EA7\u51FA 2 \u4E2A\u9274\u5B9A\u5377\u8F74");
        lines.push("\xA77 2. \u5DE5\u4F5C\u53F0\u505A\u4E00\u628A\u6728\u5251 \u2192 \u540D\u79F0\u7ACB\u523B\u53D8\u6210\u3010\u54C1\u8D28\u3011\u524D\u7F00\xB7\u6728\u5251");
        lines.push("\xA77 3. \u60AC\u505C\u770B tooltip\uFF1A\u54C1\u8D28/\u8BC4\u5206/\u98CE\u9669/\u534F\u540C/\u6B63\u8D1F\u8BCD\u6761/\u653B\u901F\u6863\u4F4D");
        lines.push("\xA77 4. \u653E\u7BB1\u5B50 \u2192 \u53D6\u51FA \u2192 \u8BCD\u6761\u4E0D\u53D8");
        lines.push("\xA77 5. \u9644\u9B54\u53F0\u9644\u950B\u5229 V \u2192 \u8BCD\u6761\u4E0E\u9644\u9B54\u540C\u65F6\u5B58\u5728");
        lines.push("\xA77 6. \u62FF\u5251\u6253\u602A \u2192 \u66B4\u51FB/\u5438\u8840/\u5143\u7D20\u6309\u8BCD\u6761\u89E6\u53D1");
        lines.push("\xA77 7. \u7A7F\u62A4\u7532\u6328\u6253 \u2192 \u51CF\u4F24\u65B9\u5411\u6B63\u786E\uFF08\u5BF9\u7167\u88F8\u8EAB/\u539F\u7248\u7532/\u8BCD\u6761\u7532\uFF09");
        lines.push("\xA77 8. /kill @s \u2192 \u6361\u56DE\u88C5\u5907 \u2192 \u8BCD\u6761\u4ECD\u5728");
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
        world11.sendMessage(`\xA7a\u751F\u6210 ${n} \u4EF6\uFF0C\u7528\u65F6 ${dt}ms`);
        zlog("af:stress", { n, ms: dt, counts });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    zlog("scriptevent \u5904\u7406\u5F02\u5E38", { id: ev.id, error: String(e) });
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
        player.onScreenDisplay.setActionBar(`${q ? q.color : "\xA7f"}\u2726 ${spec.name} \xA77(${spec.score} \u5206)`);
      } catch {
      }
    }
  }
  if (tier2 >= 3) {
    try {
      world12.sendMessage(`\xA76\u2726\u2726\u2726 \xA7r${spec.name} \xA76\u2726\u2726\u2726 \xA77\u7531 ${player ? player.name : "\u4E16\u754C"} \u83B7\u5F97\uFF08${spec.score} \u5206\uFF09`);
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
          zlog("\u80CC\u5305\u63A5\u7BA1\u5EF6\u8FDF\u5199\u56DE\u5931\u8D25", { error: String(e) });
        }
      });
    } catch (e) {
      zlog("playerInventoryItemChange \u5F02\u5E38", { error: String(e) });
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
      zlog("entityItemDrop \u5F02\u5E38", {
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
      zlog("entitySpawn \u5F02\u5E38", { error: String(e) });
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
      zlog("playerPlaceBlock \u5F02\u5E38", { error: String(e) });
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
      zlog("blockContainerOpened \u5F02\u5E38", { error: String(e) });
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
    player.onScreenDisplay.setActionBar("\xA76\u3010\u8BCD\u7F00\u7194\u7089\u3011\xA77\u5DF2\u88C5\u8F7D\uFF1A\u5236\u4F5C / \u6389\u843D / \u4EA4\u6613\u5F97\u5230\u7684\u88C5\u5907\u90FD\u4F1A\u968F\u673A\u751F\u6210\u8BCD\u6761");
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
      zlog("refreshAll \u5F02\u5E38", { player: player.name, error: String(e) });
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
      zlog("scanInventories \u5F02\u5E38", { error: String(e) });
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
      zlog("\u5EF6\u8FDF\u542F\u52A8\u5931\u8D25", { error: String(e) });
    }
  }
});

//# sourceMappingURL=../debug/main.js.map
