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
M("attackPct", "Attack Damage", "pct", 3, "offMult");
M("meleePct", "Melee Damage", "pct", 2.8, "offMult");
M("chargedBonusPct", "Charged First-Hit Damage", "pct", 1.4, "offMult");
M("armorPenPct", "Armor Penetration", "pct", 2.6, "offMult");
M("sunderPct", "Target Defense Reduction", "pct", 2, "offMult");
M("bleedDps", "Bleed Damage/s", "flat", 9, "proc", void 0, { effect: "bleed" });
M("executePct", "Execute Damage Bonus", "pct", 1.6, "offMult", "targetLowHp");
M("killStackPct", "Kill Stacking", "pct", 1.8, "offMult", "killStack");
M("rampagePct", "Combo Damage vs Same Target", "pct", 2, "offMult", "combo");
M("berserkPct", "Low-Health Damage", "pct", 2.2, "offMult", "selfLowHp");
M("vengeancePct", "Damage Boost After Taking Damage", "pct", 2, "offMult", "hurtRecent");
M("chasePct", "Chase Moving Targets", "pct", 1.8, "offMult", "targetMoving");
M("snipePct", "Long-range Damage Bonus", "pct", 1.6, "offMult", "far");
M("weakspotPct", "Weakness Damage", "pct", 2.4, "offMult");
M("dancePct", "Combo bonus damage", "pct", 1.8, "offMult", "combo");
M("burstSpeedPct", "Burst Attack Speed", "pct", 1.6, "offMult", "hurtRecent");
M("bloodRagePct", "Attack up after dealing damage", "pct", 1.8, "offMult", "hurtRecent");
M("assaultPct", "Assault Damage", "pct", 1.5, "offMult");
M("staggerChance", "Stagger Chance", "pct", 8, "proc", void 0, { effect: "stagger" });
M("elitePct", "Damage vs Elites", "pct", 2, "offMult", "elite");
M("giantPct", "Increased damage against giant mobs", "pct", 1.8, "offMult", "giant");
M("undeadPct", "Bonus Damage vs Undead", "pct", 2, "offMult", "undead");
M("arthropodPct", "Damage vs Arthropods", "pct", 2, "offMult", "arthropod");
M("illagerPct", "Bonus Damage vs. Illagers", "pct", 2, "offMult", "illager");
M("aquaticPct", "Increased damage against aquatic mobs", "pct", 2, "offMult", "aquatic");
M("nethermobPct", "Bonus damage vs Nether mobs", "pct", 2, "offMult", "nethermob");
M("bossPct", "Damage vs Bosses", "pct", 1.8, "offMult", "boss");
M("crowdPct", "More Damage per Enemy", "pct", 1.6, "offMult", "crowd");
M("soloPct", "Solo Damage", "pct", 1.8, "offMult", "solo");
M("allInPct", "All-in Damage", "pct", 1.4, "offMult", "crowd");
M("nightPct", "Night Damage Bonus", "pct", 1.6, "offMult", "night");
M("dayPct", "Daylight Damage", "pct", 1.6, "offMult", "day");
M("netherPct", "Nether Damage", "pct", 1.5, "offMult", "nether");
M("waterPct", "Underwater Damage", "pct", 1.5, "offMult", "water");
M("burningTargetPct", "Damage vs Burning Targets", "pct", 1.8, "offMult", "burning");
M("frozenTargetPct", "Increased damage to frozen targets", "pct", 1.8, "offMult", "frozen");
M("poisonedTargetPct", "Damage vs Poisoned Targets", "pct", 1.8, "offMult", "poisoned");
M("backstabPct", "Backstab Damage Bonus", "pct", 2.2, "offMult", "behind");
M("unwoundedPct", "Bonus Damage vs. Full-Health Targets", "pct", 2, "offMult", "unwounded");
M("critFollowPct", "Bonus Crit Damage", "pct", 2.2, "offMult", "crit");
M("flatDamage", "Extra Flat Damage", "flat", 14, "flat");
M("firstStrikePct", "First Strike Damage", "pct", 1.8, "offMult", "unwounded");
M("critChance", "Crit Chance", "pct", 7, "critChance");
M("critDamage", "Critical Damage", "pct", 2.4, "critDamage");
M("killCritPct", "Crit Chance After Kill", "pct", 3, "critChance", "killStack");
M("lowHpCrit", "Crit Chance vs Low-Health Targets", "pct", 3.2, "critChance", "targetLowHp");
M("luckyChance", "Lucky Strike Chance", "pct", 12, "proc", void 0, { effect: "lucky" });
M("doubleStrikeChance", "Extra Strike Chance", "pct", 6, "proc", void 0, { effect: "doubleStrike" });
M("finisherChance", "Finisher adds a heavy strike", "pct", 5, "proc", void 0, { effect: "finisher" });
M("hunterHeartCrit", "Crit Chance vs Full-Health Target", "pct", 3, "critChance", "unwounded");
M("gambleCrit", "Gambler Crit Chance", "pct", 5, "critChance");
M("gambleLossPct", "Gambler Damage Variance", "pct", 2, "proc", void 0, { negative: true });
M("attackSpeedPct", "Attack Speed", "pct", 4.2, "effect", void 0, { effect: "haste" });
M("comboAtkSpeed", "Combo Attack Speed", "pct", 3.2, "effect", "combo", { effect: "haste" });
M("followUpSpeedPct", "Pursuit Speed", "pct", 3, "effect", "hurtRecent", { effect: "haste" });
M("attackCooldownPct", "Attack Cooldown", "pct", 3, "effect", void 0, { negative: true, effect: "mining_fatigue" });
M("lifesteal", "Lifesteal", "pct", 9, "lifesteal");
M("killHeal", "Heal on Kill", "flat", 10, "killHeal");
M("bloodPowerPct", "Attack Boost After Lifesteal", "pct", 1.8, "offMult", "hurtRecent");
M("maxHealthPct", "Max Health", "pct", 3.4, "effect", void 0, { effect: "health_boost" });
M("regenPct", "Health Regeneration Rate", "pct", 2.6, "effect", void 0, { effect: "regeneration" });
M("regenFlat", "Regen per Second", "flat", 18, "effect", void 0, { effect: "regeneration", per: 0.4 });
M("lowHpDefense", "Low-Health Defense", "pct", 3, "defense", "selfLowHp");
M("bloodPool", "Kills grant temporary Health", "flat", 9, "killHeal");
M("highHpShield", "High-Health Shield", "flat", 8, "effect", void 0, { effect: "absorption", per: 1.5 });
M("outOfCombatRegen", "Out-of-Combat Recovery", "pct", 3, "effect", void 0, { effect: "regeneration" });
M("defensePct", "Global Damage Reduction", "pct", 5, "defense");
M("resistPct", "Resistance Boost", "pct", 3.6, "defense");
M("flatReduce", "Flat Damage Reduction", "flat", 16, "flatReduce");
M("shieldChance", "Shield Trigger", "pct", 6, "proc", void 0, { effect: "shield" });
M("absorbFlat", "Absorption", "flat", 9, "effect", void 0, { effect: "absorption" });
M("deflectPct", "Ranged Damage Reduction", "pct", 2.6, "defense", "ranged");
M("blockPct", "Block Strength", "pct", 3, "defense", "blocking");
M("guardReducePct", "Damage Reduction after Blocking", "pct", 3.4, "defense", "blocking");
M("standStillDefense", "Stationary Defense", "pct", 3, "defense", "standing");
M("counterPct", "Counter Damage", "pct", 2.2, "offMult", "blocking");
M("watchDefense", "Nearby Enemy Defense", "pct", 3, "defense", "crowd");
M("lastStandChance", "Cheat Death", "pct", 14, "proc", void 0, { effect: "lastStand" });
M("thornsPct", "Thorns Reflect", "pct", 3.2, "thorns");
M("reflectChance", "Negative Reflect", "pct", 5, "proc", void 0, { effect: "reflect" });
M("elementBarrierPct", "Elemental Damage Reduction", "pct", 3, "defense");
M("damageTakenPct", "Damage Taken", "pct", 3.6, "defense", void 0, { negative: true });
M("healingReducePct", "Healing Effect", "pct", 2.6, "effect", void 0, { negative: true, effect: "wither" });
M("moveSpeedPct", "Movement Speed", "pct", 4, "effect", void 0, { effect: "speed" });
M("sprintSpeedPct", "Sprint Speed", "pct", 2.6, "effect", void 0, { effect: "speed" });
M("jumpPct", "Jump Height", "pct", 2, "effect", void 0, { effect: "jump_boost" });
M("fallReducePct", "Fall Damage Reduction", "pct", 2, "flag", void 0, { effect: "fallReduce" });
M("waterSpeedPct", "Movement in Water", "pct", 1.6, "effect", void 0, { effect: "conduit_power" });
M("swimPct", "Swim Speed", "pct", 1.6, "effect", void 0, { effect: "conduit_power" });
M("fireResistPct", "Fire Resistance", "pct", 2.4, "effect", void 0, { effect: "fire_resistance" });
M("iceWalkPct", "Ice Control", "pct", 1.2, "flag", void 0, { effect: "iceWalk" });
M("dodgeChance", "Dodge Chance", "pct", 12, "dodge");
M("hurtSpeedPct", "Haste After Being Hit", "pct", 2.2, "effect", "hurtRecent", { effect: "speed" });
M("turnAgilityPct", "Nimble Turning", "pct", 1.2, "flag");
M("landingPct", "Landing Cushion", "pct", 1.4, "flag", void 0, { effect: "fallReduce" });
M("slowResistPct", "Slowness Resistance", "pct", 2, "flag", void 0, { effect: "slowResist" });
M("nightSpeedPct", "Night Movement Speed", "pct", 2.2, "effect", "night", { effect: "speed" });
M("daySpeedPct", "Daytime Movement Speed", "pct", 2.2, "effect", "day", { effect: "speed" });
M("wildAdaptPct", "Wilderness Adaptation", "pct", 2, "defense");
M("caveAdaptPct", "Cave Adaptation", "pct", 2.2, "effect", "underground", { effect: "haste" });
M("desertAdaptPct", "Desert Adaptation", "pct", 1.6, "effect", void 0, { effect: "speed" });
M("snowAdaptPct", "Snowfield Adaptation", "pct", 1.6, "effect", void 0, { effect: "speed" });
M("netherAdaptPct", "Nether Adaptation", "pct", 2.4, "defense", "nether");
M("waterAdaptPct", "Water Adaptation", "pct", 2.4, "effect", "water", { effect: "water_breathing" });
M("highAltAdaptPct", "High-Altitude Adaptation", "pct", 1.6, "defense");
M("fireChance", "Ignite Chance", "pct", 2.4, "proc", void 0, { effect: "fire" });
M("fireDuration", "Extended Burning", "sec", 8, "proc", void 0, { effect: "fireDuration" });
M("fireBurst", "Detonation Damage", "flat", 3, "proc", void 0, { effect: "fireBurst" });
M("fireGround", "Ground Fire Trail", "flag", 22, "proc", void 0, { effect: "fireGround" });
M("fireSeaPct", "Fire Sea Radius", "pct", 2, "proc", void 0, { effect: "fireSea" });
M("moltenPct", "Molten Penetration", "pct", 1.8, "offMult", "burning");
M("iceChance", "Slow Chance", "pct", 2.2, "proc", void 0, { effect: "ice" });
M("slowAmp", "Slow Potency", "amp", 16, "proc", void 0, { effect: "slowAmp" });
M("freezeChance", "Freeze Chance", "pct", 9, "proc", void 0, { effect: "freeze" });
M("iceBurst", "Ice Burst Damage", "flat", 3, "proc", void 0, { effect: "iceBurst" });
M("chillAura", "Frost Aura", "flag", 20, "proc", void 0, { effect: "chillAura" });
M("iceArmorPct", "Ice Armor Defense", "pct", 3, "defense");
M("frostExtendPct", "Slow Duration", "pct", 1.8, "proc", void 0, { effect: "frostExtend" });
M("lightningChance", "Lightning Chance", "pct", 11, "proc", void 0, { effect: "lightning" });
M("shockAmp", "Shock Intensity", "amp", 12, "proc", void 0, { effect: "shock" });
M("chainChance", "Chain Lightning Chance", "pct", 5, "proc", void 0, { effect: "chain" });
M("stormCharge", "Storm Charge", "flat", 5, "proc", void 0, { effect: "storm" });
M("thunderMarkPct", "Lightning Scar Damage", "pct", 2, "offMult", "poisoned");
M("overloadPct", "Overload Lightning Damage", "pct", 2.4, "offMult", "combo");
M("judgmentPct", "Divine Punishment deals increased damage to high-health targets", "pct", 2.2, "offMult", "targetFullHp");
M("poisonChance", "Poison Chance", "pct", 2.2, "proc", void 0, { effect: "poison" });
M("corrodeAmp", "Corrosion Strength", "amp", 9, "proc", void 0, { effect: "corrode" });
M("poisonAmp", "Poison Potency", "amp", 11, "proc", void 0, { effect: "poisonAmp" });
M("poisonBurst", "Poison Burst Damage", "flat", 3, "proc", void 0, { effect: "poisonBurst" });
M("poisonCloud", "Poison Mist", "flag", 18, "proc", void 0, { effect: "poisonCloud" });
M("snakeBitePct", "Serpent Kiss Poison Stack", "pct", 2, "proc", void 0, { effect: "snakeBite" });
M("knockbackPct", "Knockback", "pct", 1.2, "proc", void 0, { effect: "knockback" });
M("stunChance", "Stun Chance", "pct", 10, "proc", void 0, { effect: "stun" });
M("slowOnHit", "Hit Slow", "amp", 10, "proc", void 0, { effect: "slowOnHit" });
M("weakenOnHit", "Weakness on Hit", "amp", 12, "proc", void 0, { effect: "weaken" });
M("sunderOnHit", "Sunder on Hit", "amp", 12, "proc", void 0, { effect: "sunder" });
M("fearChance", "Fear Chance", "pct", 6, "proc", void 0, { effect: "fear" });
M("rootChance", "Bind Chance", "pct", 9, "proc", void 0, { effect: "root" });
M("silenceChance", "Silence Chance", "pct", 7, "proc", void 0, { effect: "silence" });
M("dispelChance", "Dispel Chance", "pct", 8, "proc", void 0, { effect: "dispel" });
M("sweepPct", "Sweep Damage", "pct", 1.8, "proc", void 0, { effect: "sweep" });
M("quakePct", "Ground Slam Damage", "pct", 1.8, "proc", void 0, { effect: "quake" });
M("fissurePct", "Earthsplit Damage", "pct", 1.6, "proc", void 0, { effect: "fissure" });
M("stormAoePct", "Storm Damage", "pct", 1.6, "proc", void 0, { effect: "stormAoe" });
M("explodePct", "Burst Damage", "pct", 2, "proc", void 0, { effect: "explode" });
M("whirlwindChance", "Whirlwind Chance", "pct", 6, "proc", void 0, { effect: "whirlwind" });
M("chainHitPct", "Chain Hit", "pct", 2, "proc", void 0, { effect: "chainHit" });
M("earthSplitPct", "Fissure Damage", "pct", 1.8, "proc", void 0, { effect: "earthSplit" });
M("swordIntentPct", "Sword Intent Damage", "pct", 2.2, "offMult", "combo");
M("quickBladePct", "Fast Sword Attack Speed", "pct", 3, "effect", void 0, { effect: "haste" });
M("breakerPct", "Army Breaker vs Elites", "pct", 2.2, "offMult", "elite");
M("beheadPct", "Decapitating Execute", "pct", 2.4, "offMult", "targetLowHp");
M("doubleSlashChance", "Double Slash Chance", "pct", 5, "proc", void 0, { effect: "doubleStrike" });
M("spinBladeChance", "Whirling Blade Chance", "pct", 4, "proc", void 0, { effect: "whirlwind" });
M("swordQiPct", "Sword Aura Damage", "pct", 2, "proc", void 0, { effect: "swordQi" });
M("flyingBladePct", "Flying Blade Damage", "pct", 1.8, "proc", void 0, { effect: "flyingBlade" });
M("bloodBladeHeal", "Blood Blade Healing", "flat", 8, "lifesteal");
M("soulStackPct", "Soul Hunt Stacks", "pct", 2, "offMult", "killStack");
M("frenzyPct", "Blade Frenzy", "pct", 2.2, "offMult", "combo");
M("peerlessPct", "Peerless Combo", "pct", 2.4, "offMult", "combo");
M("boneBreakChance", "Bonebreak Slowness", "pct", 5, "proc", void 0, { effect: "boneBreak" });
M("shieldBreakPct", "Shield-break Damage Bonus", "pct", 2, "offMult", "elite");
M("cleavePct", "Cleave Radius", "pct", 1.8, "proc", void 0, { effect: "cleave" });
M("mightyChopPct", "Heavy Slash Damage", "pct", 2.4, "offMult", "unwounded");
M("woodMasterPct", "Bonus Wood Drops", "pct", 3, "drop");
M("frenzyChopPct", "Frenzy Chop Speed", "pct", 2.4, "mining", "combo");
M("miningSpeedPct", "Mining Speed", "pct", 2.6, "mining");
M("extraDropPct", "Extra Drops", "pct", 4, "drop");
M("oreDropPct", "Ore Drops", "pct", 4.4, "drop");
M("smeltChance", "Auto Smelting", "pct", 6, "proc", void 0, { effect: "smelt" });
M("chainMine", "Chain Mining", "flag", 45, "flag", void 0, { effect: "chainMine" });
M("treeFeller", "Chain Logging", "flag", 48, "flag", void 0, { effect: "treeFeller" });
M("aoeBreak", "Area Destruction", "flag", 36, "flag", void 0, { effect: "aoeBreak" });
M("aoeMine", "Area Mining", "flag", 40, "flag", void 0, { effect: "aoeMine" });
M("deepMinePct", "Underground Efficiency", "pct", 2.2, "mining", "underground");
M("minerEye", "Miner's Eye", "flag", 18, "flag", void 0, { effect: "minerEye" });
M("treasureChance", "Treasure Chance", "pct", 7, "proc", void 0, { effect: "treasure" });
M("durabilitySave", "Durability Saving", "pct", 3.2, "durability");
M("rapidMinePct", "Haste Mining", "pct", 2.4, "mining", "combo");
M("earthVeinChance", "Leyline Trigger", "pct", 5, "proc", void 0, { effect: "earthVein" });
M("sandMasterPct", "Sand Efficiency", "pct", 2.4, "mining");
M("soilMasterPct", "Soil Efficiency", "pct", 2.4, "mining");
M("tillPct", "Tilling Speed", "pct", 2.2, "mining");
M("geologistChance", "Geologist", "pct", 5, "proc", void 0, { effect: "geologist" });
M("harvestPct", "Crop Yield", "pct", 3.4, "drop");
M("autoReplant", "Auto Replant", "flag", 30, "flag", void 0, { effect: "autoReplant" });
M("growthPct", "Crop Growth", "pct", 2.6, "flag", void 0, { effect: "growth" });
M("farmlandRange", "Tilling Radius", "flag", 22, "flag", void 0, { effect: "farmlandRange" });
M("fastTillPct", "Farming Speed", "pct", 2.2, "mining");
M("seedMasterPct", "Seed Drops", "pct", 2.6, "drop");
M("abundantChance", "Bounty Extra Drops", "pct", 3.6, "drop");
M("eternalFarm", "Everlasting Farm", "flag", 20, "flag", void 0, { effect: "eternalFarm" });
M("archaeologyChance", "Archaeology Chance", "pct", 6, "proc", void 0, { effect: "archaeology" });
M("qualityArmorPct", "Quality Armor Modifier", "pct", 0, "defense");
M("qualityArmorVulnPct", "Quality Vulnerability", "pct", 0, "defense");
M("soulPct", "Soul Damage", "pct", 2.6, "offMult");
M("accuracyPct", "Hit Precision", "pct", 2.2, "offMult");
M("comboPct", "Combo Damage", "pct", 2.8, "offMult", "combo");
M("aoePct", "Area Damage", "pct", 2.4, "offMult");
M("projectilePct", "Ranged Damage", "pct", 2.6, "offMult");
M("piercePct", "Piercing", "pct", 2.6, "offMult");
M("multishotPct", "Multishot", "pct", 3, "offMult");
M("explosivePct", "Explosive", "pct", 3, "proc");
M("ammoPct", "Ammo Recovery", "pct", 2.6, "drop");
M("fishingLuckPct", "Extra fishing rewards", "pct", 3.4, "drop");
M("treasurePct", "Treasure Chance", "pct", 3.8, "drop");
M("reelSpeedPct", "Reel Speed", "pct", 2.8, "drop");
M("fishingCooldownPct", "Fishing Cooldown", "pct", 2.6, "drop", void 0, { negative: true });
M("shearYieldPct", "Shearing Yield", "pct", 3.2, "drop");
M("shearSpeedPct", "Shear Efficiency", "pct", 2.8, "mining");
M("brushLuckPct", "Farming Bonus", "pct", 3.6, "drop");
M("brushSpeedPct", "Farming Efficiency", "pct", 2.8, "mining");
M("igniteChancePct", "Ignite chance", "pct", 3, "proc");
M("igniteCooldownPct", "Ignite Cooldown", "pct", 2.6, "drop", void 0, { negative: true });
M("fireDurationPct", "Fire Duration", "pct", 3.2, "proc");
M("cooldownReducePct", "Cooldown Reduction", "pct", 3.4, "drop");
M("varianceReducePct", "Yield Stability", "pct", 2.4, "drop");
M("shearLossPct", "Shearing Loss", "pct", 2.6, "drop", void 0, { negative: true });
M("brushLossPct", "Farming Wear", "pct", 2.6, "drop", void 0, { negative: true });
M("igniteRiskPct", "Ignite Backlash", "pct", 3, "proc", void 0, { negative: true });
M("bowDamagePct", "Bow Damage", "pct", 3, "offMult", "ranged");
M("sniperPct", "Sniper Long-Range Damage", "pct", 2.4, "offMult", "far");
M("arrowPierce", "Arrow Piercing", "flag", 26, "proc", void 0, { effect: "arrowPierce" });
M("splitArrowChance", "Arrow Split", "pct", 5, "proc", void 0, { effect: "splitArrow" });
M("multiShot", "Multi-Shot", "flag", 34, "proc", void 0, { effect: "multiShot" });
M("explosiveArrowPct", "Blast Arrow", "pct", 2.6, "proc", void 0, { effect: "explosiveArrow" });
M("flameArrowChance", "Flame Arrow", "pct", 3, "proc", void 0, { effect: "flameArrow" });
M("iceArrowChance", "Ice Bolt", "pct", 3, "proc", void 0, { effect: "iceArrow" });
M("thunderArrowChance", "Lightning Bolt", "pct", 4, "proc", void 0, { effect: "thunderArrow" });
M("homingArrow", "Tracking", "flag", 30, "proc", void 0, { effect: "homing" });
M("drawSpeedPct", "Draw Speed", "pct", 2.4, "effect", void 0, { effect: "haste" });
M("steadyAimPct", "Steady Aim", "pct", 2, "offMult", "ranged");
M("deadlyArrowPct", "Deadly Arrow Crit", "pct", 3, "critChance", "ranged");
M("hunterPct", "Hunter Ranged Damage", "pct", 2.2, "offMult", "ranged");
M("heavyCrossbowPct", "Heavy Crossbow Damage", "pct", 3.2, "offMult", "ranged");
M("armorPierceArrowPct", "Armor-Piercing Arrow", "pct", 2.6, "offMult", "ranged");
M("reloadSpeedPct", "Reload Speed", "pct", 2.6, "effect", void 0, { effect: "haste" });
M("multiBolt", "Multishot", "flag", 32, "proc", void 0, { effect: "multiShot" });
M("blastBoltPct", "Crossbow Burst", "pct", 2.6, "proc", void 0, { effect: "explosiveArrow" });
M("formationBreakPct", "Formation Break", "pct", 2, "offMult", "crowd");
M("snipeKillPct", "Snipe", "pct", 2.8, "offMult", "far");
M("rapidFirePct", "Rapid Fire", "pct", 3, "effect", void 0, { effect: "haste" });
M("stabilityPct", "Steadfast", "pct", 2, "offMult", "ranged");
M("seaGodPct", "Sea God Water Damage", "pct", 3, "offMult", "water");
M("tidePct", "Tidal Impact", "pct", 2.2, "proc", void 0, { effect: "tide" });
M("stormEnvPct", "Thunderstorm Boost", "pct", 2.6, "offMult", "water");
M("thunderPct", "Thunder Lightning Strike", "pct", 4, "proc", void 0, { effect: "lightning" });
M("returnSpeedPct", "Return Speed", "pct", 1.6, "meta", void 0, { wired: false });
M("seaPiercePct", "Sea-Piercing Throw", "pct", 2.2, "offMult", "water");
M("deepHunterPct", "Deep-Sea Hunter", "pct", 2.4, "offMult", "aquatic");
M("stormBurstPct", "Storm Burst", "pct", 2.4, "proc", void 0, { effect: "stormAoe" });
M("surgeKnockback", "Surge Knockback", "pct", 1.4, "proc", void 0, { effect: "knockback" });
M("ironShieldPct", "Shield Defense", "pct", 3.6, "defense");
M("shieldSavePct", "Shield Durability Saving", "pct", 3, "durability");
M("reboundPct", "Block Rebound", "pct", 3, "thorns", "blocking");
M("thornShieldPct", "Thorn Shield Reflect", "pct", 3.2, "thorns");
M("shieldBashPct", "Shield Bash Damage", "pct", 2.4, "offMult", "blocking");
M("chargeKnockback", "Charge Knockback", "pct", 1.6, "proc", void 0, { effect: "knockback" });
M("guardFieldPct", "Guardian Domain", "pct", 2.6, "defense", "crowd");
M("perfectBlockChance", "Perfect Block", "pct", 12, "proc", void 0, { effect: "perfectBlock" });
M("damageReduceHead", "Head Damage Reduction", "pct", 4, "defense");
M("insightFlat", "Detection Radius", "flat", 4, "flag", void 0, { effect: "insight" });
M("nightVision", "Night Vision", "flag", 30, "effect", void 0, { effect: "night_vision" });
M("waterBreathing", "Water Breathing", "flag", 26, "effect", void 0, { effect: "water_breathing" });
M("deepVision", "Deep Sea Vision", "flag", 18, "effect", void 0, { effect: "night_vision" });
M("debuffReduce", "Negative Duration Reduction", "pct", 3, "flag", void 0, { effect: "debuffReduce" });
M("controlResist", "Control Resistance", "pct", 3, "flag", void 0, { effect: "controlResist" });
M("dangerSense", "Danger Sense", "flag", 18, "flag", void 0, { effect: "dangerSense" });
M("undeadSense", "Undead Sense", "flag", 14, "flag", void 0, { effect: "undeadSense" });
M("monsterLorePct", "Monster Lore Damage Bonus", "pct", 2.2, "offMult");
M("soulEye", "Soul Eye", "flag", 16, "flag", void 0, { effect: "soulEye" });
M("heavyArmorPct", "Heavy Armor Defense", "pct", 4, "defense");
M("lifeCorePct", "Life Core", "pct", 3.4, "effect", void 0, { effect: "health_boost" });
M("shieldCore", "Shield Core", "pct", 3, "proc", void 0, { effect: "shield" });
M("regenCorePct", "Regen Core", "pct", 2.8, "effect", void 0, { effect: "regeneration" });
M("guardHeartPct", "Guardian Heart", "pct", 3.2, "defense", "selfLowHp");
M("vengeanceHeartPct", "Heart of Revenge", "pct", 2.2, "offMult", "hurtRecent");
M("unyieldingCoreChance", "Unyielding Core", "pct", 12, "proc", void 0, { effect: "lastStand" });
M("endurancePct", "Endurance", "pct", 2, "flag", void 0, { effect: "sprintCost" });
M("warWillPct", "Warrior's Will", "pct", 2.2, "offMult", "combo");
M("persistencePct", "Endurance Damage Reduction", "pct", 3, "defense", "hurtRecent");
M("feralPct", "Wild Haste", "pct", 2.2, "effect", "hurtRecent", { effect: "speed" });
M("damageSpreadPct", "Damage Sharing", "pct", 3, "defense");
M("bodyPct", "Body Knockback Resistance", "pct", 1.6, "flag", void 0, { effect: "knockbackResist" });
M("warriorLegsPct", "Warrior's Legs", "pct", 2.4, "offMult");
M("gatherPct", "Gathering Yield", "pct", 3, "drop");
M("frugalPct", "Durability Saving", "pct", 3, "durability");
M("indestructiblePct", "Unbreakable", "pct", 3.6, "durability");
M("xpPct", "XP Gain", "pct", 2.6, "drop");
M("greedyMinerPct", "Ore Glutton", "pct", 3.4, "drop");
M("huntDropPct", "Hunting Drops", "pct", 2.6, "drop");
M("farmDropPct", "Farmer Yield", "pct", 2.8, "drop");
M("artisanChance", "Artisan Extra Output", "pct", 4, "proc", void 0, { effect: "artisan" });
M("durabilityMult", "Durability Cost", "pct", 2.2, "durability", void 0, { negative: true });
M("durabilityDrain", "Natural Durability loss", "flat", 6, "durability", void 0, { negative: true });
M("fractureChance", "Breaks at Low Durability", "pct", 4, "durability", "lowDurability", { negative: true });
M("skillDurabilityCost", "Skill Extra Durability", "flat", 5, "durability", void 0, { negative: true });
M("attackDurabilityCost", "Attack Extra Durability", "flat", 5, "durability", void 0, { negative: true });
M("moveDurabilityCost", "Movement Durability Drain", "flat", 4, "durability", void 0, { negative: true });
M("agingPct", "Accelerated Aging", "pct", 2.4, "durability", void 0, { negative: true });
M("unstablePct", "Unstable Wear", "pct", 2.6, "durability", "combo", { negative: true });
M("hungerDrain", "Hunger Drain", "pct", 2, "effect", void 0, { negative: true, effect: "hunger" });
M("sprintHungerDrain", "Sprint Hunger Cost", "pct", 2, "effect", void 0, { negative: true, effect: "hunger" });
M("selfDamageChance", "Backlash Chance", "pct", 5, "proc", void 0, { negative: true, effect: "selfDamage" });
M("hurtSlowSelf", "Slow on Hit", "pct", 2.4, "effect", "hurtRecent", { negative: true, effect: "slowness" });
M("idleDecayPct", "Idle Attack Decay", "pct", 2.4, "offMult", void 0, { negative: true });
M("comboDecayPct", "Combo reduces Attack Speed", "pct", 2.4, "effect", "combo", { negative: true, effect: "mining_fatigue" });
M("firstHitDelay", "First-Strike Wind-Up", "pct", 2, "effect", void 0, { negative: true, effect: "mining_fatigue" });
M("aggroPct", "Aggro Range", "pct", 1.6, "flag", void 0, { negative: true, effect: "aggro" });
M("erraticChance", "Loss of Control Chance", "pct", 2, "proc", void 0, { negative: true, effect: "erratic" });
M("critTakenPct", "Crit Vulnerability", "pct", 2.6, "defense", "crit", { negative: true });
M("critDefenseBreak", "Defense drops after a crit", "pct", 2.4, "defense", "crit", { negative: true });
M("critDurabilityCost", "Crit Extra Durability", "flat", 5, "durability", "crit", { negative: true });
M("bluntCritPct", "Crit Chance Reduction", "pct", 3, "critChance", void 0, { negative: true });
M("lostCritDamagePct", "Critical Damage Reduction", "pct", 2.4, "critDamage", void 0, { negative: true });
M("visionPct", "Obstructed Vision", "pct", 1.6, "flag", void 0, { negative: true });
M("senseReduce", "Reduced Perception", "pct", 1.6, "flag", void 0, { negative: true, effect: "senseReduce" });
M("falseAlert", "False Alert", "pct", 1.4, "flag", void 0, { negative: true });
M("waterBreathingNeg", "Reduced underwater activity", "flag", 16, "flag", void 0, { negative: true, effect: "waterNeg" });
M("fireVulnPct", "Fire Vulnerability", "pct", 2.2, "defense", void 0, { negative: true });
M("iceSlip", "Ice Slip", "pct", 1.2, "flag", void 0, { negative: true });
M("fallDamagePct", "Fall Damage", "pct", 2.4, "flag", void 0, { negative: true });
M("miningSpeedDecay", "Mining Efficiency Decay", "pct", 2, "mining", void 0, { negative: true });
M("mineSlowSelf", "Slowed after Mining", "pct", 2, "effect", void 0, { negative: true, effect: "slowness" });
M("farmlandSlow", "Plowing Speed", "pct", 1.8, "mining", void 0, { negative: true });
M("turnSlow", "Turning Lag", "pct", 1.4, "flag", void 0, { negative: true });
M("runDecayPct", "Sprint Speed Loss", "pct", 1.8, "effect", void 0, { negative: true, effect: "slowness" });
M("sprintStartup", "Sprint Startup Delay", "pct", 1.8, "flag", void 0, { negative: true });
M("luckBreakChance", "Lucky Failure Durability Loss", "pct", 3, "durability", void 0, { negative: true });
M("critSelfDamage", "Crit Reflect Damage", "flat", 6, "proc", "crit", { negative: true, effect: "selfDamage" });
M("curseDamagePerMin", "Continuous Health Drain", "flat", 8, "proc", void 0, { negative: true, effect: "curseDrain" });
M("maxHealthNegPct", "Max Health Reduction", "pct", 3.4, "effect", void 0, { negative: true, effect: "healthNeg" });
M("naturalRegenPct", "Natural Recovery", "pct", 2.4, "effect", void 0, { negative: true, effect: "regenNeg" });
M("bloodLossPct", "Blood Loss", "pct", 3, "proc", void 0, { negative: true, effect: "bloodLoss" });
M("frailtyPct", "Fatal Frailty", "pct", 3, "defense", "selfLowHp", { negative: true });
M("armorBreakVulnPct", "Sunder Vulnerability", "pct", 2.6, "defense", void 0, { negative: true });
M("armorCrackPct", "Armor Split", "pct", 2.8, "defense", "hurtRecent", { negative: true });
M("exposedPct", "Exposed Back", "pct", 2.6, "defense", "behind", { negative: true });
M("lostGuardPct", "Breach", "pct", 2.6, "defense", "combo", { negative: true });
M("openGuardPct", "Opening", "pct", 2.4, "defense", void 0, { negative: true });
M("magicFragilePct", "Arcane Brittleness", "pct", 2.4, "defense", void 0, { negative: true });
M("shockImmobilePct", "Stunned, Cannot Move", "pct", 2, "flag", void 0, { negative: true });
M("mentalFatiguePct", "Mental Fatigue", "pct", 2, "flag", void 0, { negative: true, effect: "debuffUp" });
M("heavyLowerBodyPct", "Heavy Stance", "pct", 1.6, "effect", void 0, { negative: true, effect: "slowness" });
M("actionSlowPct", "Sluggish", "pct", 1.8, "effect", "combo", { negative: true, effect: "slowness" });
M("soilDependencyPct", "Soil Dependency", "pct", 1.8, "mining", void 0, { negative: true });
M("toolJamPct", "Jamming", "pct", 1.8, "mining", void 0, { negative: true });
M("latePlantPct", "Late Sowing", "pct", 1.8, "mining", void 0, { negative: true });
M("unstableVeinPct", "Unstable Vein", "pct", 2.2, "durability", void 0, { negative: true });
M("gluttonyGreedPct", "Overreach Side Effect", "pct", 1.8, "flag", void 0, { negative: true });
M("deathPenaltyPct", "Death Penalty", "pct", 3, "flag", void 0, { negative: true, effect: "deathPenalty" });
M("bindingCurse", "Binding Curse", "flag", 20, "flag", void 0, { negative: true, effect: "binding" });
M("uniqueImmortal", "Undying", "flag", 90, "flag", void 0, { hidden: true, effect: "immortal" });
M("uniqueSoulbound", "Soulbound", "flag", 70, "flag", void 0, { hidden: true, effect: "soulbound" });
M("uniqueGluttony", "Gluttony", "flag", 60, "flag", void 0, { hidden: true, effect: "gluttony" });
M("uniqueTime", "Time", "flag", 75, "proc", void 0, { hidden: true, effect: "time" });
M("uniqueSpace", "Space", "flag", 75, "flag", void 0, { hidden: true, effect: "space" });
M("uniqueEternalNight", "Endless Night", "flag", 80, "offMult", "night", { hidden: true });
M("uniqueSunHeart", "Sun Heart", "flag", 80, "offMult", "day", { hidden: true });
M("uniqueAbyssHeart", "Abyssal Heart", "flag", 80, "offMult", "nether", { hidden: true });
M("specialWorldTree", "World Tree", "flag", 85, "effect", void 0, { hidden: true, effect: "worldTree" });
M("specialHeavenlyThunder", "Sky Thunder", "flag", 88, "proc", void 0, { hidden: true, effect: "lightning" });
M("specialBloodMoon", "Blood Moon", "flag", 82, "offMult", "night", { hidden: true });
M("specialSunGlory", "Sunblaze", "flag", 82, "offMult", "day", { hidden: true });
M("specialAbyss", "Abyss", "flag", 82, "offMult", "nether", { hidden: true });
M("specialSeaGod", "Sea God", "flag", 82, "offMult", "water", { hidden: true });
M("specialSpacetime", "Time-Space", "flag", 78, "flag", void 0, { hidden: true, effect: "space" });
M("specialVoidWalker", "Void Walker", "flag", 76, "flag", void 0, { hidden: true, effect: "voidWalk" });
M("specialDestiny", "Destiny", "flag", 84, "proc", void 0, { hidden: true, effect: "destiny" });
M("specialMiracle", "Miracle", "flag", 92, "proc", void 0, { hidden: true, effect: "miracle" });
M("specialReversal", "Reversal", "flag", 80, "offMult", "selfLowHp", { hidden: true });
M("specialEndless", "Endless", "flag", 86, "offMult", "killStack", { hidden: true });
M("curseBloodThirst", "Bloodthirst Curse", "flag", 40, "offMult", "combo", { hidden: true, effect: "curseBloodThirst" });
M("curseFury", "Curse of Fury", "flag", 30, "flag", void 0, { hidden: true, effect: "curseFury" });
M("curseFrail", "Frail Curse", "flag", 35, "effect", void 0, { hidden: true, effect: "healthNeg" });
M("hiddenSpeciesUndead", "Hidden \u00B7 vs Undead", "pct", 1.6, "offMult", "undead", { hidden: true });
M("hiddenSpeciesArthropod", "Hidden\u00B7vs Arthropods", "pct", 1.6, "offMult", "arthropod", { hidden: true });
M("hiddenSpeciesIllager", "Hidden \u00B7 vs Illagers", "pct", 1.6, "offMult", "illager", { hidden: true });
M("hiddenSpeciesAquatic", "Hidden \u00B7 Aquatic", "pct", 1.6, "offMult", "aquatic", { hidden: true });
M("hiddenSpeciesNether", "Hidden\u00B7Vs. Nether Mobs", "pct", 1.6, "offMult", "nethermob", { hidden: true });
M("hiddenLuck", "Hidden \u00B7 Lucky", "pct", 2.4, "drop", void 0, { hidden: true });
M("hiddenGreed", "Hidden\u00B7Greed", "pct", 2, "drop", void 0, { hidden: true });
M("hiddenAwakenNight", "Hidden\u00B7Night Awakening", "flag", 60, "offMult", "night", { hidden: true });
M("hiddenAwakenBlood", "Hidden \u00B7 Blood Memory", "flag", 55, "lifesteal", void 0, { hidden: true });
M("hiddenAwakenAbyss", "Hidden \u00B7 Abyssal Whisper", "flag", 58, "offMult", "nether", { hidden: true });
M("hiddenAwakenHunt", "Hidden\u00B7Hunting Instinct", "flag", 56, "offMult", "far", { hidden: true });
M("hiddenAwakenEarth", "Hidden \u00B7 Earth Resonance", "flag", 54, "mining", void 0, { hidden: true });
M("hiddenAwakenStar", "Hidden \u00B7 Starlight Guidance", "flag", 57, "drop", void 0, { hidden: true });
M("hiddenAwakenFate", "Hidden \u00B7 Thread of Fate", "flag", 62, "proc", void 0, { hidden: true, effect: "destiny" });
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
  // ---------------- 1. Attack ----------------
  P("sharpness", "Sharp", MELEE, [m("attackPct", L(12, 8))], 100, "common"),
  P("smash", "Slam", MELEE, [m("flatDamage", L(1, 1))], 100, "common"),
  P("strong_attack", "Assault", MELEE, [m("meleePct", L(8, 6))], 100, "common"),
  P("heavy_blow", "Heavy Strike", MELEE, [m("chargedBonusPct", L(15, 11))], 90, "fine"),
  P("pierce", "Puncture", MELEE, [m("armorPenPct", L(8, 5))], 90, "fine"),
  P("sunder", "Sunder", MELEE, [m("sunderPct", L(6, 4))], 90, "fine"),
  P("tear", "Laceration", MELEE, [m("bleedDps", L(1, 1))], 80, "fine"),
  P("execute", "Execute", MELEE, [m("executePct", L(20, 12))], 70, "rare"),
  P("hunt_move", "Hunt", MELEE, [m("chasePct", L(10, 7))], 80, "fine"),
  P("slaughter", "Slaughter", MELEE, [m("killStackPct", L(4, 3))], 70, "rare"),
  P("fighting_spirit", "Battle Spirit", MELEE, [m("rampagePct", L(3, 2.5))], 80, "fine"),
  P("berserk", "Berserk", MELEE, [m("berserkPct", L(20, 14))], 60, "epic"),
  P("vengeance", "Vengeance", MELEE, [m("vengeancePct", L(10, 7))], 80, "fine"),
  P("wild_hunt", "Wild Hunt", MELEE, [m("killCritPct", L(10, 7))], 70, "rare"),
  P("assault", "Assault", MELEE, [m("knockbackPct", L(20, 15))], 90, "common"),
  P("stagger", "Shock", MELEE, [m("staggerChance", L(4, 3))], 70, "rare"),
  P("shockwave", "Shockwave", MELEE, [m("slowOnHit", L(1, 0.5))], 90, "common"),
  P("break_momentum", "Momentum Break", MELEE, [m("weakenOnHit", L(1, 0.5))], 90, "common"),
  P("suppress", "Suppression", MELEE, [m("elitePct", L(10, 8))], 70, "rare"),
  P("giant_hunter", "Behemoth Hunter", MELEE, [m("giantPct", L(10, 8))], 70, "rare"),
  // ---------------- 2. Critical Hit ----------------
  P("crit", "Crit", MELEE, [m("critChance", L(4, 3))], 100, "common"),
  P("lethal", "Lethal", MELEE, [m("critDamage", L(12, 8))], 100, "common"),
  P("precise", "Precision", MELEE, [m("critChance", L(3, 2.5)), m("critDamage", L(5, 4))], 90, "fine"),
  P("weakspot_insight", "Weakness Insight", MELEE, [m("lowHpCrit", L(6, 4))], 80, "fine"),
  P("lethal_pursuit", "Deadly Pursuit", MELEE, [m("lowHpCrit", L(8, 5))], 70, "rare"),
  P("combo", "Combo", MELEE, [m("doubleStrikeChance", L(5, 4))], 80, "fine"),
  P("double_blade", "Double Strike", MELEE, [m("doubleStrikeChance", L(8, 5))], 60, "epic"),
  P("lucky_strike", "Lucky Strike", MELEE, [m("luckyChance", L(1, 1))], 40, "epic"),
  P("hunter_heart", "Hunter's Heart", MELEE, [m("hunterHeartCrit", L(6, 4))], 70, "rare"),
  P("backstab", "Backstab", MELEE, [m("backstabPct", L(12, 9))], 70, "rare"),
  P("finisher", "Finisher", MELEE, [m("finisherChance", L(5, 3))], 50, "epic"),
  // ---------------- 3. Attack Speed ----------------
  P("swift", "Swift", MELEE_TOOLS, [m("attackSpeedPct", L(8, 5))], 100, "common", 0.12, ["heavy", "dull", "sluggish"]),
  P("gale", "Gale", MELEE, [m("comboAtkSpeed", L(4, 3))], 90, "fine"),
  P("chain_slash", "Combo Slash", MELEE, [m("comboAtkSpeed", L(5, 3.5))], 90, "fine"),
  P("agile", "Nimble", MELEE, [m("attackSpeedPct", L(6, 4))], 100, "common", 0.12, ["heavy", "dull", "sluggish"]),
  P("extreme_speed", "Haste", MELEE, [m("burstSpeedPct", L(15, 9))], 70, "rare", 0.15, ["heavy", "dull", "sluggish"]),
  P("wild_dance", "Frenzy", MELEE, [m("dancePct", L(8, 5))], 80, "fine"),
  P("first_strike", "First Strike", MELEE, [m("firstStrikePct", L(12, 9))], 80, "fine"),
  P("follow_up", "Pursuit", MELEE, [m("followUpSpeedPct", L(6, 4))], 80, "fine"),
  // ---------------- 4. Health and Lifesteal ----------------
  P("lifesteal", "Lifesteal", MELEE, [m("lifesteal", L(3, 2))], 90, "fine"),
  P("strong_lifesteal", "Greater Lifesteal", MELEE, [m("lifesteal", L(5, 3))], 60, "epic"),
  P("soul_drain", "Soul Siphon", MELEE, [m("killHeal", L(1, 1))], 80, "fine"),
  P("hunt_recovery", "Hunt Recovery", MELEE, [m("killHeal", L(1, 0.5))], 90, "common"),
  P("blood_power", "Blood Power", MELEE, [m("bloodPowerPct", L(5, 4))], 70, "rare"),
  P("life", "Health", ARMOR, [m("maxHealthPct", L(5, 4))], 100, "common"),
  P("vitality", "Vitality", ["chest", "legs"], [m("regenPct", L(10, 8))], 90, "fine"),
  P("regeneration", "Regeneration", ["chest", "legs", "head"], [m("regenFlat", L(0.2, 0.2))], 80, "fine"),
  P("unyielding", "Unyielding", ["chest", "legs"], [m("lowHpDefense", L(8, 6))], 80, "fine"),
  P("blood_pool", "Blood Pool", MELEE, [m("bloodPool", L(1, 1))], 60, "epic"),
  P("life_shield", "Health Shield", ARMOR, [m("highHpShield", L(2, 1.5))], 70, "rare"),
  P("rejuvenate", "Rejuvenation", ARMOR, [m("outOfCombatRegen", L(10, 8))], 80, "fine"),
  // ---------------- 5. Defense ----------------
  P("bulwark", "Bulwark", CH, [m("defensePct", L(8, 6))], 100, "common"),
  P("iron_wall", "Iron Wall", CH, [m("flatReduce", L(1, 1))], 80, "fine"),
  P("tough", "Toughness", ["chest", "legs"], [m("resistPct", L(4, 3))], 100, "common"),
  P("shield", "Shield", CH, [m("shieldChance", L(6, 4))], 80, "fine"),
  P("absorb", "Absorb", CH, [m("absorbFlat", L(2, 2))], 80, "fine"),
  P("deflect", "Deflect", ["chest", "head"], [m("deflectPct", L(8, 6))], 80, "fine"),
  P("block", "Block", SD, [m("blockPct", L(8, 6))], 100, "common"),
  P("guard", "Guard", SD, [m("guardReducePct", L(6, 4))], 90, "fine"),
  P("immovable", "Immovable", CH, [m("standStillDefense", L(6, 4))], 70, "rare"),
  P("counter", "Counter", SD, [m("counterPct", L(8, 6))], 80, "fine"),
  P("guard_heart", "Guarding Heart", CH, [m("lastStandChance", L(6, 4))], 50, "epic"),
  P("watch", "Watch", ARMOR, [m("watchDefense", L(5, 4))], 80, "fine"),
  // ---------------- 6. Movement ----------------
  P("swift_step", "Sprint", FE, [m("moveSpeedPct", L(5, 3))], 100, "common", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  P("dash", "Sprint", FE, [m("sprintSpeedPct", L(6, 4))], 100, "common"),
  P("light_feather", "Light Feather", FE, [m("fallReducePct", L(15, 9))], 90, "fine"),
  P("leap", "Leap", FE, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, ["clumsy", "bind_chest", "bulky"]),
  P("wind_walk", "Windrider", FE, [m("sprintSpeedPct", L(5, 3.5))], 90, "fine"),
  P("chase_wind", "Windchaser", FE, [m("hurtSpeedPct", L(8, 6))], 80, "fine"),
  P("flash_raid", "Blitz", FE, [m("hurtSpeedPct", L(6, 4))], 90, "common"),
  P("escape", "Escape", FE, [m("hurtSpeedPct", L(10, 7))], 80, "fine"),
  P("agility", "Agile", FE, [m("turnAgilityPct", L(10, 7))], 90, "common"),
  P("swim_swift", "Swift Swim", FE, [m("waterSpeedPct", L(10, 7))], 90, "common"),
  P("deep_dive", "Deep Dive", FE, [m("swimPct", L(12, 8))], 90, "common"),
  P("fire_walk", "Fire Walk", FE, [m("fireResistPct", L(10, 7))], 90, "common"),
  // ---------------- 7. Element · Fire ----------------
  P("scorch", "Scorching", MELEE, [m("fireChance", L(10, 7))], 90, "fine"),
  P("flame", "Flame", MELEE, [m("fireDuration", L(1, 1))], 90, "fine"),
  P("blazing", "Blazing", MELEE, [m("burningTargetPct", L(8, 6))], 80, "fine"),
  P("fire_seed", "Tinder", MELEE, [m("fireGround", L(1, 0.5))], 60, "epic"),
  P("deflagrate", "Deflagrate", MELEE, [m("fireBurst", L(6, 4))], 80, "fine"),
  P("fire_sea", "Inferno", MELEE, [m("fireSeaPct", L(10, 7))], 60, "epic"),
  P("molten", "Molten", MELEE, [m("moltenPct", L(8, 6))], 70, "rare"),
  // ---------------- 8. Element · Frost ----------------
  P("chill", "Chilling", MELEE, [m("iceChance", L(12, 8))], 90, "fine"),
  P("extreme_cold", "Frigid", MELEE, [m("slowAmp", L(1, 0.5))], 80, "fine"),
  P("freeze", "Freeze", MELEE, [m("freezeChance", L(3, 3))], 50, "epic"),
  P("ice_burst", "Ice Burst", MELEE, [m("frozenTargetPct", L(10, 8))], 80, "fine"),
  P("chill_aura", "Chill", ARMOR, [m("chillAura", L(1, 0.5))], 60, "epic"),
  P("ice_armor", "Ice Armor", ARMOR, [m("iceArmorPct", L(6, 4))], 80, "fine"),
  P("eternal_frost", "Eternal Frost", MELEE, [m("frostExtendPct", L(10, 8))], 70, "rare"),
  // ---------------- 9. Element · Lightning ----------------
  P("thunder", "Thunder", MELEE, [m("lightningChance", L(4, 3))], 60, "epic"),
  P("shock", "Shock", MELEE, [m("shockAmp", L(1, 0.5))], 80, "fine"),
  P("chain_lightning", "Chain Lightning", MELEE, [m("chainChance", L(6, 4))], 70, "rare"),
  P("thunderstorm", "Thunderstorm", MELEE, [m("stormCharge", L(3, 2))], 60, "epic"),
  P("thunder_mark", "Lightning Scar", MELEE, [m("thunderMarkPct", L(8, 6))], 70, "rare"),
  P("overload_thunder", "Overload", MELEE, [m("overloadPct", L(10, 8))], 70, "rare"),
  P("judgment", "Heaven's Wrath", MELEE, [m("judgmentPct", L(10, 8))], 60, "epic"),
  // ---------------- 10. Element · Poison ----------------
  P("poison_blade", "Poison Blade", MELEE, [m("poisonChance", L(12, 8))], 90, "fine"),
  P("corrode", "Corrosion", MELEE, [m("corrodeAmp", L(1, 0.5))], 80, "fine"),
  P("strong_poison", "Venom", MELEE, [m("poisonAmp", L(1, 0.5))], 80, "fine"),
  P("poison_burst", "Poison Burst", MELEE, [m("poisonBurst", L(8, 6))], 80, "fine"),
  P("poison_cloud", "Poison Mist", MELEE, [m("poisonCloud", L(1, 0.5))], 60, "epic"),
  P("snake_bite", "Serpent's Kiss", MELEE, [m("snakeBitePct", L(8, 6))], 70, "rare"),
  // ---------------- 11. Crowd Control ----------------
  P("slow", "Slowness", MELEE, [m("slowOnHit", L(1, 0.5))], 100, "common"),
  P("weaken", "Weakness", MELEE, [m("weakenOnHit", L(1, 0.5))], 100, "common"),
  P("stun", "Stun", MELEE, [m("stunChance", L(3, 2))], 60, "epic"),
  P("bind", "Binding", MELEE, [m("rootChance", L(4, 3))], 60, "epic"),
  P("fear", "Fear", MELEE, [m("fearChance", L(3, 2))], 70, "rare"),
  P("silence", "Silence", MELEE, [m("silenceChance", L(4, 3))], 60, "epic"),
  P("break_stance", "Momentum Break", MELEE, [m("sunderOnHit", L(1, 0.5))], 90, "common"),
  P("dispel", "Dispel", MELEE, [m("dispelChance", L(5, 3))], 60, "epic"),
  // ---------------- 12. Area ----------------
  P("sweep", "Sweep", MELEE, [m("sweepPct", L(20, 12))], 80, "fine"),
  P("quake", "Quake", MELEE, [m("quakePct", L(15, 10))], 80, "fine"),
  P("fissure", "Earthshatter", MELEE, [m("fissurePct", L(20, 12))], 70, "rare"),
  P("whirlwind", "Whirlwind", MELEE, [m("whirlwindChance", L(5, 3))], 70, "rare"),
  P("explode", "Explosive", MELEE, [m("explodePct", L(10, 7))], 80, "fine"),
  P("chain_hit", "Chain Strike", MELEE, [m("chainHitPct", L(12, 8))], 80, "fine"),
  P("storm", "Storm", MELEE, [m("stormAoePct", L(18, 10))], 70, "rare"),
  P("earth_split", "Earthsplit", MELEE, [m("earthSplitPct", L(15, 10))], 70, "rare"),
  /* ====================== Part 2: Sword Only ====================== */
  P("sword_intent", "Sword Intent", SW, [m("swordIntentPct", L(8, 6))], 100, "common"),
  P("quick_blade", "Quick Blade", SW, [m("quickBladePct", L(8, 5))], 90, "fine"),
  P("breaker", "Army Breaker", SW, [m("breakerPct", L(10, 8))], 70, "rare"),
  P("behead", "Decapitate", SW, [m("beheadPct", L(15, 12))], 60, "epic"),
  P("double_slash", "Double Slash", SW, [m("doubleSlashChance", L(5, 4))], 70, "rare"),
  P("spin_blade", "Whirl Blade", SW, [m("spinBladeChance", L(4, 3))], 70, "rare"),
  P("sword_qi", "Blade Qi", SW, [m("swordQiPct", L(10, 7))], 60, "epic"),
  P("flying_blade", "Flying Blade", SW, [m("flyingBladePct", L(8, 6))], 60, "epic"),
  P("blood_blade", "Blood Blade", SW, [m("bloodBladeHeal", L(1, 1))], 70, "rare"),
  P("soul_hunt", "Soul Hunt", SW, [m("soulStackPct", L(4, 3))], 50, "epic"),
  P("mad_sword", "Frenzied Blade", SW, [m("frenzyPct", L(6, 4))], 70, "rare"),
  P("peerless", "Peerless", SW, [m("peerlessPct", L(8, 5))], 40, "legendary"),
  /* ====================== Part 3: Axe Only ====================== */
  P("heavy_axe", "Heavy Axe", AX, [m("attackPct", L(10, 7)), m("knockbackPct", L(15, 10))], 100, "common"),
  P("swift_chop", "Quick Slash", AX, [m("miningSpeedPct", L(8, 6))], 100, "common"),
  P("lumber", "Logging", AX, [m("woodMasterPct", L(10, 7))], 100, "common", 0.12, ["blunt"]),
  P("tree_feller", "Timber", AX, [m("treeFeller", L(1, 0.5))], 60, "epic"),
  P("reclaim", "Pioneer", AX, [m("aoeBreak", L(1, 0.5))], 70, "rare"),
  P("bone_break", "Bone Break", AX, [m("boneBreakChance", L(5, 4))], 80, "fine"),
  P("shield_break", "Shield Break", AX, [m("shieldBreakPct", L(8, 6))], 70, "rare"),
  P("cleave", "Cleave", AX, [m("cleavePct", L(8, 6))], 70, "rare"),
  P("mighty_chop", "Cleave", AX, [m("mightyChopPct", L(20, 14))], 50, "epic"),
  P("wood_master", "Master Carpenter", AX, [m("extraDropPct", L(8, 6))], 80, "fine"),
  P("frenzy_chop", "Frenzy Chop", AX, [m("frenzyChopPct", L(8, 6))], 70, "rare"),
  /* ====================== Part 4: Pickaxe Only ====================== */
  P("swift_dig", "Quick Dig", PK, [m("miningSpeedPct", L(10, 7))], 100, "common", 0.12, ["dull_pick"]),
  P("ore_vein", "Ore Vein", PK, [m("oreDropPct", L(8, 6))], 90, "fine"),
  P("lucky_miner", "Lucky Miner", PK, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("refine", "Refined", PK, [m("smeltChance", L(5, 3))], 70, "rare"),
  P("chain_mine", "Chain Mining", PK, [m("chainMine", L(1, 0.5))], 60, "epic"),
  P("aoe_mine", "Area Mining", PK, [m("aoeMine", L(1, 0.5))], 70, "rare"),
  P("deep_dig", "Deep Dig", PK, [m("deepMinePct", L(10, 7))], 90, "fine"),
  P("miner_eye", "Miner's Eye", PK, [m("minerEye", L(1, 0.5))], 60, "epic"),
  P("treasure", "Treasure Hunter", PK, [m("treasureChance", L(3, 2))], 60, "epic"),
  P("solid", "Sturdy", MELEE_TOOLS.concat(ARMOR), [m("durabilitySave", L(10, 8))], 100, "common", 0.12, ["fragile", "brittle", "fragile_pick"]),
  P("rapid_mine", "Haste Mining", PK, [m("rapidMinePct", L(8, 6))], 70, "rare"),
  P("earth_vein", "Ley Line", PK, [m("earthVeinChance", L(5, 4))], 50, "epic"),
  /* ====================== Part 5: Shovel Only ====================== */
  P("swift_shovel", "Swift Mining", SH, [m("miningSpeedPct", L(10, 7))], 100, "common"),
  P("shovel_aoe", "Area Shovel", SH, [m("aoeMine", L(1, 0.5))], 70, "rare"),
  P("sand_master", "Sand Master", SH, [m("sandMasterPct", L(10, 7))], 90, "fine"),
  P("soil_master", "Land Master", SH, [m("soilMasterPct", L(10, 7))], 90, "fine"),
  P("treasure_hunter", "Treasure Hunter", SH, [m("treasureChance", L(3, 2))], 70, "rare"),
  P("archaeology", "Archaeology", SH, [m("archaeologyChance", L(3, 2))], 70, "rare"),
  P("loosen_soil", "Loosening", SH, [m("tillPct", L(8, 6))], 90, "fine"),
  P("geologist", "Geologist", SH, [m("geologistChance", L(5, 4))], 50, "epic"),
  /* ====================== Part 6: Hoe Only ====================== */
  P("harvest", "Harvest", HO, [m("harvestPct", L(10, 7))], 100, "common", 0.12, ["barren"]),
  P("lucky_farmer", "Lucky Farmer", HO, [m("extraDropPct", L(8, 6))], 90, "fine"),
  P("auto_replant", "Auto Replant", HO, [m("autoReplant", L(1, 0))], 70, "rare"),
  P("shennong", "Harvest God", HO, [m("harvestPct", L(15, 9))], 60, "epic"),
  P("lush", "Lush", HO, [m("growthPct", L(10, 8))], 90, "fine", 0.12, ["greedy_grow"]),
  P("earth_gift", "Earth's Bounty", HO, [m("farmlandRange", L(1, 0.5))], 70, "rare"),
  P("fast_till", "Quick Till", HO, [m("fastTillPct", L(8, 6))], 90, "fine"),
  P("seed_master", "Seed Master", HO, [m("seedMasterPct", L(8, 6))], 90, "fine"),
  P("abundant", "Bounty", HO, [m("abundantChance", L(8, 6))], 70, "rare"),
  P("eternal_farm", "Everlasting Farm", HO, [m("eternalFarm", L(1, 0))], 50, "epic"),
  /* ====================== Part 7: Bow Only ====================== */
  P("strong_bow", "Strong Bow", BW, [m("bowDamagePct", L(10, 7))], 100, "common"),
  P("sniper", "Snipe", BW, [m("sniperPct", L(10, 7))], 90, "fine"),
  P("pierce_arrow", "Piercing", BW, [m("arrowPierce", L(1, 0.5))], 70, "rare"),
  P("split_arrow", "Split", BW, [m("splitArrowChance", L(5, 4))], 60, "epic"),
  P("multi_shot", "Multi-Shot", BW, [m("multiShot", L(1, 0.5))], 50, "epic"),
  P("explosive_arrow", "Blast Arrow", BW, [m("explosiveArrowPct", L(10, 7))], 60, "epic"),
  P("flame_arrow", "Flame Arrow", BW, [m("flameArrowChance", L(8, 6))], 80, "fine"),
  P("ice_arrow", "Ice Bolt", BW, [m("iceArrowChance", L(8, 6))], 80, "fine"),
  P("thunder_arrow", "Lightning Bolt", BW, [m("thunderArrowChance", L(5, 4))], 60, "epic"),
  P("homing_arrow", "Tracking", BW, [m("homingArrow", L(1, 0.5))], 40, "legendary"),
  P("fast_string", "Quickstring", BW, [m("drawSpeedPct", L(8, 6))], 90, "fine"),
  P("steady_string", "Steady String", BW, [m("steadyAimPct", L(8, 6))], 90, "fine"),
  P("deadly_arrow", "Deadly Arrow", BW, [m("deadlyArrowPct", L(6, 4))], 80, "fine"),
  P("hunter", "Hunter", BW, [m("hunterPct", L(8, 6))], 90, "fine"),
  /* ====================== Part 8: Crossbow Only ====================== */
  P("heavy_crossbow", "Heavy Crossbow", CB, [m("heavyCrossbowPct", L(12, 8))], 100, "common"),
  P("armor_pierce", "Armor Pierce", CB, [m("armorPierceArrowPct", L(10, 7))], 90, "fine"),
  P("fast_reload", "Fast Load", CB, [m("reloadSpeedPct", L(10, 7))], 90, "fine"),
  P("multi_bolt", "Multishot", CB, [m("multiBolt", L(1, 0.5))], 50, "epic"),
  P("blast_bolt", "Blast", CB, [m("blastBoltPct", L(10, 7))], 60, "epic"),
  P("formation_break", "Formation Break", CB, [m("formationBreakPct", L(8, 6))], 70, "rare"),
  P("snipe_kill", "Snipe", CB, [m("snipeKillPct", L(12, 9))], 60, "epic"),
  P("rapid_fire", "Rapid Fire", CB, [m("rapidFirePct", L(10, 7))], 70, "rare"),
  P("stability", "Steadfast", CB, [m("stabilityPct", L(8, 6))], 90, "fine"),
  /* ====================== Part 9: Trident Only ====================== */
  P("sea_god", "Sea God", TR, [m("seaGodPct", L(10, 8))], 100, "common"),
  P("tide", "Tide", TR, [m("tidePct", L(8, 6))], 90, "fine"),
  P("storm_env", "Thunderstorm", TR, [m("stormEnvPct", L(10, 7))], 80, "fine"),
  P("thunder_trident", "Thunder", TR, [m("thunderPct", L(5, 4))], 60, "epic"),
  P("return_flow", "Backflow", TR, [m("returnSpeedPct", L(10, 8))], 90, "fine"),
  P("sea_pierce", "Sea Piercer", TR, [m("seaPiercePct", L(8, 6))], 90, "fine"),
  P("deep_hunter", "Deep-Sea Hunter", TR, [m("deepHunterPct", L(10, 7))], 90, "fine"),
  P("storm_trident", "Storm", TR, [m("stormBurstPct", L(10, 7))], 70, "rare"),
  P("surge", "Surge", TR, [m("surgeKnockback", L(15, 10))], 90, "fine"),
  /* ====================== Part 10: Shield Only ====================== */
  P("iron_shield", "Iron Shield", SD, [m("ironShieldPct", L(8, 6))], 100, "common"),
  P("sturdy_shield", "Sturdy Shield", SD, [m("shieldSavePct", L(10, 7))], 90, "fine"),
  P("rebound", "Rebound", SD, [m("reboundPct", L(10, 7))], 80, "fine"),
  P("thorn_shield", "Thorns Shield", SD, [m("thornShieldPct", L(10, 7))], 80, "fine"),
  P("shield_bash", "Shield Bash", SD, [m("shieldBashPct", L(10, 8))], 80, "fine"),
  P("charge", "Ram", SD, [m("chargeKnockback", L(20, 15))], 90, "common"),
  P("guard_field", "Guardian Domain", SD, [m("guardFieldPct", L(8, 6))], 60, "epic"),
  P("perfect_block", "Perfect Block", SD, [m("perfectBlockChance", L(4, 3))], 40, "legendary"),
  /* ====================== Part 11: Helmet ====================== */
  P("steadfast", "Resolve", HE, [m("damageReduceHead", L(8, 6))], 100, "common"),
  P("insight", "Insight", HE, [m("insightFlat", L(2, 2))], 90, "fine"),
  P("night_vision", "Night Vision", HE, [m("nightVision", F(1))], 70, "rare"),
  P("water_breathing", "Water Breathing", HE, [m("waterBreathing", F(1))], 70, "rare"),
  P("deep_vision", "Deep Sea Vision", HE, [m("deepVision", F(1))], 70, "rare"),
  P("spirit", "Spirit", HE, [m("debuffReduce", L(10, 8))], 90, "fine"),
  P("will", "Will", HE, [m("controlResist", L(10, 8))], 80, "fine"),
  P("danger_sense", "Danger Sense", HE, [m("dangerSense", F(1))], 80, "fine"),
  P("undead_sense", "Undead Sense", HE, [m("undeadSense", F(1))], 80, "fine"),
  P("monster_lore", "Monster Lore", HE, [m("monsterLorePct", L(8, 6))], 70, "rare"),
  P("soul_eye", "Soul Eye", HE, [m("soulEye", F(1))], 50, "epic"),
  /* ====================== Part 12: Chestplate ====================== */
  P("chest_bulwark", "Bulwark", CH, [m("defensePct", L(8, 6))], 100, "common"),
  P("chest_iron_wall", "Iron Wall", CH, [m("flatReduce", L(1, 1))], 90, "fine"),
  P("heavy_armor", "Heavy Armor", CH, [m("heavyArmorPct", L(10, 7))], 80, "fine"),
  P("life_core", "Life Core", CH, [m("lifeCorePct", L(8, 6))], 90, "fine"),
  P("shield_core", "Shield Core", CH, [m("shieldCore", L(6, 4))], 70, "rare"),
  P("chest_absorb", "Absorb", CH, [m("absorbFlat", L(2, 2))], 90, "fine"),
  P("thorns", "Thorns", CH, [m("thornsPct", L(10, 8))], 90, "fine"),
  P("regen_core", "Regen Core", CH, [m("regenCorePct", L(8, 6))], 90, "fine"),
  P("guard_heart_chest", "Guardian Heart", CH, [m("guardHeartPct", L(8, 6))], 80, "fine"),
  P("vengeance_heart", "Heart of Revenge", CH, [m("vengeanceHeartPct", L(6, 4))], 80, "fine"),
  P("unyielding_core", "Unyielding Core", CH, [m("unyieldingCoreChance", L(6, 4))], 50, "epic"),
  P("element_barrier", "Elemental Barrier", CH, [m("elementBarrierPct", L(8, 6))], 70, "rare"),
  /* ====================== Part 13: Leggings ====================== */
  P("legs_tough", "Toughness", LE, [m("maxHealthPct", L(4, 3))], 100, "common"),
  P("legs_vitality", "Vitality", LE, [m("regenPct", L(8, 6))], 90, "fine"),
  P("stamina", "Endurance", LE, [m("endurancePct", L(10, 7))], 90, "fine"),
  P("war_will", "Warrior's Will", LE, [m("warWillPct", L(3, 2.5))], 80, "fine"),
  P("recovery", "Recovery", LE, [m("outOfCombatRegen", L(10, 7))], 90, "fine"),
  P("persistence", "Perseverance", LE, [m("persistencePct", L(8, 6))], 80, "fine"),
  P("feral", "Wildness", LE, [m("feralPct", L(8, 6))], 80, "fine"),
  P("life_link", "Health Link", LE, [m("damageSpreadPct", L(10, 7))], 70, "rare"),
  P("body", "Constitution", LE, [m("bodyPct", L(10, 7))], 90, "fine"),
  P("warrior_legs", "Warrior's Legs", LE, [m("warriorLegsPct", L(8, 6))], 80, "fine"),
  /* ====================== Part 14: Boots ====================== */
  P("boots_swift", "Sprint", FE, [m("moveSpeedPct", L(5, 3.5))], 100, "common", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  P("boots_dash", "Sprint", FE, [m("sprintSpeedPct", L(6, 4))], 100, "common"),
  P("boots_feather", "Light Feather", FE, [m("fallReducePct", L(15, 9))], 90, "fine"),
  P("boots_leap", "Leap", FE, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, ["clumsy", "bind_chest", "bulky"]),
  P("boots_wind", "Windrider", FE, [m("sprintSpeedPct", L(5, 3.5))], 90, "fine"),
  P("boots_water", "Waterwalk", FE, [m("waterSpeedPct", L(10, 7))], 90, "fine"),
  P("boots_dive", "Deep Dive", FE, [m("swimPct", L(12, 8))], 90, "fine"),
  P("boots_fire", "Fire Walk", FE, [m("fireResistPct", L(10, 7))], 90, "fine"),
  P("boots_ice", "Ice Walk", FE, [m("iceWalkPct", L(15, 9))], 90, "fine"),
  P("dodge", "Evasion", FE, [m("dodgeChance", L(4, 3))], 50, "epic"),
  P("boots_escape", "Escape", FE, [m("hurtSpeedPct", L(10, 7))], 80, "fine"),
  P("light_foot", "Lightfoot", FE, [m("slowResistPct", L(10, 8))], 90, "fine"),
  P("soft_landing", "Swift Landing", FE, [m("landingPct", L(10, 8))], 90, "fine"),
  P("light", "Lightweight", FE, [m("moveSpeedPct", L(6, 4))], 80, "fine", 0.12, ["clumsy", "heavy_chest", "stiff", "clumsy_boots"]),
  /* ============ Part 15: General Resources / Survival ============ */
  P("fortune", "Luck", MELEE_TOOLS, [m("extraDropPct", L(10, 7))], 100, "common"),
  P("gather", "Gathering", TOOLS, [m("gatherPct", L(8, 6))], 90, "fine"),
  P("frugal", "Thrift", MELEE_TOOLS, [m("frugalPct", L(10, 7))], 90, "fine"),
  P("indestructible", "Unbreakable", MELEE_TOOLS, [m("indestructiblePct", L(12, 8))], 60, "epic"),
  P("abundance", "Bounty", MELEE_TOOLS, [m("abundantChance", L(8, 6))], 80, "fine"),
  P("xp_hunter", "XP Hunter", MELEE_TOOLS, [m("xpPct", L(10, 8))], 80, "fine"),
  P("greedy_miner", "Ore Glutton", PK, [m("greedyMinerPct", L(8, 6))], 80, "fine"),
  P("hunter_drop", "Hunter", MELEE, [m("huntDropPct", L(8, 6))], 80, "fine"),
  P("farmer", "Farmer", HO, [m("farmDropPct", L(8, 6))], 80, "fine"),
  P("artisan", "Artisan", TOOLS, [m("artisanChance", L(4, 3))], 50, "epic"),
  /* ---------- Part 16: General Movement and Survival ---------- */
  P("night_walk", "Nightwalker", ARMOR, [m("nightSpeedPct", L(6, 4))], 80, "fine"),
  P("day_walk", "Sun Walk", ARMOR, [m("daySpeedPct", L(6, 4))], 80, "fine"),
  P("wild_adapt", "Wilderness Adaptation", ARMOR, [m("wildAdaptPct", L(6, 4))], 80, "fine"),
  P("cave_walker", "Cave Walker", ARMOR, [m("caveAdaptPct", L(6, 4))], 80, "fine"),
  P("desert_walker", "Desert Walker", FE, [m("desertAdaptPct", L(6, 4))], 80, "fine"),
  P("snow_walker", "Snowfield Walker", FE, [m("snowAdaptPct", L(6, 4))], 80, "fine"),
  P("abyss_adapt", "Abyss Adaptation", ARMOR, [m("netherAdaptPct", L(8, 6))], 70, "rare"),
  P("water_adapt", "Water Adaptation", ARMOR, [m("waterAdaptPct", L(8, 6))], 70, "rare"),
  P("high_altitude", "High-Altitude Adaptation", FE, [m("highAltAdaptPct", L(6, 4))], 80, "fine"),
  /* ======================================================================
   * Fishing Rod Positive (§8.15 · 12 entries)
   * ====================================================================*/
  P("fish_bait", "Rich Bait", FISHING, [m("fishingLuckPct", L(12, 8))], 100, "common", 0.12, ["fish_float_fail"]),
  P("fish_stable_line", "Steady Line", FISHING, [m("varianceReducePct", L(15, 10))], 90, "fine"),
  P("fish_long_cast", "Long Throw", FISHING, [m("treasurePct", L(8, 5))], 90, "fine", 0.12, ["fish_short_cast"]),
  P("fish_fast_reel", "Quick Reel", FISHING, [m("reelSpeedPct", L(12, 8))], 100, "common", 0.12, ["fish_spool_jam", "fish_slow_reel"]),
  P("fish_deep_hunter", "Deepwater Hunter", FISHING, [m("fishingLuckPct", L(10, 7)), m("waterBreathing", F(1))], 70, "rare"),
  P("fish_treasure_hook", "Treasure Hook", FISHING, [m("treasurePct", L(10, 7))], 70, "rare"),
  P("fish_durable_spool", "Durability Spool", FISHING, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["fish_line_break", "fish_line_wear"]),
  P("fish_aroma", "Fish Lure Aroma", FISHING, [m("fishingLuckPct", L(9, 6)), m("cooldownReducePct", L(6, 4))], 80, "fine"),
  P("fish_bycatch", "Bycatch", FISHING, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("fish_quick_unhook", "Quick Unhook", FISHING, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("fish_sonar_float", "Detector Float", FISHING, [m("treasurePct", L(6, 4)), m("insightFlat", F(1))], 60, "epic"),
  P("fish_lucky_angler", "Lucky Angler", FISHING, [m("fishingLuckPct", L(14, 9))], 60, "epic"),
  /* ======================================================================
   * Shears Positive (§8.16 · 12 entries)
   * ====================================================================*/
  P("shear_sharp_blade", "Sharp Shears", SHEARS, [m("shearSpeedPct", L(15, 10))], 100, "common", 0.12, ["shear_blunt"]),
  P("shear_fine_cut", "Fine Cut", SHEARS, [m("shearYieldPct", L(12, 8))], 100, "common"),
  P("shear_wool_master", "Wool Master", SHEARS, [m("shearYieldPct", L(14, 9))], 90, "fine", 0.12, ["shear_wool_waste"]),
  P("shear_leaf_collect", "Leaf Gathering", SHEARS, [m("shearYieldPct", L(10, 7))], 90, "fine"),
  P("shear_vine_reap", "Vine Reaper", SHEARS, [m("shearSpeedPct", L(12, 8))], 90, "fine"),
  P("shear_durable_joint", "Durable Joints", SHEARS, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["shear_nick"]),
  P("shear_silent", "Silent Shears", SHEARS, [m("cooldownReducePct", L(8, 5))], 80, "fine"),
  P("shear_quick_prune", "Swift Pruning", SHEARS, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("shear_fiber_sense", "Fiber Sense", SHEARS, [m("insightFlat", F(1))], 60, "epic"),
  P("shear_precise", "Silk Touch", SHEARS, [m("shearYieldPct", L(11, 7))], 70, "rare"),
  P("shear_lossless", "Lossless Cut", SHEARS, [m("varianceReducePct", L(12, 8))], 80, "fine"),
  P("shear_gardener", "Gardening Expert", SHEARS, [m("harvestPct", L(10, 7))], 70, "rare"),
  /* ======================================================================
   * Brush Positive (§8.17 · 12 entries)
   * ====================================================================*/
  P("brush_fine", "Fine Brush", BRUSH, [m("brushLuckPct", L(12, 8))], 100, "common", 0.12, ["brush_force_loss"]),
  P("brush_antiquarian", "Antiquarian", BRUSH, [m("brushLuckPct", L(14, 9))], 90, "fine"),
  P("brush_steady_hand", "Steady Hand", BRUSH, [m("varianceReducePct", L(15, 10))], 90, "fine"),
  P("brush_bristle", "Brush Durability", BRUSH, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, ["brush_bristle_wear"]),
  P("brush_relic_id", "Relic Appraisal", BRUSH, [m("archaeologyChance", L(6, 4))], 70, "rare"),
  P("brush_dust_recover", "Dust Recovery", BRUSH, [m("extraDropPct", L(10, 7))], 90, "fine"),
  P("brush_precise_arch", "Precise Archaeology", BRUSH, [m("brushLuckPct", L(10, 7))], 90, "fine"),
  P("brush_civ_resonance", "Ancient Civilization Resonance", BRUSH, [m("brushLuckPct", L(13, 9))], 60, "epic"),
  P("brush_light_touch", "Light Brush", BRUSH, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("brush_sediment", "Sediment Expert", BRUSH, [m("brushSpeedPct", L(12, 8))], 90, "fine"),
  P("brush_relic_luck", "Ruin Luck", BRUSH, [m("brushLuckPct", L(15, 10))], 60, "epic"),
  P("brush_detail", "Keen Eye", BRUSH, [m("insightFlat", F(1))], 60, "epic"),
  /* ======================================================================
   * Flint and Steel Positive (§8.18 · 12 entries)
   * ====================================================================*/
  P("flint_precise", "Precise Ignition", FLINT, [m("igniteChancePct", L(12, 8))], 100, "common", 0.12, ["flint_blunt", "flint_spark_deflect"]),
  P("flint_long_burn", "Long-burning Ember", FLINT, [m("fireDurationPct", L(15, 10))], 100, "common"),
  P("flint_master", "Firestarter", FLINT, [m("igniteChancePct", L(14, 9))], 90, "fine"),
  P("flint_spark_recover", "Spark Recovery", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "fine"),
  P("flint_blaze", "Blazing Insight", FLINT, [m("fireChance", L(8, 5))], 80, "fine"),
  P("flint_damp_proof", "Damp-Proof Flint", FLINT, [m("igniteChancePct", L(10, 7))], 80, "fine"),
  P("flint_reserve", "Tinder Reserve", FLINT, [m("fireDurationPct", L(12, 8))], 80, "fine"),
  P("flint_molten_res", "Molten Resonance", FLINT, [m("moltenPct", L(10, 7))], 70, "rare"),
  P("flint_quick_ignite", "Swift Ignition", FLINT, [m("cooldownReducePct", L(12, 8))], 90, "fine"),
  P("flint_ember_mark", "Ember Mark", FLINT, [m("fireGround", F(1))], 60, "epic"),
  P("flint_heat_grip", "Fireproof Grip", FLINT, [m("fireResistPct", L(10, 7))], 90, "fine", 0.12, ["flint_fragile"]),
  P("flint_campfire", "Campfire Artisan", FLINT, [m("igniteChancePct", L(9, 6))], 80, "fine"),
  /* ==== "Extended Affix Library" Positive 274 entries (§3) ==== */
  P("xp001", "Precise Strike", MELEE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-001"),
  P("xp002", "Momentum Break", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-002"),
  P("xp003", "First Strike", MELEE, [m("firstStrikePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-003"),
  P("xp004", "Pursuit", MELEE, [m("chasePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-004"),
  P("xp005", "Battle Spirit", MELEE, [m("killStackPct", L(4, 3))], 90, "common", 0.12, [], void 0, "P-005"),
  P("xp006", "Execute", MELEE, [m("critChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-006"),
  P("xp007", "Vengeance", MELEE, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-007"),
  P("xp008", "Hunt", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-008"),
  P("xp009", "Heavy Strike", MELEE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-009"),
  P("xp010", "Soul Echo", MELEE, [m("soulPct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-010"),
  P("xp011", "Shockwave", MELEE, [m("attackCooldownPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-011"),
  P("xp012", "Steady Hand", MELEE, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-012"),
  P("xp013", "Sword Intent", SWORD, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-013"),
  P("xp014", "Double Slash", SWORD, [m("comboPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-014"),
  P("xp015", "Whirl Blade", SWORD, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-015"),
  P("xp016", "Blood Blade", SWORD, [m("lifesteal", L(2, 1.2))], 90, "fine", 0.12, [], void 0, "P-016"),
  P("xp017", "Blade Qi", SWORD, [m("aoePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-017"),
  P("xp018", "Decapitate", SWORD, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-018"),
  P("xp019", "Army Breaker", SWORD, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-019"),
  P("xp020", "Hunter's Heart", SWORD, [m("critChance", L(4, 2.5))], 90, "common", 0.12, [], void 0, "P-020"),
  P("xp021", "Peerless", SWORD, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-021"),
  P("xp022", "Quick Blade", SWORD, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-022"),
  P("xp023", "Sword Guard Counter", SWORD, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-023"),
  P("xp024", "Elemental Resonance", SWORD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-024"),
  P("xp025", "Heavy Axe", AXE, [m("knockbackPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-025"),
  P("xp026", "Master Lumberjack", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-026"),
  P("xp027", "Timber", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-027"),
  P("xp028", "Quick Slash", AXE, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-028"),
  P("xp029", "Shield Break", AXE, [m("shieldBreakPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-029"),
  P("xp030", "Bone Break", AXE, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-030"),
  P("xp031", "Cleave", AXE, [m("aoePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-031"),
  P("xp032", "Pioneer", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-032"),
  P("xp033", "Master Carpenter", AXE, [m("woodMasterPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-033"),
  P("xp034", "Cleave", AXE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-034"),
  P("xp035", "Frenzy Chop", AXE, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-035"),
  P("xp036", "Forest Warden", AXE, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-036"),
  P("xp037", "Quick Dig", PICK, [m("miningSpeedPct", L(15, 10))], 90, "rare", 0.12, [], void 0, "P-037"),
  P("xp038", "Ore Vein", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-038"),
  P("xp039", "Lucky Miner", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-039"),
  P("xp040", "Refined", PICK, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-040"),
  P("xp041", "Chain Mining", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-041"),
  P("xp042", "Area Mining", PICK, [m("aoeBreak", F(1))], 90, "rare", 0.12, [], void 0, "P-042"),
  P("xp043", "Sturdy", PICK, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-043"),
  P("xp044", "Miner's Eye", PICK, [m("oreDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-044"),
  P("xp045", "Treasure Hunter", PICK, [m("treasurePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-045"),
  P("xp046", "Deep Dig", PICK, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-046"),
  P("xp047", "Ley Line Resonance", PICK, [m("oreDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-047"),
  P("xp048", "Mining Focus", PICK, [m("miningSpeedPct", L(15, 10))], 90, "common", 0.12, [], void 0, "P-048"),
  P("xp049", "Swift Mining", SHOVEL, [m("miningSpeedPct", L(15, 10))], 90, "rare", 0.12, [], void 0, "P-049"),
  P("xp050", "Area Shovel", SHOVEL, [m("aoeBreak", F(1))], 90, "common", 0.12, [], void 0, "P-050"),
  P("xp051", "Sand Master", SHOVEL, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-051"),
  P("xp052", "Treasure Hunter", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-052"),
  P("xp053", "Archaeologist", SHOVEL, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-053"),
  P("xp054", "Loosening", SHOVEL, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-054"),
  P("xp055", "Geologist", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-055"),
  P("xp056", "Tough Shovel Head", SHOVEL, [m("attackDurabilityCost", L(1, 0.6))], 90, "common", 0.12, [], void 0, "P-056"),
  P("xp057", "Quick Clear", SHOVEL, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-057"),
  P("xp058", "Careful Mining", SHOVEL, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-058"),
  P("xp059", "Earthworks Expert", SHOVEL, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-059"),
  P("xp060", "Surface Treasure Hunt", SHOVEL, [m("treasurePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-060"),
  P("xp061", "Harvest", HOE, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-061"),
  P("xp062", "Lucky Farmer", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-062"),
  P("xp063", "Auto Replant", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-063"),
  P("xp064", "Harvest God", HOE, [m("harvestPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-064"),
  P("xp065", "Lush", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-065"),
  P("xp066", "Earth's Bounty", HOE, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-066"),
  P("xp067", "Quick Till", HOE, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-067"),
  P("xp068", "Seed Master", HOE, [m("harvestPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-068"),
  P("xp069", "Bounty", HOE, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-069"),
  P("xp070", "Everlasting Farm", HOE, [m("harvestPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-070"),
  P("xp071", "Crop Rotation", HOE, [m("harvestPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-071"),
  P("xp072", "Field Warden", HOE, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-072"),
  P("xp073", "Strong Bow", BOW, [m("projectilePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-073"),
  P("xp074", "Snipe", BOW, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-074"),
  P("xp075", "Piercing", BOW, [m("piercePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-075"),
  P("xp076", "Multi-Shot", BOW, [m("multishotPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-076"),
  P("xp077", "Blast Arrow", BOW, [m("aoePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-077"),
  P("xp078", "Flame Arrow", BOW, [m("fireChance", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-078"),
  P("xp079", "Ice Bolt", BOW, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-079"),
  P("xp080", "Lightning Bolt", BOW, [m("lightningChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-080"),
  P("xp081", "Pursuit Arrow", BOW, [m("chasePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-081"),
  P("xp082", "Quickstring", BOW, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-082"),
  P("xp083", "Steady String", BOW, [m("varianceReducePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-083"),
  P("xp084", "Deadly Arrow", BOW, [m("critChance", L(4, 2.5))], 90, "common", 0.12, [], void 0, "P-084"),
  P("xp085", "Heavy Crossbow", CROSSBOW, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-085"),
  P("xp086", "Armor Pierce", CROSSBOW, [m("armorPenPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-086"),
  P("xp087", "Fast Load", CROSSBOW, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-087"),
  P("xp088", "Multishot", CROSSBOW, [m("multishotPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-088"),
  P("xp089", "Blast", CROSSBOW, [m("explosivePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-089"),
  P("xp090", "Formation Break", CROSSBOW, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-090"),
  P("xp091", "Snipe", CROSSBOW, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-091"),
  P("xp092", "Rapid Fire", CROSSBOW, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-092"),
  P("xp093", "Steadfast", CROSSBOW, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-093"),
  P("xp094", "Mechanism Master", CROSSBOW, [m("attackDurabilityCost", L(1, 0.6))], 90, "fine", 0.12, [], void 0, "P-094"),
  P("xp095", "Sky Piercer", CROSSBOW, [m("snipePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-095"),
  P("xp096", "Ammo Recovery", CROSSBOW, [m("ammoPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-096"),
  P("xp097", "Sea God", TRIDENT, [m("waterBreathing", F(1))], 90, "rare", 0.12, [], void 0, "P-097"),
  P("xp098", "Tide", TRIDENT, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-098"),
  P("xp099", "Thunder", TRIDENT, [m("lightningChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-099"),
  P("xp100", "Backflow", TRIDENT, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-100"),
  P("xp101", "Sea Piercer", TRIDENT, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-101"),
  P("xp102", "Deep-Sea Hunter", TRIDENT, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-102"),
  P("xp103", "Surge", TRIDENT, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-103"),
  P("xp104", "Storm", TRIDENT, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-104"),
  P("xp105", "Throw Master", TRIDENT, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-105"),
  P("xp106", "Steady Recovery", TRIDENT, [m("accuracyPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-106"),
  P("xp107", "Tidal Recovery", TRIDENT, [m("waterBreathing", F(1))], 90, "rare", 0.12, [], void 0, "P-107"),
  P("xp108", "Ocean Current Sense", TRIDENT, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-108"),
  P("xp109", "Iron Shield", SHIELD, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-109"),
  P("xp110", "Sturdy Shield", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 90, "common", 0.12, [], void 0, "P-110"),
  P("xp112", "Thorns Shield", SHIELD, [m("vengeancePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-112"),
  P("xp113", "Shield Bash", SHIELD, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-113"),
  P("xp114", "Ram", SHIELD, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-114"),
  P("xp115", "Guard", SHIELD, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-115"),
  P("xp116", "Guardian Domain", SHIELD, [m("defensePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-116"),
  P("xp117", "Perfect Block", SHIELD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-117"),
  P("xp118", "Shield Wall", SHIELD, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-118"),
  P("xp119", "Reflect Barrier", SHIELD, [m("thornsPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-119"),
  P("xp120", "Hold Fast", SHIELD, [m("resistPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-120"),
  P("xp121", "Resolve", HEAD, [m("maxHealthPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-121"),
  P("xp122", "Insight", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-122"),
  P("xp123", "Night Vision", HEAD, [m("nightVision", F(1))], 90, "common", 0.12, [], void 0, "P-123"),
  P("xp124", "Water Breathing", HEAD, [m("waterBreathing", F(1))], 90, "fine", 0.12, [], void 0, "P-124"),
  P("xp125", "Deep Sea Vision", HEAD, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-125"),
  P("xp126", "Spirit", HEAD, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-126"),
  P("xp127", "Will", HEAD, [m("resistPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-127"),
  P("xp128", "Danger Sense", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-128"),
  P("xp129", "Undead Sense", HEAD, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-129"),
  P("xp130", "Monster Lore", HEAD, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-130"),
  P("xp131", "Soul Eye", HEAD, [m("soulPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-131"),
  P("xp132", "Clarity", HEAD, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-132"),
  P("xp133", "Bulwark", CHEST, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-133"),
  P("xp134", "Iron Wall", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-134"),
  P("xp135", "Heavy Armor", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-135"),
  P("xp136", "Life Core", CHEST, [m("defensePct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-136"),
  P("xp137", "Shield Core", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-137"),
  P("xp138", "Absorb", CHEST, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-138"),
  P("xp139", "Thorns", CHEST, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-139"),
  P("xp140", "Regen Core", CHEST, [m("regenPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-140"),
  P("xp141", "Guardian Heart", CHEST, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-141"),
  P("xp142", "Heart of Revenge", CHEST, [m("vengeancePct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-142"),
  P("xp143", "Unyielding Core", CHEST, [m("critChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-143"),
  P("xp144", "Elemental Barrier", CHEST, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-144"),
  P("xp145", "Toughness", LEGS, [m("maxHealthPct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-145"),
  P("xp146", "Vitality", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-146"),
  P("xp147", "Endurance", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-147"),
  P("xp148", "Warrior's Will", LEGS, [m("killStackPct", L(4, 3))], 90, "fine", 0.12, [], void 0, "P-148"),
  P("xp149", "Recovery", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-149"),
  P("xp150", "Perseverance", LEGS, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-150"),
  P("xp151", "Wildness", LEGS, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-151"),
  P("xp152", "Health Link", LEGS, [m("maxHealthPct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-152"),
  P("xp153", "Constitution", LEGS, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-153"),
  P("xp154", "Warrior's Legs", LEGS, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-154"),
  P("xp155", "Long Trek", LEGS, [m("attackCooldownPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-155"),
  P("xp156", "Steady Step", LEGS, [m("attackCooldownPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-156"),
  P("xp157", "Sprint", FEET, [m("moveSpeedPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-157"),
  P("xp158", "Sprint", FEET, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-158"),
  P("xp159", "Light Feather", FEET, [m("fallReducePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-159"),
  P("xp160", "Leap", FEET, [m("jumpPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-160"),
  P("xp161", "Windrider", FEET, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-161"),
  P("xp162", "Waterwalk", FEET, [m("moveSpeedPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-162"),
  P("xp163", "Deep Dive", FEET, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-163"),
  P("xp164", "Fire Walk", FEET, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-164"),
  P("xp165", "Ice Walk", FEET, [m("iceSlip", F(1))], 90, "common", 0.12, [], void 0, "P-165"),
  P("xp166", "Evasion", FEET, [m("dodgeChance", L(4, 2.5))], 90, "fine", 0.12, [], void 0, "P-166"),
  P("xp167", "Escape", FEET, [m("dodgeChance", L(4, 2.5))], 90, "rare", 0.12, [], void 0, "P-167"),
  P("xp168", "Lightfoot", FEET, [m("attackCooldownPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-168"),
  P("xp169", "Elemental Resistance", ARMOR, [m("resistPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-169"),
  P("xp171", "Counterstrike", ARMOR, [m("vengeancePct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-171"),
  P("xp172", "Durability Ward", ARMOR, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-172"),
  P("xp173", "Health Regeneration", ARMOR, [m("maxHealthPct", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-173"),
  P("xp174", "Knockback Resistance", ARMOR, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-174"),
  P("xp175", "Status Resistance", ARMOR, [m("defensePct", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-175"),
  P("xp176", "Combat Adaptation", ARMOR, [m("resistPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-176"),
  P("xp177", "Environmental Adaptation", ARMOR, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-177"),
  P("xp178", "Emergency Shield", ARMOR, [m("defensePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-178"),
  P("xp179", "Recovery", ARMOR, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-179"),
  P("xp180", "Set Resonance", ARMOR, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-180"),
  P("xp181", "Thrift", TOOLS, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-181"),
  P("xp182", "XP Hunter", TOOLS, [m("xpPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-182"),
  P("xp183", "Hunter", TOOLS, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-183"),
  P("xp184", "Gathering Master", TOOLS, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-184"),
  P("xp185", "Quick Hands", TOOLS, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-185"),
  P("xp186", "Steady Grip", TOOLS, [m("accuracyPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-186"),
  P("xp187", "Fine Work", TOOLS, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-187"),
  P("xp188", "Resource Identification", TOOLS, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-188"),
  P("xp189", "Durability Tuning", TOOLS, [m("durabilitySave", L(12, 8))], 90, "common", 0.12, [], void 0, "P-189"),
  P("xp190", "Chain Control", TOOLS, [m("aoeBreak", F(1))], 90, "fine", 0.12, [], void 0, "P-190"),
  P("xp191", "Byproduct", TOOLS, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-191"),
  P("xp192", "Tool Focus", TOOLS, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-192"),
  P("xp193", "Armor Crusher", MACE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-193"),
  P("xp194", "Fall Strike Mastery", MACE, [m("durabilitySave", L(10, 7))], 90, "common", 0.12, [], void 0, "P-194"),
  P("xp195", "Shockwave", MACE, [m("aoePct", L(6, 4))], 90, "common", 0.12, [], void 0, "P-195"),
  P("xp196", "Quake", MACE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-196"),
  P("xp197", "Hammer Charge", MACE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-197"),
  P("xp198", "Shieldbreaker Crush", MACE, [m("shieldBreakPct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-198"),
  P("xp199", "Mace Echo", MACE, [m("attackPct", L(10, 6))], 90, "fine", 0.12, [], void 0, "P-199"),
  P("xp200", "Falling Star", MACE, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-200"),
  P("xp201", "Mighty Knockback", MACE, [m("knockbackPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-201"),
  P("xp202", "Precise Landing", MACE, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-202"),
  P("xp203", "Battlefield Deterrence", MACE, [m("attackPct", L(10, 6))], 90, "rare", 0.12, [], void 0, "P-203"),
  P("xp204", "Hammer Soul", MACE, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-204"),
  P("xp205", "Precise Thrust", SPEAR, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-205"),
  P("xp206", "Charging Pierce", SPEAR, [m("attackPct", L(10, 6))], 90, "common", 0.12, [], void 0, "P-206"),
  P("xp207", "Lance Master", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-207"),
  P("xp208", "Phalanx Spear", SPEAR, [m("defensePct", L(5, 3))], 90, "fine", 0.12, [], void 0, "P-208"),
  P("xp209", "Long-range Suppression", SPEAR, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-209"),
  P("xp210", "Steady Rod", SPEAR, [m("durabilitySave", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-210"),
  P("xp211", "Momentum Recovery", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-211"),
  P("xp212", "Flowing Thrusts", SPEAR, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-212"),
  P("xp213", "Mounted Charge", SPEAR, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-213"),
  P("xp214", "Line Breaker", SPEAR, [m("knockbackPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-214"),
  P("xp215", "Spearhead Resonance", SPEAR, [m("moveSpeedPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-215"),
  P("xp216", "First Strike Lance", SPEAR, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-216"),
  P("xp217", "Rich Bait", FISHING, [m("treasurePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-217"),
  P("xp218", "Steady Line", FISHING, [m("varianceReducePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-218"),
  P("xp219", "Long Throw", FISHING, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-219"),
  P("xp220", "Quick Reel", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-220"),
  P("xp221", "Deepwater Hunter", FISHING, [m("waterBreathing", F(1))], 90, "common", 0.12, [], void 0, "P-221"),
  P("xp222", "Treasure Hook", FISHING, [m("treasurePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-222"),
  P("xp223", "Durability Spool", FISHING, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-223"),
  P("xp224", "Fish Lure Aroma", FISHING, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-224"),
  P("xp225", "Bycatch", FISHING, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-225"),
  P("xp226", "Quick Unhook", FISHING, [m("attackSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-226"),
  P("xp227", "Detector Float", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-227"),
  P("xp228", "Lucky Angler", FISHING, [m("fishingLuckPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-228"),
  P("xp229", "Sharp Shears", SHEARS, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-229"),
  P("xp230", "Fine Cut", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-230"),
  P("xp231", "Wool Master", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-231"),
  P("xp232", "Leaf Gathering", SHEARS, [m("extraDropPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-232"),
  P("xp233", "Vine Reaper", SHEARS, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-233"),
  P("xp234", "Durable Joints", SHEARS, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-234"),
  P("xp235", "Silent Shears", SHEARS, [m("shearYieldPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-235"),
  P("xp236", "Swift Pruning", SHEARS, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-236"),
  P("xp237", "Fiber Sense", SHEARS, [m("attackPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-237"),
  P("xp238", "Silk Touch", SHEARS, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-238"),
  P("xp239", "Lossless Cut", SHEARS, [m("varianceReducePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-239"),
  P("xp240", "Gardening Expert", SHEARS, [m("extraDropPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-240"),
  P("xp241", "Fine Brush", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-241"),
  P("xp242", "Antiquarian", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-242"),
  P("xp243", "Steady Hand", BRUSH, [m("accuracyPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-243"),
  P("xp244", "Brush Durability", BRUSH, [m("durabilitySave", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-244"),
  P("xp245", "Relic Appraisal", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "common", 0.12, [], void 0, "P-245"),
  P("xp246", "Dust Recovery", BRUSH, [m("extraDropPct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-246"),
  P("xp247", "Precise Archaeology", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "fine", 0.12, [], void 0, "P-247"),
  P("xp248", "Ancient Civilization Resonance", BRUSH, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-248"),
  P("xp249", "Light Brush", BRUSH, [m("cooldownReducePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-249"),
  P("xp250", "Sediment Expert", BRUSH, [m("brushLuckPct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-250"),
  P("xp251", "Ruin Luck", BRUSH, [m("archaeologyChance", L(6, 4))], 90, "rare", 0.12, [], void 0, "P-251"),
  P("xp252", "Keen Eye", BRUSH, [m("brushLuckPct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-252"),
  P("xp253", "Precise Ignition", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "rare", 0.12, [], void 0, "P-253"),
  P("xp254", "Long-burning Ember", FLINT, [m("igniteChancePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-254"),
  P("xp255", "Firestarter", FLINT, [m("igniteChancePct", L(12, 8))], 90, "common", 0.12, [], void 0, "P-255"),
  P("xp256", "Spark Recovery", FLINT, [m("cooldownReducePct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-256"),
  P("xp257", "Blazing Insight", FLINT, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-257"),
  P("xp258", "Damp-Proof Flint", FLINT, [m("igniteChancePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-258"),
  P("xp259", "Tinder Reserve", FLINT, [m("igniteChancePct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-259"),
  P("xp260", "Molten Resonance", FLINT, [m("fireChance", L(8, 5))], 90, "common", 0.12, [], void 0, "P-260"),
  P("xp261", "Swift Ignition", FLINT, [m("attackSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-261"),
  P("xp262", "Ember Mark", FLINT, [m("fireChance", L(8, 5))], 90, "fine", 0.12, [], void 0, "P-262"),
  P("xp263", "Fireproof Grip", FLINT, [m("fireChance", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-263"),
  P("xp264", "Campfire Artisan", FLINT, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-264"),
  P("xp265", "Light Wings", ELYTRA, [m("attackPct", L(8, 5))], 90, "rare", 0.12, [], void 0, "P-265"),
  P("xp266", "High-Altitude Stability", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-266"),
  P("xp267", "Dive Hunter", ELYTRA, [m("moveSpeedPct", L(8, 5))], 90, "common", 0.12, [], void 0, "P-267"),
  P("xp268", "Steady Landing", ELYTRA, [m("fallReducePct", L(12, 8))], 90, "fine", 0.12, [], void 0, "P-268"),
  P("xp269", "Windrider Membrane", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-269"),
  P("xp270", "Durable Wings", ELYTRA, [m("durabilitySave", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-270"),
  P("xp271", "Wind Shear", ELYTRA, [m("moveSpeedPct", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-271"),
  P("xp272", "Airflow Sense", ELYTRA, [m("insightFlat", F(1))], 90, "common", 0.12, [], void 0, "P-272"),
  P("xp273", "Long Glide", ELYTRA, [m("snipePct", L(10, 7))], 90, "common", 0.12, [], void 0, "P-273"),
  P("xp274", "Storm Adaptation", ELYTRA, [m("durabilitySave", L(10, 7))], 90, "fine", 0.12, [], void 0, "P-274"),
  P("xp275", "Slow Fall", ELYTRA, [m("fallReducePct", L(12, 8))], 90, "rare", 0.12, [], void 0, "P-275"),
  P("xp276", "Escape Dive", ELYTRA, [m("defensePct", L(5, 3))], 90, "common", 0.12, [], void 0, "P-276"),
  /* ==== Horse Armor / Riding Items Positive ==== */
  P("horse_iron_plate", "Iron Scale Barding", HORSE, [m("defensePct", L(8, 5))], 90, "fine"),
  P("horse_light_barding", "Light Horse Armor", HORSE, [m("moveSpeedPct", L(8, 5))], 90, "fine"),
  P("horse_swift", "Gallop", HORSE, [m("moveSpeedPct", L(10, 7))], 80, "fine"),
  P("horse_stamina", "Enduring Barding", HORSE, [m("durabilitySave", L(12, 8))], 90, "fine"),
  P("horse_shielded", "Loyal Horse Armor", HORSE, [m("defensePct", L(6, 4)), m("maxHealthPct", L(5, 3))], 70, "rare"),
  P("steer_steady", "Steady Helm", STEERING, [m("durabilitySave", L(12, 8))], 90, "fine"),
  P("steer_fast", "Swift Stride", STEERING, [m("moveSpeedPct", L(10, 7))], 90, "fine"),
  P("steer_lucky", "Tailwind", STEERING, [m("cooldownReducePct", L(10, 7))], 80, "fine"),
  P("steer_durable", "Tough Reins", STEERING, [m("indestructiblePct", L(8, 5))], 70, "rare"),
  P("steer_water", "Wading", STEERING, [m("waterBreathing", F(1))], 60, "epic")
];
var NEGATIVE = [
  // ---------------- Attack ----------------
  N("dull", "Sluggish", MELEE, [m("attackSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift", "agile", "extreme_speed"]),
  N("heavy", "Heavy", MELEE, [m("attackSpeedPct", L(-5, -7.5)), m("moveSpeedPct", L(-3, -3))], 90, "fine", 0.12, ["swift", "agile", "extreme_speed"]),
  N("weak", "Weakness", MELEE, [m("attackPct", L(-6, -6.5))], 100, "common"),
  N("imbalance", "Imbalance", MELEE, [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("backlash", "Fury Backlash", MELEE, [m("selfDamageChance", L(1, 1.5))], 70, "rare"),
  N("thirsty", "Thirst", MELEE, [m("hungerDrain", L(8, 10))], 90, "fine"),
  N("fatigue", "Fatigue", MELEE, [m("comboDecayPct", L(4, 5.75))], 90, "fine"),
  N("charge_up", "Charge Lag", MELEE, [m("firstHitDelay", L(5, 7.5))], 90, "fine"),
  N("recoil", "Rebound", MELEE, [m("selfDamageChance", L(1, 1)), m("attackDurabilityCost", L(1, 0.5))], 80, "fine"),
  N("bloodthirst", "Bloodthirst", MELEE, [m("idleDecayPct", L(5, 7.5))], 80, "fine"),
  N("irritable", "Irritable", MELEE, [m("aggroPct", L(10, 10))], 90, "fine"),
  N("erratic", "Out of Control", MELEE, [m("erraticChance", L(3, 2))], 80, "fine"),
  N("frail_strike", "Weakness", MELEE, [m("idleDecayPct", L(3, 4)), m("healingReducePct", L(5, 5))], 80, "fine"),
  // ---------------- Critical Hit ----------------
  N("blunt_sense", "Numbness", MELEE, [m("bluntCritPct", L(4, 4))], 100, "common"),
  N("misaim", "Misfire", MELEE, [m("lostCritDamagePct", L(8, 8))], 100, "common"),
  N("fragile_strike", "Frail Strike", MELEE, [m("critDefenseBreak", L(6, 6))], 80, "fine"),
  N("overload_crit", "Overload", MELEE, [m("critDurabilityCost", L(1, 1))], 80, "fine"),
  N("fatal_cost", "Fatal Price", MELEE, [m("critDurabilityCost", L(1, 0.75)), m("critSelfDamage", L(1, 1))], 70, "rare"),
  N("gamble", "Gamble", MELEE, [m("gambleCrit", L(8, 6)), m("attackPct", L(-6, -5))], 70, "rare"),
  // ---------------- Durability ----------------
  N("fragile", "Fragile", ALL, [m("durabilityMult", L(25, 28.75))], 100, "common", 0.12, ["solid"]),
  N("brittle", "Brittle", ALL, [m("durabilityMult", L(40, 45))], 80, "fine", 0.12, ["solid"]),
  N("corrode_neg", "Corrosion", ALL, [m("durabilityDrain", L(1, 1.5))], 80, "fine"),
  N("self_harm", "Self-Damage", MELEE_TOOLS, [m("skillDurabilityCost", L(2, 2.75))], 80, "fine"),
  N("overload", "Overload", ALL, [m("skillDurabilityCost", L(3, 3.5))], 70, "rare"),
  N("fracture", "Fracture Risk", ALL, [m("fractureChance", L(5, 4.75))], 80, "fine"),
  N("unstable", "Unstable", ALL, [m("unstablePct", L(5, 6))], 80, "fine"),
  N("aging", "Aging", ALL, [m("agingPct", L(4, 5))], 80, "fine"),
  // ---------------- Movement ----------------
  N("clumsy", "Clumsy", ["chest", "legs", "feet"], [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift", "leap", "boots_leap", "stiff"]),
  N("stagger_move", "Stagger", ["legs", "feet"], [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("pressure", "Oppression", ["legs", "feet"], [m("runDecayPct", L(4, 5.75))], 90, "fine"),
  N("inertia", "Inertia", FE, [m("turnSlow", L(10, 10))], 90, "fine"),
  N("bulky", "Heavy", ["legs", "chest"], [m("jumpPct", L(-8, -10))], 90, "fine", 0.12, ["leap", "boots_leap"]),
  N("sink", "Sink", FE, [m("swimPct", L(-12, -10.75))], 90, "fine"),
  N("slip", "Slipping", FE, [m("iceSlip", L(10, 10))], 90, "fine"),
  N("sticky", "Sticky", FE, [m("waterSpeedPct", L(-10, -10))], 80, "fine"),
  // ---------------- Health ----------------
  N("frail_body", "Frail Constitution", ARMOR, [m("maxHealthPct", L(-6, -6))], 100, "common"),
  N("vulnerable", "Vulnerable", ARMOR, [m("damageTakenPct", L(8, 8))], 100, "common"),
  N("brittle_bone", "Brittle Bones", ARMOR, [m("critTakenPct", L(8, 8))], 90, "fine"),
  N("regen_block", "Impaired Regeneration", ARMOR, [m("naturalRegenPct", L(-15, -15))], 90, "fine"),
  N("exhausted", "Exhausted", ARMOR, [m("naturalRegenPct", L(-10, -12))], 90, "fine"),
  N("blood_loss", "Blood Loss", ARMOR, [m("bloodLossPct", L(3, 3))], 70, "rare"),
  N("sickly", "Frail", ARMOR, [m("debuffReduce", L(-10, -10))], 90, "fine"),
  N("fatal_frailty", "Fatal Frailty", ARMOR, [m("frailtyPct", L(8, 8))], 70, "rare"),
  // ---------------- Defense ----------------
  N("armor_break_body", "Sunder", ARMOR, [m("armorBreakVulnPct", L(6, 6))], 90, "fine"),
  N("armor_crack", "Armor Split", CH, [m("armorCrackPct", L(6, 6))], 80, "fine"),
  N("exposed", "Exposed", ARMOR, [m("exposedPct", L(8, 8))], 80, "fine"),
  N("lost_guard", "Breach", CH, [m("lostGuardPct", L(5, 6))], 80, "fine"),
  N("open_guard", "Opening", CH, [m("openGuardPct", L(5, 6))], 80, "fine"),
  N("shock_stun", "Shockwave", ARMOR, [m("shockImmobilePct", L(5, 6))], 80, "fine"),
  N("magic_fragile", "Arcane Brittleness", ARMOR, [m("magicFragilePct", L(6, 6))], 80, "fine"),
  // ---------------- Armor · Helmet ----------------
  N("stuffy", "Swelter", HE, [m("healingReducePct", L(10, 10))], 100, "common"),
  N("dizzy", "Drowsy", HE, [m("visionPct", L(5, 7.5))], 90, "fine"),
  N("hypoxia", "Hypoxia", HE, [m("waterBreathingNeg", L(1, 1))], 80, "fine"),
  N("dull_senses", "Dull Senses", HE, [m("senseReduce", L(10, 10))], 90, "fine"),
  N("mental_fatigue", "Mental Fatigue", HE, [m("mentalFatiguePct", L(6, 6))], 90, "fine"),
  // ---------------- Armor · Chestplate ----------------
  N("heavy_chest", "Heavy", CH, [m("moveSpeedPct", L(-6, -6.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift"]),
  N("bind_chest", "Binding", CH, [m("jumpPct", L(-8, -10))], 90, "fine", 0.12, ["leap", "boots_leap"]),
  N("sluggish", "Sluggish", CH, [m("attackSpeedPct", L(-5, -7.5))], 90, "fine", 0.12, ["swift", "agile", "extreme_speed"]),
  N("overheat", "Overheat", CH, [m("fireVulnPct", L(10, 10))], 90, "fine"),
  N("heavy_press", "Heavy Press", CH, [m("maxHealthPct", L(10, 10)), m("naturalRegenPct", L(-20, -15))], 80, "fine"),
  N("brittle_armor", "Brittle Armor", CH, [m("critTakenPct", L(10, 10))], 80, "fine"),
  // ---------------- Armor · Leggings ----------------
  N("stiff", "Stiff", LE, [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift", "clumsy"]),
  N("fatigue_legs", "Fatigue", LE, [m("sprintHungerDrain", L(10, 10))], 90, "fine"),
  N("leg_bind", "Leggings Restraint", LE, [m("sprintStartup", L(10, 10))], 90, "fine"),
  N("heavy_lower", "Heavy Stance", LE, [m("heavyLowerBodyPct", L(8, 8))], 90, "fine"),
  N("action_slow", "Sluggish", LE, [m("actionSlowPct", L(5, 6))], 80, "fine"),
  // ---------------- Armor · Boots ----------------
  N("clumsy_boots", "Clumsy", FE, [m("moveSpeedPct", L(-5, -7.5))], 100, "common", 0.12, ["swift_step", "light", "boots_swift"]),
  N("water_absorb", "Water Absorb", FE, [m("waterSpeedPct", L(-15, -11.75))], 90, "fine"),
  N("sink_boots", "Sink", FE, [m("swimPct", L(-12, -10.75))], 90, "fine"),
  N("slip_boots", "Slipping", FE, [m("iceSlip", L(10, 10))], 90, "fine"),
  N("thin_sole", "Brittle Base", FE, [m("fallDamagePct", L(15, 11.75))], 90, "fine"),
  N("friction", "Friction Wear", FE, [m("moveDurabilityCost", L(1, 0.5))], 90, "fine"),
  // ---------------- Tool · Pickaxe ----------------
  N("dull_pick", "Blunt Pickaxe", PK, [m("miningSpeedPct", L(-10, -10))], 100, "common", 0.12, ["swift_dig"]),
  N("fragile_pick", "Fragile Pickaxe", PK, [m("durabilityMult", L(30, 28.75))], 100, "common", 0.12, ["solid"]),
  N("hand_shake", "Hand Shock", PK, [m("mineSlowSelf", L(5, 7.5))], 90, "fine"),
  N("greedy_dig", "Greedy Dig", PK, [m("miningSpeedPct", L(15, 11.75)), m("durabilityMult", L(60, 55))], 70, "rare"),
  N("slow_dig", "Lag", PK, [m("miningSpeedDecay", L(4, 5.75))], 90, "fine"),
  N("unstable_vein", "Unstable Vein", PK, [m("unstableVeinPct", L(5, 6))], 80, "fine"),
  // ---------------- Tool · Axe ----------------
  N("blunt", "Blunt", AX, [m("woodMasterPct", L(-12, -10.75))], 100, "common", 0.12, ["lumber"]),
  N("off_center", "Off-Balance", AX, [m("hurtSlowSelf", L(5, 7.5))], 90, "fine"),
  N("easy_break", "Fragile", AX, [m("fractureChance", L(8, 7.5))], 90, "fine"),
  N("overweight", "Too Heavy", AX, [m("woodMasterPct", L(15, 11.75)), m("moveSpeedPct", L(-8, -10))], 80, "fine"),
  // ---------------- Tool · Shovel ----------------
  N("bent_blade", "Bent Shovel Blade", SH, [m("miningSpeedPct", L(-10, -10))], 100, "common"),
  N("soil_dependency", "Soil Dependency", SH, [m("soilDependencyPct", L(6, 6))], 90, "fine"),
  N("easy_jam", "Jamming", SH, [m("toolJamPct", L(5, 6))], 90, "fine"),
  // ---------------- Tool · Hoe ----------------
  N("hardened", "Compaction", HO, [m("farmlandSlow", L(10, 10))], 100, "common"),
  N("barren", "Barren", HO, [m("harvestPct", L(-10, -10))], 100, "common", 0.12, ["harvest"]),
  N("greedy_grow", "Overreach", HO, [m("harvestPct", L(15, 11.75)), m("growthPct", L(-15, -11.75))], 80, "fine", 0.12, ["lush"]),
  N("late_plant", "Late Sowing", HO, [m("latePlantPct", L(6, 6))], 90, "fine"),
  /* ======================================================================
   * Fishing Rod Negative (§8.15 · 16 entries)
   * ====================================================================*/
  N("fish_spool_jam", "Jammed Spool", FISHING, [m("fishingCooldownPct", L(10, 7))], 100, "common", 0.12, ["fish_fast_reel"]),
  N("fish_line_break", "Fragile Line", FISHING, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["fish_durable_spool"]),
  N("fish_float_fail", "Float Failure", FISHING, [m("fishingLuckPct", L(-10, -7))], 90, "fine", 0.12, ["fish_bait"]),
  N("fish_bait_loss", "Bait Loss", FISHING, [m("fishingCooldownPct", L(8, 5))], 90, "fine"),
  N("fish_slow_reel", "Slow Reel", FISHING, [m("reelSpeedPct", L(-10, -7))], 90, "fine", 0.12, ["fish_fast_reel"]),
  N("fish_tangle", "Line Tangle", FISHING, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("fish_short_cast", "Short Throw", FISHING, [m("treasurePct", L(-6, -4))], 80, "fine", 0.12, ["fish_long_cast"]),
  N("fish_water_misjudge", "Water Misjudgment", FISHING, [m("fishingLuckPct", L(-8, -5))], 80, "fine"),
  N("fish_hook_blunt", "Blunted Hook", FISHING, [m("fishingLuckPct", L(-7, -5))], 90, "fine"),
  N("fish_brute_reel", "Forceful Reel", FISHING, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("fish_damp_spool", "Damp Spool", FISHING, [m("fishingCooldownPct", L(9, 6))], 80, "fine"),
  N("fish_loot_drift", "Loot Skew", FISHING, [m("treasurePct", L(-8, -5))], 80, "fine"),
  N("fish_empty_fatigue", "Empty-Cast Fatigue", FISHING, [m("fishingCooldownPct", L(7, 5))], 80, "fine"),
  N("fish_barb", "Barbed Hook", FISHING, [m("moveSpeedPct", L(-6, -4))], 80, "fine"),
  N("fish_reel_noise", "Reel Noise", FISHING, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("fish_line_wear", "Fishing Line Wear", FISHING, [m("durabilityMult", L(15, 10))], 90, "fine", 0.12, ["fish_durable_spool"]),
  /* ======================================================================
   * Shears Negative (§8.16 · 16 entries)
   * ====================================================================*/
  N("shear_blunt", "Blunt Shears", SHEARS, [m("shearSpeedPct", L(-10, -7))], 100, "common", 0.12, ["shear_sharp_blade"]),
  N("shear_nick", "Nicked Edge", SHEARS, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["shear_durable_joint"]),
  N("shear_wool_waste", "Wool Waste", SHEARS, [m("shearYieldPct", L(-10, -7))], 90, "fine", 0.12, ["shear_wool_master"]),
  N("shear_leaf_damage", "Torn Blade", SHEARS, [m("shearYieldPct", L(-8, -5))], 90, "fine"),
  N("shear_knot", "Tangled Line", SHEARS, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("shear_loose_handle", "Loose Shears Handle", SHEARS, [m("durabilityMult", L(15, 10))], 90, "fine"),
  N("shear_fiber_tangle", "Fiber Tangle", SHEARS, [m("shearSpeedPct", L(-8, -5))], 80, "fine"),
  N("shear_low_precision", "Insufficient Precision", SHEARS, [m("shearYieldPct", L(-7, -5))], 80, "fine"),
  N("shear_overcut", "Over-Shearing", SHEARS, [m("shearLossPct", L(10, 7))], 80, "fine"),
  N("shear_fluff_eye", "Fur-Blinded", SHEARS, [m("visionPct", L(8, 5))], 80, "fine"),
  N("shear_high_branch", "High Branch Trouble", SHEARS, [m("shearYieldPct", L(-6, -4))], 80, "fine"),
  N("shear_rust_joint", "Rusted Joints", SHEARS, [m("shearSpeedPct", L(-9, -6))], 80, "fine"),
  N("shear_deflect", "Skewed Shears", SHEARS, [m("shearYieldPct", L(-8, -5))], 80, "fine"),
  N("shear_fiber_waste", "Fiber Waste", SHEARS, [m("shearYieldPct", L(-9, -6))], 80, "fine"),
  N("shear_handle_risk", "Broken Handle Risk", SHEARS, [m("fractureChance", L(6, 4))], 70, "rare"),
  N("shear_weed_block", "Weed Clogging", SHEARS, [m("cooldownReducePct", L(-7, -5))], 80, "fine"),
  /* ======================================================================
   * Brush Negative (§8.17 · 16 entries)
   * ====================================================================*/
  N("brush_bristle_wear", "Bristle Wear", BRUSH, [m("durabilityMult", L(20, 15))], 100, "common", 0.12, ["brush_bristle"]),
  N("brush_loose_handle", "Loose Brush Handle", BRUSH, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("brush_force_loss", "Uncontrolled Force", BRUSH, [m("brushLuckPct", L(-10, -7))], 90, "fine", 0.12, ["brush_fine"]),
  N("brush_dust_eye", "Dust in the Eyes", BRUSH, [m("visionPct", L(8, 5))], 80, "fine"),
  N("brush_bristle_fall", "Loose Bristles", BRUSH, [m("brushLuckPct", L(-9, -6))], 90, "fine"),
  N("brush_mis_touch", "Careless Dig", BRUSH, [m("cooldownReducePct", L(-7, -5))], 80, "fine"),
  N("brush_wrist_fatigue", "Wrist Fatigue", BRUSH, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("brush_relic_scratch", "Relic Scuffing", BRUSH, [m("brushLossPct", L(10, 7))], 80, "fine"),
  N("brush_uneven", "Uneven Bristles", BRUSH, [m("brushLuckPct", L(-8, -5))], 80, "fine"),
  N("brush_dust_accum", "Dust Buildup", BRUSH, [m("brushSpeedPct", L(-9, -6))], 80, "fine"),
  N("brush_fragile_relic", "Fragile Relic", BRUSH, [m("brushLossPct", L(8, 5))], 80, "fine"),
  N("brush_dust_aura", "Dust Aura", BRUSH, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("brush_handle_crack", "Cracked Handle", BRUSH, [m("brushSpeedPct", L(-10, -7))], 80, "fine"),
  N("brush_over_clean", "Overclearing", BRUSH, [m("cooldownReducePct", L(-8, -5))], 80, "fine"),
  N("brush_sediment_block", "Sediment Clog", BRUSH, [m("brushLuckPct", L(-7, -5))], 80, "fine"),
  N("brush_relic_bias", "Relic Misidentification", BRUSH, [m("brushLuckPct", L(-6, -4))], 80, "fine"),
  /* ======================================================================
   * Flint and Steel Negative (§8.18 · 16 entries)
   * ====================================================================*/
  N("flint_blunt", "Dulled Flint", FLINT, [m("igniteCooldownPct", L(10, 7))], 100, "common", 0.12, ["flint_precise"]),
  N("flint_spark_deflect", "Spark Deflection", FLINT, [m("igniteChancePct", L(-10, -7))], 90, "fine", 0.12, ["flint_precise"]),
  N("flint_damp_tinder", "Damp Tinder", FLINT, [m("igniteRiskPct", L(10, 7))], 90, "fine"),
  N("flint_low_fuel", "Low Fuel", FLINT, [m("igniteCooldownPct", L(12, 8))], 90, "fine"),
  N("flint_hot_grip", "Overheated Grip", FLINT, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("flint_fragile", "Frail Durability", FLINT, [m("durabilityMult", L(20, 15))], 90, "fine", 0.12, ["flint_heat_grip"]),
  N("flint_wild_spark", "Runaway Sparks", FLINT, [m("igniteRiskPct", L(12, 8))], 80, "fine"),
  N("flint_slow_ignite", "Slow Ignition", FLINT, [m("cooldownReducePct", L(-8, -5))], 80, "fine"),
  N("flint_backfire", "Fire Backlash", FLINT, [m("igniteRiskPct", L(14, 9))], 70, "rare"),
  N("flint_fuel_mismatch", "Fuel Mismatch", FLINT, [m("igniteChancePct", L(-8, -5))], 80, "fine"),
  N("flint_fuel_waste", "Wasted Tinder", FLINT, [m("fireDurationPct", L(-12, -8))], 80, "fine"),
  N("flint_spark_expose", "Spark Exposure", FLINT, [m("aggroPct", L(10, 7))], 80, "fine"),
  N("flint_overload", "Ignition Overload", FLINT, [m("igniteCooldownPct", L(9, 6))], 80, "fine"),
  N("flint_wet_extinguish", "Wet Quench", FLINT, [m("igniteChancePct", L(-9, -6))], 80, "fine"),
  N("flint_crack", "Cracked Flint", FLINT, [m("fractureChance", L(6, 4))], 70, "rare"),
  N("flint_scald", "Scald", FLINT, [m("igniteRiskPct", L(11, 7))], 80, "fine"),
  /* ==== "Extended Affix Library" Negative 333 entries (§2) ==== */
  N("xn001", "Weakening Strike", MELEE, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-001"),
  N("xn002", "Sluggish", MELEE, [m("attackSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-002"),
  N("xn003", "Heavy", MELEE, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-003"),
  N("xn004", "Imbalance", MELEE, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-004"),
  N("xn005", "Fatigue Combo", MELEE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-005"),
  N("xn006", "Thirst", MELEE, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-006"),
  N("xn007", "Irritable", MELEE, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-007"),
  N("xn008", "Rebound", MELEE, [m("vengeancePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-008"),
  N("xn009", "Charge Lag", MELEE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-009"),
  N("xn010", "Broken Stance", MELEE, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-010"),
  N("xn011", "Overextension", MELEE, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-011"),
  N("xn012", "Misfire", MELEE, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-012"),
  N("xn013", "Power Drain", MELEE, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-013"),
  N("xn014", "Bloodlust Gap", MELEE, [m("lifesteal", L(-2, -1.2))], 80, "common", 0.12, [], void 0, "N-014"),
  N("xn015", "Hand Shock", MELEE, [m("comboPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-015"),
  N("xn016", "Weak Point", MELEE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-016"),
  N("xn017", "Blunt", SWORD, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-017"),
  N("xn018", "Chipped Edge", SWORD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-018"),
  N("xn019", "Blood Rust", SWORD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-019"),
  N("xn020", "Overlong Blade", SWORD, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-020"),
  N("xn021", "Off-hand Trouble", SWORD, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-021"),
  N("xn022", "Uncontrolled Swing", SWORD, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-022"),
  N("xn023", "Blade Hum", SWORD, [m("aoePct", L(-5, -3))], 80, "fine", 0.12, [], void 0, "N-023"),
  N("xn024", "Blade Rebound", SWORD, [m("thornsPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-024"),
  N("xn025", "Dark Rot", SWORD, [m("regenPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-025"),
  N("xn026", "Blade Qi Leak", SWORD, [m("aoePct", L(-5, -3))], 80, "fine", 0.12, [], void 0, "N-026"),
  N("xn027", "Clogged Blood Groove", SWORD, [m("lifesteal", L(-2, -1.2))], 80, "rare", 0.12, [], void 0, "N-027"),
  N("xn028", "Brittle Blade", SWORD, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-028"),
  N("xn029", "Handle Slip", SWORD, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-029"),
  N("xn030", "Cramped Grip", SWORD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-030"),
  N("xn031", "Tip-Heavy Balance", SWORD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-031"),
  N("xn032", "Bloodlust Curse", SWORD, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-032"),
  N("xn033", "Loose Axe Handle", AXE, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-033"),
  N("xn034", "Top-Heavy Axe", AXE, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-034"),
  N("xn035", "Logging Blade Jam", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-035"),
  N("xn036", "Cleave Recoil", AXE, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-036"),
  N("xn037", "Axe Edge Chip", AXE, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-037"),
  N("xn038", "Backhand Delay", AXE, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-038"),
  N("xn039", "Sawdust Blind", AXE, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-039"),
  N("xn040", "Branch Snag", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-040"),
  N("xn041", "Blunted Back", AXE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-041"),
  N("xn042", "Skewed Axe Edge", AXE, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-042"),
  N("xn043", "Handle Break Risk", AXE, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-043"),
  N("xn044", "Over-Felling", AXE, [m("woodMasterPct", L(-15, -10))], 80, "common", 0.12, [], void 0, "N-044"),
  N("xn045", "Balance Drift", AXE, [m("attackPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-045"),
  N("xn046", "Two-Handed Strain", AXE, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-046"),
  N("xn047", "Wood Waste", AXE, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-047"),
  N("xn048", "Logging Fatigue", AXE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-048"),
  N("xn049", "Blunt Tip", PICK, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-049"),
  N("xn050", "Rock Debris", PICK, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-050"),
  N("xn051", "Ore Vein Disturbance", PICK, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-051"),
  N("xn052", "Grit in the Blade", PICK, [m("miningSpeedPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-052"),
  N("xn053", "Drill Overheat", PICK, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-053"),
  N("xn054", "Rock Layer Jam", PICK, [m("miningSpeedPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-054"),
  N("xn056", "Excess Wear", PICK, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-056"),
  N("xn057", "Mining Sluggishness", PICK, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-057"),
  N("xn058", "Ore Crushing", PICK, [m("oreDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-058"),
  N("xn059", "Brittle Ore", PICK, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-059"),
  N("xn060", "Greedy Dig", PICK, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-060"),
  N("xn061", "Glare Misjudgment", PICK, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-061"),
  N("xn062", "Deep-Dig Imbalance", PICK, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-062"),
  N("xn063", "Tunnel Collapse Risk", PICK, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-063"),
  N("xn064", "Overload", PICK, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-064"),
  N("xn065", "Shovel Blade Warp", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-065"),
  N("xn066", "Clay-Coated Blade", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-066"),
  N("xn067", "Sand in Eyes", SHOVEL, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-067"),
  N("xn068", "Uncontrolled Digging", SHOVEL, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-068"),
  N("xn069", "Gravel Slippage", SHOVEL, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-069"),
  N("xn070", "Soil Compaction", SHOVEL, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-070"),
  N("xn071", "Wasted Digging", SHOVEL, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-071"),
  N("xn072", "Slow Mining", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-072"),
  N("xn073", "Shovel Handle Crack", SHOVEL, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-073"),
  N("xn074", "Hard Soil Bane failed", SHOVEL, [m("miningSpeedPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-074"),
  N("xn075", "Sand Drift", SHOVEL, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-075"),
  N("xn076", "Mud Cling", SHOVEL, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-076"),
  N("xn077", "Clumsy Archaeology", SHOVEL, [m("archaeologyChance", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-077"),
  N("xn078", "Narrow Shovel Head", SHOVEL, [m("aoeBreak", F(1))], 80, "common", 0.12, [], void 0, "N-078"),
  N("xn079", "Digging Fatigue", SHOVEL, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-079"),
  N("xn080", "Stratum Confusion", SHOVEL, [m("treasurePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-080"),
  N("xn081", "Compaction", HOE, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-081"),
  N("xn082", "Seed Scatter", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-082"),
  N("xn083", "Loose Hoe Handle", HOE, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-083"),
  N("xn084", "Crop Friendly Fire", HOE, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-084"),
  N("xn085", "Overfarming", HOE, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-085"),
  N("xn086", "Barren", HOE, [m("extraDropPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-086"),
  N("xn087", "Moisture Loss", HOE, [m("harvestPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-087"),
  N("xn088", "Stunted Growth", HOE, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-088"),
  N("xn089", "Harvest Reaper", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-089"),
  N("xn090", "Overgrown Weeds", HOE, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-090"),
  N("xn091", "Over-Fertilization", HOE, [m("extraDropPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-091"),
  N("xn092", "Sowing Misalignment", HOE, [m("autoReplant", F(1))], 80, "common", 0.12, [], void 0, "N-092"),
  N("xn093", "Soil Erosion", HOE, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-093"),
  N("xn094", "Crop Withering", HOE, [m("harvestPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-094"),
  N("xn095", "Delayed Harvest", HOE, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-095"),
  N("xn096", "Farming Fatigue", HOE, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-096"),
  N("xn097", "Slack Bowstring", BOW, [m("chargedBonusPct", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-097"),
  N("xn098", "Cracked Bow Limb", BOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-098"),
  N("xn099", "Slow Draw", BOW, [m("attackSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-099"),
  N("xn100", "Arrow Deflection", BOW, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-100"),
  N("xn101", "Damaged Fletching", BOW, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-101"),
  N("xn102", "String Vibration", BOW, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-102"),
  N("xn103", "Power Leak", BOW, [m("chargedBonusPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-103"),
  N("xn104", "Point-Blank Inaccuracy", BOW, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-104"),
  N("xn105", "Long-Range Falloff", BOW, [m("snipePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-105"),
  N("xn106", "Slow Nocking", BOW, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-106"),
  N("xn107", "Worn Bowstring", BOW, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-107"),
  N("xn108", "Wind Drift", BOW, [m("varianceReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-108"),
  N("xn109", "Overdraw Recoil", BOW, [m("vengeancePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-109"),
  N("xn110", "Heavy Quiver", BOW, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-110"),
  N("xn111", "Rapid-Fire Instability", BOW, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-111"),
  N("xn112", "Damp Bowstring", BOW, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-112"),
  N("xn113", "Slow Reload", CROSSBOW, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-113"),
  N("xn114", "Worn Spring", CROSSBOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-114"),
  N("xn115", "Heavy Crossbow", CROSSBOW, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-115"),
  N("xn116", "Slow Draw", CROSSBOW, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-116"),
  N("xn117", "Crossbow Bolt Drift", CROSSBOW, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-117"),
  N("xn118", "Rapid Scatter", CROSSBOW, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-118"),
  N("xn119", "Explosion Recoil", CROSSBOW, [m("explosivePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-119"),
  N("xn120", "Reload Mistake", CROSSBOW, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-120"),
  N("xn121", "Jammed Mechanism", CROSSBOW, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-121"),
  N("xn122", "Long-Range Inaccuracy", CROSSBOW, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-122"),
  N("xn123", "Melee Bulk", CROSSBOW, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-123"),
  N("xn124", "Brittle Crossbow String", CROSSBOW, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-124"),
  N("xn125", "Overloaded Reload", CROSSBOW, [m("multishotPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-125"),
  N("xn126", "Crossbow Bolt Waste", CROSSBOW, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-126"),
  N("xn127", "Loading Noise", CROSSBOW, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-127"),
  N("xn128", "Cold Jam", CROSSBOW, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-128"),
  N("xn129", "Throw Delay", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-129"),
  N("xn130", "Return Malfunction", TRIDENT, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-130"),
  N("xn131", "Blunted Prongs", TRIDENT, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-131"),
  N("xn132", "Land Imbalance", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-132"),
  N("xn133", "Underwater Drift", TRIDENT, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-133"),
  N("xn134", "Thunderstorm Overload", TRIDENT, [m("attackDurabilityCost", L(1, 0.6))], 80, "rare", 0.12, [], void 0, "N-134"),
  N("xn135", "Tidal Backwash", TRIDENT, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-135"),
  N("xn136", "Recoil Shock", TRIDENT, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-136"),
  N("xn137", "Deep Water Drag", TRIDENT, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-137"),
  N("xn138", "Chipped Trident", TRIDENT, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-138"),
  N("xn139", "Slow Return", TRIDENT, [m("cooldownReducePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-139"),
  N("xn140", "Throw Exhaustion", TRIDENT, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-140"),
  N("xn141", "Damp Corrosion", TRIDENT, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-141"),
  N("xn142", "Ranged Falloff", TRIDENT, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-142"),
  N("xn143", "Melee Recoil", TRIDENT, [m("thornsPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-143"),
  N("xn144", "Current Disorientation", TRIDENT, [m("waterBreathing", F(1))], 80, "rare", 0.12, [], void 0, "N-144"),
  N("xn145", "Block Delay", SHIELD, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-145"),
  N("xn146", "Cracked Shield", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-146"),
  N("xn147", "Shield Weight", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-147"),
  N("xn148", "Obstructed View", SHIELD, [m("visionPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-148"),
  N("xn150", "Excessive Blocking Cost", SHIELD, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-150"),
  N("xn151", "Warped Shield Rim", SHIELD, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-151"),
  N("xn152", "Shield Slip", SHIELD, [m("iceSlip", F(1))], 80, "fine", 0.12, [], void 0, "N-152"),
  N("xn153", "Exposed Back", SHIELD, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-153"),
  N("xn154", "Perfect block window is narrow", SHIELD, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-154"),
  N("xn155", "Shield Bash Stagger", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-155"),
  N("xn156", "Stun after blocking", SHIELD, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-156"),
  N("xn157", "Brittle Elemental Shield", SHIELD, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-157"),
  N("xn158", "Tight Bracers", SHIELD, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-158"),
  N("xn159", "Ranged Impact", SHIELD, [m("knockbackPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-159"),
  N("xn160", "Blocking Cost", SHIELD, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-160"),
  N("xn161", "Swelter", HEAD, [m("regenPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-161"),
  N("xn162", "Drowsy", HEAD, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-162"),
  N("xn163", "Hypoxia", HEAD, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-163"),
  N("xn164", "Dull Senses", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-164"),
  N("xn165", "Narrow Vision", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-165"),
  N("xn166", "Noise", HEAD, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-166"),
  N("xn167", "Mental Fatigue", HEAD, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-167"),
  N("xn168", "Thunder Tinnitus", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-168"),
  N("xn169", "Dust-Blinded", HEAD, [m("visionPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-169"),
  N("xn170", "Night Blindness", HEAD, [m("nightVision", F(1))], 80, "fine", 0.12, [], void 0, "N-170"),
  N("xn171", "Condensation", HEAD, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-171"),
  N("xn172", "Fragile Head", HEAD, [m("defensePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-172"),
  N("xn173", "Stun", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-173"),
  N("xn174", "Spell Interference", HEAD, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-174"),
  N("xn175", "Head Down", HEAD, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-175"),
  N("xn176", "Mob Detection Failure", HEAD, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-176"),
  N("xn177", "Heavy Armor", CHEST, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-177"),
  N("xn178", "Brittle Armor", CHEST, [m("critChance", L(-4, -2.5))], 80, "common", 0.12, [], void 0, "N-178"),
  N("xn179", "Overheat", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-179"),
  N("xn180", "Breath Pressure", CHEST, [m("attackCooldownPct", L(8, 5))], 80, "fine", 0.12, [], void 0, "N-180"),
  N("xn181", "Reduced Out-of-Combat Recovery", CHEST, [m("regenPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-181"),
  N("xn182", "Fragile Reflect", CHEST, [m("vengeancePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-182"),
  N("xn183", "Elemental Conduction", CHEST, [m("fireChance", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-183"),
  N("xn184", "Armpit Restraint", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-184"),
  N("xn185", "Shock Conduction", CHEST, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-185"),
  N("xn186", "Armor Gap", CHEST, [m("defensePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-186"),
  N("xn187", "Loose Plates", CHEST, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-187"),
  N("xn188", "Shield Lag", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-188"),
  N("xn189", "Healing Hindered", CHEST, [m("lifesteal", L(-2, -1.2))], 80, "fine", 0.12, [], void 0, "N-189"),
  N("xn190", "Exposed Back", CHEST, [m("defensePct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-190"),
  N("xn191", "Load Overlimit", CHEST, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-191"),
  N("xn192", "Durability Cracking", CHEST, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-192"),
  N("xn193", "Stiff", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-193"),
  N("xn194", "Knee Bind", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-194"),
  N("xn195", "Exhausted", LEGS, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-195"),
  N("xn196", "Slipstep", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-196"),
  N("xn197", "Sunken Stance", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-197"),
  N("xn198", "Sluggish Sprint", LEGS, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-198"),
  N("xn199", "Sprint Hunger", LEGS, [m("maxHealthPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-199"),
  N("xn200", "Melee Stride", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-200"),
  N("xn201", "Unstable Ankles", LEGS, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-201"),
  N("xn202", "Stealth Noise", LEGS, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-202"),
  N("xn203", "Landing Stun", LEGS, [m("attackSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-203"),
  N("xn204", "Poor Environmental Adaptation", LEGS, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-204"),
  N("xn205", "Deep Water Leg Bind", LEGS, [m("waterBreathing", F(1))], 80, "fine", 0.12, [], void 0, "N-205"),
  N("xn206", "Slope Imbalance", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-206"),
  N("xn207", "Accelerated Wear", LEGS, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-207"),
  N("xn208", "Slow Escape", LEGS, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-208"),
  N("xn209", "Clumsy", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-209"),
  N("xn210", "Brittle Base", FEET, [m("fallDamagePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-210"),
  N("xn211", "Water Absorb", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-211"),
  N("xn212", "Sink", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-212"),
  N("xn213", "Slipping", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-213"),
  N("xn214", "Unstable Heels", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-214"),
  N("xn215", "Worn Soles", FEET, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-215"),
  N("xn216", "Grit in the Joints", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-216"),
  N("xn217", "Lava Conduction", FEET, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-217"),
  N("xn218", "Ice Loss of Control", FEET, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-218"),
  N("xn219", "Footfall Shock", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-219"),
  N("xn220", "Marsh Cling", FEET, [m("soulPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-220"),
  N("xn222", "Running Stamina Drain", FEET, [m("maxHealthPct", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-222"),
  N("xn223", "Slow Leap", FEET, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-223"),
  N("xn224", "Fall Vulnerability", FEET, [m("fallDamagePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-224"),
  N("xn225", "Blunt Mace Face", MACE, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-225"),
  N("xn226", "Charge Delay", MACE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-226"),
  N("xn227", "Fall Strike Inaccuracy", MACE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-227"),
  N("xn228", "Landing Tremor", MACE, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-228"),
  N("xn229", "Top-Heavy", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-229"),
  N("xn230", "Impact Recoil", MACE, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-230"),
  N("xn231", "Cracked Haft", MACE, [m("attackPct", L(-10, -6))], 80, "fine", 0.12, [], void 0, "N-231"),
  N("xn232", "Charge Leak", MACE, [m("chargedBonusPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-232"),
  N("xn233", "Armor Concussion", MACE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-233"),
  N("xn234", "Ground Recoil", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-234"),
  N("xn235", "Heavy Strike Durability Drain", MACE, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-235"),
  N("xn236", "Whiff Stagger", MACE, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-236"),
  N("xn237", "Charge Reliance", MACE, [m("attackPct", L(-10, -6))], 80, "fine", 0.12, [], void 0, "N-237"),
  N("xn238", "Cracked Hammer Head", MACE, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-238"),
  N("xn239", "Sluggish Rebound", MACE, [m("attackPct", L(-12, -6))], 80, "common", 0.12, [], void 0, "N-239"),
  N("xn240", "Heavy Hammer Noise", MACE, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-240"),
  N("xn241", "Blunted Spear Tip", SPEAR, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-241"),
  N("xn242", "Charge distance too short", SPEAR, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-242"),
  N("xn243", "Charge Overload", SPEAR, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-243"),
  N("xn244", "Shaft Deflection", SPEAR, [m("attackPct", L(-12, -6))], 80, "fine", 0.12, [], void 0, "N-244"),
  N("xn245", "Too Close Fails", SPEAR, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-245"),
  N("xn246", "Long-Range Drift", SPEAR, [m("snipePct", L(-10, -7))], 80, "rare", 0.12, [], void 0, "N-246"),
  N("xn247", "Heavy Spear Grip", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-247"),
  N("xn248", "Thrust Recoil", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-248"),
  N("xn249", "Charge Stamina Cost", SPEAR, [m("maxHealthPct", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-249"),
  N("xn250", "Brittle Spear Shaft", SPEAR, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-250"),
  N("xn251", "Turning Lag", SPEAR, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-251"),
  N("xn252", "Unsteady Riding", SPEAR, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-252"),
  N("xn253", "Thrust Opening", SPEAR, [m("defensePct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-253"),
  N("xn254", "Over-penetration", SPEAR, [m("piercePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-254"),
  N("xn255", "Dragging Shaft", SPEAR, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-255"),
  N("xn256", "Warhorse Discord", SPEAR, [m("attackCooldownPct", L(8, 5))], 80, "rare", 0.12, [], void 0, "N-256"),
  N("xn257", "Jammed Spool", FISHING, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-257"),
  N("xn258", "Fragile Line", FISHING, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-258"),
  N("xn259", "Float Failure", FISHING, [m("fishingLuckPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-259"),
  N("xn260", "Bait Loss", FISHING, [m("cooldownReducePct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-260"),
  N("xn261", "Slow Reel", FISHING, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-261"),
  N("xn262", "Line Tangle", FISHING, [m("rootChance", L(-5, -3))], 80, "rare", 0.12, [], void 0, "N-262"),
  N("xn263", "Short Throw", FISHING, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-263"),
  N("xn264", "Water Misjudgment", FISHING, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-264"),
  N("xn265", "Blunted Hook", FISHING, [m("attackPct", L(-10, -6))], 80, "common", 0.12, [], void 0, "N-265"),
  N("xn266", "Forceful Reel", FISHING, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-266"),
  N("xn267", "Damp Spool", FISHING, [m("waterBreathing", F(1))], 80, "rare", 0.12, [], void 0, "N-267"),
  N("xn268", "Loot Skew", FISHING, [m("treasurePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-268"),
  N("xn269", "Empty-Cast Fatigue", FISHING, [m("fishingLuckPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-269"),
  N("xn270", "Barbed Hook", FISHING, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-270"),
  N("xn271", "Reel Noise", FISHING, [m("reelSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-271"),
  N("xn272", "Fishing Line Wear", FISHING, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-272"),
  N("xn273", "Blunt Shears", SHEARS, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-273"),
  N("xn274", "Nicked Edge", SHEARS, [m("attackDurabilityCost", L(1, 0.6))], 80, "common", 0.12, [], void 0, "N-274"),
  N("xn275", "Wool Waste", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-275"),
  N("xn276", "Torn Blade", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-276"),
  N("xn277", "Tangled Line", SHEARS, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-277"),
  N("xn278", "Loose Shears Handle", SHEARS, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-278"),
  N("xn279", "Fiber Tangle", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-279"),
  N("xn280", "Insufficient Precision", SHEARS, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-280"),
  N("xn281", "Over-Shearing", SHEARS, [m("extraDropPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-281"),
  N("xn282", "Fur-Blinded", SHEARS, [m("moveSpeedPct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-282"),
  N("xn283", "High Branch Trouble", SHEARS, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-283"),
  N("xn284", "Rusted Joints", SHEARS, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-284"),
  N("xn285", "Skewed Shears", SHEARS, [m("accuracyPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-285"),
  N("xn286", "Fiber Waste", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-286"),
  N("xn287", "Broken Handle Risk", SHEARS, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-287"),
  N("xn288", "Weed Clogging", SHEARS, [m("shearYieldPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-288"),
  N("xn289", "Bristle Wear", BRUSH, [m("durabilityMult", L(20, 15))], 80, "rare", 0.12, [], void 0, "N-289"),
  N("xn290", "Loose Brush Handle", BRUSH, [m("brushLuckPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-290"),
  N("xn291", "Uncontrolled Force", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-291"),
  N("xn292", "Dust in the Eyes", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "fine", 0.12, [], void 0, "N-292"),
  N("xn293", "Loose Bristles", BRUSH, [m("treasurePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-293"),
  N("xn294", "Careless Dig", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-294"),
  N("xn295", "Wrist Fatigue", BRUSH, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-295"),
  N("xn296", "Relic Scuffing", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "common", 0.12, [], void 0, "N-296"),
  N("xn297", "Uneven Bristles", BRUSH, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-297"),
  N("xn298", "Dust Buildup", BRUSH, [m("brushLuckPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-298"),
  N("xn299", "Fragile Relic", BRUSH, [m("defensePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-299"),
  N("xn300", "Dust Aura", BRUSH, [m("attackCooldownPct", L(8, 5))], 80, "common", 0.12, [], void 0, "N-300"),
  N("xn301", "Cracked Handle", BRUSH, [m("durabilityMult", L(20, 15))], 80, "fine", 0.12, [], void 0, "N-301"),
  N("xn302", "Overclearing", BRUSH, [m("cooldownReducePct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-302"),
  N("xn303", "Sediment Clog", BRUSH, [m("waterBreathing", F(1))], 80, "common", 0.12, [], void 0, "N-303"),
  N("xn304", "Relic Misidentification", BRUSH, [m("archaeologyChance", L(-6, -4))], 80, "rare", 0.12, [], void 0, "N-304"),
  N("xn305", "Dulled Flint", FLINT, [m("attackPct", L(-10, -6))], 80, "rare", 0.12, [], void 0, "N-305"),
  N("xn306", "Spark Deflection", FLINT, [m("accuracyPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-306"),
  N("xn307", "Damp Tinder", FLINT, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-307"),
  N("xn308", "Low Fuel", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-308"),
  N("xn309", "Overheated Grip", FLINT, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-309"),
  N("xn310", "Frail Durability", FLINT, [m("defensePct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-310"),
  N("xn311", "Runaway Sparks", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-311"),
  N("xn312", "Slow Ignition", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-312"),
  N("xn313", "Fire Backlash", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-313"),
  N("xn314", "Fuel Mismatch", FLINT, [m("durabilityMult", L(12, 8))], 80, "fine", 0.12, [], void 0, "N-314"),
  N("xn315", "Wasted Tinder", FLINT, [m("attackPct", L(-12, -6))], 80, "rare", 0.12, [], void 0, "N-315"),
  N("xn316", "Spark Exposure", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-316"),
  N("xn317", "Ignition Overload", FLINT, [m("igniteChancePct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-317"),
  N("xn318", "Wet Quench", FLINT, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-318"),
  N("xn319", "Cracked Flint", FLINT, [m("durabilityMult", L(20, 15))], 80, "common", 0.12, [], void 0, "N-319"),
  N("xn320", "Scald", FLINT, [m("attackCooldownPct", L(-12, -8))], 80, "rare", 0.12, [], void 0, "N-320"),
  N("xn321", "Torn Membrane", ELYTRA, [m("attackPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-321"),
  N("xn322", "Slow Takeoff", ELYTRA, [m("attackCooldownPct", L(-12, -8))], 80, "common", 0.12, [], void 0, "N-322"),
  N("xn323", "Airflow Imbalance", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-323"),
  N("xn324", "Dive Too Deep", ELYTRA, [m("fallDamagePct", L(-10, -7))], 80, "fine", 0.12, [], void 0, "N-324"),
  N("xn325", "Insufficient Lift", ELYTRA, [m("attackPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-325"),
  N("xn326", "Wing Break Risk", ELYTRA, [m("durabilityMult", L(12, 8))], 80, "rare", 0.12, [], void 0, "N-326"),
  N("xn327", "Excessive Drag", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-327"),
  N("xn328", "Cracked Wingtip", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-328"),
  N("xn329", "Slow Turning", ELYTRA, [m("moveSpeedPct", L(-10, -7))], 80, "common", 0.12, [], void 0, "N-329"),
  N("xn330", "Takeoff Shake", ELYTRA, [m("attackCooldownPct", L(-12, -8))], 80, "fine", 0.12, [], void 0, "N-330"),
  N("xn331", "Overburdened", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "rare", 0.12, [], void 0, "N-331"),
  N("xn332", "Heat Discomfort", ELYTRA, [m("fireChance", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-332"),
  N("xn333", "Cold Wind Assault", ELYTRA, [m("attackPct", L(-8, -5))], 80, "fine", 0.12, [], void 0, "N-333"),
  N("xn334", "Membrane Leak", ELYTRA, [m("durabilityMult", L(12, 8))], 80, "common", 0.12, [], void 0, "N-334"),
  N("xn335", "Airflow Noise", ELYTRA, [m("moveSpeedPct", L(-8, -5))], 80, "common", 0.12, [], void 0, "N-335"),
  N("xn336", "Emergency Return Failed", ELYTRA, [m("dodgeChance", L(-4, -2.5))], 80, "rare", 0.12, [], void 0, "N-336"),
  /* ==== Horse Armor / Riding Items Negative ==== */
  N("horse_heavy_barding", "Heavy Horse Armor", HORSE, [m("moveSpeedPct", L(-10, -7))], 90, "fine"),
  N("horse_rub", "Abrasion", HORSE, [m("durabilityMult", L(18, 12))], 90, "fine"),
  N("horse_loose", "Loose Girth", HORSE, [m("defensePct", L(-8, -5))], 80, "fine"),
  N("horse_spook", "Skittish", HORSE, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("horse_stiff", "Stiff Back", HORSE, [m("jumpPct", L(-10, -7))], 80, "fine"),
  N("steer_snag", "Stiff Reins", STEERING, [m("cooldownReducePct", L(-8, -5))], 90, "fine"),
  N("steer_fray", "Worn Reins", STEERING, [m("durabilityMult", L(20, 15))], 90, "fine"),
  N("steer_drag", "Drag", STEERING, [m("moveSpeedPct", L(-8, -5))], 80, "fine"),
  N("steer_slip", "Slip", STEERING, [m("accuracyPct", L(-8, -5))], 80, "fine"),
  N("steer_tangle", "Tangle", STEERING, [m("cooldownReducePct", L(-7, -5))], 80, "fine")
];
var DUAL = [
  D("mad_war", "Berserk", MELEE, [m("attackPct", L(25, 17.5)), m("berserkPct", L(30, 24)), m("defensePct", L(-12, -10.75))], 60, "epic"),
  D("glass_cannon", "Glass Cannon", MELEE, [m("attackPct", L(40, 37.5)), m("critChance", L(8, 7)), m("damageTakenPct", L(20, 18.75))], 40, "legendary"),
  D("titan", "Titan", ARMOR, [m("maxHealthPct", L(20, 18.75)), m("defensePct", L(12, 10.75)), m("moveSpeedPct", L(-8, -7.5)), m("jumpPct", L(-10, -8.75))], 40, "legendary"),
  D("gale_cost", "Price of Speed", MELEE, [m("attackSpeedPct", L(20, 15)), m("durabilityMult", L(20, 18.75))], 60, "epic"),
  D("greed", "Greed", MELEE_TOOLS, [m("extraDropPct", L(10, 10)), m("luckBreakChance", L(5, 4.75))], 60, "epic"),
  D("soul_reap", "Soul Hunt", MELEE, [m("killStackPct", L(6, 5)), m("idleDecayPct", L(6, 6))], 50, "epic"),
  D("blood_sacrifice", "Blood Sacrifice", MELEE, [m("lifesteal", L(10, 8)), m("maxHealthPct", L(-12, -10.75))], 50, "epic"),
  D("flame_heart", "Heart of Flame", MELEE, [m("fireChance", L(20, 15)), m("fireVulnPct", L(15, 13.75))], 50, "epic"),
  D("eternal_frost_dual", "Eternal Frost", MELEE, [m("freezeChance", L(6, 5)), m("fireVulnPct", L(12, 12))], 50, "epic"),
  D("thunder_dual", "Thunderstorm", MELEE, [m("lightningChance", L(8, 6)), m("skillDurabilityCost", L(3, 2.75))], 50, "epic"),
  D("heavy_hammer", "Mace", MELEE, [m("attackPct", L(30, 22)), m("attackSpeedPct", L(-10, -8.75))], 60, "epic"),
  D("light_blade", "Light Blade", MELEE, [m("attackSpeedPct", L(25, 18.75)), m("attackPct", L(-10, -8.75))], 60, "epic"),
  D("gambler", "Gambler", MELEE, [m("gambleCrit", L(15, 12)), m("gambleLossPct", L(10, 8.75))], 50, "epic"),
  D("death_match", "Deathmatch", MELEE, [m("berserkPct", L(35, 26)), m("naturalRegenPct", L(-40, -25))], 50, "epic"),
  D("unyielding_dual", "Unyielding", ARMOR, [m("lastStandChance", L(12, 9)), m("healingReducePct", L(15, 13.75))], 50, "epic")
];
var SPECIAL = [
  SP("world_tree", "World Tree", ALL, [m("specialWorldTree", F(1)), m("regenFlat", L(0.5, 0.5))], 30, "legendary", 0.2, [], "legendary"),
  SP("heavenly_thunder", "Sky Thunder", MELEE, [m("specialHeavenlyThunder", F(1)), m("lightningChance", L(15, 10))], 25, "legendary", 0.2, [], "legendary"),
  SP("blood_moon", "Blood Moon", MELEE, [m("specialBloodMoon", F(1)), m("nightPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("sun_glory_special", "Sunblaze", MELEE, [m("specialSunGlory", F(1)), m("dayPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("abyss_special", "Abyss", MELEE, [m("specialAbyss", F(1)), m("netherPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("sea_god_special", "Sea God", TR.concat(SD), [m("specialSeaGod", F(1)), m("waterPct", L(30, 25))], 30, "legendary", 0.2, [], "legendary"),
  SP("spacetime", "Time-Space", ARMOR, [m("specialSpacetime", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("immortal_special", "Undying", ALL, [m("uniqueImmortal", F(1))], 20, "mythic", 0.2, [], "legendary"),
  SP("soulbound_special", "Soulbound", ALL, [m("uniqueSoulbound", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("soul_harvest", "Soul Siphon", MELEE, [m("killStackPct", L(10, 8)), m("killHeal", L(2, 1.5))], 25, "legendary", 0.2, [], "legendary"),
  SP("void_walker", "Void Walker", ARMOR, [m("specialVoidWalker", F(1))], 25, "legendary", 0.2, [], "legendary"),
  SP("destiny", "Destiny", ALL, [m("specialDestiny", F(1))], 20, "mythic", 0.2, [], "ancient"),
  SP("miracle", "Miracle", ALL, [m("specialMiracle", F(1))], 15, "mythic", 0.25, [], "ancient"),
  SP("reversal", "Reversal", ARMOR, [m("specialReversal", F(1))], 20, "mythic", 0.2, [], "ancient"),
  SP("endless", "Endless", MELEE, [m("specialEndless", F(1))], 15, "mythic", 0.25, [], "ancient")
];
var CURSE = [
  CU(
    "curse_blood_thirst",
    "Bloodthirst Curse",
    MELEE,
    [m("curseBloodThirst", F(1)), m("comboAtkSpeed", L(10, 8)), m("curseDamagePerMin", L(1, 1))],
    40,
    "epic",
    0.2,
    [],
    "epic",
    "The more you attack the stronger you get, but not attacking for a long time drains health"
  ),
  CU(
    "curse_greed",
    "Curse of Greed",
    MELEE_TOOLS,
    [m("extraDropPct", L(20, 15)), m("deathPenaltyPct", L(15, 10))],
    40,
    "epic",
    0.2,
    [],
    "epic",
    "Drops greatly increased, but extra penalty on death"
  ),
  CU(
    "curse_binding",
    "Binding Curse",
    ARMOR,
    [m("bindingCurse", F(1)), m("defensePct", L(15, 12))],
    35,
    "epic",
    0.2,
    [],
    "epic",
    "Defense increased, but the equipment cannot be taken off easily"
  ),
  CU(
    "curse_frail",
    "Frail Curse",
    MELEE,
    [m("attackPct", L(60, 45)), m("maxHealthNegPct", L(30, 20))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "Extremely high attack, but very low max health"
  ),
  CU(
    "curse_fury",
    "Curse of Fury",
    MELEE,
    [m("curseFury", F(1)), m("attackPct", L(25, 20)), m("aggroPct", L(30, 25))],
    35,
    "epic",
    0.2,
    [],
    "epic",
    "Automatically enter combat, but mobs spot you more easily"
  ),
  CU(
    "curse_eternal_night",
    "Eternal Night Curse",
    MELEE,
    [m("uniqueEternalNight", F(1)), m("dayPct", L(-30, -20))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "Very strong at night, but severely weakened during the day"
  ),
  CU(
    "curse_abyss",
    "Abyss Curse",
    MELEE,
    [m("uniqueAbyssHeart", F(1)), m("netherPct", L(-20, -15))],
    30,
    "legendary",
    0.2,
    [],
    "legendary",
    "Extremely strong in the Nether, but weakened in the Overworld"
  )
];
var UNIQUE = [
  U("unique_time", "Time", MELEE, [m("uniqueTime", F(1))], 1, "legendary", 0.2, [], void 0, "Briefly slows target actions after attacking"),
  U("unique_space", "Space", ARMOR, [m("uniqueSpace", F(1))], 1, "legendary", 0.2, [], void 0, "Chance to blink a short distance when hit by a lethal attack"),
  U("unique_gluttony", "Gluttony", MELEE, [m("uniqueGluttony", F(1))], 1, "legendary", 0.2, [], void 0, "Kills restore health, but food consumption rises sharply"),
  U("unique_eternal_night", "Endless Night", MELEE, [m("uniqueEternalNight", F(1))], 1, "mythic", 0.2, [], void 0, "Very strong at night, heavily weakened by day"),
  U("unique_sun_heart", "Sun Heart", MELEE, [m("uniqueSunHeart", F(1))], 1, "mythic", 0.2, [], void 0, "Very strong during the day, weaker at night"),
  U("unique_abyss_heart", "Abyssal Heart", MELEE, [m("uniqueAbyssHeart", F(1))], 1, "mythic", 0.2, [], void 0, "Extremely strong in the Nether, weakened in the Overworld")
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
  common: "Common",
  fine: "Fine",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic"
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
  if (def.kind === "negative") return "Negative Pool";
  if (def.kind === "dual") return "Dual-edge Pool";
  if (def.kind === "curse") return "Curse Pool";
  if (def.kind === "unique") return "Ancient/Unique pool";
  if (def.kind === "special") return "Legendary/Mythic Pool";
  const g = def.groups;
  const stat = def.mods[0]?.stat ?? "";
  const ranged = g.every((x) => x === "bow" || x === "crossbow" || x === "trident");
  if (ranged) return "Ranged Pool";
  const toolOnly = g.every((x) => x === "pickaxe" || x === "axe" || x === "shovel" || x === "hoe");
  if (toolOnly) return "Tool Pool";
  const armorOnly = g.every((x) => x === "head" || x === "chest" || x === "legs" || x === "feet");
  if (armorOnly) return "Armor Pool";
  if (g.includes("shield") && g.length <= 2) return "Shield Pool";
  const elem = ["fire", "ice", "freeze", "lightning", "thunder", "poison", "chill", "molten", "shock", "corrode", "frost", "storm"];
  if (elem.some((k) => stat.includes(k))) return "Element Pool";
  if (stat.includes("crit") || stat.includes("lucky")) return "Crit Pool";
  if (stat.includes("attackSpeed") || stat.includes("comboAtkSpeed") || stat.includes("burstSpeed")) return "Attack Speed Pool";
  if (stat.includes("lifesteal") || stat.includes("killHeal") || stat.includes("Health") || stat.includes("regen") || stat.includes("blood")) return "Health Pool";
  if (stat.includes("defense") || stat.includes("Reduce") || stat.includes("shield") || stat.includes("dodge") || stat.includes("thorns") || stat.includes("resist")) return "Defense Pool";
  if (stat.includes("Speed") || stat.includes("jump") || stat.includes("fall") || stat.includes("swim") || stat.includes("water") || stat.includes("turn") || stat.includes("landing")) return "Movement Pool";
  if (stat.includes("stun") || stat.includes("slow") || stat.includes("weaken") || stat.includes("root") || stat.includes("fear") || stat.includes("silence") || stat.includes("dispel") || stat.includes("knockback")) return "Control Pool";
  if (stat.includes("sweep") || stat.includes("quake") || stat.includes("fissure") || stat.includes("whirlwind") || stat.includes("explode") || stat.includes("chainHit") || stat.includes("stormAoe") || stat.includes("earthSplit")) return "Radius Pool";
  if (g.length > 6) return "General Pool";
  return "Weapon Pool";
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
  { id: "sluggish", name: "Very Slow", pct: -30, cooldown: round3(BASE_COOLDOWN / 0.7), color: "\xA74" },
  { id: "slow", name: "Slow", pct: -15, cooldown: round3(BASE_COOLDOWN / 0.85), color: "\xA7c" },
  { id: "dull", name: "Slightly Slow", pct: -7, cooldown: round3(BASE_COOLDOWN / 0.93), color: "\xA76" },
  { id: "normal", name: "Common", pct: 0, cooldown: BASE_COOLDOWN, color: "\xA7f" },
  { id: "quick", name: "Slightly Fast", pct: 8, cooldown: round3(BASE_COOLDOWN / 1.08), color: "\xA7a" },
  { id: "fast", name: "Quick", pct: 18, cooldown: round3(BASE_COOLDOWN / 1.18), color: "\xA7b" },
  { id: "swift", name: "Very Fast", pct: 35, cooldown: round3(BASE_COOLDOWN / 1.35), color: "\xA7d" }
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
    name: "Poor",
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
    name: "Broken",
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
    name: "Common",
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
    name: "Superior",
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
    name: "Rare",
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
    name: "Epic",
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
    name: "Legendary",
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
    name: "Mythic",
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
    name: "Ancient",
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
    name: "Unique",
    color: "\xA74",
    weight: 20,
    // §38: the only one not bound by the normal rules
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
    name: "War God Resonance",
    kind: "armor",
    desc: "Melee Damage +12%",
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
    name: "Hunter Resonance",
    kind: "armor",
    desc: "Ranged Damage +12%, Movement Speed +8%",
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
    name: "Berserker Resonance",
    kind: "armor",
    desc: "Massive buff at low health (Berserk +20%, Lifesteal +5%)",
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
    name: "Guardian Resonance",
    kind: "armor",
    desc: "Extra 6% global damage reduction",
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
    name: "Thorn Resonance",
    kind: "armor",
    desc: "Reflects damage continuously when hit by melee attacks (Thorns +15%)",
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
    name: "Wind Resonance",
    kind: "armor",
    desc: "Movement Speed +12%, Sprint Speed +10%",
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
    name: "Miner Resonance",
    kind: "tool",
    desc: "Grants the Miner special effect (Mining Speed +20%, Ore Drops +15%)",
    tool: { groups: ["pickaxe"], affixes: ["swift_dig", "ore_vein", "lucky_miner", "fortune", "chain_mine", "treasure"], need: 3 },
    effects: { miningSpeedPct: 20, oreDropPct: 15 }
  },
  {
    id: "harvest_res",
    name: "Harvest Resonance",
    kind: "tool",
    desc: "Greatly increases farm yield (crops +25%, extra drops +15%)",
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
  perfect: "Very High",
  high: "High",
  normal: "Common",
  conflict: "Conflict"
};
var SYNERGY_PAIRS = [
  // ---------------- Very High ----------------
  { a: "crit", b: "lethal", level: "perfect", note: "Crit + Lethal" },
  { a: "crit", b: "precise", level: "perfect", note: "Crit + Precision" },
  { a: "lifesteal", b: "berserk", level: "perfect", note: "Lifesteal + Berserk" },
  { a: "lifesteal", b: "mad_war", level: "perfect", note: "Lifesteal + Berserk" },
  { a: "swift", b: "chain_slash", level: "perfect", note: "Swift + Combo Slash" },
  { a: "swift", b: "combo", level: "high", note: "Swift + Combo" },
  { a: "fireChance", b: "blazing", level: "perfect", note: "Ignite + Blaze" },
  { a: "scorch", b: "blazing", level: "perfect", note: "Scorching + Blazing" },
  { a: "chill", b: "ice_burst", level: "perfect", note: "Chill + Ice Burst" },
  { a: "freeze", b: "ice_burst", level: "perfect", note: "Freeze + Ice Burst" },
  { a: "thunder", b: "chain_lightning", level: "perfect", note: "Thunder + Chain Lightning" },
  { a: "poison_blade", b: "poison_burst", level: "perfect", note: "Poison Blade + Poison Burst" },
  { a: "poison_blade", b: "strong_poison", level: "high", note: "Poison Blade + Venom" },
  { a: "execute", b: "behead", level: "perfect", note: "Execute + Decapitate" },
  { a: "execute", b: "lethal_pursuit", level: "high", note: "Execute + Lethal Pursuit" },
  { a: "berserk", b: "mad_war", level: "perfect", note: "Frenzy + Berserk" },
  { a: "berserk", b: "tough", level: "high", note: "Berserk + Tenacity (Rare extreme combo)" },
  { a: "berserk", b: "life", level: "high", note: "Berserk + Health" },
  { a: "thorns", b: "bulwark", level: "perfect", note: "Thorns + Bulwark" },
  { a: "thorns", b: "thorn_shield", level: "perfect", note: "Thorns + Thorn Shield" },
  { a: "dodge", b: "boots_swift", level: "high", note: "Dodge + Sprint" },
  { a: "chain_mine", b: "ore_vein", level: "perfect", note: "Chain Mining + Ore Vein" },
  { a: "chain_mine", b: "lucky_miner", level: "high", note: "Chain Mining + Lucky Miner" },
  { a: "harvest", b: "lucky_farmer", level: "perfect", note: "Harvest + Lucky Farmer" },
  { a: "harvest", b: "lush", level: "high", note: "Harvest + Lush" },
  { a: "tree_feller", b: "lumber", level: "perfect", note: "Tree Feller + Logging" },
  { a: "multi_shot", b: "split_arrow", level: "perfect", note: "Multishot + Split" },
  { a: "strong_bow", b: "sniper", level: "high", note: "Power Bow + Sniper" },
  { a: "heavy_crossbow", b: "armor_pierce", level: "high", note: "Heavy Crossbow + Armor Pierce" },
  { a: "sea_god", b: "deep_hunter", level: "high", note: "Poseidon + Deep-Sea Hunter" },
  { a: "shield_bash", b: "counter", level: "perfect", note: "Shield Bash + Riposte" },
  { a: "guard", b: "rebound", level: "high", note: "Guard + Rebound" },
  { a: "sweep", b: "quake", level: "high", note: "Sweep + Quake" },
  { a: "night_hunt", b: "blood_moon", level: "perfect", note: "Night Hunt + Blood Moon" },
  { a: "sun_glory", b: "sun_glory_special", level: "perfect", note: "Sunburst + Sunburst (Special)" },
  { a: "abyss", b: "abyss_special", level: "perfect", note: "Abyss + Abyss (Special)" },
  { a: "indestructible", b: "solid", level: "high", note: "Unbreakable + Sturdy" },
  { a: "lifesteal", b: "blood_sacrifice", level: "high", note: "Lifesteal + Blood Sacrifice" },
  // ---------------- Conflict ----------------
  { a: "light", b: "heavy", level: "conflict", note: "Lightweight + Heavy" },
  { a: "light", b: "clumsy", level: "conflict", note: "Light + Heavy" },
  { a: "agile", b: "dull", level: "conflict", note: "Nimble + Sluggish" },
  { a: "swift", b: "heavy", level: "conflict", note: "Swift + Heavy" },
  { a: "extreme_speed", b: "sluggish", level: "conflict", note: "Haste + Slowness" },
  { a: "solid", b: "fragile", level: "conflict", note: "Sturdy + Brittle" },
  { a: "solid", b: "brittle", level: "conflict", note: "Sturdy + Brittle" },
  { a: "lifesteal", b: "curse_frail", level: "conflict", note: "Lifesteal + Frailty Curse" },
  { a: "life", b: "curse_frail", level: "conflict", note: "Health + Fragile Curse" },
  { a: "night_hunt", b: "day_walk", level: "conflict", note: "Night Hunt + Sun Walk" },
  { a: "nightVision", b: "dizzy", level: "conflict", note: "Night Vision + Dizzy" },
  { a: "regeneration", b: "regen_block", level: "conflict", note: "Regeneration + Regeneration Block" },
  { a: "auto_replant", b: "late_plant", level: "conflict", note: "Auto Replant + Late Sowing" },
  { a: "heavy_armor", b: "boots_swift", level: "conflict", note: "Heavy Armor + Fleet Step" },
  { a: "chain_mine", b: "slow_dig", level: "conflict", note: "Chain Mining + Sluggish" },
  { a: "swift", b: "charge_up", level: "conflict", note: "Swift + Charge Lag" },
  { a: "crit", b: "blunt_sense", level: "conflict", note: "Crit + Dullness" },
  { a: "life", b: "frail_body", level: "conflict", note: "Health + Frail Body" },
  { a: "night_walk", b: "day_walk", level: "conflict", note: "Night Walker + Day Walker" },
  { a: "fast_till", b: "hardened", level: "conflict", note: "Quick Till + Hardpan" },
  { a: "swift_dig", b: "slow_dig", level: "conflict", note: "Quick Dig + Sluggish" },
  { a: "strong_bow", b: "misaim", level: "conflict", note: "Strong Bow + Misaim" },
  { a: "heavy_armor", b: "boots_swift", level: "conflict", note: "Heavy Armor + Fleet Step" }
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
  // §4.1 Normal mob equipment Drops
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
  // §4.2 Elite Mob / Mini Boss
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
  // §4.3 Boss (the doc suggests lowering the Unique candidate from 1% to 0.1%)
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
  // §4.4 Normal natural Structure Chest
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
  // §4.5 High-tier Structure Chest
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
  // §4.6 Fishing
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
  // §4.7 Quest / Reward (defaults to the Crafting Table pool)
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
  // Doc: Unique follows the template; this gives a reasonable default
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
  // Wooden / Leather
  1: 4,
  // Stone / Gold / Chainmail / Copper
  2: 4,
  // Iron
  3: 5,
  // Diamond
  4: 5
  // Netherite
};
var CAPS = {
  critChance: 50,
  // Critical Hit chance total cap %
  critMultiplier: 2.5,
  // Critical Hit multiplier cap
  lifesteal: 20,
  // Lifesteal cap %
  moveSpeedUp: 35,
  // Extra movement speed cap %
  moveSpeedDown: -40,
  // Movement penalty floor %
  damageReduction: 25,
  // Extra damage-reduction layer cap %
  vulnerability: 35,
  // Extra vulnerability layer cap %
  chainBreakNormal: 9,
  // Chain-break cap for normal affixes
  chainBreakEpic: 25
  // Chain-break cap for Epic and above
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
  // Damage taken +6%
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
  // Unique follows the template; this gives the Ancient tier
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
  trash: { id: "trash", label: "Ruins", range: ["poor", "common"] },
  normal: { id: "normal", label: "Common", range: ["common", "fine"] },
  elite: { id: "elite", label: "Elite", range: ["fine", "epic"] },
  rare: { id: "rare", label: "Rare", range: ["rare", "legendary"] },
  boss: { id: "boss", label: "Boss", range: ["epic", "mythic"] },
  deep: { id: "deep", label: "Deep", range: ["fine", "epic"] },
  nether: { id: "nether", label: "Nether", range: ["rare", "legendary"] },
  end: { id: "end", label: "End", range: ["epic", "legendary"] },
  ancient: { id: "ancient", label: "Ancient", range: ["epic", "mythic"] }
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
  { prefix: "wooden", tier: 0, name: "Wood" },
  { prefix: "leather", tier: 0, name: "Leather" },
  { prefix: "stone", tier: 1, name: "Stone" },
  { prefix: "golden", tier: 1, name: "Gold" },
  { prefix: "chainmail", tier: 1, name: "Chainmail" },
  { prefix: "copper", tier: 1, name: "Copper" },
  { prefix: "iron", tier: 2, name: "Iron" },
  { prefix: "diamond", tier: 3, name: "Diamond" },
  { prefix: "netherite", tier: 4, name: "Netherite" }
];
var SUFFIX = {
  sword: { group: "sword", kind: "sword", cn: "Sword" },
  axe: { group: "axe", kind: "axe", cn: "Axe" },
  pickaxe: { group: "pickaxe", kind: "pickaxe", cn: "Pickaxe" },
  shovel: { group: "shovel", kind: "shovel", cn: "Shovel" },
  hoe: { group: "hoe", kind: "hoe", cn: "Hoe" },
  helmet: { group: "head", kind: "helmet", cn: "Helmet" },
  chestplate: { group: "chest", kind: "chestplate", cn: "Chestplate" },
  leggings: { group: "legs", kind: "leggings", cn: "Leggings" },
  boots: { group: "feet", kind: "boots", cn: "Boots" },
  spear: { group: "spear", kind: "spear", cn: "Spear" },
  mace: { group: "mace", kind: "mace", cn: "Mace" }
};
var SPECIAL2 = {
  "minecraft:bow": { kind: "bow", group: "bow", materialTier: 1, materialName: "Bow", baseName: "Bow" },
  "minecraft:crossbow": { kind: "crossbow", group: "crossbow", materialTier: 2, materialName: "Crossbow", baseName: "Crossbow" },
  "minecraft:trident": { kind: "trident", group: "trident", materialTier: 3, materialName: "Trident", baseName: "Trident" },
  "minecraft:shield": { kind: "shield", group: "shield", materialTier: 2, materialName: "Shield", baseName: "Shield" },
  "minecraft:leather_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 0, materialName: "Leather", baseName: "Leather Horse Armor" },
  "minecraft:copper_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 1, materialName: "Copper", baseName: "Copper Horse Armor" },
  "minecraft:iron_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 2, materialName: "Iron", baseName: "Iron Horse Armor" },
  "minecraft:golden_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 1, materialName: "Gold", baseName: "Golden Horse Armor" },
  "minecraft:diamond_horse_armor": { kind: "horse_armor", group: "horse", materialTier: 3, materialName: "Diamond", baseName: "Diamond Horse Armor" },
  "minecraft:carrot_on_a_stick": { kind: "steering", group: "steering", materialTier: 1, materialName: "Carrot on a Stick", baseName: "Carrot on a Stick" },
  "minecraft:warped_fungus_on_a_stick": { kind: "steering", group: "steering", materialTier: 1, materialName: "Warped Fungus Rod", baseName: "Warped Fungus Rod" },
  "minecraft:fishing_rod": { kind: "fishing_rod", group: "fishing", materialTier: 1, materialName: "Fishing Rod", baseName: "Fishing Rod" },
  "minecraft:shears": { kind: "shears", group: "shears", materialTier: 2, materialName: "Shears", baseName: "Shears" },
  "minecraft:brush": { kind: "brush", group: "brush", materialTier: 1, materialName: "Brush", baseName: "Brush" },
  "minecraft:flint_and_steel": { kind: "flint_and_steel", group: "flint", materialTier: 1, materialName: "Flint and Steel", baseName: "Flint and Steel" },
  "minecraft:mace": { kind: "mace", group: "mace", materialTier: 3, materialName: "Mace", baseName: "Mace" },
  "minecraft:elytra": { kind: "chestplate", group: "chest", materialTier: 2, materialName: "Elytra", baseName: "Elytra" },
  "minecraft:turtle_helmet": { kind: "helmet", group: "head", materialTier: 2, materialName: "Turtle", baseName: "Turtle Shell" }
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
  sword: { group: "sword", kind: "sword", cn: "Sword", tier: 3 },
  axe: { group: "axe", kind: "axe", cn: "Axe", tier: 3 },
  pickaxe: { group: "pickaxe", kind: "pickaxe", cn: "Pickaxe", tier: 3 },
  shovel: { group: "shovel", kind: "shovel", cn: "Shovel", tier: 3 },
  hoe: { group: "hoe", kind: "hoe", cn: "Hoe", tier: 3 },
  spear: { group: "spear", kind: "spear", cn: "Spear", tier: 3 },
  fishing: { group: "fishing", kind: "fishing_rod", cn: "Fishing Rod", tier: 1 },
  horse: { group: "horse", kind: "horse_armor", cn: "Horse Armor", tier: 2 },
  horse_armor: { group: "horse", kind: "horse_armor", cn: "Horse Armor", tier: 2 },
  steering: { group: "steering", kind: "steering", cn: "Fishing Rod", tier: 1 },
  fishing_rod: { group: "fishing", kind: "fishing_rod", cn: "Fishing Rod", tier: 1 },
  shears: { group: "shears", kind: "shears", cn: "Shears", tier: 2 },
  brush: { group: "brush", kind: "brush", cn: "Brush", tier: 1 },
  flint: { group: "flint", kind: "flint_and_steel", cn: "Flint and Steel", tier: 1 },
  flint_and_steel: { group: "flint", kind: "flint_and_steel", cn: "Flint and Steel", tier: 1 },
  mace: { group: "mace", kind: "mace", cn: "Mace", tier: 3 },
  bow: { group: "bow", kind: "bow", cn: "Bow", tier: 2 },
  crossbow: { group: "crossbow", kind: "crossbow", cn: "Crossbow", tier: 2 },
  trident: { group: "trident", kind: "trident", cn: "Trident", tier: 3 },
  shield: { group: "shield", kind: "shield", cn: "Shield", tier: 2 },
  head: { group: "head", kind: "helmet", cn: "Helmet", tier: 3 },
  helmet: { group: "head", kind: "helmet", cn: "Helmet", tier: 3 },
  chest: { group: "chest", kind: "chestplate", cn: "Chestplate", tier: 3 },
  chestplate: { group: "chest", kind: "chestplate", cn: "Chestplate", tier: 3 },
  legs: { group: "legs", kind: "leggings", cn: "Leggings", tier: 3 },
  leggings: { group: "legs", kind: "leggings", cn: "Leggings", tier: 3 },
  feet: { group: "feet", kind: "boots", cn: "Boots", tier: 3 },
  boots: { group: "feet", kind: "boots", cn: "Boots", tier: 3 }
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
    materialName: "Third Party",
    baseName
  };
}

// scripts/domain/Naming.ts
var FLAVOR = [
  "Calamity",
  "Blood Moon",
  "Starfall",
  "Void",
  "Sky",
  "Frost Hush",
  "Thunder",
  "Dawn",
  "Dusk",
  "Dragon Soul",
  "Titan",
  "Wraith",
  "Oracle",
  "Lost World",
  "Eternal",
  "Chaos",
  "Doom",
  "Blood Moon"
];
var TITLES = {
  ancient: ["Curse", "Lost", "Ancient"],
  unique: ["Unique", "Finality", "Genesis"]
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
  return `${quality.color}[${quality.name}${tag}] ${name}\u00A7r`;
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
        parts.push(`${label} +${round(v)}s`);
        break;
      case "amp":
        parts.push(`${label} +${round(v)} Level`);
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
  sharpness: "Sharpness",
  smite: "Undead Slayer",
  bane_of_arthropods: "Arthropod Slayer",
  knockback: "Knockback",
  fire_aspect: "Fire Aspect",
  looting: "Looting",
  sweeping: "Sweeping Blade",
  efficiency: "Efficiency",
  silk_touch: "Silk Touch",
  fortune: "Fortune",
  unbreaking: "Durability",
  mending: "Mending",
  protection: "Protection",
  fire_protection: "Fire Protection",
  feather_falling: "Fall Protection",
  blast_protection: "Blast Protection",
  projectile_protection: "Projectile Protection",
  thorns: "Thorns",
  respiration: "Water Breathing",
  depth_strider: "Deep Sea Explorer",
  aqua_affinity: "Underwater Haste",
  frost_walker: "Frost Walker",
  soul_speed: "Soul Speed",
  swift_sneak: "Swift Sneak",
  power: "Strength",
  punch: "Impact",
  flame: "Flame Arrow",
  infinity: "Infinity",
  multishot: "Multishot",
  quick_charge: "Quick Charge",
  piercing: "Piercing",
  loyalty: "Loyalty",
  impaling: "Puncture",
  riptide: "Riptide",
  channeling: "Channeling",
  density: "Density",
  breach: "Sunder",
  wind_burst: "Wind Burst"
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
var MARK_POS = "\xA7a◆";
var MARK_NEG = "\xA7c⚠";
var MARK_SPE = "\xA76✦";
var MARK_UNI = "\xA75❖";
var AFFIX_BUDGET = 8;
var SEVERITY = {
  common: "",
  fine: "Light",
  rare: "Medium",
  epic: "Heavy",
  legendary: "Extremely Heavy",
  mythic: "Lethal"
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
    lines.push("\u00A78\u2026and " + (list.length - shown.length) + " affixes");
  }
  return shown.length;
}
var ORIGIN_CN = {
  crafting: "Craft",
  mob_loot: "Mob Drops",
  chest_loot: "Chest Loot",
  fishing: "Fishing",
  reward: "Quest Reward",
  script_give: "Given by command/script",
  inventory: "Obtained in Inventory",
  third_party: "Third-party Addon",
  unknown: "Unknown Source"
};
function originText(spec) {
  const raw = spec.origin;
  if (!raw) return void 0;
  const base = ORIGIN_CN[raw] ?? raw;
  const detail = spec.originDetail;
  if (!detail) return base;
  const short = detail.replace("minecraft:", "");
  const MOB_CN = {
    zombie: "Zombie",
    skeleton: "Skeleton",
    spider: "Spider",
    creeper: "Creeper",
    enderman: "Enderman",
    blaze: "Blaze",
    witch: "Witch",
    warden: "Warden",
    wither: "Wither",
    ender_dragon: "Ender Dragon",
    elder_guardian: "Elder Guardian"
  };
  const name = MOB_CN[short] ?? short;
  return base + "(" + name + ")";
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
  lines.push("\xA78" + color + "[" + (q ? q.name : spec.quality) + "]\u00A78 \u00B7 Risk \u00A7c" + spec.risk);
  if (syn !== "normal") {
    const note = synDetail && synDetail.length ? "(" + synDetail.join(", ") + ")" : "";
    const synColor = syn === "conflict" ? "\xA7c" : syn === "perfect" ? "\xA76" : "\xA7b";
    lines.push("\u00A78Synergy " + synColor + SYNERGY_LEVEL_NAME[syn] + "\xA78" + note);
  }
  lines.push("\u00A78Base Stats \u00A7c\u00D7" + spec.baseMult.toFixed(2) + "\u00A78(" + spec.baseName + ")");
  const tier2 = speedTierFor(specStats(spec));
  if (tier2.id !== "normal") {
    lines.push("\u00A78Attack Speed " + tier2.color + tier2.name + "\u00A78(" + (tier2.pct >= 0 ? "+" : "") + tier2.pct + "%)");
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
    lines.push("\u00A78\u258EHidden Affix " + (spec.awakened ? "\u00A7aAwakened" : "\u00A77Not Awakened"));
    if (spec.awakened) for (const k of awakenKeys) lines.push("\xA75❖ " + (STAT_META[k]?.label ?? k));
  }
  const hiddenKeys = Object.keys(spec.hidden).filter((k) => !k.startsWith("hiddenAwaken"));
  if (hiddenKeys.length) {
    lines.push("");
    lines.push("\u00A78\u258EHidden Stats");
    for (const k of hiddenKeys.slice(0, 2)) lines.push("\xA78" + (STAT_META[k]?.label ?? k) + " +" + round(spec.hidden[k]));
    if (hiddenKeys.length > 2) lines.push("\u00A78\u2026and " + (hiddenKeys.length - 2) + " hidden stats");
  }
  const originLine = originText(spec);
  if (originLine) lines.push("\u00A78Source:" + originLine);
  lines.push("");
  lines.push("\u00A77Equipment Score: \u00A7e" + spec.score);
  const ench = opts.enchantments ?? [];
  if (ench.length) {
    lines.push("\u00A77Enchant: \u00A7b" + ench.join("\u00A77, \u00A7b"));
  } else {
    lines.push("\u00A78Enchanting / anvil / grindstone all work normally");
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
  return hit ? `\u00A78Potential Resonance: ${hit.name} (${hit.desc})` : void 0;
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
        zlog("setItem failed", { slot: i, error: String(e) });
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
        zlog("setEquipment failed", { slot, error: String(e) });
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
    reasons.push("Idle Attack Decay");
  }
  if (ctx.dimId !== "minecraft:nether" && g("uniqueAbyssHeart")) {
    mult -= 0.2;
    reasons.push("Abyssal Heart\u00B7Overworld Weakening");
  }
  if (ctx.dimId === "minecraft:overworld" && g("uniqueEternalNight")) {
    mult += ctx.night ? 0.5 : -0.35;
    reasons.push(ctx.night ? "Endless Night" : "Eternal Night\u00B7Daytime Weakness");
  }
  if (ctx.dimId === "minecraft:overworld" && g("uniqueSunHeart")) {
    mult += ctx.night ? -0.3 : 0.45;
    reasons.push(ctx.night ? "Sun Heart \u00B7 Weakened at Night" : "Sun Heart");
  }
  const base = ctx.st.weaponBaseMult ?? 1;
  if (base !== 1) {
    mult *= base;
    if (reasons.length < 6) reasons.push(`Base \u00D7${base.toFixed(2)}`);
  }
  const tier2 = speedTierFor(s);
  const comp = speedDpsCompensation(tier2);
  if (comp !== 1) {
    mult *= comp;
    reasons.push(`Attack Speed\u00B7${tier2.name}`);
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
    reasons.push("Crit");
  }
  const lucky = g("luckyChance") > 0 && ctx.roll2 * 100 < g("luckyChance");
  if (lucky) {
    mult *= 3;
    reasons.push("Lucky Strike");
  }
  const doubleStrike = g("doubleStrikeChance") > 0 && ctx.roll3 * 100 < g("doubleStrikeChance");
  if (doubleStrike) reasons.push("Extra Strike");
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
    zlog("entityHurt(before) exception", { error: String(e) });
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
    zlog("entityHurt(after) exception", { error: String(e) });
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
    // Already handled in the damage layer
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
    // Handled in the defense layer
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
    // Handled in the damage layer via frozenTargetPct
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
    zlog("entityDie exception", { error: String(e) });
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
    zlog("setblock destroy failed", { x, y, z, error: String(e) });
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
    zlog("playerBreakBlock error", { error: String(e) });
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
  const syn = spec.synergy >= 0.85 ? "Very High" : spec.synergy >= 0.65 ? "High" : spec.synergy >= 0.4 ? "Common" : "Conflict";
  lines.push(`Quality: ${q ? q.name : spec.quality}    Score: ${spec.score}    Risk: ${spec.risk}    Synergy: ${Math.round(spec.synergy * 100)}% (${syn})`);
  lines.push(`Type: ${spec.baseName}    Base Stats: \u00D7${spec.baseMult.toFixed(2)}`);
  lines.push("");
  if (!spec.identified) {
    lines.push("[Unidentified]");
    lines.push("Use an Identify Scroll (equipment in main hand + scroll in off hand, right-click a crafting table) to reveal the true affixes.");
    return lines;
  }
  const sec = (title, list) => {
    if (!list.length) return;
    lines.push(`— ${title} —`);
    for (const a of list) {
      const def = AFFIX_BY_ID[a.id];
      const rar = a.rarity && a.rarity !== "common" ? `[${RARITY_NAME[a.rarity]}]` : "";
      const text = def ? modText(def, a.level, a.roll ?? 1) : "";
      lines.push(`${def?.name ?? a.id} ${roman(a.level)} ${rar}`);
      if (text) lines.push(`    ${text}`);
    }
  };
  sec("Positive Affixes", spec.pos);
  sec("Dual-edge Affix", spec.dual);
  sec("Special Affix", spec.special);
  sec("Negative Affixes", spec.neg);
  sec("Curse", spec.curse);
  sec("Unique Affix", spec.unique);
  const awaken = Object.keys(spec.hidden).filter((k) => k.startsWith("hiddenAwaken"));
  if (awaken.length) {
    lines.push("");
    lines.push(`Hidden Affix: ${spec.awakened ? "Awakened" : "Not awakened (awakens after some use)"}`);
    if (spec.awakened) for (const k of awaken) lines.push(`  ${STAT_META[k]?.label ?? k}`);
  }
  if (Object.keys(spec.hidden).length) {
    lines.push("");
    lines.push("\u2014 Hidden Stats \u2014");
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
    lines.push("\u2014 Active Resonances \u2014");
    for (const r of resonances) lines.push(`${r.def.name}: ${r.def.desc}`);
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
    lines.push(`${meta?.label ?? k}: ${v > 0 ? "+" : ""}${round(v)}${meta?.unit === "pct" ? "%" : ""}`);
  }
  return lines.length ? lines : ["(No Active Stats)"];
}
async function showInspect(player, spec, resonances = []) {
  const form = new ActionFormData().title(spec.identified ? spec.name.replace(/§./g, "") : "Mysterious Equipment").body(inspectLines(spec, resonances).join("\n")).button("Stat Details").button("Disabled");
  const res = await form.show(player);
  if (res.canceled) return;
  if (res.selection === 0) {
    await new MessageFormData().title("Stat Details").body(statLines(spec).join("\n")).button1("Back").button2("Disabled").show(player);
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
  // Approximate mapping (see reports/IMPLEMENTATION_MAPPING.md)
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
      zlog("addEffect failed", { id: entry.id, error: String(e) });
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
  if (running) return "Self-test already running";
  buildSteps();
  stepIndex = 0;
  running = true;
  zlog("Self test started", { steps: steps.length });
  return `Self-test started (${steps.length} steps)`;
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
        fail(step.id, `Still not ready after ${MAX_RETRIES} retries (world resources not prepared)`);
        stepIndex++;
      }
      return;
    }
    stepIndex++;
  } catch (e) {
    fail(step.id, "Self-test step threw an exception: " + String(e));
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
      if (!ok) return fail("af.runtime.boot", "Core module or world API unavailable");
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
        if (seen.has(a.id)) errors.push("Duplicate id: " + a.id);
        seen.add(a.id);
        for (const g of a.groups) groups.add(g);
        for (const mod of a.mods) {
          if (!STAT_META[mod.stat]) errors.push(`${a.id}: unregistered stat ${mod.stat}`);
          if (mod.levels.length !== 5) errors.push(`${a.id}: ${mod.stat} levels array length=${mod.levels.length}`);
        }
        if (!a.groups.length) errors.push(`${a.id}: no available slots`);
        if (!RARITY_ORDER.includes(a.rarity)) errors.push(`${a.id}: invalid affix quality ${a.rarity}`);
      }
      const totalWeight = QUALITIES.reduce((s, q) => s + q.weight, 0);
      if (totalWeight !== 1e4) errors.push(`Quality weight sum=${totalWeight}`);
      if (ALL_AFFIXES.length < 400) errors.push(`Not enough affixes: ${ALL_AFFIXES.length}`);
      if (groups.size !== 21) errors.push(`Equipment slots=${groups.size} (expected 21)`);
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
        if (poolFor("positive", g).length < 5) missing.push(`Positive pool insufficient ${g}`);
        if (poolFor("negative", g).length < 3) missing.push(`Negative pool insufficient ${g}`);
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
      if (generated < 1900) return fail("af.runtime.generate", `Only generated ${generated}/2000`);
      if (exclusionViolations > 0) return fail("af.runtime.generate", `Exclusion conflicts: ${exclusionViolations}`);
      if (mythicTotal > 0 && mythicWithNeg / mythicTotal < 0.9) {
        return fail("af.runtime.generate", `Mythic with negative ratio too low ${mythicWithNeg}/${mythicTotal}`);
      }
      if (groupsSeen.size !== 13) return fail("af.runtime.generate", `Covered slots ${groupsSeen.size}/13`);
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
      if (!s || !s.mythicTotal) return fail("af.runtime.score", "Missing Generation Stats");
      const worstMythic = s.worstMythic === Number.MAX_SAFE_INTEGER ? 0 : s.worstMythic;
      if (!(s.bestLegendary > worstMythic)) {
        return fail("af.runtime.score", `Scores not separated: best Legendary ${s.bestLegendary} <= worst Mythic ${worstMythic}`);
      }
      const fragile = AFFIX_BY_ID.fragile;
      const s5 = affixScore(fragile, 5);
      if (s5 >= 0) return fail("af.runtime.score", `Negative affix score should be negative: Fragile V = ${s5}`);
      const sharp = AFFIX_BY_ID.sharpness;
      if (affixScore(sharp, 3, 1.5) <= affixScore(sharp, 3, 1)) {
        return fail("af.runtime.score", "Affix quality multiplier did not amplify the score");
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
      if (perfect.level !== "perfect") return fail("af.runtime.synergy", `Crit + Lethal should be Very High, actual ${perfect.level}`);
      if (conflict.level !== "conflict") return fail("af.runtime.synergy", `Nimble+Sluggish should conflict, actual ${conflict.level}`);
      if (normal.level !== "normal") return fail("af.runtime.synergy", `Sharp+Smite should be Common, actual ${normal.level}`);
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
      if (!spec) return fail("af.runtime.item_write", "Generation Failed");
      const stack = new ItemStack3("minecraft:diamond_sword", 1);
      stack.nameTag = spec.name;
      stack.setLore(buildLore(spec));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const back = stack.getDynamicProperty(DYNPROP_KEY);
      if (typeof back !== "string") return fail("af.runtime.item_write", "dynamic property was not written back");
      const lore = stack.getLore();
      if (!lore || !lore.length) return fail("af.runtime.item_write", "lore is empty");
      if (stack.nameTag !== spec.name) return fail("af.runtime.item_write", "nameTag mismatch");
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
      if (!spec) return fail("af.runtime.item_read", "Generation Failed");
      const stack = new ItemStack3("minecraft:netherite_chestplate", 1);
      stack.setLore(buildLore(spec, { includePayload: true }));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const a = decodeSpec(String(stack.getDynamicProperty(DYNPROP_KEY)));
      const b = decodeSpec(parseLorePayload(stack.getLore()));
      if (!a || !b) return fail("af.runtime.item_read", `Dual-channel read failed A=${!!a} B=${!!b}`);
      const same = a.quality === spec.quality && a.score === spec.score && a.pos.length === spec.pos.length && a.neg.length === spec.neg.length && a.special.length === spec.special.length && a.curse.length === spec.curse.length && a.synergy === spec.synergy && a.awakened === spec.awakened;
      if (!same) return fail("af.runtime.item_read", "Read-back data does not match what was written");
      const v1 = decodeSpec(
        JSON.stringify([1, 1, "rare", "sword", "sword", "Diamond Sword", 3, 1.2, [["sharpness", 2]], [], [], [], {}, 20, 300, true, "\u00A7b[Rare] Diamond Sword\u00A7r"])
      );
      if (!v1) return fail("af.runtime.item_read", "v1 legacy data cannot be read back");
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
      if (!ench) return fail("af.runtime.enchant_preserved", "Item has no minecraft:enchantable component");
      const type = EnchantmentTypes.get("sharpness");
      if (!type) return fail("af.runtime.enchant_preserved", "Sharpness enchantment type not found");
      ench.addEnchantment({ type, level: 5 });
      const before = ench.getEnchantments().length;
      if (before < 1) return fail("af.runtime.enchant_preserved", "Enchantment was not applied");
      const spec = generateSpec("minecraft:diamond_sword", 20816, { forceQuality: "legendary", forceIdentified: true });
      if (!spec) return fail("af.runtime.enchant_preserved", "Generation Failed");
      stack.setLore(buildLore(spec));
      stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
      const after = stack.getComponent("minecraft:enchantable")?.getEnchantments().length ?? 0;
      if (after !== before) return fail("af.runtime.enchant_preserved", `Enchantment broken: ${before} -> ${after}`);
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
              tried.push(`${cx},${y},${cz}: no inventory component`);
              continue;
            }
            const spec = generateSpec("minecraft:iron_sword", 12648430, { forceQuality: "rare", forceIdentified: true });
            if (!spec) return fail("af.runtime.container", "Generation Failed");
            const stack = new ItemStack3("minecraft:iron_sword", 1);
            stack.setLore(buildLore(spec));
            stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
            inv.container.setItem(0, stack);
            const back = inv.container.getItem(0);
            const read = decodeSpec(String(back?.getDynamicProperty(DYNPROP_KEY)));
            if (!read || read.score !== spec.score) return fail("af.runtime.container", "Container data read-back mismatch");
            pass("af.runtime.container", { location: { x: cx, y, z: cz }, score: read.score, quality: read.quality });
            return true;
          } catch (e) {
            tried.push(`${cx},${y},${cz}: ${String(e)}`);
          }
        }
      }
      zlog("container not ready, retry later", { tried: tried.slice(0, 3) });
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
      if (missing.length) return fail("af.runtime.effects", "Invalid effect id: " + missing.join(","));
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
      if (!plan.length) return fail("af.runtime.effects", "effectPlan produced no effects");
      const unknown = plan.filter((p) => !EffectTypes.get(p.id));
      if (unknown.length) return fail("af.runtime.effects", "Unknown effect: " + unknown.map((u) => u.id).join(","));
      pass("af.runtime.effects", { verified: ids.length, plan: plan.map((p) => `${p.id}:${p.amp}`) });
    }
  });
  steps.push({
    id: "af.runtime.commands",
    fn: () => {
      const ids = registeredScriptEvents();
      if (!ids.length) return fail("af.runtime.commands", "No scriptevent registered");
      pass("af.runtime.commands", { ids });
    }
  });
  steps.push({
    id: "af.runtime.resonance",
    fn: () => {
      const mk = (type, ids) => {
        const spec = generateSpec(type, 40503 + ids.length, { forceQuality: "legendary", forceIdentified: true });
        if (!spec) throw new Error("Generation failed " + type);
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
        return fail("af.runtime.resonance", "Guardian Resonance did not trigger: " + JSON.stringify(armor.map((a) => a.def.id)));
      }
      const tool = computeToolResonances(mk("minecraft:diamond_pickaxe", ["swift_dig", "ore_vein", "lucky_miner"]));
      if (!tool.some((a) => a.def.id === "miner")) {
        return fail("af.runtime.resonance", "Miner Resonance did not trigger: " + JSON.stringify(tool.map((a) => a.def.id)));
      }
      if (computeArmorResonances({}).length) return fail("af.runtime.resonance", "Empty set should have no resonance");
      pass("af.runtime.resonance", { armor: armor.map((a) => a.def.name), tool: tool.map((a) => a.def.name) });
    }
  });
  steps.push({
    id: "af.runtime.tooltip",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 7486, { forceQuality: "mythic" });
      if (!spec) return fail("af.runtime.tooltip", "Generation Failed");
      if (!spec.identified) return fail("af.runtime.tooltip", "Generation result is not in an identified state (\u00A71 requires it to be usable on generation)");
      const lore = buildLore(spec, { enchantments: ["Sharpness V", "Durability III"] });
      const plain = lore.map((l) => l.replace(/§./g, ""));
      const hasMark = plain.some((l) => l.includes("◆")) || plain.some((l) => l.includes("⚠"));
      const hasScore = plain.some((l) => l.startsWith("Equipment Score:"));
      const hasEnch = plain.some((l) => l.startsWith("Enchant: ") && l.includes("Sharpness V"));
      const hasName = plain.some((l) => l.includes("[Mythic]"));
      const noUnidentified = !plain.some((l) => l.includes("Unidentified"));
      if (!hasMark || !hasScore || !hasEnch || !hasName || !noUnidentified) {
        return fail("af.runtime.tooltip", "tooltip structure does not match \u00A742", { hasMark, hasScore, hasEnch, hasName, noUnidentified });
      }
      const awakenBase = generateSpec("minecraft:diamond_sword", 10794, { forceQuality: "ancient", forceIdentified: true });
      if (!awakenBase) return fail("af.runtime.tooltip", "Failed to generate Awakening test cases");
      const notAwake = { ...awakenBase, hidden: { hiddenAwakenNight: 1 }, awakened: false };
      const awake = awakenSpec(notAwake);
      if (!awake.awakened) return fail("af.runtime.tooltip", "Awakened state did not flip");
      if (!buildLore(notAwake).some((l) => l.includes("Dormant"))) return fail("af.runtime.tooltip", "Awakening hint is missing");
      pass("af.runtime.tooltip", {
        lines: lore.length,
        marks: plain.filter((l) => l.includes("◆")).length,
        warns: plain.filter((l) => l.includes("⚠")).length,
        score: spec.score,
        enchantLine: plain.find((l) => l.startsWith("Enchant: ")) ?? null,
        awaken: "Dormant \u2192 Awakened",
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
          if (info) bad.push(`${id} should not be identified as equipment`);
        } else if (!info || info.group !== group) {
          bad.push(`${id} -> ${info?.group ?? "undefined"} (expected ${group})`);
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
        zlog("damage_calibration not ready, retry later", { error: baseline.error ?? "loss<0" });
        return false;
      }
      const boosted = spawnAndHit({ x: base.x + 2, y: base.y, z: base.z }, 2);
      if (boosted.error || boosted.loss < 0) {
        zlog("damage_calibration not ready on second attempt, retry later", { error: boosted.error ?? "loss<0" });
        return false;
      }
      if (baseline.loss <= 0) {
        return fail("af.runtime.damage_calibration", `Baseline damage did not take effect: loss=${baseline.loss}`);
      }
      if (!(boosted.loss > baseline.loss)) {
        return fail(
          "af.runtime.damage_calibration",
          `ev.damage change did not affect final damage loss: ${baseline.loss.toFixed(2)} -> ${boosted.loss.toFixed(2)}`
        );
      }
      pass("af.runtime.damage_calibration", {
        baselineLoss: +baseline.loss.toFixed(3),
        boostedLoss: +boosted.loss.toFixed(3),
        ratio: +(boosted.loss / baseline.loss).toFixed(2),
        note: "Changes to beforeEvents.entityHurt.damage really do carry through to the final health loss. The multiplier need not be exactly 2 \u2014 vanilla also applies armor/difficulty/hurt resolution; what is proven here is the chain \"modifiable and effective\""
      });
      return true;
    }
  });
  steps.push({
    id: "af.runtime.stats_aggregate",
    fn: () => {
      const spec = generateSpec("minecraft:diamond_sword", 1911, { forceQuality: "epic", forceIdentified: true });
      if (!spec) return fail("af.runtime.stats_aggregate", "Generation Failed");
      const stats = specStats(spec);
      const total = Object.values(stats).reduce((a, b) => a + Math.abs(b), 0);
      if (total <= 0) return fail("af.runtime.stats_aggregate", "Stat aggregation is empty");
      if (Object.keys(emptyStats()).length < 200) return fail("af.runtime.stats_aggregate", "emptyStats key count is abnormal");
      const risk0 = computeRisk([]);
      const risk1 = computeRisk([{ id: "fragile", level: 5, roll: 1 }]);
      if (!(risk1 > risk0)) return fail("af.runtime.stats_aggregate", "Risk budget calculation error");
      const { score: _sc, name: _nm, ...rest } = spec;
      const recomputed = computeScore(rest);
      if (Math.abs(recomputed - spec.score) > 1) {
        return fail("af.runtime.stats_aggregate", `Score is not reproducible: ${recomputed} vs ${spec.score}`);
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
      if (SPEED_TIERS.length < 5) return fail("af.runtime.speed_tier", "Insufficient Tiers");
      const asc = SPEED_TIERS.every((x, i) => i === 0 || x.pct > SPEED_TIERS[i - 1].pct);
      if (!asc) return fail("af.runtime.speed_tier", "Tiers are not monotonically increasing");
      const cdAsc = SPEED_TIERS.every((x, i) => i === 0 || x.cooldown < SPEED_TIERS[i - 1].cooldown);
      if (!cdAsc) return fail("af.runtime.speed_tier", "Cooldown does not decrease with tier");
      const normal = speedTierFor({});
      if (normal.id !== "normal") return fail("af.runtime.speed_tier", `Empty stat should fall in Common tier, got ${normal.id}`);
      const fast = speedTierFor({ attackSpeedPct: 34 });
      if (fast.id !== "swift") return fail("af.runtime.speed_tier", `+34% should fall in the fastest tier, got ${fast.id}`);
      const slow = speedTierFor({ attackSpeedPct: -28 });
      if (slow.id !== "sluggish") return fail("af.runtime.speed_tier", `-28% should land in the very slow tier, actual ${slow.id}`);
      const comp = speedDpsCompensation(fast);
      if (SPEED_NATIVE ? comp !== 1 : Math.abs(comp - 1.35) > 1e-3) {
        return fail("af.runtime.speed_tier", `Effective DPS conversion anomaly: ${comp}`);
      }
      const tpl = nativeTemplate("diamond", fast, 7, 1561);
      const comps = tpl["minecraft:item"]?.components ?? {};
      for (const k of ["minecraft:cooldown", "minecraft:damage", "minecraft:durability", "minecraft:enchantable", "minecraft:repairable", "minecraft:hover_text_color", "minecraft:rarity"]) {
        if (!(k in comps)) return fail("af.runtime.speed_tier", `Native template is missing component ${k}`);
      }
      if (comps["minecraft:cooldown"].type !== "attack") return fail("af.runtime.speed_tier", "cooldown.type must be attack");
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
        if (!spec) return fail("af.runtime.item_entity", "Generation Failed");
        const stack = new ItemStack3("minecraft:iron_sword", 1);
        stack.setLore(buildLore(spec));
        stack.setDynamicProperty(DYNPROP_KEY, encodeSpec(spec));
        ent = dim.spawnItem(stack, { x: 8, y: 101, z: 8 });
        if (!ent) {
          zlog("item_entity not ready, retrying later");
          return false;
        }
        const comp = ent.getComponent("minecraft:item");
        const back = comp?.itemStack;
        if (!back) return fail("af.runtime.item_entity", "Dropped item has no minecraft:item component");
        const read = decodeSpec(String(back.getDynamicProperty(DYNPROP_KEY)));
        if (!read || read.score !== spec.score || read.pos.length !== spec.pos.length) {
          return fail("af.runtime.item_entity", "Equipment data on the dropped item is inconsistent");
        }
        const loreOk = (back.getLore() ?? []).some((l) => l.includes("Score"));
        if (!loreOk) return fail("af.runtime.item_entity", "Drop item lore lost");
        pass("af.runtime.item_entity", {
          score: read.score,
          quality: read.quality,
          pos: read.pos.length,
          loreLines: (back.getLore() ?? []).length,
          note: "Data is preserved with the dropped item entity (data-side evidence for death drop \u2192 pickup)"
        });
        return true;
      } catch (e) {
        zlog("item_entity not ready, retrying later", { error: String(e) });
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
      if (back.length < many.length) problems.push(`lore truncated: ${many.length} -> ${back.length}`);
      if (longest < long.length) problems.push(`Single line truncated: ${long.length} -> ${longest}`);
      if (payloadDefault !== void 0) problems.push("Default tooltip still contains machine-readable payload lines (junk lines visible to players)");
      if (!payload) problems.push("Fallback-mode payload line cannot be reassembled (data is lost when the dynamic property fails)");
      if (payloadLine.length > 60) problems.push(`Fallback payload single line too long: ${payloadLine.length}`);
      if (worstLore.length > 26) problems.push(`Worst-case tooltip line count ${worstLore.length} is too long (readability limit 26 lines)`);
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
      if (!Array.isArray(players)) return fail("af.runtime.world_api", "getAllPlayers returned a non-array");
      if (typeof time !== "number") return fail("af.runtime.world_api", "getTimeOfDay returned a non-number");
      pass("af.runtime.world_api", {
        players: players.length,
        timeOfDay: time,
        dimensions: dims,
        playerPathNote: players.length === 0 ? "Headless environment has no player: player interaction paths are covered by Layer A pure functions" : "Player Present"
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
  return `Ran ${out.length} self-tests`;
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
  { id: "tpl_time", name: "Time" },
  { id: "tpl_space", name: "Space" },
  { id: "tpl_gluttony", name: "Gluttony" },
  { id: "tpl_eternal_night", name: "Endless Night" },
  { id: "tpl_sun_heart", name: "Sun Heart" },
  { id: "tpl_abyss_heart", name: "Abyssal Heart" }
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
  if (!stack) return { eligible: false, reason: "No Item", thirdParty: false };
  if (isRPG(stack)) return { eligible: false, reason: "Already RPG equipment (never rerolled)", thirdParty: false };
  if (!originEnabled(origin)) return { eligible: false, reason: `Source closed: ${origin}`, thirdParty: false };
  const tags = safeTags(stack);
  if (tags.includes(TAG_IGNORE)) return { eligible: false, reason: "Third-party declaration kira:rpg_ignore", thirdParty: false };
  const declared = tags.find((t) => t === TAG_WEAPON || t === TAG_ARMOR || t === TAG_TOOL);
  if (declared) {
    const info2 = classifyThirdParty(stack.typeId, tags);
    if (!info2) {
      return { eligible: false, reason: "Third party declared kira:rpg_* but no recognizable kira:rpg_type_* is present", thirdParty: true };
    }
    const poolTag = tags.find((t) => t.startsWith("kira:rpg_pool_") || t.startsWith("kira:rpg_material_"));
    return {
      eligible: true,
      reason: `Third-party declared ${declared} \u2192 ${info2.group}`,
      thirdParty: true,
      pool: poolTag ? poolTag.replace("kira:rpg_pool_", "").replace("kira:rpg_material_", "") : void 0,
      info: info2
    };
  }
  const info = classify(stack.typeId);
  if (info) return { eligible: true, reason: `Vanilla equipment ${info.baseName}`, thirdParty: false };
  if (THIRD_PARTY_WHITELIST.includes(stack.typeId)) {
    return { eligible: true, reason: "Third-party whitelist", thirdParty: true };
  }
  return { eligible: false, reason: `Not in takeover pool: ${stack.typeId}`, thirdParty: false };
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
    return { stack, ingested: false, reason: "Generator does not recognize this item", thirdParty: verdict.thirdParty };
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
        zlog("unique:downgraded", { template: tplId, reason: "Already occupied or the registry is not writable" });
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
      zlog("Failed to regenerate drops", { error: String(e) });
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
        zlog("Affix Forge Command List", { ids: REGISTERED });
        world11.sendMessage(
          [
            "\u00A76===== Affix Forge =====",
            "\u00A7e\u2014\u2014 How to Play \u2014\u2014",
            "\u00A77\u00B7 Mine, fight, loot chests and craft as usual \u2014\u2014 equipment \u00A7fautomatically\u00A77 turns into random gear, \u00A7fready to use at once",
            "\u00A77\u00B7 Requires no extra materials, scrolls or special workbench",
            "\u00A7e\u2014\u2014 Commands \u2014\u2014",
            "\u00A77/scriptevent af:inspect \u00A78Inspect main-hand equipment (full affix panel)",
            "\u00A77/scriptevent af:stats \u00A78Print the aggregated stats of main-hand equipment",
            "\u00A77/scriptevent af:roll <item id> [quality] \u00A78Generate a specific piece of equipment",
            "\u00A77/scriptevent af:verify \u00A78Self-check list (includes live-client acceptance items)",
            "\u00A77/scriptevent af:selftest \u00A78runs 22 runtime self-tests"
          ].join("\n")
        );
        break;
      case "af:selftest":
        world11.sendMessage("\xA7e" + runSelfTestOnce());
        break;
      case "af:inspect": {
        if (!player) {
          world11.sendMessage("\u00A7cThis command requires a player");
          break;
        }
        const spec = mainhandSpec(player);
        if (!spec) {
          reply(player, "\u00A7cThe main hand is not equipment from this system");
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
          world11.sendMessage("\u00A7cNo player online, cannot give item");
          break;
        }
        const spec = giveGenerated(target, type, quality);
        world11.sendMessage(spec ? `\u00A7aGenerated \u00A7r${spec.name}` : `\u00A7cCannot spawn ${type}`);
        break;
      }
      case "af:stats": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7cNo players online");
          break;
        }
        const spec = mainhandSpec(target);
        if (!spec) {
          world11.sendMessage("\u00A7cThe main hand is not equipment from this system");
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
          world11.sendMessage("\u00A7caf:dura requires a player executor");
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
        world11.sendMessage(`\u00A7aDurability: ${JSON.stringify(info)}`);
        break;
      }
      case "af:dura-set": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7caf:dura-set requires a player executor");
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
          zlog("af:dura-set failed", { error: String(e) });
        }
        zlog("af:dura-set", { requested: n, before, after, ok });
        world11.sendMessage(`\u00A7aDurability write: requested ${n} / before ${before} / after ${after} / ok=${ok}`);
        break;
      }
      case "af:dura-slot": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7caf:dura-slot requires a player");
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
        world11.sendMessage(`\u00A7aDurability[${slotName}]: ${JSON.stringify(info)}`);
        break;
      }
      case "af:dura-grant": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7caf:dura-grant requires a player");
          break;
        }
        const statName = parts[0];
        const statVal = Number(parts[1] ?? 0);
        const typeId = parts[2] ?? "minecraft:diamond_pickaxe";
        const slotName = parts[3] ?? "Mainhand";
        if (!statName) {
          world11.sendMessage("\u00A7cUsage: af:dura-grant <stat> <value> [item] [slot]");
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
          spec.name = `\u00A7e[Test] ${statName}=${statVal}`;
          spec.score = 0;
          writeSpec(item, spec);
          specOk = true;
        }
        const eq = target.getComponent("minecraft:equippable");
        const slot = EquipmentSlot3[slotName] ?? EquipmentSlot3.Mainhand;
        eq?.setEquipment(slot, item);
        zlog("af:dura-grant", { player: target.name, stat: statName, value: statVal, item: typeId, slot: String(slot), specOk });
        world11.sendMessage(`\u00A7aApplied ${statName}=${statVal} to ${typeId} (${slotName})`);
        break;
      }
      case "af:dumpitems": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7caf:dumpitems requires a player executor");
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
        world11.sendMessage(`\u00A7aDumped nearby drops (${list.length}), see the server log`);
        break;
      }
      case "af:dumpinv": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7caf:dumpinv requires a player executor");
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
              // Diagnostic: the third-party contract relies on Item Tag, so print tags as-is here
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
        world11.sendMessage(`\u00A7aDumped ${target.name}'s inventory (${out.length} items), see server log`);
        break;
      }
      case "af:scan": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7caf:scan requires a player as the executor (/execute as @a run scriptevent af:scan)");
          break;
        }
        registerPlayer(target.id);
        let changed = 0;
        try {
          const inv = target.getComponent("minecraft:inventory");
          if (inv?.container) changed = processContainer(inv.container);
        } catch (e) {
          zlog("af:scan inventory failed", { error: String(e) });
        }
        let stats = 0;
        try {
          const st = refreshPlayer(target, true);
          applyEffects(target, st);
          stats = Object.keys(st.stats).filter((k) => st.stats[k]).length;
        } catch (e) {
          zlog("af:scan stat failed", { error: String(e) });
        }
        zlog("af:scan", { player: target.name, changed, activeStats: stats });
        world11.sendMessage(`\u00A7aRescanned ${target.name}: ${changed} new equipment generated, ${stats} stats applied`);
        break;
      }
      case "af:forge": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7cNo players online, cannot forge");
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
          world11.sendMessage("\u00A7cCannot generate " + typeId);
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
        world11.sendMessage(`\u00A7aForged \u00A7r${spec.name}`);
        zlog("af:forge", { typeId, quality, pos: pos.map((a) => a.id), neg: neg.map((a) => a.id) });
        break;
      }
      case "af:verify": {
        const target = player ?? firstPlayer();
        if (!target) {
          world11.sendMessage("\u00A7cMust be run by a player: /scriptevent af:verify");
          break;
        }
        const spec = mainhandSpec(target);
        const st = getState(target.id, target.name);
        const lines = [];
        lines.push("\u00A76===== Affix Forge \u00B7 Vertical Slice Self-test =====");
        lines.push(spec ? `\u00A7a[Auto] Main-hand equipment identified: ${spec.name}` : "\u00A7e[Auto] Main hand is not equipment from this system (equip a piece first)");
        if (spec) {
          lines.push(`\u00A7a[Auto] Quality=${spec.quality} Score=${spec.score} Risk=${spec.risk} Synergy=${Math.round(spec.synergy * 100)}%`);
          lines.push(`\u00A7a[Auto] Affixes: Positive ${spec.pos.length} / Negative ${spec.neg.length} / Dual-edge ${spec.dual.length} / Special ${spec.special.length} / Curse ${spec.curse.length} / Unique ${spec.unique.length}`);
          lines.push(spec.identified ? "\u00A7a[Auto] Identify status: Identified" : "\u00A7e[Auto] Identify status: Unidentified (Identify Scroll in offhand + right-click workstation)");
          const ench = 0;
          void ench;
        }
        lines.push(`\u00A7a[Auto] Resonance active: ${st.resonances.length ? st.resonances.map((r) => r.def.name).join(", ") : "None"}`);
        const stats = st.stats;
        const active = Object.keys(stats).filter((k) => stats[k]).length;
        lines.push(`\u00A7a[Auto] Active stats: ${active}`);
        lines.push("\u00A77--- Needs your manual confirmation (20-item checklist in reports/PLAYER_ACCEPTANCE.md) ---");
        lines.push("\u00A77 1. Put 4 Paper + 1 Amethyst Shard in a Crafting Table \u2192 yields 2 Identify Scrolls");
        lines.push("\u00A77 2. Craft a wooden sword at the crafting table \u2192 the name instantly becomes [Quality] Prefix\u00B7Wooden Sword");
        lines.push("\u00A77 3. Hover for tooltip: Quality/Score/Risk/Synergy/Positive & Negative Affixes/Attack Speed Tier");
        lines.push("\u00A77 4. Put in chest \u2192 take out \u2192 affixes unchanged");
        lines.push("\u00A77 5. Enchant Sharpness V at an enchanting table \u2192 the affix and the enchantment coexist");
        lines.push("\u00A77 6. Hit mobs with a sword \u2192 crit/lifesteal/element trigger per affix");
        lines.push("\u00A77 7. Take hits in armor \u2192 damage reduction points the right way (compare bare / vanilla armor / affix armor)");
        lines.push("\u00A77 8. /kill @s \u2192 pick up equipment \u2192 affixes still there");
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
        world11.sendMessage(`\u00A7aGenerated ${n} items in ${dt}ms`);
        zlog("af:stress", { n, ms: dt, counts });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    zlog("scriptevent handling exception", { id: ev.id, error: String(e) });
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
        player.onScreenDisplay.setActionBar(`${q ? q.color : "\u00A7f"}\u2726 ${spec.name} \u00A77(${spec.score} pts)`);
      } catch {
      }
    }
  }
  if (tier2 >= 3) {
    try {
      world12.sendMessage(`\u00A76\u2726\u2726\u2726 \u00A7r${spec.name} \u00A76\u2726\u2726\u2726 \u00A77Obtained by ${player ? player.name : "World"} (${spec.score} pts)`);
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
          zlog("Inventory takeover delayed write-back failed", { error: String(e) });
        }
      });
    } catch (e) {
      zlog("playerInventoryItemChange error", { error: String(e) });
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
      zlog("entityItemDrop exception", {
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
      zlog("entitySpawn exception", { error: String(e) });
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
      zlog("playerPlaceBlock exception", { error: String(e) });
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
      zlog("blockContainerOpened exception", { error: String(e) });
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
    player.onScreenDisplay.setActionBar("\u00A76[Affix Forge] \u00A77Loaded: equipment from crafting / drops / trading all rolls random affixes");
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
      zlog("refreshAll error", { player: player.name, error: String(e) });
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
      zlog("scanInventories error", { error: String(e) });
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
    // Do not hardcode version numbers -- the same code runs on different BDS builds (release 1.26.52.3 / lab 1.26.20.5).
    // This reads **runtime real capabilities**, not compile-time constants.
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
      zlog("Delayed start failed", { error: String(e) });
    }
  }
});

//# sourceMappingURL=../debug/main.js.map
