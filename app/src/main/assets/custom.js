// 优先用宿主能力打开系统浏览器
async function openExternal(url) {
  const w = window;
  try {
    if (w.__TAURI__?.shell?.open) { await w.__TAURI__.shell.open(url); return; }              // PakePlus/Tauri
    if (w.cordova?.InAppBrowser?.open) { w.cordova.InAppBrowser.open(url, '_system'); return; } // Cordova
    if (w.Capacitor?.Browser?.open) { await w.Capacitor.Browser.open({ url }); return; }        // Capacitor
    if (w.plus?.runtime?.openURL) { w.plus.runtime.openURL(url); return; }                      // uni-app/HBuilder
  } catch (e) {}
  window.open(url, '_blank', 'noopener,noreferrer'); // 兜底
}

function isExternalUrl(url) {
  try {
    const u = new URL(url, location.href);
    return u.origin !== location.origin;
  } catch { return false; }
}

const hookClick = (e) => {
  const a = e.target.closest && e.target.closest('a');
  const hasBaseBlank = !!document.querySelector('head base[target="_blank"]');
  if (!a || !a.href) return;

  const relExternal = (a.rel || '').toLowerCase().includes('external') || a.dataset.openExternal === 'true';
  const targetBlank = a.target === '_blank' || hasBaseBlank;
  const external = isExternalUrl(a.href) || relExternal;

  if (external && (targetBlank || relExternal)) {
    e.preventDefault();
    openExternal(a.href);
  } else {
    // 站内链接按默认行为，不强制跳转
  }
};

window.open = function (url, target, features) {
  // window.open 一律按外部打开处理，避免 WebView 新窗口不支持
  openExternal(url);
};

document.removeEventListener('click', hookClick, { capture: true }); // 防重复注册（如果之前注册过）
document.addEventListener('click', hookClick, { capture: true });