var Lingshou = Lingshou || {};
(function(lib) {
  lib.rollTalent = function() {
    const r = Math.random();
    if (r < 0.20) return { name: '低', mult: 0.85 };
    if (r < 0.85) return { name: '中', mult: 1.0 };
    return { name: '高', mult: 1.25 };
  };

  lib.rollSkills = function(tier) {
    const pick = function(cat) {
      const a = Lingshou.SKILL_POOL[cat];
      const s = a[Math.floor(Math.random() * a.length)];
      return Object.assign({ cat: cat }, s);
    };
    if (tier === 'normal') return [pick('atk')];
    if (tier === 'elite')  return [pick('atk'), pick(Math.random() < 0.5 ? 'def' : 'heal')];
    return [pick('atk'), pick('atk'), pick('def'), pick(Math.random() < 0.5 ? 'heal' : 'buff')];
  };

  lib.buildCreature = function(map, level, tier, isBaby, baseName) {
    let name;
    if (tier === 'normal') name = baseName;
    else if (tier === 'elite') name = lib.choice(Lingshou.ELITE_PREFIX) + baseName;
    else name = lib.choice(Lingshou.BOSS_PREFIX) + baseName + '王';

    const talent = lib.rollTalent();
    const growth = Lingshou.GROWTH_BASE[tier] * (isBaby ? 1.2 : 1.0);
    return {
      baseName, name, tier, isBaby, mapId: map.id, mapMult: map.mapMult,
      level, growth, talent, base: Object.assign({}, Lingshou.BASE_STATS[tier]),
      skills: lib.rollSkills(tier),
      element: map.element || 'none', levelCap: 99, breakthroughs: 0, babyFocus: null,
    };
  };

  // 基础属性（不含装备）
  lib.getBaseStats = function(creature) {
    const g = creature.growth * creature.talent.mult;
    const lvl = creature.level;
    return {
      hp:  Math.round(creature.base.hp  + lvl * g * 4.2 * creature.mapMult),
      atk: Math.round(creature.base.atk + lvl * g * 1.15 * creature.mapMult),
      def: Math.round(creature.base.def + lvl * g * 0.62 * creature.mapMult),
      spd: Math.round(creature.base.spd + lvl * g * 0.24 * creature.mapMult),
    };
  };

  // 总属性（含装备）
  lib.computeStats = function(creature, equipment) {
    const base = lib.getBaseStats(creature);
    if (!equipment) return base;
    const total = { ...base };
    for (const key of ['weapon','armor','accessory']) {
      const eq = equipment[key];
      if (eq && eq.pct) {
        total.hp  += Math.round(base.hp * (eq.pct.hp || 0));
        total.atk += Math.round(base.atk * (eq.pct.atk || 0));
        total.def += Math.round(base.def * (eq.pct.def || 0));
        total.spd += Math.round(base.spd * (eq.pct.spd || 0));
      }
    }
    return total;
  };

  lib.catchChance = function(tier, isBaby) { return isBaby ? 1.0 : (Lingshou.CATCH_CHANCE[tier] || 0.4); };
  lib.displayName = function(pet) { return (pet.nickname || pet.name) + (pet.isBaby ? '「宝」' : ''); };
  lib.colorClass = function(pet) { return pet.isBaby ? 'baby' : pet.tier; };
  lib.expToNext = function(level) { return Math.round(Lingshou.EXP_COEFF * Math.pow(level, Lingshou.EXP_POW)) + 25; };
  lib.playerExpToNext = function(level) { return Math.round(Lingshou.PLAYER_EXP_COEFF * Math.pow(level, Lingshou.PLAYER_EXP_POW)) + 50; };
  lib.soulValue = function(pet) { return Math.round(pet.level * (Lingshou.SOUL_PER_LEVEL[pet.tier]||1) + (Lingshou.SOUL_BASE[pet.tier]||2)); };

  lib.creatureToPet = function(creature) {
    return {
      id: lib.uid(), nickname: null,
      baseName: creature.baseName, name: creature.name, tier: creature.tier,
      isBaby: creature.isBaby, mapMult: creature.mapMult, level: 1, exp: 0,
      growth: creature.growth, talent: creature.talent,
      base: Object.assign({}, creature.base), skills: creature.skills, caughtAt: Date.now(),
      element: creature.element || 'none', levelCap: creature.levelCap || 99,
      breakthroughs: 0, babyFocus: creature.babyFocus || null,
    };
  };

  lib.skillDesc = function(skill) {
    if (skill.cat === 'atk') return `输出技能：造成 ${skill.mult}× 攻击力的伤害`;
    if (skill.cat === 'def') return `防御技能：以防御姿态出招，兼顾输出与格挡`;
    if (skill.cat === 'heal') return `回复技能：恢复自身 ${Math.round(skill.pct * 100)}% 生命上限`;
    if (skill.cat === 'buff') return `增益技能：攻击力提升 ${Math.round(skill.atkBoost * 100)}%，持续 ${skill.turns} 回合`;
    return '';
  };
})(Lingshou);