(function(global){
  const { $, $all, showToast, switchTab } = PMS_UTILS;

  function bindTabs() {
    $all('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        switchTab(btn.dataset.tab);
        await window.PMS_MAIN.onTabChanged(btn.dataset.tab);
      });
    });
  }

  async function initializeModules() {
    await PMS_MODULES.kraKpi.init();
    await PMS_MODULES.competency.init();
    await PMS_MODULES.achievement.init();
    await PMS_MODULES.roles.init();
    await PMS_MODULES.systemConfig.init();
    await PMS_MODULES.reports.init();
  }

  async function onTabChanged(tab) {
    if (tab === 'goals') await PMS_MODULES.kraKpi.onShow();
    if (tab === 'competencies') await PMS_MODULES.competency.onShow();
    if (tab === 'reports') await PMS_MODULES.reports.onShow();
    if (tab === 'admin') { await PMS_MODULES.roles.onShow(); await PMS_MODULES.systemConfig.onShow(); }
  }

  async function boot() {
    bindTabs();
    await PMS_AUTH.initAuth();
  }

  global.PMS_MAIN = { boot, initializeModules, onTabChanged };

  window.addEventListener('DOMContentLoaded', () => {
    PMS_MAIN.boot().catch(err => console.error(err));
  });
})(window);
