var Lingshou = Lingshou || {};

(function(lib) {
  const SAVE_KEY = 'lingshoulu-save-v1';

  async function saveGame(silent) {
    if (!state) return;
    state.lastSaveTime = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      lib.flashSaveStatus((silent ? '已自动存档 ' : '已存档 ') + lib.nowTime());
      return true;
    } catch (e) {
      console.error('存档失败', e);
      lib.flashSaveStatus('⚠ 存档失败，请导出备份');
      return false;
    }
  }

  async function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
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