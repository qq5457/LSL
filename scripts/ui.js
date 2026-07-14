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
        btn.onclick = function() {
          state.currentMapId = m.id;
          lib.renderMapsGrid();
          lib.renderTopBars();
          lib.debounceSave();
        };
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

    const statLine = function(name, b, t) {
      const diff = t - b;
      return `<span>${name} <b>${t}</b>${diff !== 0 ? ` <span style="color:var(--green);">(+${diff})</span>` : ''}</span>`;
    };

    card.innerHTML =
      `<div class="pet-name-row">
        <span class="pet-name c-${cls}">${lib.displayName(pet)}</span>
        <span class="tier-tag tier-${pet.tier}">${Lingshou.TIER_LABEL[pet.tier]}</span>
        ${pet.isBaby ? '<span class="tier-tag tier-baby">宝</span>' : ''}
        <span style="margin-left:auto;font-size:11px;color:var(--muted);">Lv.${pet.level}　天赋:${pet.talent.name}</span>
      </div>
      <div class="hp-row"><div class="hp-bar-wrap"><div class="hp-bar" style="width:100%"></div></div><div class="hp-txt">HP ${total.hp}</div></div>
      <div class="pet-stats-mini">
        ${statLine('攻击', base.atk, total.atk)}
        ${statLine('防御', base.def, total.def)}
        ${statLine('速度', base.spd, total.spd)}
        <span>成长 <b>${(pet.growth * pet.talent.mult).toFixed(2)}</b></span>
      </div>
      <div class="hp-row" style="margin-top:6px;"><div class="hp-bar-wrap"><div class="expbar" style="width:${lib.clamp(pet.exp/need*100,0,100)}%"></div></div><div class="hp-txt">EXP ${pet.exp}/${need}</div></div>
      <div class="pet-skills-mini">${pet.skills.map(s => '<span class="skill-chip">'+s.name+'</span>').join('')}</div>`;
  };

  // ========== 宠物仓库宫格 ==========
  lib.renderPetList = function() {
    const wrap = $('petList');
    wrap.innerHTML = '';
    if (!state.pets.length) {
      wrap.innerHTML = '<div class="empty-hint">仓库空空如也</div>';
      return;
    }
    const sorted = [].concat(state.pets).sort(function(a, b) {
      const order = { boss:0, elite:1, normal:2 };
      if (a.isBaby !== b.isBaby) return a.isBaby ? -1 : 1;
      if (order[a.tier] !== order[b.tier]) return order[a.tier] - order[b.tier];
      return b.level - a.level;
    });
    sorted.forEach(function(pet) {
      const cls = lib.colorClass(pet);
      const card = document.createElement('div');
      card.className = 'pet-grid-card';
      if (pet.id === state.activePetId) card.style.borderColor = 'var(--gold)';
      card.innerHTML = `<div class="pet-grid-name c-${cls}">${lib.displayName(pet)}</div>`;
      card.onclick = function() { lib.openPetDetail(pet.id); };
      wrap.appendChild(card);
    });
  };

  // ========== 培养 ==========
  lib.trainPet = function(pet) {
    const costPer = 5;
    if (state.player.soul < costPer) { lib.pushToast('兽魂不足'); return; }
    const use = Math.min(state.player.soul, 200);
    const expGain = Math.floor(use / costPer);
    state.player.soul -= use;
    (function(p, e) {
      p.exp += e;
      let need = lib.expToNext(p.level);
      while (p.exp >= need) { p.exp -= need; p.level++; need = lib.expToNext(p.level); }
    })(pet, expGain);
    lib.pushLog({ t: 'get', txt: '使用兽魂' + use + '培养' + lib.displayName(pet) + '，经验+' + expGain });
    lib.renderPetList();
    lib.renderTopBars();
    if (pet.id === state.activePetId) lib.renderActivePet();
    lib.debounceSave();
  };

  // ========== 炼化 ==========
  lib.refinePet = function(pet) {
    if (pet.id === state.activePetId) { lib.pushToast('主力无法炼化'); return; }
    if (pet.isBaby && state.settings.keepBaby && !confirm(lib.displayName(pet) + ' 确定炼化？')) return;
    if (pet.tier === 'boss' && state.settings.keepBoss && !confirm(lib.displayName(pet) + ' 确定炼化？')) return;
    const soul = lib.soulValue(pet);
    state.player.soul += soul;
    state.pets = state.pets.filter(p => p.id !== pet.id);
    lib.pushLog({ t: 'get', txt: '炼化' + lib.displayName(pet) + '，兽魂+' + soul });
    lib.renderPetList();
    lib.renderTopBars();
    lib.debounceSave();
  };

  // ========== 日志系统 ==========
  lib.pushLog = function(entry) {
    state.log.push(entry);
    if (state.log.length > 50) state.log.shift();
    lib.appendLogDom(entry);
  };

  lib.appendLogDom = function(entry) {
    const area = $('logArea');
    const div = document.createElement('div');
    const clsMap = { title: 'l-title', win: 'l-win', lose: 'l-lose', get: 'l-get', atk: 'l-dim', skill: 'l-dim' };
    div.className = clsMap[entry.t] || '';
    div.textContent = entry.txt;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
    while (area.childNodes.length > 120) area.removeChild(area.firstChild);
  };

  lib.pushToast = function(msg) { lib.pushLog({ t: 'lose', txt: msg }); };

  // ========== 宠物详情弹窗 ==========
  let detailPetId = null;
  lib.openPetDetail = function(id) { detailPetId = id; lib.renderPetDetailBox(); $('petDetailModal').classList.add('show'); };
  lib.closePetDetail = function() { detailPetId = null; $('petDetailModal').classList.remove('show'); };
  lib.renderPetDetailIfOpen = function(id) { if (detailPetId === id) lib.renderPetDetailBox(); };

  lib.renderPetDetailBox = function() {
    const pet = state.pets.find(p => p.id === detailPetId);
    const box = $('petDetailBox');
    if (!pet) { box.innerHTML = '<div class="empty-hint">该灵兽不存在</div>'; return; }
    const base = lib.getBaseStats(pet);
    const total = lib.computeStats(pet, state.equipment);
    const cls = lib.colorClass(pet);
    const isActive = pet.id === state.activePetId;
    const need = lib.expToNext(pet.level);

    const stat = function(label, b, t) {
      const diff = t - b;
      return `<div class="detail-stat"><div class="dl">${label}</div><div class="dv">${t}${diff !== 0 ? ` <span style="color:var(--green);">(+${diff})</span>` : ''}</div></div>`;
    };

    box.innerHTML =
      `<button class="detail-close" id="petDetailCloseBtn">×</button>
      <div class="detail-name-row">
        <span class="pet-name c-${cls}" style="font-size:18px;">${lib.displayName(pet)}</span>
        <span class="tier-tag tier-${pet.tier}">${Lingshou.TIER_LABEL[pet.tier]}</span>
        ${pet.isBaby ? '<span class="tier-tag tier-baby">宝</span>' : ''}
        ${isActive ? '<span class="tier-tag" style="background:rgba(205,164,61,.18);color:var(--gold);">主力</span>' : ''}
      </div>
      <div class="detail-meta">种族名：${pet.name}　|　基础种类：${pet.baseName}　|　天赋：${pet.talent.name}（×${pet.talent.mult}）　|　成长：${(pet.growth * pet.talent.mult).toFixed(3)}<br>Lv.${pet.level}　EXP ${pet.exp}/${need}　|　捕获于：${new Date(pet.caughtAt).toLocaleString('zh-CN')}</div>
      <div class="nickname-row">
        <input type="text" id="nicknameInput" placeholder="给灵兽起个昵称" value="${pet.nickname ? pet.nickname.replace(/"/g,'&quot;') : ''}" maxlength="12">
        <button class="mini-btn primary" id="saveNicknameBtn">保存</button>
      </div>
      <div class="section-title">当前属性（基础 + 装备加成）</div>
      <div class="detail-grid">
        ${stat('生命 HP', base.hp, total.hp)}
        ${stat('攻击 ATK', base.atk, total.atk)}
        ${stat('防御 DEF', base.def, total.def)}
        ${stat('速度 SPD', base.spd, total.spd)}
      </div>
      <div class="section-title">技能（${pet.skills.length}个）</div>
      ${pet.skills.map(s => `<div class="skill-detail"><div class="sname">【${Lingshou.SKILL_CAT_LABEL[s.cat]}】${s.name}</div><div class="sdesc">${lib.skillDesc(s)}</div></div>`).join('')}
      <div class="btnrow" style="margin-top:14px;">
        <button class="mini-btn primary" data-act="use">设为主力</button>
        <button class="mini-btn" data-act="train">用兽魂培养</button>
        <button class="mini-btn danger" data-act="refine">炼化</button>
      </div>`;
    $('petDetailCloseBtn').onclick = lib.closePetDetail;
    $('saveNicknameBtn').onclick = function() {
      const val = $('nicknameInput').value.trim();
      pet.nickname = val || null;
      lib.renderPetDetailBox();
      lib.renderPetList();
      lib.renderActivePet();
      lib.debounceSave();
    };
    box.querySelectorAll('[data-act]').forEach(function(btn) {
      btn.onclick = function() {
        const act = btn.getAttribute('data-act');
        if (act === 'use') { state.activePetId = pet.id; lib.renderActivePet(); lib.renderTopBars(); lib.renderPetDetailBox(); lib.renderPetList(); lib.debounceSave(); }
        if (act === 'train') { lib.trainPet(pet); lib.renderPetDetailBox(); }
        if (act === 'refine') { lib.refinePet(pet); lib.closePetDetail(); }
      };
    });
  };

  // ========== 背包（装备） ==========
  lib.renderBag = function() {
    $('bagGold').textContent = state.player.gold;
    $('bagSoul').textContent = state.player.soul;
    $('bagMat').textContent = state.player.mat;
    $('bagPetExp').textContent = state.player.petExp;

    // 装备槽
    const slots = $('equipSlots');
    slots.innerHTML = '';
    [['weapon','兵刃'],['armor','护甲'],['accessory','饰品']].forEach(function(kv) {
      const key = kv[0], label = kv[1];
      const eq = state.equipment[key];
      const div = document.createElement('div');
      div.className = 'equip-slot';
      if (eq) {
        div.innerHTML = `<b>${eq.name}</b>${lib.statLine(eq.pct)}`;
        div.style.cursor = 'pointer';
        div.title = '点击卸下';
        div.onclick = function() {
          state.equipInventory.push(eq);
          state.equipment[key] = null;
          lib.renderBag();
          lib.debounceSave();
        };
      } else {
        div.innerHTML = `<b style="color:var(--muted)">${label}</b>未装备`;
      }
      slots.appendChild(div);
    });

    // 背包列表
    const inv = $('equipInv');
    inv.innerHTML = '';
    if (!state.equipInventory.length) {
      inv.innerHTML = '<div class="empty-hint">暂无未装备物品</div>';
      return;
    }

    const sorted = [].concat(state.equipInventory).sort(function(a, b) {
      const currentA = state.equipment[a.slot];
      const csA = currentA ? lib.equipScore(currentA) : -Infinity;
      const aBetter = lib.equipScore(a) > csA ? 1 : 0;
      const bBetter = lib.equipScore(b) > (state.equipment[b.slot] ? lib.equipScore(state.equipment[b.slot]) : -Infinity) ? 1 : 0;
      if (aBetter !== bBetter) return bBetter - aBetter;
      return lib.equipScore(b) - lib.equipScore(a);
    });

    sorted.forEach(function(eq) {
      const current = state.equipment[eq.slot];
      const isBetter = current ? lib.equipScore(eq) > lib.equipScore(current) : true;
      const card = document.createElement('div');
      card.className = 'equip-grid-card' + (isBetter ? ' better' : '');
      card.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:var(--parchment);">${eq.name}</div>
        <div style="font-size:10px;color:var(--muted);">Lv.${eq.itemLevel} ${eq.slotName}</div>
        <div style="font-size:10px;${isBetter ? 'color:var(--green);' : 'color:var(--muted);'}">${lib.statLine(eq.pct)}</div>
        <button class="mini-btn danger" style="font-size:9px;padding:2px 6px;margin-top:4px;">分解</button>
      `;
      card.onclick = function(e) {
        if (e.target.tagName === 'BUTTON') return;
        const old = state.equipment[eq.slot];
        state.equipment[eq.slot] = eq;
        state.equipInventory = state.equipInventory.filter(e => e.id !== eq.id);
        if (old) state.equipInventory.push(old);
        lib.renderBag();
        lib.debounceSave();
      };
      card.querySelector('button').onclick = function(e) {
        e.stopPropagation();
        state.player.mat += lib.randInt(1, 3);
        state.equipInventory = state.equipInventory.filter(e => e.id !== eq.id);
        lib.pushLog({ t:'get', txt:`分解 ${eq.name}，获得材料` });
        lib.renderBag();
        lib.debounceSave();
      };
      inv.appendChild(card);
    });
  };

  lib.statLine = function(pct) {
    const parts = [];
    if (pct && pct.atk) parts.push('攻+' + Math.round(pct.atk*100) + '%');
    if (pct && pct.def) parts.push('防+' + Math.round(pct.def*100) + '%');
    if (pct && pct.hp) parts.push('血+' + Math.round(pct.hp*100) + '%');
    if (pct && pct.spd) parts.push('速+' + Math.round(pct.spd*100) + '%');
    return parts.join(' ');
  };

  // ========== 设置界面 ==========
  lib.renderSettings = function() {
    $('setAutoRefine').checked = state.settings.autoRefine;
    $('setKeepBaby').checked = state.settings.keepBaby;
    $('setKeepBoss').checked = state.settings.keepBoss;
    document.querySelectorAll('.speed-opt').forEach(function(el) {
      el.classList.toggle('active', +el.getAttribute('data-v') === state.tickMs);
    });
    const totalSec = state.playTimeSec + Math.floor((Date.now() - state.startedAt) / 1000);
    $('playTimeTxt').textContent = `游戏时长 ${lib.fmtDuration(totalSec)}　|　战斗 ${state.stats.totalBattles}　|　捕获 ${state.stats.totalCatches}`;
  };

  // ========== 全渲染 ==========
  lib.renderAll = function() {
    lib.renderMapsGrid();
    lib.renderTopBars();
    lib.renderActivePet();
    lib.renderPetList();
    lib.renderBag();
    lib.renderSettings();
    const btn = $('exploreBtn');
    btn.textContent = state.exploring ? '停 止 探 索' : '开 始 探 索';
    btn.classList.toggle('stop', state.exploring);
  };

  // ========== 离线收获弹窗 ==========
  lib.showHarvestModal = function(h, elapsedSec) {
    const modal = $('harvestModal');
    $('harvestSub').textContent = '你离开了 ' + lib.fmtDuration(elapsedSec) + '（离线收益50%），战斗' + h.battles + '场（胜' + h.wins + '）：';
    const list = $('harvestList');
    list.innerHTML = '';
    const rows = [['金币', '+' + h.gold], ['经验', '+' + h.exp]];
    if (h.soul) rows.push(['兽魂', '+' + h.soul]);
    if (h.mat) rows.push(['装备材料', '+' + h.mat]);
    if (h.refined) rows.push(['自动炼化', h.refined + '只']);
    Object.keys(h.caught).forEach(function(name) {
      rows.push(['发现 ' + name, '×' + h.caught[name]]);
    });
    rows.forEach(function(kv) {
      const div = document.createElement('div');
      div.className = 'harvest-item';
      div.innerHTML = `<span>${kv[0]}</span><b>${kv[1]}</b>`;
      list.appendChild(div);
    });
    modal.classList.add('show');
  };

  // ========== 事件绑定 ==========
  lib.bindEvents = function() {
    $('exploreBtn').onclick = function() {
      state.exploring = !state.exploring;
      if (state.exploring) window.startExploreLoop(true);
      else window.stopExploreLoop();
      $('exploreBtn').textContent = state.exploring ? '停 止 探 索' : '开 始 探 索';
      $('exploreBtn').classList.toggle('stop', state.exploring);
      lib.debounceSave();
    };

    document.querySelectorAll('nav.tabbar button').forEach(function(btn) {
      btn.onclick = function() {
        document.querySelectorAll('nav.tabbar button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        ['explore','pets','bag','settings'].forEach(function(t) {
          $('tab-' + t).style.display = (t === tab) ? '' : 'none';
        });
        if (tab === 'pets') lib.renderPetList();
        if (tab === 'bag') lib.renderBag();
        if (tab === 'settings') lib.renderSettings();
      };
    });

    $('setAutoRefine').onchange = function(e) { state.settings.autoRefine = e.target.checked; Lingshou.saveGame(true); };
    $('setKeepBaby').onchange = function(e) { state.settings.keepBaby = e.target.checked; Lingshou.saveGame(true); };
    $('setKeepBoss').onchange = function(e) { state.settings.keepBoss = e.target.checked; Lingshou.saveGame(true); };

    $('speedOpts').addEventListener('click', function(e) {
      const opt = e.target.closest('.speed-opt');
      if (!opt) return;
      state.tickMs = Number(opt.getAttribute('data-v'));
      lib.renderSettings();
      if (state.exploring) window.startExploreLoop(false);  // 不立即战斗
      Lingshou.saveGame(true);
    });

    $('btnSaveNow').onclick = function() { Lingshou.saveGame(false); };
    $('btnExport').onclick = function() { Lingshou.exportSave(); };
    $('btnImport').onclick = function() { $('importFile').click(); };
    $('importFile').onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function() { Lingshou.importSaveFromText(reader.result); };
      reader.readAsText(file);
      e.target.value = '';
    };

    $('btnReset').onclick = async function() {
      if (!confirm('确定要重置存档吗？所有进度将永久丢失。')) return;
      window.stopExploreLoop();
      state = Lingshou.freshState();
      Lingshou.ensureActivePet();
      await Lingshou.saveGame(false);
      $('logArea').innerHTML = '';
      lib.renderAll();
    };

    $('harvestClose').onclick = function() {
      $('harvestModal').classList.remove('show');
    };
  };
})(Lingshou);