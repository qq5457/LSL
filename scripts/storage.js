var Lingshou = Lingshou || {};
(function(lib) {
const SAVE_KEY = 'lingshoulu-save-v1';
// 云存档地址（自动检测）
const API_BASE = (function(){
  const host = window.location.host;
  // 如果通过 /game/ 代理访问，API 路径相同
  return host;
})();

// 生成设备标识
function getDeviceId() {
  let id = localStorage.getItem('lingshoulu_device');
  if (!id) {
    id = 'device_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    localStorage.setItem('lingshoulu_device', id);
  }
  return id;
}

async function saveGame(silent) {
  if (!state) return;
  state.lastSaveTime = Date.now();
  // 本地存档（兜底）
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { console.error('本地存档失败', e); }
  // 云存档
  try {
    const resp = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: getDeviceId(),
        save: JSON.stringify(state),
        save_time: state.lastSaveTime || Date.now()
      })
    });
    const saveResult = await resp.json();
    if (saveResult.conflict) {
      console.warn('云存档冲突，另一设备有更新');
      lib.flashSaveStatus('⚠️ 存档冲突，请刷新页面加载最新存档');
      return false;
    }
    lib.flashSaveStatus((silent ? '☁️ 已云端存档 ' : '☁️ 已云端存档 ') + lib.nowTime());
  } catch (e) {
    console.error('云存档失败', e);
    lib.flashSaveStatus((silent ? '已本地存档 ' : '已本地存档 ') + lib.nowTime() + '（云不可用）');
  }
  return true;
}

async function loadGame() {
  let data = null;
  // 优先加载云存档
  try {
    const resp = await fetch('/api/load?device_id=' + getDeviceId());
    const result = await resp.json();
    if (result.save) {
      data = JSON.parse(result.save);
      lib.flashSaveStatus('☁️ 已加载云端存档');
    }
  } catch (e) {
    console.log('云存档不可用，改读本地');
  }
  // 兜底：本地存档
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

lib.saveGame = saveGame;
lib.loadGame = loadGame;
lib.exportSave = exportSave;
lib.flashSaveStatus = function(txt) {
  const el = document.getElementById('saveStatus');
  if (el) {
    el.textContent = txt;
    el.style.color = txt.indexOf('⚠') === 0 ? 'var(--red)' : '';
  }
};
})(Lingshou);
