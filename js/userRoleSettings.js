(function(global){
  const { $, $all, showToast } = PMS_UTILS;

  async function render() {
    const root = $('#roleManagement'); if (!root) return;
    root.innerHTML = '';
    const info = document.createElement('div');
    info.className = 'content-card';
    info.innerHTML = '<p>Role management UI placeholder. Integrate with GAS for real data.</p>';
    root.appendChild(info);
  }

  async function onShow() { await render(); }
  async function init() { /* placeholder */ }

  global.PMS_MODULES = global.PMS_MODULES || {};
  global.PMS_MODULES.roles = { init, onShow };
})(window);
