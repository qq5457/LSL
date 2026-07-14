var Lingshou = Lingshou || {};
(function(lib) {
const SAVE_KEY = 'lingshoulu-save-v1';
const DEVICE_KEY = 'lingshoulu_sync_id';

// 获取同步 ID：所有设备共享（首次生成后固定，不清除就不会变）
function getSyncId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = 'sync_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// 保存：本地优先（即时响应）+ 云端（静默同步）
async function saveGame(silent) {
  if (!state) return;
  state.lastSaveTime = Date.now();
  // 本地存档（兜底，秒存）
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { console.error('本地存档失败', e); }
  // 云端存档（静默同步，不阻塞）
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: getSyncId(),
        save: JSON.stringify(state),
        save_time: state.lastSaveTime || Date.now()
      })
    });
    if (!silent) lib.flashSaveStatus('☁️ 已同步存档 ' + lib.nowTime());
  } catch (e) {
    console.error('云同步失败', e);
    if (!silent) lib.flashSaveStatus('已本地存档 ' + lib.nowTime() + '（云不可用）');
  }
  return true;
}

// 加载：云端优先（拿到所有设备的最新进度）→ 本地兜底
async function loadGame() {
  let data = null;
  const syncId = getSyncId();
  // 云端
  try {
    const resp = await fetch('/api/load?device_id=' + syncId);
    const result = await resp.json();
    if (result.save) {
      data = JSON.parse(result.save);
      lib.flashSaveStatus('☁️ 已加载云端存档');
    }
  } catch (e) {
    console.log('云存档不可用，改读本地');
  }
  // 本地兜底
  if (!data) {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {}
  }
  return data;
}

function exportSave() {
  if (!state) { alert('游戏未初始化'); return; }
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const t = new Date();
    const fname = `灵兽录存档_${t.getFullYear()}${lib.pad2(t.getMonth()+1)}${lib.pad2(t.getDate())}_${lib.pad2(t.getHours())}${lib.pad2(t.getMinutes())}.json`;
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    lib.flashSaveStatus('已导出存档文件');
  } catch (e) {
    console.error(e);
    alert('导出失败：' + e.message);
  }
}

// 设置页：绑定同步 ID 显示和登录操作
lib.setupSyncUI = function() {
  const syncId = getSyncId();
  const el = document.getElementById('syncIdDisplay');
  if (el) el.textContent = syncId;
};

lib.saveGame = saveGame;
lib.loadGame = loadGame;
lib.exportSave = exportSave;
lib.getSyncId = getSyncId;
lib.flashSaveStatus = function(txt) {
  const el = document.getElementById('saveStatus');
  if (el) {
    el.textContent = txt;
    el.style.color = txt.indexOf('⚠️') === 0 ? 'var(--red)' : '';
  }
};
})(Lingshou);
