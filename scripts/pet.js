var Lingshou = Lingshou || {};
(function(lib) {
// 随机五行属性
lib.randomElement = function() {
return lib.choice(Lingshou.ELEMENTS);
};
// 根据品阶生成属性
lib.buildCreature = function(map, level, tier, isBaby, baseName) {
let name, element = 'none';
if (tier === 'normal') {
name = baseName;
} else if (tier === 'elite') {
element = lib.randomElement();
const prefix = lib.choice(Lingshou.ELEMENT_PREFIX[element]);
name = prefix + baseName;
} else { // boss
element = lib.randomElement();
const prefix = lib.choice(Lingshou.BOSS_PREFIX);
name = prefix + baseName + '王';
}
const growth = Lingshou.GROWTH_PER_LEVEL[tier];
let tierMult = 1.0;
if (tier === 'boss') tierMult = lib.rand(Lingshou.BOSS_STAT_MULT.min, Lingshou.BOSS_STAT_MULT.max);
if (tier === 'baby') tierMult = lib.rand(Lingshou.BABY_STAT_MULT.min, Lingshou.BABY_STAT_MULT.max);
let elementBonus = 0;
if (element !== 'none') {
if (tier === 'elite') elementBonus = lib.rand(Lingshou.ELITE_ELEMENT_BONUS.min, Lingshou.ELITE_ELEMENT_BONUS.max);
else if (tier === 'boss') elementBonus = lib.rand(Lingshou.BOSS_ELEMENT_BONUS.min, Lingshou.BOSS_ELEMENT_BONUS.max);
else if (tier === 'baby') elementBonus = lib.rand(Lingshou.BABY_ELEMENT_BONUS.min, Lingshou.BABY_ELEMENT_BONUS.max);
}
let skills = [];
if (tier === 'normal') skills = [lib.randomSkill('atk')];
else if (tier === 'elite') {
skills.push(lib.randomSkill('atk'));
skills.push(lib.randomSkill(Math.random()<0.5?'def':'heal'));
if (Math.random()<0.5) skills.push(lib.randomSkill('atk'));
} else if (tier === 'boss') {
skills.push(lib.randomSkill('atk'));
skills.push(lib.randomSkill('atk'));
skills.push(lib.randomSkill('def'));
skills.push(lib.randomSkill(Math.random()<0.5?'heal':'buff'));
} else if (tier === 'baby') {
skills.push(lib.randomSkill('atk'));
}
return {
baseName, name, tier, isBaby, element,
mapId: map.id, mapMult: map.mapMult,
level, growth, tierMult, elementBonus,
skills,
};
};
lib.randomSkill = function(cat) {
const a = Lingshou.SKILL_POOL[cat];
const s = a[Math.floor(Math.random() * a.length)];
return Object.assign({ cat }, s);
};
// ★★★ 计算基础属性（含宝宝定向成长） ★★★
lib.getBaseStats = function(pet) {
const growth = pet.growth;
const lvl = pet.level;
let hp = Math.round(growth.hp * lvl);
let atk = Math.round(growth.atk * lvl);
let def = Math.round(growth.def * lvl);
let spd = Math.round(growth.spd * lvl);
// 宝宝定向成长
if (pet.isBaby && pet.babyFocus && Lingshou.BABY_FOCUS_BONUS[pet.babyFocus]) {
const bonus = Lingshou.BABY_FOCUS_BONUS[pet.babyFocus];
atk += Math.round(bonus.atk * lvl);
def += Math.round(bonus.def * lvl);
hp += Math.round(bonus.hp * lvl);
spd += Math.round(bonus.spd * lvl);
}
// 品阶乘区
hp = Math.round(hp * (pet.tierMult || 1));
atk = Math.round(atk * (pet.tierMult || 1));
def = Math.round(def * (pet.tierMult || 1));
spd = Math.round(spd * (pet.tierMult || 1));
// 属性加成
if (pet.element !== 'none' && pet.elementBonus) {
const bonus = Math.round(atk * pet.elementBonus);
atk += bonus;
def += Math.round(bonus * 0.5);
spd += Math.round(bonus * 0.3);
}
return { hp, atk, def, spd };
};
// 总属性（含装备）
lib.computeStats = function(pet, equipment) {
const base = lib.getBaseStats(pet);
if (!equipment) return base;
const total = { ...base };
for (const key of ['weapon','armor','accessory']) {
const eq = equipment[key];
if (eq && eq.pct) {
total.hp += Math.round(base.hp * (eq.pct.hp || 0));
total.atk += Math.round(base.atk * (eq.pct.atk || 0));
total.def += Math.round(base.def * (eq.pct.def || 0));
total.spd += Math.round(base.spd * (eq.pct.spd || 0));
if (eq.extra) {
eq.extra.forEach(ext => {
total.hp += Math.round(base.hp * (ext.hp || 0));
total.atk += Math.round(base.atk * (ext.atk || 0));
total.def += Math.round(base.def * (ext.def || 0));
total.spd += Math.round(base.spd * (ext.spd || 0));
});
}
}
}
return total;
};
// ★★★ 宝宝升级时检查是否学新技能（每10级） ★★★
lib.checkBabySkillLearn = function(pet) {
if (!pet.isBaby) return;
const currentSkillCount = pet.skills.length;
const expectedSkillCount = Math.min(Math.floor(pet.level / 10) + 1, Lingshou.BABY_MAX_SKILLS);
if (expectedSkillCount > currentSkillCount) {
const cats = ['atk', 'atk', 'def', 'heal', 'buff'];
const newSkill = lib.randomSkill(lib.choice(cats));
pet.skills.push(newSkill);
return newSkill;
}
return null;
};
// ★★★ 检查是否可以突破 ★★★
lib.canBreakthrough = function(pet) {
const nextBreak = (pet.breakthroughs || 0) + 1;
const requiredLevel = nextBreak * 10;
if (pet.level < requiredLevel) return false;
if (pet.isBaby && nextBreak >= Lingshou.BABY_PILL_START && state.player.qualificationPills < 1) return false;
const soulCost = Lingshou.BREAKTHROUGH_SOUL[nextBreak] || 0;
const goldCost = Lingshou.BREAKTHROUGH_GOLD[nextBreak] || 0;
return state.player.soul >= soulCost && state.player.gold >= goldCost;
};
// ★★★ 执行突破 ★★★
lib.doBreakthrough = function(pet) {
const nextBreak = (pet.breakthroughs || 0) + 1;
const soulCost = Lingshou.BREAKTHROUGH_SOUL[nextBreak] || 0;
const goldCost = Lingshou.BREAKTHROUGH_GOLD[nextBreak] || 0;
state.player.soul -= soulCost;
state.player.gold -= goldCost;
if (pet.isBaby && nextBreak >= Lingshou.BABY_PILL_START) {
state.player.qualificationPills -= 1;
}
pet.breakthroughs = nextBreak;
if (pet.isBaby && pet.skills.length < Lingshou.BABY_MAX_SKILLS) {
const cats = ['atk', 'atk', 'def', 'heal', 'buff'];
const newSkill = lib.randomSkill(lib.choice(cats));
pet.skills.push(newSkill);
return { soulCost, goldCost, newSkill: newSkill };
}
return { soulCost, goldCost };
};
lib.catchChance = function(tier, isBaby) { return isBaby ? 1.0 : (Lingshou.CATCH_CHANCE[tier] || 0.4); };
lib.displayName = function(pet) { return pet.nickname || pet.name; };
lib.colorClass = function(pet) { return pet.isBaby ? 'baby' : pet.tier; };
lib.expToNext = function(level) { return Math.round(Lingshou.EXP_COEFF * Math.pow(level, Lingshou.EXP_POW)) + 25; };
lib.playerExpToNext = function(level) { return Math.round(Lingshou.PLAYER_EXP_COEFF * Math.pow(level, Lingshou.PLAYER_EXP_POW)) + 50; };
lib.soulValue = function(pet) {
const mult = Lingshou.SOUL_MULT[pet.tier] || 0.6;
return Math.max(1, Math.round(pet.level * mult));
};
lib.creatureToPet = function(creature) {
return {
id: lib.uid(),
nickname: null,
baseName: creature.baseName,
name: creature.name,
tier: creature.tier,
isBaby: creature.isBaby,
element: creature.element,
mapMult: creature.mapMult,
level: creature.isBaby ? 1 : creature.level,
exp: 0,
growth: Object.assign({}, creature.growth),
tierMult: creature.tierMult || 1.0,
elementBonus: creature.elementBonus || 0,
skills: creature.skills.slice(),
caughtAt: Date.now(),
babyFocus: null,
breakthroughs: 0,
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
