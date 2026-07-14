var Lingshou = Lingshou || {};

// ========== 一阶段地图 ==========
Lingshou.MAPS = [
  {id:'village', name:'新手村', minLv:1,  maxLv:10,  mapMult:1.00, base:['猫','狗','兔','蛇'],           allowElite:false, allowBoss:false, unlockLv:1},
  {id:'bamboo',  name:'青竹林', minLv:10, maxLv:22,  mapMult:1.35, base:['狼','狐狸','鹰','豹'],          allowElite:true,  allowBoss:false, unlockLv:8},
  {id:'wild',    name:'荒原',   minLv:20, maxLv:40,  mapMult:1.85, base:['熊','黑鹰','妖虎','野猪'],       allowElite:true,  allowBoss:true,  unlockLv:18},
  {id:'ice',     name:'冰原',   minLv:40, maxLv:65,  mapMult:2.45, base:['雪狼','冰蟒','霜鹰','雪熊'],     allowElite:true,  allowBoss:true,  unlockLv:36},
  {id:'secret',  name:'秘境',   minLv:60, maxLv:150, mapMult:3.30, base:['幻影虎','龙鹰','玄冰兽','烈焰狮'],allowElite:true,  allowBoss:true,  unlockLv:56},
];

// ========== 属性系统 ==========
Lingshou.ELEMENTS = ['金','木','水','火','土'];
Lingshou.ELEMENT_ADVANTAGE = { '金':'木', '木':'土', '土':'水', '水':'火', '火':'金' };
Lingshou.ELEMENT_DAMAGE_BONUS = 1.5;
Lingshou.ELEMENT_DAMAGE_REDUCTION = 0.75;

Lingshou.PHASE2_MAPS = [
  {id:'metal',  name:'锐金山', element:'金', minLv:60, maxLv:100, mapMult:4.0, base:['金甲兽','钢翼鹰','铁尾蝎'],        allowElite:true, allowBoss:true, unlockLv:60, requireBoss:'metal'},
  {id:'wood',   name:'青木林', element:'木', minLv:60, maxLv:100, mapMult:4.0, base:['藤蛇','木灵狐','翠羽鸟'],            allowElite:true, allowBoss:true, unlockLv:60, requireBoss:'wood'},
  {id:'water',  name:'玄水渊', element:'水', minLv:60, maxLv:100, mapMult:4.0, base:['冰鳞鱼','水影豹','深海蛇'],          allowElite:true, allowBoss:true, unlockLv:60, requireBoss:'water'},
  {id:'fire',   name:'烈火谷', element:'火', minLv:60, maxLv:100, mapMult:4.0, base:['炎虎','火羽鹰','赤焰狼'],            allowElite:true, allowBoss:true, unlockLv:60, requireBoss:'fire'},
  {id:'earth',  name:'厚土荒原',element:'土', minLv:60, maxLv:100, mapMult:4.0, base:['岩甲熊','沙蝎','地龙'],             allowElite:true, allowBoss:true, unlockLv:60, requireBoss:'earth'},
];

Lingshou.ELITE_PREFIX = ['火焰','寒冰','雷电','暗影','疾风','剧毒','烈日','幽冥'];
Lingshou.BOSS_PREFIX  = ['苍月','烈焰','九尾','霜鸦','雷霆','幽冥','赤炎','玄天'];

Lingshou.GROWTH_BASE = { normal: 1.0, elite: 1.5, boss: 2.2 };
Lingshou.BASE_STATS = {
  normal: { hp: 26, atk: 6,  def: 3,  spd: 8 },
  elite:  { hp: 50, atk: 10, def: 6,  spd: 10 },
  boss:   { hp:112, atk: 20, def: 11, spd: 13 },
};
Lingshou.TIER_LABEL = { normal: '普通', elite: '精英', boss: 'Boss' };

Lingshou.SKILL_POOL = {
  atk: [
    { name: '撕裂', mult: 1.6 }, { name: '重击', mult: 1.9 }, { name: '穿刺', mult: 1.5 },
    { name: '噬咬', mult: 1.7 }, { name: '横扫', mult: 1.55 }
  ],
  def: [{ name: '护盾', reduce: 0.4 }],
  heal: [{ name: '治疗', pct: 0.22 }],
  buff: [{ name: '狂暴', atkBoost: 0.35, turns: 2 }],
};

Lingshou.BABY_CHANCE = 0.0005;
Lingshou.BABY_COOLDOWN_SEC = 1500;
Lingshou.OFFLINE_MULT = 0.5;
Lingshou.MAX_OFFLINE_TICKS = 1800;
Lingshou.EXP_COEFF = 30;
Lingshou.EXP_POW = 1.4;
Lingshou.PLAYER_EXP_COEFF = 60;
Lingshou.PLAYER_EXP_POW = 1.5;
Lingshou.CATCH_CHANCE = { normal: 0.40, elite: 0.15, boss: 0.05 };
Lingshou.SOUL_PER_LEVEL = { normal: 1, elite: 2.4, boss: 4.6 };
Lingshou.SOUL_BASE = { normal: 2, elite: 6, boss: 16 };
Lingshou.SKILL_CAT_LABEL = { atk: '输出', def: '防御', heal: '回复', buff: '增益' };

// ========== 装备品质对应的百分比加成范围 ==========
Lingshou.EQUIP_QUALITY_PCT = {
  '粗制': { min: 0.02, max: 0.04 },
  '精良': { min: 0.04, max: 0.07 },
  '稀有': { min: 0.07, max: 0.12 },
};

// 装备每个部位加成的基础类型（百分比作用于宠物基础属性）
Lingshou.EQUIP_SLOT_BONUS = {
  weapon: ['atk'],
  armor: ['hp','def'],
  accessory: ['spd'],
};

// 突破相关（预留）
Lingshou.BREAKTHROUGH_COST_BASE = { soul: 50, gold: 200 };
Lingshou.BREAKTHROUGH_COST_BABY_EXTRA = { pills: 1 };