var Lingshou = Lingshou || {};
(function(lib) {
lib.freshState = function() {
return {
version: 2,
player: { level: 1, exp: 0, gold: 20, soul: 0, mat: 0, petExp: 0, qualificationPills: 0, pillFragments: 0 },
currentMapId: 'village', exploring: false, tickMs: 2400, activePetId: null,
pets: [], equipment: { weapon: null, armor: null, accessory: null }, equipInventory: [],
settings: { autoRefine: true, keepBaby: true, keepBoss: true },
log: [], lastSaveTime: Date.now(), playTimeSec: 0, startedAt: Date.now(),
stats: { totalCatches: 0, totalBattles: 0 }, babyCooldownSec: 0,
phase2Unlocked: false, unlockedPhase2Maps: [],
dailyBossCaught: {},
dailyBabyCaught: {},
dailyResetDate: '',
};
};
lib.applySaveDefaults = function(s) {
if (!s.settings) s.settings = { autoRefine: true, keepBaby: true, keepBoss: true };
if (s.tickMs == null) s.tickMs = 2400;
if (s.babyCooldownSec == null) s.babyCooldownSec = 0;
if (!s.equipInventory) s.equipInventory = [];
if (!s.equipment) s.equipment = { weapon: null, armor: null, accessory: null };
if (!s.stats) s.stats = { totalCatches: 0, totalBattles: 0 };
if (s.player.mat == null) s.player.mat = 0;
if (s.player.petExp == null) s.player.petExp = 0;
if (s.player.qualificationPills == null) s.player.qualificationPills = 0;
if (s.player.pillFragments == null) s.player.pillFragments = 0;
if (s.phase2Unlocked == null) s.phase2Unlocked = false;
if (!s.unlockedPhase2Maps) s.unlockedPhase2Maps = [];
if (!s.dailyBossCaught) s.dailyBossCaught = {};
if (!s.dailyBabyCaught) s.dailyBabyCaught = {};
if (!s.dailyResetDate) s.dailyResetDate = '';
(s.pets || []).forEach(p => {
if (p.element === undefined) p.element = 'none';
if (p.tierMult === undefined) p.tierMult = 1.0;
if (p.elementBonus === undefined) p.elementBonus = 0;
if (p.babyFocus === undefined) p.babyFocus = null;
if (p.breakthroughs === undefined) p.breakthroughs = 0;
});
return s;
};
lib.importSaveFromText = function(text) {
let obj;
try { obj = JSON.parse(text); } catch (e) { alert('存档格式错误'); return; }
if (!obj || !obj.player || !Array.isArray(obj.pets)) { alert('无效存档'); return; }
if (!confirm('导入将覆盖进度，继续？')) return;
if (window.stopExploreLoop) window.stopExploreLoop();
state = lib.applySaveDefaults(obj);
lib.ensureActivePet();
const logArea = document.getElementById('logArea');
if (logArea) logArea.innerHTML = '';
if (state.log && state.log.length) state.log.slice(-50).forEach(e => { if (lib.appendLogDom) lib.appendLogDom(e); });
if (lib.renderAll) lib.renderAll();
if (state.exploring && window.startExploreLoop) window.startExploreLoop(false);
lib.saveGame(false);
lib.flashSaveStatus('已导入存档');
};
lib.unlockedMaps = function() { return Lingshou.MAPS.filter(m => state.player.level >= m.unlockLv); };
lib.getMap = function(id) { return Lingshou.MAPS.find(m => m.id === id) || Lingshou.PHASE2_MAPS.find(m => m.id === id); };
lib.activePet = function() { return state.pets.find(p => p.id === state.activePetId) || null; };

// ========== 每日限制 ==========
lib.checkDailyReset = function() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const effectiveDate = now.getHours() < Lingshou.DAILY_RESET_HOUR
    ? new Date(now.getTime() - 86400000).toISOString().slice(0, 10) : today;
  if (state.dailyResetDate !== effectiveDate) {
    state.dailyBossCaught = {};
    state.dailyBabyCaught = {};
    state.dailyResetDate = effectiveDate;
  }
};
lib.canSpawnBoss = function(mapId) {
  lib.checkDailyReset();
  return (state.dailyBossCaught[mapId] || 0) < Lingshou.DAILY_BOSS_LIMIT;
};
lib.canSpawnBaby = function(mapId) {
  lib.checkDailyReset();
  return (state.dailyBabyCaught[mapId] || 0) < Lingshou.DAILY_BABY_LIMIT;
};
lib.recordCatch = function(mapId, tier) {
  lib.checkDailyReset();
  if (tier === 'boss') state.dailyBossCaught[mapId] = (state.dailyBossCaught[mapId] || 0) + 1;
  if (tier === 'baby') state.dailyBabyCaught[mapId] = (state.dailyBabyCaught[mapId] || 0) + 1;
};
})(Lingshou);
