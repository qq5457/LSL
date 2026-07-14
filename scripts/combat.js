var Lingshou = Lingshou || {};

(function(lib) {
  // ========== 战斗模拟 ==========
  lib.simulateBattle = function(playerCreature, enemyCreature, wantLog) {
    const ps = lib.computeStats(playerCreature, state.equipment);
    const es = lib.computeStats(enemyCreature);
    let php = ps.hp, ehp = es.hp;
    let pAtkBuff = 1, eAtkBuff = 1, pBuffTurns = 0, eBuffTurns = 0;
    const logs = [];
    const playerFirst = ps.spd >= es.spd;

    function doAttack(attackerStats, side) {
      const skills = side === 'p' ? playerCreature.skills : enemyCreature.skills;
      let dmg = 0, tag = '普通攻击';
      const useSkill = skills.length && Math.random() < 0.35;
      let skill = useSkill ? lib.choice(skills) : null;

      if (skill && skill.cat === 'atk') { dmg = attackerStats.atk * skill.mult; tag = skill.name; }
      else if (skill && skill.cat === 'heal') {
        const heal = Math.round((side === 'p' ? ps.hp : es.hp) * skill.pct);
        side === 'p' ? (php = Math.min(ps.hp, php + heal)) : (ehp = Math.min(es.hp, ehp + heal));
        if (wantLog) logs.push({ t: 'skill', txt: `${side === 'p' ? lib.displayName(playerCreature) : enemyCreature.name}使用【${skill.name}】，恢复${heal}生命。` });
        return;
      } else if (skill && skill.cat === 'buff') {
        if (side === 'p') { pAtkBuff = 1 + skill.atkBoost; pBuffTurns = skill.turns; }
        else { eAtkBuff = 1 + skill.atkBoost; eBuffTurns = skill.turns; }
        if (wantLog) logs.push({ t: 'skill', txt: `${side === 'p' ? lib.displayName(playerCreature) : enemyCreature.name}发动【${skill.name}】，攻击力提升！` });
        return;
      } else if (skill && skill.cat === 'def') { dmg = attackerStats.atk * 1.0; tag = skill.name + '（防御姿态）'; }
      else { dmg = attackerStats.atk; }

      const buff = side === 'p' ? pAtkBuff : eAtkBuff;
      const defenderDef = side === 'p' ? es.def : ps.def;
      let raw = Math.max(1, Math.round((dmg * buff - defenderDef * 0.5) * lib.rand(0.85, 1.15)));
      side === 'p' ? (ehp = Math.max(0, ehp - raw)) : (php = Math.max(0, php - raw));
      if (wantLog) logs.push({ t: 'atk', txt: `${side === 'p' ? lib.displayName(playerCreature) : enemyCreature.name}发动【${tag}】，造成${raw}点伤害。` });
    }

    let round = 0;
    while (php > 0 && ehp > 0 && round < 25) {
      round++;
      const order = playerFirst ? ['p', 'e'] : ['e', 'p'];
      for (const side of order) { if (php <= 0 || ehp <= 0) break; doAttack(side === 'p' ? ps : es, side); }
      if (pBuffTurns > 0) { pBuffTurns--; if (pBuffTurns <= 0) pAtkBuff = 1; }
      if (eBuffTurns > 0) { eBuffTurns--; if (eBuffTurns <= 0) eAtkBuff = 1; }
    }
    const win = php > 0 && ehp <= 0;
    return { win, logs, remainPct: ps.hp ? php / ps.hp : 0 };
  };

  // ========== 宝宝判定 ==========
  lib.rollBaby = function() {
    const tickSec = (state.tickMs || 2400) / 1000;
    if (state.babyCooldownSec > 0) {
      state.babyCooldownSec = Math.max(0, state.babyCooldownSec - tickSec);
      return false;
    }
    const got = Math.random() < Lingshou.BABY_CHANCE;
    if (got) state.babyCooldownSec = Lingshou.BABY_COOLDOWN_SEC;
    return got;
  };

  // ========== 生成遭遇 ==========
  lib.generateEncounter = function(map) {
    const lvl = lib.randInt(map.minLv, map.maxLv);
    let tier = 'normal';
    if (map.allowBoss && Math.random() < 0.018) tier = 'boss';
    else if (map.allowElite && Math.random() < 0.13) tier = 'elite';
    const isBaby = lib.rollBaby();
    const baseName = lib.choice(map.base);
    return lib.buildCreature(map, lvl, tier, isBaby, baseName);
  };

  // ========== 经验增加 ==========
  function grantPlayerExp(exp) {
    state.player.exp += exp;
    let need = lib.playerExpToNext(state.player.level);
    while (state.player.exp >= need) { state.player.exp -= need; state.player.level++; need = lib.playerExpToNext(state.player.level); }
  }

  function grantPetExp(pet, exp) {
    if (!pet) return;
    pet.exp += exp;
    let need = lib.expToNext(pet.level);
    while (pet.exp >= need) { pet.exp -= need; pet.level++; need = lib.expToNext(pet.level); }
  }

  // ========== 装备生成（百分比属性） ==========
  lib.generateEquipment = function(map) {
    const slots = ['weapon', 'armor', 'accessory'];
    const slot = lib.choice(slots);
    const qualities = ['粗制','精良','稀有'];
    const q = qualities[Math.random() < 0.7 ? 0 : (Math.random() < 0.7 ? 1 : 2)];
    const slotNameMap = { weapon: '兵刃', armor: '护甲', accessory: '饰品' };
    const nameMap = {
      weapon: ['朽木剑','青铜刀','铁枪'],
      armor: ['布甲','皮甲','铁甲'],
      accessory: ['铜戒','玉坠','兽骨链']
    };
    const name = q + lib.choice(nameMap[slot]);
    const ranges = Lingshou.EQUIP_QUALITY_PCT[q];
    const pct = { atk:0, def:0, hp:0, spd:0 };
    const bonuses = Lingshou.EQUIP_SLOT_BONUS[slot] || [];
    bonuses.forEach(stat => {
      pct[stat] = parseFloat((lib.rand(ranges.min, ranges.max)).toFixed(2));
    });
    return { id: lib.uid(), slot, slotName: slotNameMap[slot], name, quality: q, pct, itemLevel: map.minLv };
  };

  // 装备评分
  lib.equipScore = function(eq) {
    if (!eq || !eq.pct) return 0;
    return (eq.pct.atk||0)*1.3 + (eq.pct.def||0)*1.2 + (eq.pct.hp||0)*0.15 + (eq.pct.spd||0)*1.5;
  };

  // ========== 单次遭遇结算 ==========
  lib.resolveEncounter = function(map, wantLog) {
    if (!lib.activePet()) lib.ensureActivePet();
    const enemy = lib.generateEncounter(map);
    const player = lib.activePet();
    const battle = lib.simulateBattle(player, enemy, wantLog);
    const logs = wantLog ? [] : null;

    const enemyTierLabel = Lingshou.TIER_LABEL[enemy.tier];
    if (wantLog) {
      logs.push({
        t: 'title',
        txt: `遭遇：${enemy.isBaby ? enemy.name+'「宝」' : enemy.name}（${enemyTierLabel} Lv.${enemy.level}）`
      });
    }

    const result = {
      caught: null, gold: 0, exp: 0, petExpGain: 0, win: battle.win,
      soulGain: 0, matGain: 0, refinedAuto: false,
      enemyName: lib.displayName(enemy), enemyTier: enemy.tier, enemyIsBaby: enemy.isBaby
    };

    if (battle.win) {
      if (wantLog) { battle.logs.forEach(l => logs.push(l)); logs.push({ t: 'win', txt: '战斗胜利！' }); }
      const gold = Math.round(enemy.level * 1.8 * lib.rand(0.8, 1.25) + 3);
      const goldExp = enemy.level * 2 + 4;
      const petExp = enemy.level * 2 + 5;
      result.gold = gold; result.exp = goldExp; result.petExpGain = petExp;
      state.player.gold += gold; grantPlayerExp(goldExp); grantPetExp(player, petExp);

      if (wantLog) logs.push({ t: 'get', txt: `获得：经验+${goldExp}　金币+${gold}` });

      if (Math.random() < 0.10) {
        const m = lib.randInt(1, 3);
        state.player.mat += m;
        result.matGain = m;
        if (wantLog) logs.push({ t: 'get', txt: `拾取：装备材料+${m}` });
      }
      if (enemy.tier !== 'normal' && Math.random() < 0.12) {
        const s = lib.randInt(2, 6);
        state.player.soul += s;
        result.soulGain = (result.soulGain || 0) + s;
        if (wantLog) logs.push({ t: 'get', txt: `拾取：兽魂+${s}` });
      }
      if (Math.random() < 0.02) {
        const eq = lib.generateEquipment(map);
        state.equipInventory.push(eq);
        if (wantLog) logs.push({ t: 'get', txt: `拾取装备：${eq.name}` });
      }

      const cc = lib.catchChance(enemy.tier, enemy.isBaby);
      if (Math.random() < cc) {
        const pet = lib.creatureToPet(enemy);
        if (pet.tier === 'normal' && !pet.isBaby && state.settings.autoRefine) {
          const soul = lib.soulValue(pet);
          state.player.soul += soul;
          result.refinedAuto = true;
          result.soulGain = (result.soulGain || 0) + soul;
          if (wantLog) logs.push({ t: 'get', txt: `发现：${lib.displayName(pet)}（已自动炼化兽魂+${soul}）` });
        } else {
          state.pets.push(pet);
          result.caught = pet;
          state.stats.totalCatches++;
          if (wantLog) logs.push({ t: 'get', txt: `发现：${lib.displayName(pet)}，已收入宠物仓库！` });
        }
      }
    } else {
      if (wantLog) { battle.logs.forEach(l => logs.push(l)); logs.push({ t: 'lose', txt: '战斗失利，主力灵兽负伤撤退。' }); }
      const gold = Math.round(enemy.level * 0.5);
      const exp = Math.round(enemy.level * 0.6) + 1;
      state.player.gold += gold;
      grantPlayerExp(exp);
      result.gold = gold; result.exp = exp;
    }

    state.stats.totalBattles++;
    if (wantLog) result.logs = logs;
    return result;
  };

  // ========== 离线进度 ==========
  lib.handleOfflineProgress = async function() {
    const elapsedSec = Math.floor((Date.now() - (state.lastSaveTime || Date.now())) / 1000);
    if (elapsedSec < 25) return;
    let ticks = Math.floor(elapsedSec / (state.tickMs / 1000));
    ticks = lib.clamp(ticks, 0, Lingshou.MAX_OFFLINE_TICKS);
    if (ticks <= 0 || !state.exploring) return;
    const map = lib.getMap(state.currentMapId) || Lingshou.MAPS[0];
    lib.ensureActivePet();

    const harvest = { gold: 0, exp: 0, soul: 0, mat: 0, caught: {}, battles: 0, wins: 0, refined: 0 };
    for (let i = 0; i < ticks; i++) {
      const r = lib.resolveEncounter(map, false);
      harvest.gold += Math.floor(r.gold * Lingshou.OFFLINE_MULT);
      harvest.exp += Math.floor(r.exp * Lingshou.OFFLINE_MULT);
      harvest.soul += (r.soulGain || 0);
      harvest.mat += (r.matGain || 0);
      harvest.battles++;
      if (r.win) harvest.wins++;
      if (r.refinedAuto) harvest.refined++;
      if (r.caught) {
        const key = lib.displayName(r.caught);
        harvest.caught[key] = (harvest.caught[key] || 0) + 1;
      }
    }
    if (lib.showHarvestModal) lib.showHarvestModal(harvest, elapsedSec);
  };

  // ========== 确保存在主力宠物 ==========
  lib.ensureActivePet = function() {
    if (!lib.activePet() && state.pets.length) {
      state.activePetId = state.pets[0].id;
    }
    if (!state.pets.length) {
      const map = lib.getMap('village') || Lingshou.MAPS[0];
      const c = lib.buildCreature(map, 1, 'normal', false, lib.choice(map.base));
      const pet = lib.creatureToPet(c);
      state.pets.push(pet);
      state.activePetId = pet.id;
    }
  };

})(Lingshou);