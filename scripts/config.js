var Lingshou = Lingshou || {};
// ========== 一阶段地图 ==========
Lingshou.MAPS = [
{id:'village', name:'新手村', minLv:1, maxLv:10, mapMult:1.00, base:['猫','狗','兔','蛇'], allowElite:false, allowBoss:false, unlockLv:1},
{id:'bamboo', name:'青竹林', minLv:10, maxLv:22, mapMult:1.35, base:['狼','狐狸','鹰','豹'], allowElite:true, allowBoss:false, unlockLv:8},
{id:'wild', name:'荒原', minLv:20, maxLv:40, mapMult:1.85, base:['熊','黑鹰','妖虎','野猪'], allowElite:true, allowBoss:true, unlockLv:18},
{id:'ice', name:'冰原', minLv:40, maxLv:65, mapMult:2.45, base:['雪狼','冰蟒','霜鹰','雪熊'], allowElite:true, allowBoss:true, unlockLv:36},
{id:'secret', name:'秘境', minLv:60, maxLv:150, mapMult:3.30, base:['幻影虎','龙鹰','玄冰兽','烈焰狮'],allowElite:true, allowBoss:true, unlockLv:56},
];
// ========== 五行属性 ==========
Lingshou.ELEMENTS = ['金','木','水','火','土'];
Lingshou.ELEMENT_ADVANTAGE = {
'金':'木', '木':'土', '土':'水', '水':'火', '火':'金'
};
Lingshou.ELEMENT_DAMAGE_BONUS = 1.5;
Lingshou.ELEMENT_DAMAGE_REDUCTION = 0.75;
// ========== 属性前缀 ==========
Lingshou.ELITE_PREFIX = ['寒冰','炎火','雷电','暗影','疾风','剧毒','烈日','幽冥']; // 保留旧版兼容
Lingshou.BOSS_PREFIX = ['苍月','烈焰','九尾','霜鸦','雷霆','幽冥','赤炎','玄天'];
// 新五行属性词库（用于精英/Boss/宝宝的属性前缀）
Lingshou.ELEMENT_PREFIX = {
'金': ['锐金','金刚','玄金'],
'木': ['青木','苍木','灵木'],
'水': ['寒水','玄水','幽水'],
'火': ['烈火','炎火','赤火'],
'土': ['厚土','坚土','黄沙']
};
// ========== 品阶成长率（每级增加） ==========
Lingshou.GROWTH_PER_LEVEL = {
normal: { hp:8, atk:2.0, def:1.2, spd:0.8 },
elite: { hp:10, atk:2.5, def:1.5, spd:1.0 },
boss: { hp:14, atk:3.0, def:1.8, spd:1.2 },
baby: { hp:16, atk:3.5, def:2.0, spd:1.4 }
};
// Boss / 宝宝品阶属性乘区（随机区间）
Lingshou.BOSS_STAT_MULT = { min:1.1, max:1.5 };
Lingshou.BABY_STAT_MULT = { min:1.6, max:2.0 };
// 精英/Boss/宝宝 属性数值加成（基于基础攻击的百分比）
Lingshou.ELITE_ELEMENT_BONUS = { min:0.08, max:0.15 };
Lingshou.BOSS_ELEMENT_BONUS = { min:0.15, max:0.25 };
Lingshou.BABY_ELEMENT_BONUS = { min:0.25, max:0.40 };
// ========== 技能池 ==========
Lingshou.SKILL_POOL = {
atk: [
{ name: '撕裂', mult: 1.6 },
{ name: '重击', mult: 1.9 },
{ name: '穿刺', mult: 1.5 },
{ name: '噬咬', mult: 1.7 },
{ name: '横扫', mult: 1.55 }
],
def: [{ name: '护盾', reduce: 0.4 }],
heal: [{ name: '治疗', pct: 0.22 }],
buff: [{ name: '狂暴', atkBoost: 0.35, turns: 2 }]
};
// ========== 宝宝技能最大数 ==========
Lingshou.BABY_MAX_SKILLS = 6;
// ========== 装备 ==========
Lingshou.EQUIP_QUALITY_PCT = {
'粗制': { mainMin:0.005, mainMax:0.012, extraCount:0 },
'精良': { mainMin:0.010, mainMax:0.020, extraCount:1 },
'传家': { mainMin:0.015, mainMax:0.030, extraCount:2 }
};
Lingshou.EQUIP_SLOT_BONUS = {
weapon: ['atk'],
armor: ['hp','def'],
accessory: ['spd']
};
// 装备额外词条随机范围
Lingshou.EQUIP_EXTRA_STATS = ['atk','def','hp','spd'];
Lingshou.EQUIP_EXTRA_RANGE = { min:0.003, max:0.008 };
// ========== 兽魂精算 ==========
Lingshou.SOUL_MULT = { normal:0.6, elite:1.3, boss:1.6, baby:2.0 };
// ========== 突破（预留） ==========
Lingshou.BREAKTHROUGH_COST_BASE = { soul: 50, gold: 200 };
Lingshou.BABY_BREAK_PILLS = [0,1,1,2,2,3,4];
// ========== 宝宝定向成长（每级额外加成，基于基础成长率） ==========
Lingshou.BABY_FOCUS_BONUS = {
  atk: { atk: 1.5, def: 0, hp: 0, spd: 0.3 },
  def: { atk: 0, def: 1.2, hp: 5, spd: 0 },
  spd: { atk: 0.5, def: 0, hp: 0, spd: 1.2 },
  hp: { atk: 0, def: 0.5, hp: 10, spd: 0 },
};
// ========== 突破消耗 ==========
Lingshou.BREAKTHROUGH_SOUL = [0, 20, 40, 60, 80, 100, 120];
Lingshou.BREAKTHROUGH_GOLD = [0, 100, 200, 300, 400, 500, 600];
Lingshou.BABY_PILL_START = 4;
// ========== 每日 Boss/宝宝上限 ==========
Lingshou.DAILY_BOSS_LIMIT = 3;
Lingshou.DAILY_BABY_LIMIT = 1;
Lingshou.DAILY_RESET_HOUR = 6;

Lingshou.TIER_LABEL = { normal: '普通', elite: '精英', boss: 'Boss', baby: '宝宝' };
Lingshou.BABY_CHANCE = 0.0005;
Lingshou.BABY_COOLDOWN_SEC = 1500;
Lingshou.OFFLINE_MULT = 0.5;
Lingshou.MAX_OFFLINE_TICKS = 1800;
Lingshou.EXP_COEFF = 30;
Lingshou.EXP_POW = 1.4;
Lingshou.PLAYER_EXP_COEFF = 60;
Lingshou.PLAYER_EXP_POW = 1.5;
Lingshou.CATCH_CHANCE = { normal: 0.40, elite: 0.15, boss: 0.05 };
Lingshou.SKILL_CAT_LABEL = { atk: '输出', def: '防御', heal: '回复', buff: '增益' };
