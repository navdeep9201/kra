(function(global){
  function showToast(message, type='info', timeoutMs=3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') toast.style.borderColor = '#dc2626';
    if (type === 'success') toast.style.borderColor = '#16a34a';
    container.appendChild(toast);
    setTimeout(()=>{ toast.remove(); }, timeoutMs);
  }

  function setLoading(isLoading) {
    const el = document.getElementById('loadingSpinner');
    if (!el) return;
    el.classList.toggle('active', !!isLoading);
  }

  async function httpRequest(path, options={}) {
    const base = PMS_CONFIG.apiBaseUrl.replace(/\/$/, '');
    const url = /^https?:/.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const text = await response.text().catch(()=> '');
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/json') ? response.json() : response.text();
  }

  function $(selector, root=document) { return root.querySelector(selector); }
  function $all(selector, root=document) { return Array.from(root.querySelectorAll(selector)); }

  function getActiveTab() {
    return $('.tab-btn.active')?.dataset?.tab || 'profile';
  }

  function switchTab(tabName) {
    $all('.tab-btn').forEach(btn=> btn.classList.toggle('active', btn.dataset.tab === tabName));
    $all('.tab-content').forEach(view=> view.classList.toggle('active', view.id === `${tabName}Tab`));
  }

  function saveSession(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function loadSession(key, fallback=null) {
    const v = localStorage.getItem(key); if (!v) return fallback; try { return JSON.parse(v); } catch { return fallback; }
  }
  function clearSession(key) { localStorage.removeItem(key); }

  function clampNumber(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function sum(numbers) { return numbers.reduce((a,b)=> a + (Number(b)||0), 0); }

  global.PMS_UTILS = { showToast, setLoading, httpRequest, $, $all, getActiveTab, switchTab, saveSession, loadSession, clearSession, clampNumber, sum };
})(window);
