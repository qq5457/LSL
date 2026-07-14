var Lingshou = Lingshou || {};
(function(lib) {
function $(id) { return document.getElementById(id); }
// ========== 顶部状态栏 ==========
lib.renderTopBars = function() {
$('pLevel').textContent = state.player.level;
const need = lib.playerExpToNext(state.player.level);
$('pExpBar').style.width = lib.clamp(state.player.exp / need * 100, 0, 100) + '%';
$('pExpTxt').textContent = state.player.exp + '/' + need;
$('rGold').textContent = state.player.gold;
$('rSoul').textContent = state.player.soul;
$('rPetCount').textContent = state.pets.length;
const map = lib.getMap(state.currentMapId);
$('rMapName').textContent = map ? map.name : '-';
};
// ========== 地图网格 ==========
lib.renderMapsGrid = function() {
const grid = $('mapsGrid');
grid.innerHTML = '';
Lingshou.MAPS.forEach(function(m) {
const locked = state.player.level < m.unlockLv;
const btn = document.createElement('div');
btn.className = 'map-btn' + (m.id === state.currentMapId ? ' active' : '') + (locked ? ' locked' : '');
btn.innerHTML = m.name + '<small>' + (locked ? 'Lv.' + m.unlockLv + '解锁' : 'Lv.' + m.minLv + '-' + m.maxLv) + '</small>';
if (!locked) {
btn.onclick = function() { state.currentMapId = m.id; lib.renderMapsGrid(); lib.renderTopBars(); lib.debounceSave(); };
}
grid.appendChild(btn);
});
};
// ========== 主力卡片 ==========
lib.renderActivePet = function() {
const card = $('activePetCard');
const pet = lib.activePet();
if (!pet) { card.innerHTML = '<div class="empty-hint">暂无主力灵兽</div>'; return; }
const base = lib.getBaseStats(pet);
const total = lib.computeStats(pet, state.equipment);
const need = lib.expToNext(pet.level);
const cls = lib.colorClass(pet);
const elemStr = pet.element !== 'none' ? `·${pet.element}` : '';
const statLine = (name, b, t) => {
const diff = t - b;
return `<span>${name} <b>${t}</b>${diff !== 0 ? ` <span style="color:var(--green);">(+${diff})</span>` : ''}</span>`;
};
card.innerHTML =
`<div class="pet-name-row">
<span class="pet-name c-${cls}">${lib.displayName(pet)}${elemStr}</span>
${!pet.isBaby ? `<span class="tier-tag tier-${pet.tier}">${Lingshou.TIER_LABEL[pet.tier]}</span>` : ''}
${pet.isBaby ? '<span class="tier-tag tier-baby">宝</span>' : ''}
<span style="margin-left:auto;font-size:11px;color:var(--muted);">Lv.${pet.level}</span>
</div>
<div class="hp-row"><div class="hp-bar-wrap"><div class="hp-bar" style="width:100%"></div></div><div class="hp-txt">HP ${total.hp}</div></div>
<div class="pet-stats-mini">
${statLine('攻击', base.atk, total.atk)}
${statLine('防御', base.def, total.def)}
${statLine('速度', base.spd, total.spd)}
</div>
<div class="hp-row" style="margin-top:6px;"><div class="hp-bar-wrap"><div class="expbar" style="width:${lib.clamp(pet.exp/need*100,0,100)}%"></div></div><div class="hp-txt">EXP ${pet.exp}/${need}</div></div>
<div class="pet-skills-mini">${pet.skills.map(s => '<span class="skill-chip">'+s.name+'</span>').join('')}</div>`;
};
// ========== 宠物仓库宫格 ==========
lib.renderPetList = function() {
const wrap = $('petList');
wrap.innerHTML = '';
if (!state.pets.length) { wrap.innerHTML = '<div class="empty-hint">仓库空空如也</div>'; return; }
const sorted = [].concat(state.pets).sort((a,b) => {
const order = { boss:0, elite:1, normal:2 };
if (a.isBaby !== b.isBaby) return a.isBaby ? -1 : 1;
if (order[a.tier] !== order[b.tier]) return order[a.tier] - order[b.tier];
return b.level - a.level;
});
sorted.forEach(pet => {
const cls = lib.colorClass(pet);
const card = document.createElement('div');
card.className = 'pet-grid-card';
if (pet.id === state.activePetId) card.style.borderColor = 'var(--gold)';
card.innerHTML = `<div class="pet-grid-name c-${cls}">${lib.displayName(pet)}</div><div style="font-size:10px;color:var(--muted);">Lv.${pet.level}</div>`;
card.onclick = () => lib.openPetDetail(pet.id);
wrap.appendChild(card);
});
};
lib.trainPet = function(pet) {
if (state.player.soul < 1) { lib.pushToast('兽魂不足'); return; }
const use = Math.min(state.player.soul, 50);
state.player.soul -= use;
(function(p, e) { p.exp += e; let n = lib.expToNext(p.level); while(p.exp >= n) { p.exp -= n; p.level++; n = lib.expToNext(p.level); } })(pet, use);
lib.pushLog({ t:'get', txt:'消耗' + use + '兽魂培养' + lib.displayName(pet) + '，经验+' + use });
lib.renderPetList(); lib.renderTopBars();
if (pet.id === state.activePetId) lib.renderActivePet();
lib.debounceSave();
};
lib.refinePet = function(pet) {
if (pet.id === state.activePetId) { lib.pushToast('主力无法炼化'); return; }
if (pet.isBaby && state.settings.keepBaby && !confirm(lib.displayName(pet) + ' 确定炼化？')) return;
if (pet.tier === 'boss' && state.settings.keepBoss && !confirm(lib.displayName(pet) + ' 确定炼化？')) return;
const soul = lib.soulValue(pet);
state.player.soul += soul;
state.pets = state.pets.filter(p => p.id !== pet.id);
lib.pushLog({ t:'get', txt:'炼化' + lib.displayName(pet) + '，兽魂+' + soul });
lib.renderPetList(); lib.renderTopBars(); lib.debounceSave();
};
// ========== 日志 ==========
lib.pushLog = function(entry) { state.log.push(entry); if (state.log.length > 50) state.log.shift(); lib.appendLogDom(entry); };
lib.appendLogDom = function(entry) {
const area = $('logArea');
const div = document.createElement('div');
const m = { title:'l-title', win:'l-win', lose:'l-lose', get:'l-get', atk:'l-dim', skill:'l-dim' };
div.className = m[entry.t] || '';
div.textContent = entry.txt;
area.appendChild(div); area.scrollTop = area.scrollHeight;
while (area.childNodes.length > 120) area.removeChild(area.firstChild);
};
lib.pushToast = function(msg) { lib.pushLog({ t:'lose', txt:msg }); };
// ========== 宠物详情弹窗 ==========
let detailPetId = null;
lib.openPetDetail = function(id) { detailPetId = id; lib.renderPetDetailBox(); $('petDetailModal').classList.add('show'); };
lib.closePetDetail = function() { detailPetId = null; $('petDetailModal').classList.remove('show'); };
lib.renderPetDetailBox = function() {
const pet = state.pets.find(p => p.id === detailPetId);
const box = $('petDetailBox');
if (!pet) { box.innerHTML = '<div class="empty-hint">该灵兽不存在</div>'; return; }
const base = lib.getBaseStats(pet);
const total = lib.computeStats(pet, state.equipment);
const cls = lib.colorClass(pet);
const elemStr = pet.element !== 'none' ? `·${pet.element}属性` : '无属性';
const stat = (l, b, t) => {
const diff = t - b;
return `<div class="detail-stat"><div class="dl">${l}</div><div class="dv">${t}${diff!==0?` <span style="color:var(--green);">(+${diff})</span>`:''}</div></div>`;
};
const isActive = pet.id === state.activePetId;
const activeBtnClass = isActive ? '' : 'primary';
const activeBtnDisabled = isActive ? 'disabled' : '';
box.innerHTML =
`<button class="detail-close" id="petDetailCloseBtn">×</button>
<div class="detail-name-row"><span class="pet-name c-${cls}" style="font-size:18px;">${lib.displayName(pet)}</span>${!pet.isBaby ? `<span class="tier-tag tier-${pet.tier}">${Lingshou.TIER_LABEL[pet.tier]}</span>` : ''}${pet.isBaby?'<span class="tier-tag tier-baby">宝</span>':''}</div>
<div class="detail-meta">${elemStr} Lv.${pet.level} ${pet.isBaby&&pet.babyFocus? '培养方向：'+({atk:'攻击',def:'防御',spd:'速度',hp:'生命'}[pet.babyFocus]||''):''}</div>
<div class="section-title">属性</div>
<div class="detail-grid">${stat('HP',base.hp,total.hp)}${stat('ATK',base.atk,total.atk)}${stat('DEF',base.def,total.def)}${stat('SPD',base.spd,total.spd)}</div>
<div class="section-title">技能（${pet.skills.length}）</div>
${pet.skills.map(s=>`<div class="skill-detail"><div class="sname">【${Lingshou.SKILL_CAT_LABEL[s.cat]}】${s.name}</div><div class="sdesc">${lib.skillDesc(s)}</div></div>`).join('')}
${pet.isBaby ? `
<div class="section-title">培养方向</div>
<div style="display:flex;gap:6px;margin-bottom:10px;">
${['atk','def','spd','hp'].map(f => {
  const label = {atk:'攻击',def:'防御',spd:'速度',hp:'生命'}[f];
  return `<button class="mini-btn ${pet.babyFocus===f?'primary':''}" data-act="focus" data-focus="${f}">${label}</button>`;
}).join('')}
</div>
<div class="section-title">突破（当前突破 ${pet.breakthroughs||0} 次）</div>
<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">
${lib.canBreakthrough(pet) ? '可以突破！消耗：' + Lingshou.BREAKTHROUGH_SOUL[(pet.breakthroughs||0)+1] + ' 兽魂 + ' + Lingshou.BREAKTHROUGH_GOLD[(pet.breakthroughs||0)+1] + ' 金币' + (pet.isBaby && (pet.breakthroughs||0)+1 >= Lingshou.BABY_PILL_START ? ' + 1 资质丹' : '') : '经验不足，需要达到 ' + ((pet.breakthroughs||0)+1)*10 + ' 级'}
</div>
<button class="mini-btn primary" data-act="breakthrough" ${lib.canBreakthrough(pet)?'':'disabled'}>突破</button>
` : ''}
<div class="btnrow"><button class="mini-btn ${activeBtnClass}" data-act="use" ${activeBtnDisabled}>设为主力</button><button class="mini-btn" data-act="train">用兽魂培养</button><button class="mini-btn danger" data-act="refine">炼化</button></div>`;
$('petDetailCloseBtn').onclick = lib.closePetDetail;
box.querySelectorAll('[data-act]').forEach(btn => {
btn.onclick = () => {
const a = btn.getAttribute('data-act');
if (a==='use') { state.activePetId = pet.id; lib.renderActivePet(); lib.renderTopBars(); lib.renderPetList(); lib.debounceSave(); }
if (a==='train') { lib.showTrainModal(pet); }
if (a==='refine') { lib.refinePet(pet); lib.closePetDetail(); }
if (a==='focus') { const f = btn.getAttribute('data-focus'); pet.babyFocus = (pet.babyFocus === f) ? null : f; lib.renderPetDetailBox(); lib.renderActivePet(); lib.debounceSave(); }
if (a==='breakthrough') { if (lib.canBreakthrough(pet)) { const result = lib.doBreakthrough(pet); let msg = lib.displayName(pet) + ' 突破成功！'; if (result.newSkill) msg += ' 领悟新技能：' + result.newSkill.name; lib.pushLog({ t: 'get', txt: msg }); alert(msg); lib.renderPetDetailBox(); lib.renderActivePet(); lib.debounceSave(); } }
};
});
};
// ========== 装备详情弹窗 ==========
let detailEquipId = null;
lib.openEquipDetail = function(id) { detailEquipId = id; lib.renderEquipDetailBox(); $('equipDetailModal').classList.add('show'); };
lib.closeEquipDetail = function() { detailEquipId = null; $('equipDetailModal').classList.remove('show'); };
lib.renderEquipDetailBox = function() {
const eq = state.equipInventory.find(e => e.id === detailEquipId);
const box = $('equipDetailBox');
if (!eq) { box.innerHTML = '<div class="empty-hint">装备不存在</div>'; return; }
const current = state.equipment[eq.slot];
box.innerHTML =
`<button class="detail-close" id="equipDetailCloseBtn">×</button>
<div style="font-size:18px;color:var(--gold);font-weight:700;">${eq.name}</div>
<div style="font-size:11px;color:var(--muted);">Lv.${eq.itemLevel} ${eq.slotName} 品质：${eq.quality}</div>
<div class="section-title">属性加成</div>
<div style="font-size:13px;">${lib.statLine(eq.pct)}</div>
${eq.extra && eq.extra.length ? `<div class="section-title">额外词条</div><div style="font-size:13px;">${eq.extra.map(ext => lib.statLine(ext)).join('<br>')}</div>` : ''}
<div class="btnrow"><button class="mini-btn primary" data-act="equip">装备</button><button class="mini-btn danger" data-act="decompose">分解</button></div>`;
$('equipDetailCloseBtn').onclick = lib.closeEquipDetail;
box.querySelectorAll('[data-act]').forEach(btn => {
btn.onclick = () => {
if (btn.getAttribute('data-act')==='equip') {
const old = state.equipment[eq.slot];
state.equipment[eq.slot] = eq;
state.equipInventory = state.equipInventory.filter(e => e.id !== eq.id);
if (old) state.equipInventory.push(old);
lib.closeEquipDetail();
lib.renderBag(); lib.debounceSave();
} else {
state.player.mat += lib.randInt(1,3);
state.equipInventory = state.equipInventory.filter(e => e.id !== eq.id);
lib.pushLog({t:'get',txt:`分解 ${eq.name}，获得材料`});
lib.closeEquipDetail();
lib.renderBag(); lib.debounceSave();
}
};
});
};
// ========== 背包 ==========
lib.renderBag = function() {
$('bagMat').textContent = state.player.mat;
$('bagPills').textContent = state.player.qualificationPills || 0;
$('bagFragments').textContent = state.player.pillFragments || 0;
$('bagSkillStone').textContent = state.player.skillStones || 0;
$('bagPetExp').textContent = state.player.petExp || 0;
const slots = $('equipSlots');
slots.innerHTML = '';
[['weapon','兵刃'],['armor','护甲'],['accessory','饰品']].forEach(([key,label]) => {
const eq = state.equipment[key];
const div = document.createElement('div');
div.className = 'equip-slot';
if (eq) { div.innerHTML = `<b>${eq.name}</b>${lib.statLine(eq.pct)}`; div.style.cursor='pointer'; div.title='点击卸下'; div.onclick=()=>{ state.equipInventory.push(eq); state.equipment[key]=null; lib.renderBag(); lib.debounceSave(); }; }
else div.innerHTML = `<b style="color:var(--muted)">${label}</b>未装备`;
slots.appendChild(div);
});
const inv = $('equipInv');
inv.innerHTML = '';
if (!state.equipInventory.length) { inv.innerHTML = '<div class="empty-hint">暂无未装备物品</div>'; return; }
const sorted = [].concat(state.equipInventory).sort((a,b) => {
const ca = state.equipment[a.slot]; const caScore = ca ? lib.equipScore(ca) : -Infinity;
const aB = lib.equipScore(a) > caScore ? 1 : 0;
const bB = lib.equipScore(b) > (state.equipment[b.slot] ? lib.equipScore(state.equipment[b.slot]) : -Infinity) ? 1 : 0;
if (aB !== bB) return bB - aB;
return lib.equipScore(b) - lib.equipScore(a);
});
sorted.forEach(eq => {
const current = state.equipment[eq.slot]; const isBetter = current ? lib.equipScore(eq) > lib.equipScore(current) : true;
const card = document.createElement('div');
card.className = 'equip-grid-card' + (isBetter ? ' better' : '');
card.innerHTML = `<div style="font-size:12px;">${eq.name}</div><div style="font-size:10px;color:var(--muted);">Lv.${eq.itemLevel}</div><div style="font-size:10px;${isBetter?'color:var(--green);':'color:var(--muted);'}">${lib.statLine(eq.pct)}</div>`;
card.onclick = () => lib.openEquipDetail(eq.id);
inv.appendChild(card);
});
};
lib.statLine = function(pct) {
if (!pct) return '';
return ['atk','def','hp','spd'].map(k => pct[k] ? (k==='hp'?'血':'')+'+'+Math.round(pct[k]*100)+'%' : '').filter(Boolean).join(' ');
};
// ========== 设置 ==========
lib.renderSettings = function() {
$('setAutoRefine').checked = state.settings.autoRefine;
$('setKeepBaby').checked = state.settings.keepBaby;
$('setKeepBoss').checked = state.settings.keepBoss;
document.querySelectorAll('.speed-opt').forEach(el => el.classList.toggle('active', +el.dataset.v === state.tickMs));
const totalSec = state.playTimeSec + Math.floor((Date.now() - state.startedAt)/1000);
$('playTimeTxt').textContent = `游戏时长 ${lib.fmtDuration(totalSec)} 战斗 ${state.stats.totalBattles} 捕获 ${state.stats.totalCatches}`;
// 显示同步 ID
if (typeof Lingshou.getSyncId === 'function') {
  $('syncIdDisplay').textContent = Lingshou.getSyncId();
}
$('btnCopySyncId').onclick = function() {
    navigator.clipboard.writeText(Lingshou.getSyncId()).then(function() {
      alert('同步 ID 已复制');
    }).catch(function() {
      prompt('手动复制：', Lingshou.getSyncId());
    });
  };
  // 切换同步 ID
  $('btnSetSyncId').onclick = function() {
    var newId = $('syncIdInput').value.trim();
    if (!newId) { alert('请输入同步 ID'); return; }
    if (!confirm('切换到 ID「' + newId + '」将重新加载存档，确定？')) return;
    localStorage.setItem('lingshoulu_sync_id', newId);
    location.reload();
  };
};
lib.renderAll = function() {
lib.renderMapsGrid(); lib.renderTopBars(); lib.renderActivePet(); lib.renderPetList(); lib.renderBag(); lib.renderSettings();
const btn = $('exploreBtn');
btn.textContent = state.exploring ? '停 止 探 索' : '开 始 探 索';
btn.classList.toggle('stop', state.exploring);
};
lib.showHarvestModal = function(h, elapsedSec) {
$('harvestSub').textContent = `离开 ${lib.fmtDuration(elapsedSec)}（离线50%），战斗${h.battles}场（胜${h.wins}）：`;
const list = $('harvestList'); list.innerHTML = '';
[['金币','+'+h.gold],['经验','+'+h.exp],['兽魂','+'+h.soul],['材料','+'+h.mat]].forEach(kv => {
if (kv[1]!=='+0') { const d=document.createElement('div'); d.className='harvest-item'; d.innerHTML='<span>'+kv[0]+'</span><b>'+kv[1]+'</b>'; list.appendChild(d); }
});
Object.keys(h.caught).forEach(k => {
const d=document.createElement('div'); d.className='harvest-item'; d.innerHTML='<span>'+k+'</span><b>×'+h.caught[k]+'</b>'; list.appendChild(d);
});
$('harvestModal').classList.add('show');
};
// ========== 事件绑定 ==========
lib.bindEvents = function() {
$('exploreBtn').onclick = () => {
state.exploring = !state.exploring;
state.exploring ? window.startExploreLoop(true) : window.stopExploreLoop();
$('exploreBtn').textContent = state.exploring ? '停 止 探 索' : '开 始 探 索';
$('exploreBtn').classList.toggle('stop', state.exploring);
lib.debounceSave();
};
document.querySelectorAll('nav.tabbar button').forEach(btn => btn.onclick = () => {
document.querySelectorAll('nav.tabbar button').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
['explore','pets','bag','settings'].forEach(t => $(`tab-${t}`).style.display = t===btn.dataset.tab ? '' : 'none');
if (btn.dataset.tab==='pets') lib.renderPetList();
if (btn.dataset.tab==='bag') lib.renderBag();
if (btn.dataset.tab==='settings') lib.renderSettings();
});
$('setAutoRefine').onchange = e => { state.settings.autoRefine = e.target.checked; Lingshou.saveGame(true); };
$('setKeepBaby').onchange = e => { state.settings.keepBaby = e.target.checked; Lingshou.saveGame(true); };
$('setKeepBoss').onchange = e => { state.settings.keepBoss = e.target.checked; Lingshou.saveGame(true); };
$('speedOpts').onclick = e => {
const opt = e.target.closest('.speed-opt'); if (!opt) return;
state.tickMs = +opt.dataset.v; lib.renderSettings();
if (state.exploring) window.startExploreLoop(false);
Lingshou.saveGame(true);
};
$('btnSaveNow').onclick = () => Lingshou.saveGame(false);
$('btnExport').onclick = () => Lingshou.exportSave();
$('btnImport').onclick = () => $('importFile').click();
$('importFile').onchange = e => {
const f = e.target.files[0]; if (!f) return;
const reader = new FileReader();
reader.onload = () => Lingshou.importSaveFromText(reader.result);
reader.readAsText(f); e.target.value='';
};
$('btnReset').onclick = function() {
if (!confirm('重置？')) return;
if (!confirm('确定重置所有存档？将生成新的同步 ID。')) return;
var newId = 'sync_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
localStorage.setItem('lingshoulu_sync_id', newId);
localStorage.removeItem('lingshoulu-save-v1');
location.reload();
};
// ========== 批量炼化弹窗 ==========
lib.showBatchRefineModal = function() {
var counts = { normal: 0, elite: 0, boss: 0, baby: 0 };
state.pets.forEach(function(p) {
if (p.id === state.activePetId) return;
if (p.isBaby) counts.baby++;
else counts[p.tier] = (counts[p.tier] || 0) + 1;
});
var options = $('batchRefineOptions');
options.innerHTML = '';
var tiers = [
{ key: 'normal', label: '普通', count: counts.normal },
{ key: 'elite', label: '精英', count: counts.elite },
{ key: 'boss', label: 'Boss', count: counts.boss },
{ key: 'baby', label: '宝宝', count: counts.baby }
];
window._batchRefineSelection = { normal: true, elite: false, boss: false, baby: false };
tiers.forEach(function(t) {
var row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);';
row.innerHTML =
'<label style="cursor:pointer;display:flex;align-items:center;gap:8px;">' +
'<input type="checkbox" data-tier="' + t.key + '" ' + (t.key === 'normal' ? 'checked' : '') + ' ' + (t.count === 0 ? 'disabled' : '') + '>' +
'<span>' + t.label + '（' + t.count + '只）</span>' +
'</label>';
options.appendChild(row);
});
options.querySelectorAll('input').forEach(function(cb) {
cb.onchange = function() {
window._batchRefineSelection[this.dataset.tier] = this.checked;
};
});
$('batchRefineModal').classList.add('show');
$('batchRefineConfirm').onclick = function() {
var totalSoul = 0;
var toRemove = [];
var sel = window._batchRefineSelection;
// 统计勾选总数（不含主力）
var checkedCount = 0;
for (var i = 0; i < state.pets.length; i++) {
var p = state.pets[i];
if (p.id === state.activePetId) continue;
var tier = p.isBaby ? 'baby' : p.tier;
if (sel[tier]) checkedCount++;
}
for (var i = state.pets.length - 1; i >= 0; i--) {
var p = state.pets[i];
if (p.id === state.activePetId) continue;
var tier = p.isBaby ? 'baby' : p.tier;
if (sel[tier]) {
if ((p.tier === 'boss' || p.isBaby) && state.settings['keep' + (p.isBaby ? 'Baby' : 'Boss')]) {
if (!confirm('确定要炼化「' + lib.displayName(p) + '」吗？此操作不可撤销。')) continue;
}
totalSoul += lib.soulValue(p);
toRemove.push(p.id);
}
}
if (toRemove.length === 0) {
alert('没有选中任何宠物（可能都被保护设置跳过了）');
return;
}
var confirmMsg = '勾选 ' + checkedCount + ' 只，实际炼化 ' + toRemove.length + ' 只，获得 ' + totalSoul + ' 兽魂？';
if (checkedCount !== toRemove.length) {
confirmMsg += '\n（' + (checkedCount - toRemove.length) + ' 只被保护设置跳过）';
}
if (!confirm(confirmMsg)) return;
state.player.soul += totalSoul;
state.pets = state.pets.filter(function(p) { return toRemove.indexOf(p.id) === -1; });
alert('炼化完成！获得兽魂 +' + totalSoul);
lib.pushLog({ t: 'get', txt: '批量炼化 ' + toRemove.length + ' 只宠物，获得兽魂+' + totalSoul });
$('batchRefineModal').classList.remove('show');
lib.renderPetList();
lib.renderTopBars();
lib.debounceSave();
};
$('batchRefineCancel').onclick = function() {
$('batchRefineModal').classList.remove('show');
};
};
// ========== 批量分解弹窗 ==========
lib.showBatchDecomposeModal = function() {
var counts = { '粗制': 0, '精良': 0, '传家': 0 };
state.equipInventory.forEach(function(eq) {
counts[eq.quality] = (counts[eq.quality] || 0) + 1;
});
var options = $('batchDecomposeOptions');
options.innerHTML = '';
window._batchDecomposeSelection = { '粗制': true, '精良': false, '传家': false };
Object.keys(counts).forEach(function(q) {
var row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);';
row.innerHTML =
'<label style="cursor:pointer;display:flex;align-items:center;gap:8px;">' +
'<input type="checkbox" data-quality="' + q + '" ' + (q === '粗制' ? 'checked' : '') + ' ' + (counts[q] === 0 ? 'disabled' : '') + '>' +
'<span>' + q + '（' + counts[q] + '件）</span>' +
'</label>';
options.appendChild(row);
});
options.querySelectorAll('input').forEach(function(cb) {
cb.onchange = function() {
window._batchDecomposeSelection[this.dataset.quality] = this.checked;
};
});
$('batchDecomposeModal').classList.add('show');
$('batchDecomposeConfirm').onclick = function() {
var totalMat = 0;
var toRemove = [];
var sel = window._batchDecomposeSelection;
var checkedCount = 0;
state.equipInventory.forEach(function(eq) {
if (sel[eq.quality]) checkedCount++;
if (sel[eq.quality]) {
totalMat += Lingshou.randInt(1, 3);
toRemove.push(eq.id);
}
});
if (toRemove.length === 0) {
alert('没有选中任何装备');
return;
}
if (!confirm('勾选 ' + checkedCount + ' 件，实际分解 ' + toRemove.length + ' 件，获得约 ' + totalMat + ' 材料？')) return;
state.player.mat += totalMat;
state.equipInventory = state.equipInventory.filter(function(eq) { return toRemove.indexOf(eq.id) === -1; });
alert('分解完成！获得材料 +' + totalMat);
lib.pushLog({ t: 'get', txt: '批量分解 ' + toRemove.length + ' 件装备，获得材料+' + totalMat });
$('batchDecomposeModal').classList.remove('show');
lib.renderBag();
lib.debounceSave();
};
$('batchDecomposeCancel').onclick = function() {
$('batchDecomposeModal').classList.remove('show');
};
};
function calcTotalExp(fromLv, toLv) {
var total = 0;
for (var lv = fromLv; lv < toLv; lv++) {
total += lib.expToNext(lv);
}
return total;
}
function updateTrainCost(pet, targetLv) {
var totalExpNeeded = calcTotalExp(pet.level, targetLv) - pet.exp;
$('trainCost').textContent = '消耗：' + Math.max(0, totalExpNeeded) + ' 兽魂';
}
// ========== 培养弹窗 ==========
lib.showTrainModal = function(pet) {
var currentLv = pet.level;
var maxLv = pet.isBaby ? (pet.breakthroughs + 1) * 10 : 999;
$('trainInfo').innerHTML = '当前兽魂：<b>' + state.player.soul + '</b> 当前等级：Lv.' + currentLv;
var slider = $('trainSlider');
slider.min = currentLv;
slider.max = Math.min(currentLv + 50, maxLv);
slider.value = currentLv;
$('trainTargetLv').textContent = currentLv;
updateTrainCost(pet, currentLv);
slider.oninput = function() {
var targetLv = parseInt(this.value);
$('trainTargetLv').textContent = targetLv;
updateTrainCost(pet, targetLv);
};
$('trainModal').classList.add('show');
$('trainConfirm').onclick = function() {
var targetLv = parseInt(slider.value);
var totalExpNeeded = calcTotalExp(currentLv, targetLv) - pet.exp;
var soulNeeded = Math.max(0, totalExpNeeded);
if (soulNeeded === 0) { alert('已经是目标等级'); return; }
if (state.player.soul < soulNeeded) { alert('兽魂不足，需要 ' + soulNeeded); return; }
state.player.soul -= soulNeeded;
pet.exp += soulNeeded;
var need = lib.expToNext(pet.level);
while (pet.exp >= need && pet.level < maxLv) {
pet.exp -= need;
pet.level++;
need = lib.expToNext(pet.level);
}
lib.pushLog({ t:'get', txt:'培养 ' + lib.displayName(pet) + ' 至 Lv.' + pet.level + '，消耗 ' + soulNeeded + ' 兽魂' });
$('trainModal').classList.remove('show');
lib.renderPetDetailBox();
lib.renderActivePet();
lib.renderTopBars();
lib.debounceSave();
};
$('trainCancel').onclick = function() { $('trainModal').classList.remove('show'); };
};
$('harvestClose').onclick = () => $('harvestModal').classList.remove('show');
$('btnBatchRefine').onclick = function() { lib.showBatchRefineModal(); };
$('btnBatchDecompose').onclick = function() { lib.showBatchDecomposeModal(); };
// 所有弹窗：点击遮罩关闭
document.querySelectorAll('.modal-mask').forEach(function(mask) {
mask.addEventListener('click', function(e) {
if (e.target === mask) mask.classList.remove('show');
});
});
};
})(Lingshou);
