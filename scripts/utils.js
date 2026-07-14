var Lingshou = Lingshou || {};

(function(lib) {
  lib.randInt = function(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };
  lib.rand = function(a, b) { return a + Math.random() * (b - a); };
  lib.choice = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  lib.uid = function() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
  lib.clamp = function(v, a, b) { return Math.max(a, Math.min(b, v)); };
  lib.pad2 = function(n) { return String(n).padStart(2, '0'); };
  lib.fmtDuration = function(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    if (m > 0) return `${m}分钟`;
    return `${sec}秒`;
  };
  lib.nowTime = function() { return new Date().toLocaleTimeString('zh-CN', { hour12: false }); };
})(Lingshou);