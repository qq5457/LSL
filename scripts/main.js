var Lingshou = Lingshou || {};
(function(lib) {
function $(id) { return document.getElementById(id); }
let tickTimer = null;
window.startExploreLoop = function(immediate) {
if (immediate === undefined) immediate = true;
stopExploreLoop();
tickTimer = setInterval(gameTick, state.tickMs);
if (immediate) gameTick();
};
window.stopExploreLoop = function() { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } };
function gameTick() {
if (!state.exploring) return;
const map = lib.getMap(state.currentMapId) || Lingshou.MAPS[0];
const r = lib.resolveEncounter(map, true);
r.logs.forEach(entry => lib.pushLog(entry));
lib.renderTopBars(); lib.renderActivePet();
if (document.getElementById('tab-pets').style.display !== 'none') lib.renderPetList();
lib.debounceSave();
}
let saveDebounce = null;
lib.debounceSave = function() {
if (saveDebounce) clearTimeout(saveDebounce);
saveDebounce = setTimeout(() => lib.saveGame(true), 1200);
};
function updateClock() { const el = document.getElementById('clockTxt'); if (el) el.textContent = new Date().toLocaleTimeString('zh-CN',{hour12:false}); }
window.addEventListener('beforeunload', () => { try { lib.saveGame(true); } catch(e) {} });
async function init() {
const saved = await lib.loadGame();
state = saved ? lib.applySaveDefaults(saved) : lib.freshState();
lib.ensureActivePet();
lib.bindEvents(); lib.renderAll();
if (state.log && state.log.length) {
$('logArea').innerHTML = ''; state.log.slice(-50).forEach(e => lib.appendLogDom(e));
} else lib.pushLog({ t:'title', txt:'欢迎来到《灵兽录》！' });
if (saved) { await lib.handleOfflineProgress(); lib.renderAll(); }
if (state.exploring) startExploreLoop(false);
updateClock(); setInterval(updateClock, 1000);
setInterval(() => lib.saveGame(true), 20000);
}
window.addEventListener('DOMContentLoaded', init);
})(Lingshou);
